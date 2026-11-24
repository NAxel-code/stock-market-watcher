import logging
import time
from datetime import datetime, timezone
from typing import Any
from app.services import yahoo_finance as yf_service

logger = logging.getLogger("stockpulse")

# In-memory snapshot storage with disk/cache fallback
_last_collection_time: str | None = None
_collection_metrics: dict[str, Any] = {
    "total_collections": 0,
    "last_duration_ms": 0,
    "last_status": "UNINITIALIZED",
    "stale_tickers_count": 0,
    "primary_source": "yahoo_finance",
    "backup_source": "cachetools_inmemory",
}

# Snapshot cache for instant serving
_cached_market_snapshot: dict[str, Any] = {}


def convert_fx(amount: float, from_currency: str, to_currency: str) -> dict[str, Any]:
    """
    Unified backend FX conversion engine.
    Calculates direct, inverse, or cross-rate triangulation via live rates.
    """
    from_curr = from_currency.strip().upper()
    to_curr = to_currency.strip().upper()

    if from_curr == to_curr:
        return {
            "amount": amount,
            "from_currency": from_curr,
            "to_currency": to_curr,
            "rate": 1.0,
            "converted_amount": amount,
            "as_of": datetime.now(timezone.utc).isoformat(),
        }

    rates_resp = yf_service.get_live_fx_rates()
    rates_map = {item.pair: item.rate for item in rates_resp.rates}

    # Direct pair
    direct_pair = f"{from_curr}/{to_curr}"
    if direct_pair in rates_map:
        rate = rates_map[direct_pair]
        return {
            "amount": amount,
            "from_currency": from_curr,
            "to_currency": to_curr,
            "rate": rate,
            "converted_amount": round(amount * rate, 4 if rate < 100 else 2),
            "as_of": rates_resp.as_of,
        }

    # Inverse pair
    inverse_pair = f"{to_curr}/{from_curr}"
    if inverse_pair in rates_map and rates_map[inverse_pair] > 0:
        rate = 1.0 / rates_map[inverse_pair]
        return {
            "amount": amount,
            "from_currency": from_curr,
            "to_currency": to_curr,
            "rate": rate,
            "converted_amount": round(amount * rate, 4 if rate < 100 else 2),
            "as_of": rates_resp.as_of,
        }

    # Triangulation via USD
    # 1. from -> USD
    rate_from_usd = 1.0 if from_curr == "USD" else None
    if f"USD/{from_curr}" in rates_map and rates_map[f"USD/{from_curr}"] > 0:
        rate_from_usd = 1.0 / rates_map[f"USD/{from_curr}"]

    # 2. USD -> to
    rate_usd_to = 1.0 if to_curr == "USD" else None
    if f"USD/{to_curr}" in rates_map:
        rate_usd_to = rates_map[f"USD/{to_curr}"]

    if rate_from_usd is not None and rate_usd_to is not None:
        triangulated_rate = rate_from_usd * rate_usd_to
        return {
            "amount": amount,
            "from_currency": from_curr,
            "to_currency": to_curr,
            "rate": triangulated_rate,
            "converted_amount": round(amount * triangulated_rate, 4 if triangulated_rate < 100 else 2),
            "as_of": rates_resp.as_of,
        }

    # Fallback to 1:1 if rate cannot be resolved
    return {
        "amount": amount,
        "from_currency": from_curr,
        "to_currency": to_curr,
        "rate": 1.0,
        "converted_amount": amount,
        "as_of": datetime.now(timezone.utc).isoformat(),
        "warning": f"Unable to resolve cross-rate for {from_curr} to {to_curr}",
    }


def run_collection_cycle(target_tickers: list[str] | None = None) -> dict[str, Any]:
    """
    Executes a scheduled collection cycle across FX, market status, and equities universe.
    Caches the results and updates telemetry metrics.
    """
    global _last_collection_time, _collection_metrics, _cached_market_snapshot
    start_time = time.perf_counter()
    logger.info("Starting scheduled market data collection cycle...")

    tickers_to_pull = target_tickers or yf_service.DEFAULT_WATCHLIST[:12]
    stale_count = 0

    try:
        # 1. Collect FX Rates
        fx_rates = yf_service.get_live_fx_rates()

        # 2. Collect Market Statuses
        statuses = yf_service.get_all_market_statuses()

        # 3. Collect Batch Quotes
        quotes = yf_service.get_batch_quotes(tickers_to_pull)
        for q in quotes:
            if q.is_stale:
                stale_count += 1

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        _last_collection_time = datetime.now(timezone.utc).isoformat()

        _collection_metrics["total_collections"] += 1
        _collection_metrics["last_duration_ms"] = duration_ms
        _collection_metrics["last_status"] = "SUCCESS"
        _collection_metrics["stale_tickers_count"] = stale_count

        _cached_market_snapshot = {
            "as_of": _last_collection_time,
            "duration_ms": duration_ms,
            "quotes_count": len(quotes),
            "fx_pairs_count": len(fx_rates.rates),
            "statuses": statuses,
            "stale_count": stale_count,
        }

        logger.info(
            f"Collection cycle complete in {duration_ms}ms: {len(quotes)} quotes, "
            f"{len(fx_rates.rates)} FX pairs, {stale_count} stale."
        )

        return {
            "status": "SUCCESS",
            "duration_ms": duration_ms,
            "collected_quotes": len(quotes),
            "fx_pairs": len(fx_rates.rates),
            "as_of": _last_collection_time,
        }
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        _collection_metrics["last_duration_ms"] = duration_ms
        _collection_metrics["last_status"] = f"ERROR: {str(exc)}"
        logger.error(f"Collection cycle failed after {duration_ms}ms: {exc}")
        return {
            "status": "ERROR",
            "error": str(exc),
            "duration_ms": duration_ms,
            "as_of": datetime.now(timezone.utc).isoformat(),
        }


def get_health_telemetry() -> dict[str, Any]:
    """Returns real-time data health telemetry and provider status."""
    return {
        "status": "HEALTHY" if _collection_metrics["last_status"] in ("SUCCESS", "UNINITIALIZED") else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "last_collection": _last_collection_time,
        "metrics": _collection_metrics,
        "latest_snapshot": _cached_market_snapshot or None,
    }
