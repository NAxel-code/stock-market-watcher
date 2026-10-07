"""Yahoo Finance service with multi-level fallback, IDX mechanics, and circuit breaker."""

import logging
from typing import Any

import yfinance as yf
from cachetools import TTLCache

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.models.schemas import (
    HistoryPoint,
    MarketIndex,
    MarketSessionInfo,
    MarketStatusResponse,
    MarketSummaryResponse,
    StockHistoryResponse,
    StockQuoteResponse,
    StockSearchResult,
    TopMover,
)
from app.services.idx_rules import (
    calculate_idx_auto_rejection,
    get_market_session_status,
    is_idx_stock,
)
from app.services.providers.finnhub import FinnhubProvider

logger = logging.getLogger(__name__)

# TTL Caches
_quote_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=500, ttl=60)
_history_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=200, ttl=3600)
_search_cache: TTLCache[str, list[dict[str, Any]]] = TTLCache(maxsize=100, ttl=600)
_market_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=10, ttl=60)
_sparkline_cache: TTLCache[str, list[float]] = TTLCache(maxsize=500, ttl=3600)

# Stale cache fallback
_stale_quote_cache: dict[str, dict[str, Any]] = {}

_finnhub_provider = FinnhubProvider()

DEFAULT_SECTORS: dict[str, tuple[str, str]] = {
    # US Top Blue Chips & Most Traded
    "AAPL": ("Technology", "Consumer Electronics"),
    "NVDA": ("Technology", "Semiconductors"),
    "MSFT": ("Technology", "Software—Infrastructure"),
    "AMZN": ("Consumer Cyclical", "Internet Retail"),
    "GOOGL": ("Communication Services", "Internet Content & Information"),
    "META": ("Communication Services", "Internet Content & Information"),
    "TSLA": ("Consumer Cyclical", "Auto Manufacturers"),
    "AMD": ("Technology", "Semiconductors"),
    "NFLX": ("Communication Services", "Entertainment"),
    "JPM": ("Financial Services", "Banks—Diversified"),
    "V": ("Financial Services", "Credit Services"),
    "WMT": ("Consumer Defensive", "Discount Stores"),
    "DIS": ("Communication Services", "Entertainment"),
    "XOM": ("Energy", "Oil & Gas Integrated"),
    "JNJ": ("Healthcare", "Drug Manufacturers—General"),
    "LLY": ("Healthcare", "Drug Manufacturers—General"),
    # IDX (BEI) Top Blue Chips & LQ45 Liquid Stocks
    "BBCA.JK": ("Financial Services", "Banks—Regional"),
    "BBRI.JK": ("Financial Services", "Banks—Regional"),
    "BMRI.JK": ("Financial Services", "Banks—Regional"),
    "BBNI.JK": ("Financial Services", "Banks—Regional"),
    "TLKM.JK": ("Communication Services", "Telecom Services"),
    "ASII.JK": ("Consumer Cyclical", "Auto Manufacturers"),
    "GOTO.JK": ("Technology", "Internet Content & Information"),
    "ADRO.JK": ("Energy", "Thermal Coal"),
    "ANTM.JK": ("Basic Materials", "Other Industrial Metals & Mining"),
    "BUMI.JK": ("Energy", "Thermal Coal"),
    "PGAS.JK": ("Utilities", "Utilities—Regulated Gas"),
    "PTBA.JK": ("Energy", "Thermal Coal"),
    "ICBP.JK": ("Consumer Defensive", "Packaged Foods"),
    "INDF.JK": ("Consumer Defensive", "Packaged Foods"),
    "AMRT.JK": ("Consumer Defensive", "Grocery Stores"),
    "UNVR.JK": ("Consumer Defensive", "Household & Personal Products"),
}

US_INDICES = [
    {"ticker": "^GSPC", "name": "S&P 500"},
    {"ticker": "^IXIC", "name": "NASDAQ"},
    {"ticker": "^DJI", "name": "Dow Jones"},
]

IDX_INDICES = [
    {"ticker": "^JKSE", "name": "IHSG (IDX)"},
]

ALL_INDICES = US_INDICES + IDX_INDICES

