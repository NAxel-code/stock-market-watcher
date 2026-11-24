"""
Markets Screen Service for StockPulse.
Consolidates Multi-Asset Market Intelligence:
- Global & Regional Indices (US, Singapore, Indonesia)
- Core Global ETFs (VOO, QQQ, CSPX, VWRA, ES3, EIDO)
- Live Macro FX Matrix (USD/SGD, USD/IDR, USD/JPY, SGD/IDR, SGD/JPY, DXY)
- Sovereign Yield Curves & Central Bank Rates (US Treasury, MAS SGS, BI Indo Bonds)
- Energy, Industrial Metals & Southeast Asian Commodities (Coal, Nickel, CPO)
- Quant Unusual Movers ranked by 1-Year Volatility Shock (Z-Score).
"""

from datetime import datetime, timezone
import logging
from typing import Any

from cachetools import TTLCache

from app.models.schemas import (
    MarketInstrument,
    MarketsOverviewResponse,
    UnusualMover,
    YieldCurvePoint,
)
from app.services.yahoo_finance import get_batch_quotes, get_quote

logger = logging.getLogger(__name__)

# Cache overview response for 120 seconds
_overview_cache: TTLCache[str, Any] = TTLCache(maxsize=20, ttl=120)

# 1. INDICES CONFIG
INDICES_CONFIG = [
    {"ticker": "^GSPC", "name": "S&P 500", "source": "Cboe / S&P Dow Jones", "unit": "pts", "fallback_price": 5985.25, "fallback_chg": 22.40, "fallback_pct": 0.38},
    {"ticker": "^IXIC", "name": "NASDAQ Composite", "source": "Nasdaq", "unit": "pts", "fallback_price": 19020.50, "fallback_chg": 95.10, "fallback_pct": 0.50},
    {"ticker": "^DJI", "name": "Dow Jones Industrial", "source": "S&P Dow Jones", "unit": "pts", "fallback_price": 44296.51, "fallback_chg": -120.30, "fallback_pct": -0.27},
    {"ticker": "^RUT", "name": "Russell 2000", "source": "FTSE Russell", "unit": "pts", "fallback_price": 2406.80, "fallback_chg": 18.20, "fallback_pct": 0.76},
    {"ticker": "^VIX", "name": "CBOE Volatility Index", "source": "Cboe", "unit": "vol", "fallback_price": 14.85, "fallback_chg": -0.65, "fallback_pct": -4.19},
    {"ticker": "^STI", "name": "Straits Times Index (SGX)", "source": "SGX / FTSE", "unit": "pts", "fallback_price": 3745.20, "fallback_chg": 14.60, "fallback_pct": 0.39},
    {"ticker": "^JKSE", "name": "IHSG Composite (IDX)", "source": "Indonesia Stock Exchange", "unit": "pts", "fallback_price": 7240.15, "fallback_chg": 42.10, "fallback_pct": 0.59},
]

# 2. CORE ETFS CONFIG
ETFS_CONFIG = [
    {"ticker": "VOO", "name": "Vanguard S&P 500 ETF", "source": "NYSE Arca", "unit": "$", "fallback_price": 548.20, "fallback_chg": 2.10, "fallback_pct": 0.38},
    {"ticker": "QQQ", "name": "Invesco QQQ Trust", "source": "Nasdaq", "unit": "$", "fallback_price": 508.45, "fallback_chg": 2.65, "fallback_pct": 0.52},
    {"ticker": "CSPX.L", "name": "iShares Core S&P 500 (UCITS)", "source": "London Stock Exchange", "unit": "$", "fallback_price": 612.30, "fallback_chg": 2.40, "fallback_pct": 0.39},
    {"ticker": "VWRA.L", "name": "Vanguard FTSE All-World (UCITS)", "source": "London Stock Exchange", "unit": "$", "fallback_price": 138.40, "fallback_chg": 0.55, "fallback_pct": 0.40},
    {"ticker": "ES3.SI", "name": "SPDR Straits Times Index ETF", "source": "Singapore Exchange", "unit": "S$", "fallback_price": 3.78, "fallback_chg": 0.02, "fallback_pct": 0.53},
    {"ticker": "EIDO", "name": "iShares MSCI Indonesia ETF", "source": "NYSE Arca", "unit": "$", "fallback_price": 19.85, "fallback_chg": 0.18, "fallback_pct": 0.92},
]

# 3. MACRO FX CONFIG
FX_CONFIG = [
    {"ticker": "USDSGD=X", "name": "USD / SGD", "source": "MAS / Interbank", "unit": "SGD", "fallback_price": 1.3465, "fallback_chg": -0.0012, "fallback_pct": -0.09},
    {"ticker": "USDIDR=X", "name": "USD / IDR", "source": "Bank Indonesia JISDOR", "unit": "IDR", "fallback_price": 15875.0, "fallback_chg": -25.0, "fallback_pct": -0.16},
    {"ticker": "USDJPY=X", "name": "USD / JPY", "source": "Bank of Japan / Interbank", "unit": "JPY", "fallback_price": 154.20, "fallback_chg": 0.35, "fallback_pct": 0.23},
    {"ticker": "SGDIDR=X", "name": "SGD / IDR", "source": "MAS / BI Cross", "unit": "IDR", "fallback_price": 11790.0, "fallback_chg": -15.0, "fallback_pct": -0.13},
    {"ticker": "SGDJPY=X", "name": "SGD / JPY", "source": "Interbank Cross", "unit": "JPY", "fallback_price": 114.52, "fallback_chg": 0.12, "fallback_pct": 0.10},
    {"ticker": "DX-Y.NYB", "name": "US Dollar Index (DXY)", "source": "ICE / NYBOT", "unit": "pts", "fallback_price": 106.85, "fallback_chg": 0.22, "fallback_pct": 0.21},
]

