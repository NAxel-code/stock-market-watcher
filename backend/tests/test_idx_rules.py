from datetime import datetime
from zoneinfo import ZoneInfo

from app.services.idx_rules import (
    calculate_idx_auto_rejection,
    get_idx_tick_size,
    get_market_session_status,
    is_idx_stock,
)


def test_is_idx_stock() -> None:
    assert is_idx_stock("BBCA.JK") is True
    assert is_idx_stock("tlkm.jk") is True
    assert is_idx_stock("AAPL") is False
    assert is_idx_stock("^GSPC") is False


def test_get_idx_tick_size() -> None:
    assert get_idx_tick_size(150) == 1
    assert get_idx_tick_size(250) == 2
    assert get_idx_tick_size(1000) == 5
    assert get_idx_tick_size(3500) == 10
    assert get_idx_tick_size(10000) == 25


def test_calculate_idx_auto_rejection_low_price() -> None:
    # Under Rp 200 -> 35%
    limits = calculate_idx_auto_rejection(100.0)
    assert limits["tick_size"] == 1
    assert limits["ara_price"] == 135.0
    assert limits["arb_price"] == 65.0
    assert limits["ara_percentage"] == 35.0
    assert limits["arb_percentage"] == -35.0


def test_calculate_idx_auto_rejection_mid_price() -> None:
    # Rp 200 - Rp 5000 -> 25%
    limits = calculate_idx_auto_rejection(1000.0)
    assert limits["tick_size"] == 5
    assert limits["ara_price"] == 1250.0
    assert limits["arb_price"] == 750.0


def test_calculate_idx_auto_rejection_high_price() -> None:
    # Above Rp 5000 -> 20%
    limits = calculate_idx_auto_rejection(10000.0)
    assert limits["tick_size"] == 25
    assert limits["ara_price"] == 12000.0
    assert limits["arb_price"] == 8000.0


def test_calculate_idx_auto_rejection_zero() -> None:
    limits = calculate_idx_auto_rejection(0.0)
    assert limits["ara_price"] == 0.0
    assert limits["arb_price"] == 0.0


def test_get_market_session_status_idx_weekend() -> None:
    # A Saturday in Jakarta timezone
    tz = ZoneInfo("Asia/Jakarta")
    dt = datetime(2026, 10, 3, 10, 0, tzinfo=tz)  # Saturday
    status = get_market_session_status("IDX", now_dt=dt)
    assert status["is_open"] is False
    assert "Weekend" in status["session_name"]


def test_get_market_session_status_idx_session1() -> None:
    # Tuesday 10:00 AM WIB -> Session 1 Open
    tz = ZoneInfo("Asia/Jakarta")
    dt = datetime(2026, 10, 6, 10, 0, tzinfo=tz)
    status = get_market_session_status("IDX", now_dt=dt)
    assert status["is_open"] is True
    assert "Session 1" in status["session_name"]


def test_get_market_session_status_us_regular_hours() -> None:
    # Tuesday 11:00 AM EST -> Regular Open
    tz = ZoneInfo("America/New_York")
    dt = datetime(2026, 10, 6, 11, 0, tzinfo=tz)
    status = get_market_session_status("US", now_dt=dt)
    assert status["is_open"] is True
    assert "Regular Hours" in status["session_name"]
