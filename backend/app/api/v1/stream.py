"""Real-time SSE & WebSocket streaming endpoints backed by QuoteStreamHub."""

import asyncio
import json
import os
import time
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.security import resolve_owner_id
from app.services import yahoo_finance as yf_service
from app.services.alert_worker import evaluate_pending_alerts
from app.services.stream_hub import stream_hub

router = APIRouter(prefix="/stream", tags=["stream"])


def _format_sse(event_name: str, data: dict) -> str:
    return f"event: {event_name}\ndata: {json.dumps(data)}\n\n"


@router.get("/quotes")
async def stream_quotes(
    request: Request,
    tickers: str = Query(
        default="AAPL,NVDA,MSFT,AMZN,GOOGL,META,D05.SI,BBCA.JK",
        description="Comma-separated ticker symbols to stream",
    ),
    workspace_id: str | None = Query(default=None),
    token: str | None = Query(default=None),
    oneshot: bool = Query(default=False, description="Emit snapshot and close (useful for health/testing)"),
):
    """
    Server-Sent Events (SSE) stream delivering real-time quote snapshots,
    delta price ticks, FX cross-rates, and instant server-side price alerts.
    """
    auth_header = f"Bearer {token}" if token else request.headers.get("authorization")
    ws_header = workspace_id or request.headers.get("x-workspace-id")
    owner_id = resolve_owner_id(authorization=auth_header, x_workspace_id=ws_header)

    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:50]
    if not ticker_list:
        ticker_list = ["AAPL", "NVDA", "MSFT", "BBCA.JK", "D05.SI"]

    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    max_window_s = 24.0 if is_serverless else 180.0
    tick_interval_s = max(2.0, float(settings.stream_tick_interval_s))

    async def event_generator():
        sub_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        sub = stream_hub.register(sub_id=sub_id, owner_id=owner_id, tickers=ticker_list, loop=loop)
        started_at = time.monotonic()

        try:
            yield "retry: 2500\n\n"

            # 1. Immediate snapshot on connect
            quotes = await asyncio.to_thread(yf_service.get_batch_quotes, ticker_list)
            fx_resp = await asyncio.to_thread(yf_service.get_live_fx_rates)
            for q in quotes:
                sub.last_sent_prices[q.ticker.upper()] = (float(q.current_price), float(q.change_percent))

            snapshot_payload = {
                "as_of": datetime.now(UTC).isoformat(),
                "quotes": [q.model_dump() for q in quotes],
                "fx_rates": [r.model_dump() for r in fx_resp.rates],
            }
            yield _format_sse("snapshot", snapshot_payload)

            if oneshot:
                return

            # Evaluate pending alerts for this owner on initial connect
            triggered = await asyncio.to_thread(evaluate_pending_alerts, owner_id)
            for alert_evt in triggered:
                yield _format_sse("alert", alert_evt)

            last_heartbeat = time.monotonic()
            last_direct_poll = time.monotonic()

            while True:
                if await request.is_disconnected():
                    break
                if time.monotonic() - started_at >= max_window_s:
                    yield _format_sse("reconnect", {"reason": "window_refresh"})
                    break

                # Wait briefly for hub-published tick or alert events
                try:
                    evt = await asyncio.wait_for(sub.queue.get(), timeout=2.0)
                    yield _format_sse(evt["event"], evt["data"])
                except TimeoutError:
                    pass

                # In serverless/test environments without persistent background task,
                # drive delta ticks safely if no hub tick arrived recently
                now = time.monotonic()
                if is_serverless and now - last_direct_poll >= tick_interval_s:
                    last_direct_poll = now
                    await asyncio.to_thread(stream_hub.broadcast_quotes, False)

                if now - last_heartbeat >= 10.0:
                    last_heartbeat = now
                    yield _format_sse("heartbeat", {"as_of": datetime.now(UTC).isoformat()})
        finally:
            stream_hub.unregister(sub_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.websocket("/ws")
async def websocket_quotes(
    websocket: WebSocket,
    tickers: str = Query(default="AAPL,NVDA,MSFT,BBCA.JK,D05.SI"),
    workspace_id: str | None = Query(default=None),
    token: str | None = Query(default=None),
):
    """Full-duplex WebSocket endpoint for persistent ASGI environments."""
    await websocket.accept()
    auth_header = f"Bearer {token}" if token else None
    owner_id = resolve_owner_id(authorization=auth_header, x_workspace_id=workspace_id)
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:50]

    sub_id = str(uuid.uuid4())
    loop = asyncio.get_running_loop()
    sub = stream_hub.register(sub_id=sub_id, owner_id=owner_id, tickers=ticker_list, loop=loop)

    try:
        # Send initial snapshot
        quotes = await asyncio.to_thread(yf_service.get_batch_quotes, ticker_list)
        fx_resp = await asyncio.to_thread(yf_service.get_live_fx_rates)
        await websocket.send_json({
            "event": "snapshot",
            "data": {
                "as_of": datetime.now(UTC).isoformat(),
                "quotes": [q.model_dump() for q in quotes],
                "fx_rates": [r.model_dump() for r in fx_resp.rates],
            },
        })

        async def _sender() -> None:
            while True:
                evt = await sub.queue.get()
                await websocket.send_json(evt)

        async def _receiver() -> None:
            while True:
                msg = await websocket.receive_json()
                if isinstance(msg, dict) and "subscribe" in msg and isinstance(msg["subscribe"], list):
                    stream_hub.update_tickers(sub_id, [str(t) for t in msg["subscribe"]][:50])

        sender_task = asyncio.create_task(_sender())
        receiver_task = asyncio.create_task(_receiver())
        done, pending = await asyncio.wait(
            [sender_task, receiver_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    except WebSocketDisconnect:
        pass
    finally:
        stream_hub.unregister(sub_id)
