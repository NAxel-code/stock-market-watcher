"""Indonesia Stock Exchange (IDX / BEI) Trading Rules & Market Mechanics.

References:
- PT Bursa Efek Indonesia (IDX) Trading Rules: https://www.idx.co.id
- Lot size: 1 lot = 100 shares.
- Fraksi Harga (Tick Sizes) & Maksimum Perubahan.
- Auto Rejection Atas (ARA) & Auto Rejection Bawah (ARB).
- Sesi Perdagangan Pasar Reguler (WIB / UTC+7).
"""

from datetime import UTC, datetime, time
from typing import TypedDict
from zoneinfo import ZoneInfo


class IdxPriceLimits(TypedDict):
    tick_size: int
    ara_price: float
    arb_price: float
    ara_percentage: float
    arb_percentage: float


class MarketSessionStatus(TypedDict):
    market: str
    is_open: bool
    session_name: str
    current_time_local: str
    timezone: str


def is_idx_stock(ticker: str) -> bool:
    """Return True if the ticker belongs to the Indonesia Stock Exchange."""
    return ticker.upper().endswith(".JK")


def get_idx_tick_size(price: float) -> int:
    """Calculate IDX tick size (fraksi harga) based on current price level."""
    if price < 200:
        return 1
    elif price < 500:
        return 2
    elif price < 2000:
        return 5
    elif price < 5000:
        return 10
    else:
        return 25


def calculate_idx_auto_rejection(prev_close: float) -> IdxPriceLimits:
    """Calculate symmetrical Auto Rejection Atas (ARA) and Auto Rejection Bawah (ARB).

    Thresholds:
    - Rp 50 to Rp 200: 35%
    - Rp 200 to Rp 5,000: 25%
    - > Rp 5,000: 20%
    """
    if prev_close <= 0:
        return {
            "tick_size": 1,
            "ara_price": 0.0,
            "arb_price": 0.0,
            "ara_percentage": 0.0,
            "arb_percentage": 0.0,
        }

    if prev_close <= 200:
        pct = 0.35
    elif prev_close <= 5000:
        pct = 0.25
    else:
        pct = 0.20

    raw_ara = prev_close * (1 + pct)
    raw_arb = prev_close * (1 - pct)

    # Minimum price limit on IDX regular market is Rp 50 (papan utama/pengembangan)
    raw_arb = max(50.0, raw_arb)

    tick = get_idx_tick_size(prev_close)

    # Adjust to nearest tick
    ara_price = round(raw_ara / tick) * tick
    arb_price = round(raw_arb / tick) * tick

    # Ensure ARA >= prev_close and ARB <= prev_close
    ara_price = max(prev_close, ara_price)
    arb_price = min(prev_close, max(50.0, arb_price))

    ara_pct = round(((ara_price - prev_close) / prev_close) * 100, 2)
    arb_pct = round(((arb_price - prev_close) / prev_close) * 100, 2)

    return {
        "tick_size": tick,
        "ara_price": float(ara_price),
        "arb_price": float(arb_price),
        "ara_percentage": ara_pct,
        "arb_percentage": arb_pct,
    }


def get_market_session_status(market: str = "IDX", now_dt: datetime | None = None) -> MarketSessionStatus:
    """Check whether IDX or US markets are open and return detailed session status."""
    market_upper = market.upper()

    if market_upper == "IDX":
        try:
            tz = ZoneInfo("Asia/Jakarta")
        except Exception:
            tz = UTC

        now = now_dt or datetime.now(tz)
        local_time = now.time()
        weekday = now.weekday()  # 0=Monday, 6=Sunday

        time_str = now.strftime("%Y-%m-%d %H:%M:%S WIB")

        if weekday >= 5:  # Saturday or Sunday
            return {
                "market": "IDX",
                "is_open": False,
                "session_name": "Weekend Closed",
                "current_time_local": time_str,
                "timezone": "WIB (UTC+7)",
            }

        # Regular sessions (Mon-Thu vs Fri)
        session2_start = time(14, 0) if weekday == 4 else time(13, 30)

        if time(8, 45) <= local_time < time(9, 0):
            status = "Pre-Opening"
            is_open = True
        elif time(9, 0) <= local_time < time(11, 30):
            status = "Session 1 (Open)"
            is_open = True
        elif time(11, 30) <= local_time < session2_start:
            status = "Lunch Break"
            is_open = False
        elif session2_start <= local_time < time(15, 49):
            status = "Session 2 (Open)"
            is_open = True
        elif time(15, 49) <= local_time < time(16, 15):
            status = "Pre-Closing / Post-Trading"
            is_open = False
        else:
            status = "Market Closed"
            is_open = False

        return {
            "market": "IDX",
            "is_open": is_open,
            "session_name": status,
            "current_time_local": time_str,
            "timezone": "WIB (UTC+7)",
        }

    else:
        # US Market (NYSE / NASDAQ in US/Eastern)
        try:
            tz = ZoneInfo("America/New_York")
        except Exception:
            tz = UTC

        now = now_dt or datetime.now(tz)
        local_time = now.time()
        weekday = now.weekday()
        time_str = now.strftime("%Y-%m-%d %H:%M:%S EST/EDT")

        if weekday >= 5:
            return {
                "market": "US",
                "is_open": False,
                "session_name": "Weekend Closed",
                "current_time_local": time_str,
                "timezone": "US/Eastern",
            }

        if time(4, 0) <= local_time < time(9, 30):
            status = "Pre-Market"
            is_open = False
        elif time(9, 30) <= local_time < time(16, 0):
            status = "Regular Hours (Open)"
            is_open = True
        elif time(16, 0) <= local_time < time(20, 0):
            status = "After-Hours"
            is_open = False
        else:
            status = "Market Closed"
            is_open = False

        return {
            "market": "US",
            "is_open": is_open,
            "session_name": status,
            "current_time_local": time_str,
            "timezone": "US/Eastern",
        }