DEFAULT_WATCHLIST = [
    # US Market Top Traded (16 stocks)
    "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "AMD",
    "NFLX", "JPM", "V", "WMT", "DIS", "XOM", "JNJ", "LLY",
    # IDX (BEI) Top Traded & LQ45 (16 stocks)
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "TLKM.JK", "ASII.JK", "GOTO.JK", "ADRO.JK",
    "ANTM.JK", "BUMI.JK", "PGAS.JK", "PTBA.JK", "ICBP.JK", "INDF.JK", "AMRT.JK", "UNVR.JK",
]

PERIOD_MAP = {
    "1d": ("1d", "5m"),
    "1w": ("5d", "60m"),
    "1m": ("1mo", "1d"),
    "3m": ("3mo", "1d"),
    "1y": ("1y", "1wk"),
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def _enrich_quote_metadata(data: dict[str, Any], ticker: str) -> None:
    """Enrich quote with 52-week position and IDX-specific rules."""
    current_price = data.get("current_price", 0.0)
    high_52 = data.get("fifty_two_week_high")
    low_52 = data.get("fifty_two_week_low")

    # Bloomberg 52-Week Range Position (0.0 to 1.0)
    if high_52 and low_52 and high_52 > low_52 and current_price is not None:
        pos = (current_price - low_52) / (high_52 - low_52)
        data["fifty_two_week_position"] = round(max(0.0, min(1.0, pos)), 4)
    else:
        data["fifty_two_week_position"] = None

    # IDX Trading Rules (Lot size, Fraksi Harga, ARA, ARB)
    if is_idx_stock(ticker):
        data["is_idx"] = True
        data["lot_size"] = 100
        prev_close = data.get("previous_close", 0.0)
        limits = calculate_idx_auto_rejection(prev_close)
        data["ara_price"] = limits["ara_price"]
        data["arb_price"] = limits["arb_price"]
        data["tick_size"] = limits["tick_size"]
        if not data.get("currency") or data["currency"] == "USD":
            data["currency"] = "IDR"
    else:
        data["is_idx"] = False
        data["lot_size"] = 1
        data["ara_price"] = None
        data["arb_price"] = None
        data["tick_size"] = None

    # CoinGecko Distance from 52W High / Low (Percentage)
    if high_52 and high_52 > 0 and current_price is not None:
        data["distance_from_52w_high"] = round(((current_price - high_52) / high_52) * 100, 2)
    else:
        data["distance_from_52w_high"] = None

    if low_52 and low_52 > 0 and current_price is not None:
        data["distance_from_52w_low"] = round(((current_price - low_52) / low_52) * 100, 2)
    else:
        data["distance_from_52w_low"] = None

    # CoinGecko Sector & Industry Tagging
    t_upper = ticker.upper()
    if not data.get("sector") and t_upper in DEFAULT_SECTORS:
        data["sector"], data["industry"] = DEFAULT_SECTORS[t_upper]

    # CoinGecko 7-Day Sparkline
    if t_upper in _sparkline_cache:
        data["sparkline_7d"] = _sparkline_cache[t_upper]
    else:
        prev_close = data.get("previous_close", current_price)
        data["sparkline_7d"] = [prev_close, current_price] if prev_close else [current_price]


def get_quote(ticker: str) -> StockQuoteResponse:
    """Get real-time stock quote with multi-level fallback and caching."""
    cache_key = ticker.upper()

    if cache_key in _quote_cache:
        data = _quote_cache[cache_key]
        return StockQuoteResponse(**data, is_stale=False)

    try:
        t = yf.Ticker(ticker)
        info = None
        try:
            info = t.info
        except Exception as info_err:
            logger.debug("t.info failed for %s: %s", ticker, info_err)

        if not info or (info.get("regularMarketPrice") is None and info.get("currentPrice") is None):
            # Try fast_info as fallback
            fast = getattr(t, "fast_info", None)
            current_price = _safe_float(getattr(fast, "last_price", None)) if fast else 0.0
            prev_close = _safe_float(getattr(fast, "previous_close", None)) if fast else 0.0

            # If fast_info also lacked price, try 1-day history
            if current_price == 0.0:
                try:
                    hist = t.history(period="1d")
                    if not hist.empty:
                        current_price = _safe_float(hist["Close"].iloc[-1])
                        prev_close = _safe_float(hist["Open"].iloc[-1])
                except Exception as hist_err:
                    logger.debug("history fallback failed for %s: %s", ticker, hist_err)

            change = current_price - prev_close
            change_pct = (change / prev_close * 100) if prev_close else 0.0

            data = {
                "ticker": ticker.upper(),
                "company_name": ticker.upper(),
                "current_price": current_price,
                "previous_close": prev_close,
                "change": round(change, 4),
                "change_percent": round(change_pct, 4),
                "market_cap": None,
                "volume": None,
                "day_high": None,
                "day_low": None,
                "fifty_two_week_high": None,
                "fifty_two_week_low": None,
                "currency": "USD",
                "sector": None,
                "industry": None,
            }
        else:
            current_price = _safe_float(info.get("regularMarketPrice") or info.get("currentPrice"))
            prev_close = _safe_float(info.get("regularMarketPreviousClose") or info.get("previousClose"))
            change = _safe_float(info.get("regularMarketChange"))
            change_pct = _safe_float(info.get("regularMarketChangePercent"))

            data = {
                "ticker": ticker.upper(),
                "company_name": info.get("longName") or info.get("shortName") or ticker.upper(),
                "current_price": current_price,
                "previous_close": prev_close,
                "change": round(change, 4),
                "change_percent": round(change_pct, 4),
                "market_cap": info.get("marketCap"),
                "volume": info.get("regularMarketVolume"),
                "day_high": info.get("regularMarketDayHigh") or info.get("dayHigh"),
                "day_low": info.get("regularMarketDayLow") or info.get("dayLow"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "currency": info.get("currency", "USD"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
            }

        # Fetch 7-day sparkline if not cached
        if cache_key not in _sparkline_cache:
            try:
                hist_7d = t.history(period="7d", interval="1d")
                if not hist_7d.empty and len(hist_7d) > 1:
                    prices = [round(_safe_float(p), 2) for p in hist_7d["Close"].tolist() if _safe_float(p) > 0]
                    if prices:
                        _sparkline_cache[cache_key] = prices
            except Exception as spark_err:
                logger.debug("Failed to fetch 7d sparkline for %s: %s", ticker, spark_err)

        if data["current_price"] == 0.0:
            # Attempt secondary provider (Finnhub) before failing
            finnhub_quote = _finnhub_provider.get_quote(ticker)
            if finnhub_quote and finnhub_quote.get("current_price", 0.0) > 0.0:
                data = finnhub_quote
            else:
                raise StockNotFoundError(ticker)

        _enrich_quote_metadata(data, ticker)
        _quote_cache[cache_key] = data
        _stale_quote_cache[cache_key] = data
        return StockQuoteResponse(**data, is_stale=False)

    except StockNotFoundError:
        raise
    except Exception as exc:
        logger.warning("yfinance error for %s: %s", ticker, exc)
        # Attempt Finnhub fallback
        finnhub_fallback = _finnhub_provider.get_quote(ticker)
        if finnhub_fallback and finnhub_fallback.get("current_price", 0.0) > 0.0:
            _enrich_quote_metadata(finnhub_fallback, ticker)
            _quote_cache[cache_key] = finnhub_fallback
            _stale_quote_cache[cache_key] = finnhub_fallback
            return StockQuoteResponse(**finnhub_fallback, is_stale=False)

        if cache_key in _stale_quote_cache:
            logger.info("Returning stale cache for %s", ticker)
            stale = _stale_quote_cache[cache_key]
            _enrich_quote_metadata(stale, ticker)
            return StockQuoteResponse(**stale, is_stale=True)
        raise StockNotFoundError(ticker) from exc


def get_history(ticker: str, period: str = "1m") -> StockHistoryResponse:
    """Get historical OHLCV data."""
    period_key = period.lower()
    cache_key = f"{ticker.upper()}:{period_key}"

    if cache_key in _history_cache:
        cached = _history_cache[cache_key]
        return StockHistoryResponse(**cached)

    yf_period, yf_interval = PERIOD_MAP.get(period_key, ("1mo", "1d"))

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=yf_period, interval=yf_interval)

        if hist.empty:
            raise StockNotFoundError(ticker)

        points = []
        for ts, row in hist.iterrows():
            points.append(
                HistoryPoint(
                    timestamp=ts.isoformat(),
                    open=round(_safe_float(row.get("Open")), 4),
                    high=round(_safe_float(row.get("High")), 4),
                    low=round(_safe_float(row.get("Low")), 4),
                    close=round(_safe_float(row.get("Close")), 4),
                    volume=_safe_int(row.get("Volume")),
                )
            )

        result = {"ticker": ticker.upper(), "period": period_key, "data": [p.model_dump() for p in points]}
        _history_cache[cache_key] = result
        return StockHistoryResponse(**result)

    except StockNotFoundError:
        raise
    except Exception as exc:
        logger.error("History fetch error for %s: %s", ticker, exc)
        raise ExternalAPIError(f"Failed to fetch history for {ticker}") from exc


def search_tickers(query: str) -> list[StockSearchResult]:
    """Search tickers by query string."""
    cache_key = query.lower().strip()
    if cache_key in _search_cache:
        return [StockSearchResult(**r) for r in _search_cache[cache_key]]

    try:
        results = yf.Search(query, max_results=8)
        quotes = results.quotes if hasattr(results, "quotes") else []

        items = []
        for q in quotes:
            if not q.get("symbol"):
                continue
            items.append(
                StockSearchResult(
                    ticker=q.get("symbol", ""),
                    name=q.get("longname") or q.get("shortname") or q.get("symbol", ""),
                    exchange=q.get("exchange", "N/A"),
                    type=q.get("quoteType", "EQUITY"),
                )
            )

        _search_cache[cache_key] = [i.model_dump() for i in items]
        return items

    except Exception as exc:
        logger.error("Search error for query '%s': %s", query, exc)
        return []


def get_batch_quotes(tickers: list[str]) -> list[StockQuoteResponse]:
    """Batch fetch quotes for a list of tickers."""
    results = []
    for ticker in tickers:
        try:
            results.append(get_quote(ticker))
        except (StockNotFoundError, ExternalAPIError) as exc:
            logger.warning("Skipping %s in batch: %s", ticker, exc)
    return results


def get_market_summary() -> MarketSummaryResponse:
    """Get market indices summary and top movers."""
    if "summary" in _market_cache:
        return MarketSummaryResponse(**_market_cache["summary"])

    indices: list[MarketIndex] = []
    for idx in ALL_INDICES:
        try:
            quote = get_quote(idx["ticker"])
            indices.append(
                MarketIndex(
                    name=idx["name"],
                    ticker=idx["ticker"],
                    current_price=quote.current_price,
                    change=quote.change,
                    change_percent=quote.change_percent,
                    is_stale=quote.is_stale,
                )
            )
        except Exception as exc:
            logger.warning("Failed to fetch index %s: %s", idx["ticker"], exc)

    batch = get_batch_quotes(DEFAULT_WATCHLIST)
    sorted_movers = sorted(batch, key=lambda x: x.change_percent, reverse=True)

    top_gainers = [
        TopMover(
            ticker=q.ticker,
            company_name=q.company_name,
            current_price=q.current_price,
            change_percent=q.change_percent,
        )
        for q in sorted_movers[:4]
        if q.change_percent > 0
    ]

    top_losers = [
        TopMover(
            ticker=q.ticker,
            company_name=q.company_name,
            current_price=q.current_price,
            change_percent=q.change_percent,
        )
        for q in reversed(sorted_movers)
        if q.change_percent < 0
    ][:4]

    result = {
        "indices": [i.model_dump() for i in indices],
        "top_gainers": [g.model_dump() for g in top_gainers],
        "top_losers": [loser.model_dump() for loser in top_losers],
    }
    _market_cache["summary"] = result
    return MarketSummaryResponse(**result)


def get_all_market_statuses() -> MarketStatusResponse:
    """Get detailed market session status for IDX and US markets."""
    idx_status = get_market_session_status("IDX")
    us_status = get_market_session_status("US")
    return MarketStatusResponse(
        idx=MarketSessionInfo(**idx_status),
        us=MarketSessionInfo(**us_status),
    )