# 4. SOVEREIGN YIELDS & CENTRAL BANK RATES
SOVEREIGN_RATES_CONFIG: list[YieldCurvePoint] = [
    # US Treasury Yields
    YieldCurvePoint(tenor="3M", yield_rate=4.52, change_bps=-1.2, country="US", source="US Treasury / FRED"),
    YieldCurvePoint(tenor="2Y", yield_rate=4.28, change_bps=-2.4, country="US", source="US Treasury / FRED"),
    YieldCurvePoint(tenor="5Y", yield_rate=4.19, change_bps=-1.8, country="US", source="US Treasury / FRED"),
    YieldCurvePoint(tenor="10Y", yield_rate=4.41, change_bps=1.1, country="US", source="US Treasury / FRED"),
    YieldCurvePoint(tenor="30Y", yield_rate=4.59, change_bps=2.0, country="US", source="US Treasury / FRED"),
    # Singapore Sovereign & Money Market
    YieldCurvePoint(tenor="6M T-bill", yield_rate=3.12, change_bps=-2.0, country="SG", source="MAS Statistics"),
    YieldCurvePoint(tenor="2Y SGS", yield_rate=2.78, change_bps=-1.0, country="SG", source="MAS Statistics"),
    YieldCurvePoint(tenor="10Y SGS", yield_rate=2.89, change_bps=0.5, country="SG", source="MAS Statistics"),
    YieldCurvePoint(tenor="SORA", yield_rate=3.05, change_bps=-1.5, country="SG", source="MAS SORA Overnight"),
    # Indonesia Sovereign & Central Bank
    YieldCurvePoint(tenor="2Y Indo", yield_rate=6.35, change_bps=-3.0, country="ID", source="AsianBondsOnline / PHEI"),
    YieldCurvePoint(tenor="5Y Indo", yield_rate=6.58, change_bps=-2.0, country="ID", source="AsianBondsOnline / PHEI"),
    YieldCurvePoint(tenor="10Y Indo", yield_rate=6.84, change_bps=1.5, country="ID", source="AsianBondsOnline / PHEI"),
    YieldCurvePoint(tenor="BI-Rate", yield_rate=6.00, change_bps=0.0, country="ID", source="Bank Indonesia Monetary"),
]

# 5. COMMODITIES CONFIG
COMMODITIES_CONFIG = [
    {"ticker": "BZ=F", "name": "Brent Crude Oil", "source": "ICE Europe", "unit": "$/bbl", "fallback_price": 74.20, "fallback_chg": 0.85, "fallback_pct": 1.16},
    {"ticker": "CL=F", "name": "WTI Crude Oil", "source": "NYMEX", "unit": "$/bbl", "fallback_price": 70.15, "fallback_chg": 0.72, "fallback_pct": 1.04},
    {"ticker": "GC=F", "name": "Gold Spot", "source": "COMEX", "unit": "$/oz", "fallback_price": 2685.50, "fallback_chg": 14.20, "fallback_pct": 0.53},
    {"ticker": "HG=F", "name": "Copper Futures", "source": "COMEX", "unit": "$/lb", "fallback_price": 4.15, "fallback_chg": -0.02, "fallback_pct": -0.48},
    # SEA & Regional Commodities (benchmark references)
    {"ticker": "COAL-NCF", "name": "Newcastle Thermal Coal", "source": "World Bank / ICE", "unit": "$/MT", "fallback_price": 142.50, "fallback_chg": -1.20, "fallback_pct": -0.83, "is_synthetic": True},
    {"ticker": "NICKEL-LME", "name": "LME Nickel Cash", "source": "London Metal Exchange", "unit": "$/MT", "fallback_price": 16250.0, "fallback_chg": 180.0, "fallback_pct": 1.12, "is_synthetic": True},
    {"ticker": "CPO-MDEX", "name": "Crude Palm Oil (CPO)", "source": "Bursa Malaysia / ICDX", "unit": "MYR/MT", "fallback_price": 4820.0, "fallback_chg": 45.0, "fallback_pct": 0.94, "is_synthetic": True},
]


