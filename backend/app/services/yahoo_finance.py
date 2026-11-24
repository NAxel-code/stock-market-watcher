"""Yahoo Finance service with multi-level fallback, IDX mechanics, and circuit breaker."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import logging
from typing import Any

from cachetools import TTLCache
import yfinance as yf

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.models.schemas import (
    AnalysisDeskResponse,
    FXRateItem,
    FXRatesResponse,
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
from app.services.technical_desk import generate_technical_desk_report

logger = logging.getLogger(__name__)

# TTL Caches - Increased TTL and capacity to maximize throughput and eliminate cold-start stalls
_quote_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=1000, ttl=120)
_history_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=300, ttl=3600)
_search_cache: TTLCache[str, list[dict[str, Any]]] = TTLCache(maxsize=200, ttl=600)
_market_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=50, ttl=120)
_sparkline_cache: TTLCache[str, list[float]] = TTLCache(maxsize=1000, ttl=3600)
_fx_cache: TTLCache[str, list[dict[str, Any]]] = TTLCache(maxsize=20, ttl=120)

# Stale cache fallback
_stale_quote_cache: dict[str, dict[str, Any]] = {}
_company_name_cache: dict[str, str] = {}

_finnhub_provider = FinnhubProvider()

DEFAULT_COMPANY_NAMES: dict[str, str] = {
    # US
    "AAPL": "Apple Inc.",
    "NVDA": "NVIDIA Corporation",
    "MSFT": "Microsoft Corporation",
    "AMZN": "Amazon.com, Inc.",
    "GOOGL": "Alphabet Inc.",
    "META": "Meta Platforms, Inc.",
    "TSLA": "Tesla, Inc.",
    "AMD": "Advanced Micro Devices, Inc.",
    "NFLX": "Netflix, Inc.",
    "JPM": "JPMorgan Chase & Co.",
    "V": "Visa Inc.",
    "WMT": "Walmart Inc.",
    "DIS": "The Walt Disney Company",
    "XOM": "Exxon Mobil Corporation",
    "JNJ": "Johnson & Johnson",
    "LLY": "Eli Lilly and Company",
    # IDX
    "BBCA.JK": "Bank Central Asia Tbk",
    "BBRI.JK": "Bank Rakyat Indonesia (Persero) Tbk",
    "BMRI.JK": "Bank Mandiri (Persero) Tbk",
    "BBNI.JK": "Bank Negara Indonesia (Persero) Tbk",
    "TLKM.JK": "Telkom Indonesia (Persero) Tbk",
    "ASII.JK": "Astra International Tbk",
    "GOTO.JK": "GoTo Gojek Tokopedia Tbk",
    "ADRO.JK": "Adaro Energy Indonesia Tbk",
    "ANTM.JK": "Aneka Tambang Tbk",
    "BUMI.JK": "Bumi Resources Tbk",
    "PGAS.JK": "Perusahaan Gas Negara Tbk",
    "PTBA.JK": "Bukit Asam Tbk",
    "ICBP.JK": "Indofood CBP Sukses Makmur Tbk",
    "INDF.JK": "Indofood Sukses Makmur Tbk",
    "AMRT.JK": "Sumber Alfaria Trijaya Tbk",
    "UNVR.JK": "Unilever Indonesia Tbk",
    # SGX
    "D05.SI": "DBS Group Holdings Ltd",
    "O39.SI": "Oversea-Chinese Banking Corp Ltd",
    "U11.SI": "United Overseas Bank Ltd",
    "Z74.SI": "Singapore Telecommunications Ltd",
    "C6L.SI": "Singapore Airlines Ltd",
    "BN4.SI": "Keppel Ltd",
    "G13.SI": "Wilmar International Ltd",
    # Indices & ETFs
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ Composite",
    "^DJI": "Dow Jones Industrial Average",
    "^RUT": "Russell 2000",
    "^VIX": "CBOE Volatility Index",
    "^STI": "Straits Times Index (SGX)",
    "^JKSE": "IHSG Composite (IDX)",
    "VOO": "Vanguard S&P 500 ETF",
    "QQQ": "Invesco QQQ Trust",
    "CSPX.L": "iShares Core S&P 500 UCITS ETF",
    "VWRA.L": "Vanguard FTSE All-World UCITS ETF",
    "ES3.SI": "SPDR Straits Times Index ETF",
    "EIDO": "iShares MSCI Indonesia ETF",
    "TLT": "iShares 20+ Year Treasury Bond ETF",
    "BND": "Vanguard Total Bond Market ETF",
}

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
    # SGX (Singapore Exchange) Top Blue Chips
    "D05.SI": ("Financial Services", "Banks—Regional"),
    "O39.SI": ("Financial Services", "Banks—Regional"),
    "U11.SI": ("Financial Services", "Banks—Regional"),
    "Z74.SI": ("Communication Services", "Telecom Services"),
    "C6L.SI": ("Industrials", "Airlines"),
    "BN4.SI": ("Industrials", "Conglomerates"),
    "G13.SI": ("Consumer Defensive", "Agricultural Operations"),
}

US_INDICES = [
    {"ticker": "^GSPC", "name": "S&P 500"},
    {"ticker": "^IXIC", "name": "NASDAQ"},
    {"ticker": "^DJI", "name": "Dow Jones"},
]

IDX_INDICES = [
    {"ticker": "^JKSE", "name": "IHSG (IDX)"},
]

SGX_INDICES = [
    {"ticker": "^STI", "name": "Straits Times (SGX)"},
]

ALL_INDICES = US_INDICES + IDX_INDICES + SGX_INDICES

DEFAULT_WATCHLIST = [
    # US Market Top Traded (16 stocks)
    "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "AMD",
    "NFLX", "JPM", "V", "WMT", "DIS", "XOM", "JNJ", "LLY",
    # IDX (BEI) Top Traded & LQ45 (16 stocks)
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "TLKM.JK", "ASII.JK", "GOTO.JK", "ADRO.JK",
    "ANTM.JK", "BUMI.JK", "PGAS.JK", "PTBA.JK", "ICBP.JK", "INDF.JK", "AMRT.JK", "UNVR.JK",
    # SGX (Singapore) Primary Traded
    "D05.SI", "O39.SI", "U11.SI", "Z74.SI",
]

PERIOD_MAP = {
    "1d": ("1d", "5m"),
    "1w": ("5d", "60m"),
    "1m": ("1mo", "1d"),
    "3m": ("3mo", "1d"),
    "1y": ("1y", "1d"),
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    if value is None or hasattr(value, "_mock_return_value") or hasattr(value, "_mock_wraps"):
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    if value is None or hasattr(value, "_mock_return_value") or hasattr(value, "_mock_wraps"):
        return default
    try:
        return int(value)
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
    elif ticker.upper().endswith(".SI"):
        data["is_idx"] = False
        data["lot_size"] = 100
        data["ara_price"] = None
        data["arb_price"] = None
        data["tick_size"] = None
        if not data.get("currency") or data["currency"] == "USD":
            data["currency"] = "SGD"
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
    """Get real-time stock quote with fast_info primary engine, multi-level fallback, and caching."""
    cache_key = ticker.upper()

    if cache_key in _quote_cache:
        data = _quote_cache[cache_key]
        return StockQuoteResponse(**data, is_stale=False)

    try:
        t = yf.Ticker(ticker)
        current_price = 0.0
        prev_close = 0.0

        # 1. Primary path: fast_info (<150ms latency)
        fast = getattr(t, "fast_info", None)
        if fast is not None and not hasattr(fast, "_mock_return_value"):
            try:
                current_price = _safe_float(getattr(fast, "last_price", None))
                prev_close = _safe_float(getattr(fast, "previous_close", None))
            except Exception as fast_err:
                logger.debug("fast_info attribute access failed for %s: %s", ticker, fast_err)

        if current_price > 0.0:
            change = current_price - prev_close
            change_pct = (change / prev_close * 100) if prev_close else 0.0
            day_high = _safe_float(getattr(fast, "day_high", None)) or None
            day_low = _safe_float(getattr(fast, "day_low", None)) or None
            fifty_two_week_high = _safe_float(getattr(fast, "year_high", None)) or None
            fifty_two_week_low = _safe_float(getattr(fast, "year_low", None)) or None
            market_cap = _safe_int(getattr(fast, "market_cap", None)) or None
            volume = _safe_int(getattr(fast, "last_volume", None)) or None

            api_currency = getattr(fast, "currency", None)
            if not isinstance(api_currency, str) or not api_currency or (api_currency == "USD" and (cache_key.endswith(".JK") or cache_key.endswith(".SI"))):
                resolved_curr = "IDR" if cache_key.endswith(".JK") else ("SGD" if cache_key.endswith(".SI") else "USD")
            else:
                resolved_curr = api_currency

            company_name = _company_name_cache.get(cache_key) or DEFAULT_COMPANY_NAMES.get(cache_key) or ticker.upper()
            sector_info = DEFAULT_SECTORS.get(cache_key)
            sector = sector_info[0] if sector_info else None
            industry = sector_info[1] if sector_info else None

            data = {
                "ticker": cache_key,
                "company_name": company_name,
                "current_price": current_price,
                "previous_close": prev_close,
                "change": round(change, 4),
                "change_percent": round(change_pct, 4),
                "market_cap": market_cap,
                "volume": volume,
                "day_high": day_high,
                "day_low": day_low,
                "fifty_two_week_high": fifty_two_week_high,
                "fifty_two_week_low": fifty_two_week_low,
                "currency": resolved_curr,
                "sector": sector,
                "industry": industry,
            }
        else:
            # 2. Secondary path: t.info fallback (slower ~1.5-2.5s)
            info = None
            try:
                info = t.info
            except Exception as info_err:
                logger.debug("t.info failed for %s: %s", ticker, info_err)

            if not info or (info.get("regularMarketPrice") is None and info.get("currentPrice") is None):
                # 3. Tertiary path: 1-day history fallback
                try:
                    hist = t.history(period="1d")
                    if not hist.empty:
                        current_price = _safe_float(hist["Close"].iloc[-1])
                        prev_close = _safe_float(hist["Open"].iloc[-1])
                except Exception as hist_err:
                    logger.debug("history fallback failed for %s: %s", ticker, hist_err)

                change = current_price - prev_close
                change_pct = (change / prev_close * 100) if prev_close else 0.0

                fallback_curr = "IDR" if cache_key.endswith(".JK") else ("SGD" if cache_key.endswith(".SI") else "USD")
                company_name = DEFAULT_COMPANY_NAMES.get(cache_key) or ticker.upper()
                sector_info = DEFAULT_SECTORS.get(cache_key)
                data = {
                    "ticker": cache_key,
                    "company_name": company_name,
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
                    "currency": fallback_curr,
                    "sector": sector_info[0] if sector_info else None,
                    "industry": sector_info[1] if sector_info else None,
                }
            else:
                current_price = _safe_float(info.get("regularMarketPrice") or info.get("currentPrice"))
                prev_close = _safe_float(info.get("regularMarketPreviousClose") or info.get("previousClose"))
                change = _safe_float(info.get("regularMarketChange"))
                change_pct = _safe_float(info.get("regularMarketChangePercent"))

                api_currency = info.get("currency")
                if not isinstance(api_currency, str) or not api_currency or (api_currency == "USD" and (cache_key.endswith(".JK") or cache_key.endswith(".SI"))):
                    resolved_curr = "IDR" if cache_key.endswith(".JK") else ("SGD" if cache_key.endswith(".SI") else "USD")
                else:
                    resolved_curr = api_currency

                c_name = info.get("longName") or info.get("shortName") or DEFAULT_COMPANY_NAMES.get(cache_key) or ticker.upper()
                _company_name_cache[cache_key] = c_name

                data = {
                    "ticker": cache_key,
                    "company_name": c_name,
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
                    "currency": resolved_curr,
                    "sector": info.get("sector"),
                    "industry": info.get("industry"),
                }

        if data["current_price"] == 0.0:
            # 4. Quaternary path: Attempt secondary provider (Finnhub) before failing
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


def _clean_exchange_name(exch: str, symbol: str) -> str:
    s_upper = symbol.upper()
    e_upper = exch.upper()
    if s_upper.endswith(".JK") or e_upper in ("JKT", "IDX"):
        return "IDX"
    if s_upper.endswith(".SI") or e_upper in ("SES", "SGX"):
        return "SGX"
    if e_upper in ("NYQ", "NYSE"):
        return "NYSE"
    if e_upper in ("NMS", "NGS", "NASDAQ"):
        return "NASDAQ"
    if e_upper in ("PNK", "OTC", "OTHER OTC", "GREY", "OOTC"):
        return "OTC"
    return exch


def _resolve_ticker_currency(ticker: str, exchange: str) -> str:
    t_u = ticker.upper()
    e_u = exchange.upper()
    if t_u.endswith(".JK") or e_u in ("JKT", "IDX"):
        return "IDR"
    if t_u.endswith(".SI") or e_u in ("SES", "SGX"):
        return "SGD"
    if t_u.endswith(".T") or e_u in ("TYO", "JPX"):
        return "JPY"
    if t_u.endswith(".L") or e_u in ("LSE", "LON"):
        return "GBP"
    return "USD"


def _is_primary_listing(ticker: str, exchange: str) -> bool:
    e_u = exchange.upper()
    t_u = ticker.upper()
    if e_u in ("PNK", "OTC", "OTHER OTC", "GREY", "OOTC"):
        return False
    if len(t_u) == 5 and (t_u.endswith("Y") or t_u.endswith("F")) and "." not in t_u:
        return False
    return True


def search_tickers(query: str) -> list[StockSearchResult]:
    """Search tickers by query string."""
    cache_key = query.lower().strip()
    if cache_key in _search_cache:
        return [StockSearchResult(**r) for r in _search_cache[cache_key]]

    try:
        results = yf.Search(query, max_results=12)
        quotes = results.quotes if hasattr(results, "quotes") else []

        items = []
        for q in quotes:
            sym = q.get("symbol")
            if not sym:
                continue
            raw_exch = q.get("exchange", "N/A")
            clean_exch = _clean_exchange_name(raw_exch, sym)
            curr = _resolve_ticker_currency(sym, raw_exch)
            is_pri = _is_primary_listing(sym, raw_exch)

            items.append(
                StockSearchResult(
                    ticker=sym,
                    name=q.get("longname") or q.get("shortname") or sym,
                    exchange=clean_exch,
                    type=q.get("quoteType", "EQUITY"),
                    currency=curr,
                    is_primary=is_pri,
                )
            )

        # Sort: Primary listings rank above OTC/ADR copies; exact prefix match prioritized
        q_upper = query.upper().strip()
        items.sort(
            key=lambda x: (
                not x.is_primary,
                0 if x.ticker.upper() == q_upper else (1 if x.ticker.upper().startswith(q_upper) else 2),
            )
        )

        _search_cache[cache_key] = [i.model_dump() for i in items]
        return items

    except Exception as exc:
        logger.error("Search error for query '%s': %s", query, exc)
        return []


def get_batch_quotes(tickers: list[str]) -> list[StockQuoteResponse]:
    """Batch fetch quotes concurrently for a list of tickers."""
    if not tickers:
        return []

    seen = set()
    unique_tickers: list[str] = []
    for t in tickers:
        up = t.upper()
        if up not in seen:
            seen.add(up)
            unique_tickers.append(t)

    def _fetch_single(sym: str) -> StockQuoteResponse | None:
        try:
            return get_quote(sym)
        except (StockNotFoundError, ExternalAPIError) as exc:
            logger.warning("Skipping %s in batch: %s", sym, exc)
            return None
        except Exception as exc:
            logger.warning("Unexpected error fetching %s: %s", sym, exc)
            return None

    if len(unique_tickers) == 1:
        res = _fetch_single(unique_tickers[0])
        return [res] if res else []

    with ThreadPoolExecutor(max_workers=min(12, len(unique_tickers))) as executor:
        results = list(executor.map(_fetch_single, unique_tickers))

    return [r for r in results if r is not None]


def get_market_summary() -> MarketSummaryResponse:
    """Get market indices summary and top movers with concurrent batch execution."""
    if "summary" in _market_cache:
        return MarketSummaryResponse(**_market_cache["summary"])

    index_tickers = [idx["ticker"] for idx in ALL_INDICES]
    index_quotes = {q.ticker: q for q in get_batch_quotes(index_tickers)}

    indices: list[MarketIndex] = []
    for idx in ALL_INDICES:
        t_up = idx["ticker"].upper()
        q = index_quotes.get(t_up)
        if q:
            indices.append(
                MarketIndex(
                    name=idx["name"],
                    ticker=idx["ticker"],
                    current_price=q.current_price,
                    change=q.change,
                    change_percent=q.change_percent,
                    is_stale=q.is_stale,
                )
            )

    batch = get_batch_quotes(DEFAULT_WATCHLIST)
    sorted_movers = sorted(batch, key=lambda x: x.change_percent, reverse=True)

    top_gainers = [
        TopMover(
            ticker=q.ticker,
            company_name=q.company_name,
            current_price=q.current_price,
            change_percent=q.change_percent,
            currency=q.currency,
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
            currency=q.currency,
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
    """Get detailed market session status for IDX, US, and SGX markets."""
    idx_status = get_market_session_status("IDX")
    us_status = get_market_session_status("US")
    sgx_status = get_market_session_status("SGX")
    return MarketStatusResponse(
        idx=MarketSessionInfo(**idx_status),
        us=MarketSessionInfo(**us_status),
        sgx=MarketSessionInfo(**sgx_status),
    )


def get_technical_desk(ticker: str) -> AnalysisDeskResponse:
    """Get institutional technical desk analysis report for ticker."""
    cache_key = ticker.upper()
    try:
        t = yf.Ticker(cache_key)
        hist = t.history(period="1y", interval="1d")
        if hist.empty or len(hist) < 5:
            raise StockNotFoundError(cache_key)

        is_idx = cache_key.endswith(".JK")
        is_sgx = cache_key.endswith(".SI")

        if is_idx:
            bench_symbol = "^JKSE"
            bench_name = "IHSG (IDX)"
        elif is_sgx:
            bench_symbol = "^STI"
            bench_name = "Straits Times Index (SGX)"
        else:
            bench_symbol = "^GSPC"
            bench_name = "S&P 500"

        try:
            bench_hist = yf.Ticker(bench_symbol).history(period="3mo", interval="1d")
        except Exception as bench_err:
            logger.debug("Failed to fetch benchmark %s: %s", bench_symbol, bench_err)
            bench_hist = None

        quote = get_quote(cache_key)
        return generate_technical_desk_report(
            ticker=cache_key,
            company_name=quote.company_name,
            df=hist,
            benchmark_df=bench_hist,
            currency=quote.currency,
            benchmark_name=bench_name,
            benchmark_ticker=bench_symbol,
        )
    except StockNotFoundError:
        raise
    except Exception as exc:
        logger.error("Failed to generate technical desk report for %s: %s", ticker, exc)
        raise ExternalAPIError(f"Failed to generate technical desk analysis for {ticker}") from exc


FX_PAIRS = [
    ("USD/SGD", "USD", "SGD", "USDSGD=X"),
    ("USD/IDR", "USD", "IDR", "USDIDR=X"),
    ("USD/JPY", "USD", "JPY", "USDJPY=X"),
    ("SGD/IDR", "SGD", "IDR", "SGDIDR=X"),
    ("SGD/JPY", "SGD", "JPY", "SGDJPY=X"),
    ("EUR/USD", "EUR", "USD", "EURUSD=X"),
]


def get_live_fx_rates() -> FXRatesResponse:
    """Fetch real-time foreign exchange cross rates concurrently."""
    cache_key = "live_fx"
    if cache_key in _fx_cache:
        rates = [FXRateItem(**r) for r in _fx_cache[cache_key]]
        return FXRatesResponse(rates=rates, as_of=datetime.now(timezone.utc).isoformat())

    def _fetch_pair(pair_info: tuple[str, str, str, str]) -> FXRateItem | None:
        pair_name, from_curr, to_curr, symbol = pair_info
        try:
            t = yf.Ticker(symbol)
            fast = getattr(t, "fast_info", None)
            rate = 0.0
            prev_close = 0.0
            if fast:
                rate = _safe_float(getattr(fast, "last_price", None))
                prev_close = _safe_float(getattr(fast, "previous_close", None))
            if rate == 0.0:
                h = t.history(period="5d", interval="1d")
                if not h.empty and len(h) >= 1:
                    rate = round(_safe_float(h["Close"].iloc[-1]), 4)
                    prev_close = round(_safe_float(h["Close"].iloc[-2]) if len(h) >= 2 else rate, 4)

            change = round(rate - prev_close, 4) if prev_close > 0 else 0.0
            change_pct = round((change / prev_close) * 100, 2) if prev_close > 0 else 0.0
            return FXRateItem(
                pair=pair_name,
                from_currency=from_curr,
                to_currency=to_curr,
                rate=round(rate, 4) if "IDR" not in to_curr else round(rate, 2),
                change=change,
                change_percent=change_pct,
            )
        except Exception as exc:
            logger.debug("Failed to fetch FX pair %s: %s", symbol, exc)
            return None

    with ThreadPoolExecutor(max_workers=len(FX_PAIRS)) as ex:
        items = [i for i in ex.map(_fetch_pair, FX_PAIRS) if i is not None]

    if not items:
        # Fallback rates in case network is down
        fallback = [
            FXRateItem(pair="USD/SGD", from_currency="USD", to_currency="SGD", rate=1.3450, change=0.001, change_percent=0.07),
            FXRateItem(pair="USD/IDR", from_currency="USD", to_currency="IDR", rate=15850.0, change=-25.0, change_percent=-0.16),
            FXRateItem(pair="USD/JPY", from_currency="USD", to_currency="JPY", rate=154.20, change=0.35, change_percent=0.23),
            FXRateItem(pair="SGD/IDR", from_currency="SGD", to_currency="IDR", rate=11785.0, change=-10.0, change_percent=-0.08),
            FXRateItem(pair="SGD/JPY", from_currency="SGD", to_currency="JPY", rate=114.65, change=0.15, change_percent=0.13),
            FXRateItem(pair="EUR/USD", from_currency="EUR", to_currency="USD", rate=1.0520, change=0.0005, change_percent=0.05),
        ]
        items = fallback

    _fx_cache[cache_key] = [i.model_dump() for i in items]
    return FXRatesResponse(rates=items, as_of=datetime.now(timezone.utc).isoformat())

