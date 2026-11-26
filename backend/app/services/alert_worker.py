"""24/7 Server-side background price alert evaluation worker."""

import asyncio
import logging
from typing import Any

from app.core.config import settings
from app.db.store import store
from app.services import yahoo_finance as yf_service
from app.services.stream_hub import stream_hub

logger = logging.getLogger(__name__)


def evaluate_pending_alerts(owner_id: str | None = None) -> list[dict[str, Any]]:
    """
    Evaluate all active alerts (or alerts scoped to one owner_id) against live quotes.
    Persists triggered state in DB and publishes instant SSE/WS notifications.
    """
    if owner_id is not None:
        active_alerts = store.list_alerts(owner_id=owner_id, include_triggered=False)
    else:
        active_alerts = store.list_all_active_alerts()

    if not active_alerts:
        return []

    unique_tickers = sorted({a["ticker"].upper() for a in active_alerts})
    quotes = yf_service.get_batch_quotes(unique_tickers)
    price_map = {q.ticker.upper(): q.current_price for q in quotes}

    triggered: list[dict[str, Any]] = []
    for alert in active_alerts:
        ticker = alert["ticker"].upper()
        current = price_map.get(ticker)
        if current is None or current <= 0:
            continue

        target = float(alert["target_price"])
        condition = alert["condition"]
        is_hit = (condition == "ABOVE" and current >= target) or (
            condition == "BELOW" and current <= target
        )
        if not is_hit:
            continue

        msg = f"{ticker} crossed {condition} {target} (Current: {current})"
        updated = store.mark_alert_triggered(alert["id"], current, msg)
        if not updated:
            continue

        payload = {
            "alert_id": updated["id"],
            "ticker": ticker,
            "condition": condition,
            "target_price": target,
            "current_price": current,
            "triggered_at": updated["triggered_at"],
            "message": msg,
        }
        triggered.append(payload)
        stream_hub.publish_alert(alert["owner_id"], payload)

    return triggered


async def alert_worker_loop(stop_event: asyncio.Event) -> None:
    """Periodic 24/7 background alert evaluation loop running independently of browser tabs."""
    interval = max(5, int(settings.alert_eval_interval_s))
    logger.info("Starting 24/7 Alert Evaluation Worker (interval=%ds)", interval)
    while not stop_event.is_set():
        try:
            triggered = await asyncio.to_thread(evaluate_pending_alerts, None)
            if triggered:
                logger.info("Alert Worker fired %d price alert(s)", len(triggered))
        except Exception as exc:
            logger.debug("Alert worker evaluation cycle error: %s", exc)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except TimeoutError:
            pass