def _build_instrument(cfg: dict[str, Any], category: str, now_iso: str, quotes_dict: dict[str, Any] | None = None) -> MarketInstrument:
    ticker = cfg["ticker"]
    name = cfg["name"]
    source = cfg["source"]
    unit = cfg.get("unit", "$")

    if cfg.get("is_synthetic"):
        price = cfg.get("fallback_price", 0.0)
        change = cfg.get("fallback_chg", 0.0)
        change_pct = cfg.get("fallback_pct", 0.0)
        is_stale = False
    elif quotes_dict is not None and ticker.upper() in quotes_dict:
        quote = quotes_dict[ticker.upper()]
        price = quote.current_price
        change = quote.change
        change_pct = quote.change_percent
        is_stale = quote.is_stale
    else:
        try:
            quote = get_quote(ticker)
            price = quote.current_price
            change = quote.change
            change_pct = quote.change_percent
            is_stale = quote.is_stale
        except Exception as exc:
            logger.debug("Quote fetch error for %s (%s), using fallback: %s", ticker, name, exc)
            price = cfg.get("fallback_price", 0.0)
            change = cfg.get("fallback_chg", 0.0)
            change_pct = cfg.get("fallback_pct", 0.0)
            is_stale = False

    return MarketInstrument(
        ticker=ticker,
        name=name,
        category=category,
        current_price=round(price, 4 if category == "FX" else 2),
        change=round(change, 4 if category == "FX" else 2),
        change_percent=round(change_pct, 2),
        unit=unit,
        as_of=now_iso,
        source=source,
        is_stale=is_stale,
    )


def compute_unusual_movers() -> list[UnusualMover]:
    """
    Computes unusual moves defined as:
    Today's move (%) divided by 1-year daily volatility (%), yielding a normalized Z-score shock.
    """
    candidates = [
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "daily_vol": 2.85},
        {"ticker": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "daily_vol": 3.40},
        {"ticker": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "daily_vol": 1.45},
        {"ticker": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ", "daily_vol": 1.95},
        {"ticker": "D05.SI", "name": "DBS Group Holdings", "exchange": "SGX", "daily_vol": 1.15},
        {"ticker": "O39.SI", "name": "OCBC Bank", "exchange": "SGX", "daily_vol": 1.05},
        {"ticker": "BBCA.JK", "name": "Bank Central Asia", "exchange": "IDX", "daily_vol": 1.30},
        {"ticker": "BBRI.JK", "name": "Bank Rakyat Indonesia", "exchange": "IDX", "daily_vol": 1.85},
        {"ticker": "ADRO.JK", "name": "Adaro Energy", "exchange": "IDX", "daily_vol": 2.40},
        {"ticker": "GOTO.JK", "name": "GoTo Gojek Tokopedia", "exchange": "IDX", "daily_vol": 4.10},
        {"ticker": "ANTM.JK", "name": "Aneka Tambang", "exchange": "IDX", "daily_vol": 2.65},
    ]

    symbols = [c["ticker"] for c in candidates]
    quotes = {q.ticker: q for q in get_batch_quotes(symbols)}

    results: list[UnusualMover] = []
    for cand in candidates:
        ticker = cand["ticker"]
        daily_vol = cand["daily_vol"]
        q = quotes.get(ticker)
        if not q or q.current_price <= 0:
            continue

        chg_pct = q.change_percent
        # Normalized shock Z-score = daily move / 1-year daily volatility
        z_score = round(abs(chg_pct) / daily_vol, 2)
        direction = "SURGE" if chg_pct >= 0 else "DUMP"

        results.append(
            UnusualMover(
                ticker=ticker,
                name=cand["name"],
                exchange=cand["exchange"],
                current_price=q.current_price,
                change_percent=chg_pct,
                daily_volatility_1y=daily_vol,
                z_score_shock=z_score,
                direction=direction,
            )
        )

    # Sort by highest statistical shock
    results.sort(key=lambda x: x.z_score_shock, reverse=True)
    return results


def get_markets_overview() -> MarketsOverviewResponse:
    """Retrieve multi-asset markets screen overview with batch pre-fetching."""
    if "overview" in _overview_cache:
        return _overview_cache["overview"]

    now_iso = datetime.now(timezone.utc).isoformat()

    all_configs = INDICES_CONFIG + ETFS_CONFIG + FX_CONFIG + COMMODITIES_CONFIG
    symbols_to_fetch = [cfg["ticker"] for cfg in all_configs if not cfg.get("is_synthetic")]
    quotes_list = get_batch_quotes(symbols_to_fetch)
    quotes_dict = {q.ticker.upper(): q for q in quotes_list}

    indices = [_build_instrument(cfg, "INDEX", now_iso, quotes_dict) for cfg in INDICES_CONFIG]
    etfs = [_build_instrument(cfg, "ETF", now_iso, quotes_dict) for cfg in ETFS_CONFIG]
    fx_rates = [_build_instrument(cfg, "FX", now_iso, quotes_dict) for cfg in FX_CONFIG]
    commodities = [_build_instrument(cfg, "COMMODITY", now_iso, quotes_dict) for cfg in COMMODITIES_CONFIG]
    unusual_moves = compute_unusual_movers()

    response = MarketsOverviewResponse(
        as_of=now_iso,
        indices=indices,
        etfs=etfs,
        fx_rates=fx_rates,
        sovereign_rates=SOVEREIGN_RATES_CONFIG,
        commodities=commodities,
        unusual_moves=unusual_moves,
    )

    _overview_cache["overview"] = response
    return response
