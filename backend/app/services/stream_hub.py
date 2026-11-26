"""Central real-time quote streaming pub/sub hub for SSE and WebSocket clients."""

import asyncio
import logging
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.core.config import settings
from app.services import yahoo_finance as yf_service

logger = logging.getLogger(__name__)


@dataclass
class StreamSubscriber:
    """Represents a single connected SSE or WebSocket client."""

    sub_id: str
    owner_id: str
    tickers: set[str]
    queue: asyncio.Queue[dict[str, Any]]
    loop: asyncio.AbstractEventLoop
    last_sent_prices: dict[str, tuple[float, float]] = field(default_factory=dict)


class QuoteStreamHub:
    """
    Shared pub/sub hub that multiplexes upstream Yahoo/Finnhub fetches across all
    active streaming clients, preventing redundant rate-limit consumption.
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._subscribers: dict[str, StreamSubscriber] = {}
        self._last_fx_snapshot: dict[str, float] = {}
        self._fetch_lock = asyncio.Lock() if hasattr(asyncio, "Lock") else None

    def register(
        self,
        sub_id: str,
        owner_id: str,
        tickers: list[str],
        loop: asyncio.AbstractEventLoop,
    ) -> StreamSubscriber:
        clean_tickers = {t.strip().upper() for t in tickers if t.strip()}
        sub = StreamSubscriber(
            sub_id=sub_id,
            owner_id=owner_id,
            tickers=clean_tickers,
            queue=asyncio.Queue(maxsize=128),
            loop=loop,
        )
        with self._lock:
            self._subscribers[sub_id] = sub
        return sub

    def update_tickers(self, sub_id: str, tickers: list[str]) -> None:
        clean_tickers = {t.strip().upper() for t in tickers if t.strip()}
        with self._lock:
            if sub_id in self._subscribers:
                self._subscribers[sub_id].tickers = clean_tickers

    def unregister(self, sub_id: str) -> None:
        with self._lock:
            self._subscribers.pop(sub_id, None)

    def get_active_tickers(self) -> list[str]:
        with self._lock:
            union: set[str] = set()
            for sub in self._subscribers.values():
                union.update(sub.tickers)
            return sorted(union)

    def subscriber_count(self) -> int:
        with self._lock:
            return len(self._subscribers)

    def _enqueue(self, sub: StreamSubscriber, event: dict[str, Any]) -> None:
        def _put() -> None:
            if sub.queue.full():
                try:
                    sub.queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            try:
                sub.queue.put_nowait(event)
            except asyncio.QueueFull:
                pass

        try:
            running_loop = asyncio.get_running_loop()
        except RuntimeError:
            running_loop = None

        if running_loop is sub.loop:
            _put()
        else:
            try:
                sub.loop.call_soon_threadsafe(_put)
            except RuntimeError:
                pass

    def publish_alert(self, owner_id: str, alert_payload: dict[str, Any]) -> None:
        """Push a triggered alert event immediately to matching connected subscribers."""
        with self._lock:
            targets = [
                sub for sub in self._subscribers.values()
                if sub.owner_id == owner_id
            ]
        for sub in targets:
            self._enqueue(
                sub,
                {
                    "event": "alert",
                    "data": alert_payload,
                },
            )

    def broadcast_quotes(self, force_all: bool = False) -> int:
        """
        Fetch quotes once for the union of all subscribed tickers, then push
        delta price updates to each subscriber. Returns number of events dispatched.
        """
        tickers = self.get_active_tickers()
        if not tickers:
            return 0

        quotes = yf_service.get_batch_quotes(tickers)
        quote_map = {q.ticker.upper(): q.model_dump() for q in quotes}
        fx_resp = yf_service.get_live_fx_rates()
        now_iso = datetime.now(UTC).isoformat()

        dispatched = 0
        with self._lock:
            subs = list(self._subscribers.values())

        for sub in subs:
            changed_quotes: list[dict[str, Any]] = []
            for t in sub.tickers:
                q_data = quote_map.get(t)
                if not q_data:
                    continue
                sig = (float(q_data["current_price"]), float(q_data["change_percent"]))
                if force_all or sub.last_sent_prices.get(t) != sig:
                    sub.last_sent_prices[t] = sig
                    changed_quotes.append(q_data)

            if changed_quotes:
                self._enqueue(
                    sub,
                    {
                        "event": "tick",
                        "data": {
                            "as_of": now_iso,
                            "quotes": changed_quotes,
                            "fx_rates": [r.model_dump() for r in fx_resp.rates],
                        },
                    },
                )
                dispatched += 1

        return dispatched


stream_hub = QuoteStreamHub()


async def quote_broadcaster_loop(stop_event: asyncio.Event) -> None:
    """Background loop broadcasting shared quote ticks to all live streaming clients."""
    interval = max(2.0, float(settings.stream_tick_interval_s))
    logger.info("Starting real-time QuoteStreamHub broadcaster loop (interval=%.1fs)", interval)
    while not stop_event.is_set():
        try:
            if stream_hub.subscriber_count() > 0:
                await asyncio.to_thread(stream_hub.broadcast_quotes, False)
        except Exception as exc:
            logger.debug("Quote broadcaster tick error: %s", exc)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except TimeoutError:
            pass
