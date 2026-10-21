"""Unit tests for the Technical Desk analytical service."""

import pytest
import pandas as pd
import numpy as np

from app.services.technical_desk import (
    calculate_sma,
    calculate_slope,
    calculate_cmf,
    calculate_rsi,
    calculate_macd,
    calculate_adx,
    detect_swing_pivots,
    analyze_market_structure,
    analyze_vsa,
    classify_weinstein_stage,
    generate_trade_plan,
    generate_scenarios,
    generate_technical_desk_report,
)


def _generate_synthetic_ohlcv(
    n_bars: int = 250,
    trend: str = "down",
    base_price: float = 5000.0,
    volatility: float = 0.015,
) -> pd.DataFrame:
    """Generate deterministic synthetic OHLCV data for testing."""
    np.random.seed(42)
    dates = pd.date_range(end="2026-10-20", periods=n_bars, freq="B")
    
    prices = [base_price]
    for i in range(1, n_bars):
        if trend == "down":
            drift = -0.003
        elif trend == "up":
            drift = +0.003
        elif trend == "flat":
            drift = 0.000
        else:
            drift = 0.0
        change = drift + np.random.normal(0, volatility)
        prices.append(max(10.0, prices[-1] * (1 + change)))

    df = pd.DataFrame(index=dates)
    df["Close"] = prices
    df["Open"] = [p * (1 + np.random.uniform(-0.005, 0.005)) for p in prices]
    df["High"] = [max(o, c) * (1 + abs(np.random.uniform(0.002, 0.015))) for o, c in zip(df["Open"], df["Close"])]
    df["Low"] = [min(o, c) * (1 - abs(np.random.uniform(0.002, 0.015))) for o, c in zip(df["Open"], df["Close"])]
    df["Volume"] = [int(np.random.uniform(10_000_000, 50_000_000)) for _ in range(n_bars)]
    return df


def test_calculate_sma():
    series = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    sma3 = calculate_sma(series, period=3)
    assert len(sma3) == 5
    assert pd.isna(sma3.iloc[0])
    assert pd.isna(sma3.iloc[1])
    assert sma3.iloc[2] == pytest.approx(20.0)
    assert sma3.iloc[3] == pytest.approx(30.0)
    assert sma3.iloc[4] == pytest.approx(40.0)


def test_calculate_slope():
    series = pd.Series([100.0] * 20 + [110.0])
    slope = calculate_slope(series, lookback=20)
    assert slope == pytest.approx(10.0)  # +10%

    flat_series = pd.Series([100.0] * 25)
    assert calculate_slope(flat_series, lookback=20) == pytest.approx(0.0)


def test_calculate_cmf():
    df = pd.DataFrame({
        "High": [105.0, 108.0, 110.0],
        "Low": [95.0, 98.0, 100.0],
        "Close": [100.0, 103.0, 105.0],  # Close exactly at midpoint ((High+Low)/2) -> MFM = 0
        "Volume": [1000, 1000, 1000],
    })
    cmf = calculate_cmf(df, period=3)
    assert cmf == pytest.approx(0.0, abs=0.01)

    # Bullish close at high
    df_bull = pd.DataFrame({
        "High": [100.0, 102.0],
        "Low": [90.0, 92.0],
        "Close": [100.0, 102.0],  # Close at High -> MFM = 1.0
        "Volume": [500, 500],
    })
    cmf_bull = calculate_cmf(df_bull, period=2)
    assert cmf_bull == pytest.approx(1.0, abs=0.01)


def test_calculate_rsi():
    # Constant rising prices should produce high RSI
    rising = pd.Series([float(i) for i in range(1, 30)])
    rsi_high = calculate_rsi(rising, period=14)
    assert rsi_high > 80.0

    # Constant falling prices should produce low RSI
    falling = pd.Series([float(100 - i) for i in range(1, 30)])
    rsi_low = calculate_rsi(falling, period=14)
    assert rsi_low < 20.0


def test_calculate_macd():
    series = pd.Series([100.0 + i for i in range(50)])
    macd_line, signal_line, hist = calculate_macd(series)
    assert isinstance(macd_line, float)
    assert isinstance(signal_line, float)
    assert isinstance(hist, float)
    assert hist == pytest.approx(macd_line - signal_line, abs=0.001)


def test_calculate_adx():
    df = _generate_synthetic_ohlcv(n_bars=60, trend="up")
    adx_val = calculate_adx(df, period=14)
    assert 0.0 <= adx_val <= 100.0


def test_swing_pivots_and_market_structure():
    df_down = _generate_synthetic_ohlcv(n_bars=250, trend="down", base_price=6000.0)
    structure = analyze_market_structure(df_down)
    
    assert structure.trend_structure in ("LH-LL", "NEUTRAL")
    assert structure.nearest_support > 0
    assert structure.nearest_resistance >= structure.nearest_support
    assert structure.drawdown_300d_pct <= 0.0
    assert structure.peak_300d_price >= df_down["Close"].iloc[-1]


def test_vsa_metrics():
    df = _generate_synthetic_ohlcv(n_bars=100, trend="flat")
    vsa = analyze_vsa(df)
    assert vsa.up_down_volume_ratio_20d > 0.0
    assert vsa.participation_status in [
        "Dominant Selling Pressure",
        "Dominant Buying Pressure",
        "Balanced Participation",
    ]


def test_stage_analysis_stage_4_downtrend():
    # Long downtrend -> Stage 4 (Markdown)
    df_down = _generate_synthetic_ohlcv(n_bars=250, trend="down", base_price=6000.0)
    stage = classify_weinstein_stage(df_down)
    assert stage.stage_number == 4
    assert stage.bias == "BEARISH"

    plan = generate_trade_plan(df_down, stage)
    assert plan.verdict in ("AVOID", "TAKE PROFIT")
    assert "Markdown" in plan.rationale or "downtrend" in plan.rationale.lower()


def test_stage_analysis_stage_2_uptrend():
    # Sustained strong uptrend -> Stage 2 (Markup)
    df_up = _generate_synthetic_ohlcv(n_bars=250, trend="up", base_price=3000.0)
    stage = classify_weinstein_stage(df_up)
    assert stage.stage_number == 2
    assert stage.bias == "BULLISH"

    plan = generate_trade_plan(df_up, stage)
    assert plan.verdict in ("BUY ON BREAKOUT", "BUY ON WEAKNESS")
    assert plan.stop_loss is not None
    assert plan.target_1 is not None


def test_scenarios_probabilities_sum_to_100():
    df = _generate_synthetic_ohlcv(n_bars=250, trend="down")
    scenarios = generate_scenarios(df)
    assert len(scenarios) == 3
    total_prob = sum(s.probability_pct for s in scenarios)
    assert total_prob == 100
    for s in scenarios:
        assert len(s.supporting_factors) > 0 or len(s.opposing_factors) > 0


def test_edge_case_short_history():
    # Only 50 bars
    df_short = _generate_synthetic_ohlcv(n_bars=50, trend="up")
    report = generate_technical_desk_report(
        ticker="TEST",
        company_name="Test Corp",
        df=df_short,
        benchmark_df=None,
    )
    assert report.ticker == "TEST"
    assert report.stage.stage_number in (1, 2, 3, 4)
    assert report.trade_plan.verdict in ("AVOID", "BUY ON BREAKOUT", "BUY ON WEAKNESS", "TAKE PROFIT", "HOLD")
