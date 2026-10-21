"""Institutional Technical Desk Analytical Engine.

Implements Stan Weinstein 4-Stage Analysis, Market Structure (HH-HL / LH-LL),
Volume Spread Analysis (VSA), Chaikin Money Flow (CMF), Momentum Indicators,
Conditional 3-Scenario Projections, and Actionable Trade Plans.
"""

from datetime import datetime, timezone
import logging
from typing import Any

from cachetools import TTLCache
import numpy as np
import pandas as pd
import yfinance as yf

from app.models.schemas import (
    AnalysisDeskResponse,
    MarketStructure,
    MomentumMetrics,
    RelativeStrengthMetrics,
    ScenarioProjection,
    StageInfo,
    TradePlan,
    VsaMetrics,
)

logger = logging.getLogger(__name__)

# In-memory cache for technical desk reports (5-minute TTL)
_desk_cache: TTLCache[str, AnalysisDeskResponse] = TTLCache(maxsize=100, ttl=300)


def calculate_sma(series: pd.Series, period: int) -> pd.Series:
    """Calculate Simple Moving Average."""
    return series.rolling(window=period).mean()


def calculate_slope(series: pd.Series, lookback: int = 20) -> float:
    """Calculate percentage slope of a series over lookback bars."""
    clean = series.dropna()
    if len(clean) <= lookback:
        return 0.0
    current_val = float(clean.iloc[-1])
    prev_val = float(clean.iloc[-lookback - 1])
    if prev_val == 0.0:
        return 0.0
    return round(((current_val - prev_val) / prev_val) * 100, 2)


def calculate_cmf(df: pd.DataFrame, period: int = 20) -> float:
    """Calculate Chaikin Money Flow (CMF) over specified period."""
    if len(df) < period:
        period = max(1, len(df))
    
    recent = df.tail(period)
    high = recent["High"].astype(float)
    low = recent["Low"].astype(float)
    close = recent["Close"].astype(float)
    volume = recent["Volume"].astype(float)

    high_low_diff = high - low
    mfm = np.where(
        high_low_diff > 0,
        ((close - low) - (high - close)) / high_low_diff,
        0.0,
    )
    mfv = mfm * volume
    total_volume = volume.sum()
    if total_volume <= 0:
        return 0.0
    return round(float(mfv.sum() / total_volume), 4)


def calculate_rsi(series: pd.Series, period: int = 14) -> float:
    """Calculate Wilder's Relative Strength Index (RSI)."""
    clean = series.dropna()
    if len(clean) < period + 1:
        return 50.0

    delta = clean.diff().dropna()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.iloc[:period].mean()
    avg_loss = loss.iloc[:period].mean()

    for i in range(period, len(delta)):
        avg_gain = (avg_gain * (period - 1) + gain.iloc[i]) / period
        avg_loss = (avg_loss * (period - 1) + loss.iloc[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(float(rsi), 2)


def calculate_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[float, float, float]:
    """Calculate MACD line, signal line, and histogram."""
    clean = series.dropna()
    if len(clean) < slow + signal:
        return 0.0, 0.0, 0.0

    fast_ema = clean.ewm(span=fast, adjust=False).mean()
    slow_ema = clean.ewm(span=slow, adjust=False).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line

    return (
        round(float(macd_line.iloc[-1]), 4),
        round(float(signal_line.iloc[-1]), 4),
        round(float(hist.iloc[-1]), 4),
    )


def calculate_adx(df: pd.DataFrame, period: int = 14) -> float:
    """Calculate Average Directional Index (ADX)."""
    if len(df) < period * 2:
        return 20.0

    high = df["High"].astype(float)
    low = df["Low"].astype(float)
    close = df["Close"].astype(float)
    prev_close = close.shift(1)

    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    up_move = high - high.shift(1)
    down_move = low.shift(1) - low

    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

    tr_smooth = pd.Series(tr).ewm(alpha=1 / period, adjust=False).mean()
    plus_di = 100 * (pd.Series(plus_dm, index=df.index).ewm(alpha=1 / period, adjust=False).mean() / tr_smooth)
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).ewm(alpha=1 / period, adjust=False).mean() / tr_smooth)

    di_sum = plus_di + minus_di
    dx = np.where(di_sum > 0, 100 * (plus_di - minus_di).abs() / di_sum, 0.0)
    adx = pd.Series(dx, index=df.index).ewm(alpha=1 / period, adjust=False).mean()

    return round(float(adx.iloc[-1]), 2)


def calculate_stochastic(
    df: pd.DataFrame, k_period: int = 14, d_period: int = 3
) -> tuple[float, float]:
    """Calculate Stochastic %K and %D."""
    if len(df) < k_period + d_period:
        return 50.0, 50.0

    low_min = df["Low"].rolling(window=k_period).min()
    high_max = df["High"].rolling(window=k_period).max()
    denom = high_max - low_min

    fast_k = np.where(denom > 0, 100 * (df["Close"] - low_min) / denom, 50.0)
    k_series = pd.Series(fast_k, index=df.index)
    d_series = k_series.rolling(window=d_period).mean()

    return round(float(k_series.iloc[-1]), 2), round(float(d_series.iloc[-1]), 2)


def detect_swing_pivots(
    df: pd.DataFrame, window: int = 5
) -> tuple[list[float], list[float]]:
    """Detect local swing highs and swing lows using rolling extrema."""
    highs = df["High"].values
    lows = df["Low"].values
    n = len(df)
    
    swing_highs: list[float] = []
    swing_lows: list[float] = []

    for i in range(window, n - window):
        current_high = highs[i]
        current_low = lows[i]
        
        is_pivot_high = all(current_high >= highs[i - j] for j in range(1, window + 1)) and all(
            current_high >= highs[i + j] for j in range(1, window + 1)
        )
        is_pivot_low = all(current_low <= lows[i - j] for j in range(1, window + 1)) and all(
            current_low <= lows[i + j] for j in range(1, window + 1)
        )

        if is_pivot_high:
            swing_highs.append(float(current_high))
        if is_pivot_low:
            swing_lows.append(float(current_low))

    # If insufficient pivots detected due to short series, fallback to recent rolling min/max
    if not swing_highs:
        swing_highs = [float(df["High"].max())]
    if not swing_lows:
        swing_lows = [float(df["Low"].min())]

    return swing_highs, swing_lows


def analyze_market_structure(df: pd.DataFrame) -> MarketStructure:
    """Analyze price swings, support/resistance pivots, and MA alignment."""
    current_close = float(df["Close"].iloc[-1])
    swing_highs, swing_lows = detect_swing_pivots(df, window=5)

    # Resistances strictly above current price
    resistances_above = [sh for sh in swing_highs if sh > current_close * 1.005]
    nearest_resistance = min(resistances_above) if resistances_above else float(df["High"].tail(100).max())
    if nearest_resistance <= current_close:
        nearest_resistance = round(current_close * 1.05, 2)

    # Supports strictly below current price
    supports_below = [sl for sl in swing_lows if sl < current_close * 0.995]
    nearest_support = max(supports_below) if supports_below else float(df["Low"].tail(100).min())
    if nearest_support >= current_close or nearest_support <= 0:
        nearest_support = round(current_close * 0.95, 2)

    # 300-day peak drawdown
    peak_300d = float(df["High"].tail(300).max())
    drawdown_300d = round(((current_close - peak_300d) / peak_300d) * 100, 2)

    # Moving averages
    ma20_series = calculate_sma(df["Close"], 20)
    ma50_series = calculate_sma(df["Close"], 50)
    ma200_series = calculate_sma(df["Close"], 200)

    ma20 = round(float(ma20_series.dropna().iloc[-1]), 2) if not ma20_series.dropna().empty else current_close
    ma50 = round(float(ma50_series.dropna().iloc[-1]), 2) if not ma50_series.dropna().empty else current_close
    
    if len(df) >= 200 and not ma200_series.dropna().empty:
        ma200 = round(float(ma200_series.dropna().iloc[-1]), 2)
        ma200_slope = calculate_slope(ma200_series, 20)
    else:
        ma200 = None
        ma200_slope = None

    # Trend structure classification (HH-HL vs LH-LL)
    if len(swing_highs) >= 2 and len(swing_lows) >= 2:
        recent_sh = swing_highs[-1]
        prior_sh = swing_highs[-2]
        recent_sl = swing_lows[-1]
        prior_sl = swing_lows[-2]

        if recent_sh < prior_sh and recent_sl < prior_sl:
            trend_structure = "LH-LL"
            trend_desc = "Lower Highs & Lower Lows (Active Downtrend)"
        elif recent_sh > prior_sh and recent_sl > prior_sl:
            trend_structure = "HH-HL"
            trend_desc = "Higher Highs & Higher Lows (Active Uptrend)"
        else:
            trend_structure = "NEUTRAL"
            trend_desc = "Mixed / Consolidating Pivots"
    else:
        trend_structure = "NEUTRAL"
        trend_desc = "Consolidation / Base Range"

    # Moving average stack
    if ma200 is not None:
        if current_close > ma20 > ma50 > ma200:
            ma_stack = "BULLISH_ALIGNMENT"
        elif current_close < ma20 < ma50 < ma200:
            ma_stack = "BEARISH_ALIGNMENT"
        else:
            ma_stack = "MIXED"
    else:
        ma_stack = "BULLISH_ALIGNMENT" if current_close > ma20 > ma50 else "BEARISH_ALIGNMENT"

    return MarketStructure(
        trend_structure=trend_structure,
        trend_description=trend_desc,
        nearest_support=round(nearest_support, 2),
        nearest_resistance=round(nearest_resistance, 2),
        drawdown_300d_pct=drawdown_300d,
        peak_300d_price=round(peak_300d, 2),
        ma20=ma20,
        ma50=ma50,
        ma200=ma200,
        ma200_slope_pct=ma200_slope,
        ma_stack_status=ma_stack,
    )


def analyze_vsa(df: pd.DataFrame) -> VsaMetrics:
    """Analyze Volume Spread Analysis (VSA), up/down volume ratio, and climaxes."""
    recent_20 = df.tail(20)
    up_vol = float(recent_20[recent_20["Close"] >= recent_20["Open"]]["Volume"].sum())
    down_vol = float(recent_20[recent_20["Close"] < recent_20["Open"]]["Volume"].sum())
    
    ratio = round(up_vol / max(1.0, down_vol), 2)
    if ratio > 1.25:
        part_status = "Dominant Buying Pressure"
    elif ratio < 0.80:
        part_status = "Dominant Selling Pressure"
    else:
        part_status = "Balanced Participation"

    # Volume surge on last bar compared to 20-bar SMA
    avg_vol_20 = float(recent_20["Volume"].mean())
    last_vol = float(df["Volume"].iloc[-1])
    surge_ratio = round(last_vol / max(1.0, avg_vol_20), 2)

    # Spread analysis
    recent_spreads = recent_20["High"] - recent_20["Low"]
    avg_spread = float(recent_spreads.mean())
    last_spread = float(df["High"].iloc[-1] - df["Low"].iloc[-1])
    is_down_bar = bool(df["Close"].iloc[-1] < df["Open"].iloc[-1])

    # Selling climax: volume surge > 2.2x on wide drop
    is_selling_climax = bool(surge_ratio >= 2.2 and is_down_bar and last_spread > avg_spread * 1.3)

    # Stopping volume: high volume but narrow spread or long lower shadow after drop
    lower_shadow = float(min(df["Open"].iloc[-1], df["Close"].iloc[-1]) - df["Low"].iloc[-1])
    is_stopping_volume = bool(
        surge_ratio >= 1.7 and (last_spread < avg_spread * 0.85 or lower_shadow > last_spread * 0.5)
    )

    # Absorption: high volume pressing into resistance without rejection
    is_absorption = bool(surge_ratio >= 1.6 and not is_down_bar and df["Close"].iloc[-1] >= df["Open"].iloc[-1])

    return VsaMetrics(
        up_down_volume_ratio_20d=ratio,
        participation_status=part_status,
        is_selling_climax=is_selling_climax,
        is_stopping_volume=is_stopping_volume,
        is_absorption=is_absorption,
        volume_surge_ratio=surge_ratio,
    )


def classify_weinstein_stage(df: pd.DataFrame) -> StageInfo:
    """Classify the Stan Weinstein 4-Stage market phase."""
    current_close = float(df["Close"].iloc[-1])
    ma20_series = calculate_sma(df["Close"], 20)
    ma50_series = calculate_sma(df["Close"], 50)
    ma200_series = calculate_sma(df["Close"], 200)

    ma20 = float(ma20_series.dropna().iloc[-1]) if not ma20_series.dropna().empty else current_close
    ma50 = float(ma50_series.dropna().iloc[-1]) if not ma50_series.dropna().empty else current_close
    
    has_ma200 = len(df) >= 200 and not ma200_series.dropna().empty
    ma200 = float(ma200_series.dropna().iloc[-1]) if has_ma200 else ma50
    ma200_slope = calculate_slope(ma200_series, 20) if has_ma200 else calculate_slope(ma50_series, 20)

    peak_300d = float(df["High"].tail(300).max())
    drawdown_pct = ((current_close - peak_300d) / peak_300d) * 100

    # Weinstein Rules Classification
    # Stage 4: Markdown / Downtrend
    if current_close < ma200 and (ma200_slope <= 0.2 or current_close < ma50 < ma200):
        confidence = 90 if current_close < ma20 < ma50 < ma200 else 75
        return StageInfo(
            stage_number=4,
            stage_name="Stage 4 - Markdown / Downtrend",
            bias="BEARISH",
            confidence_pct=confidence,
            description="Price is trading below key moving averages with negative trend slope. High probability of continued structural decline.",
        )

    # Stage 2: Advancing / Markup
    if current_close > ma200 and ma200_slope >= 0.2 and current_close > ma50:
        confidence = 90 if current_close > ma20 > ma50 > ma200 else 80
        return StageInfo(
            stage_number=2,
            stage_name="Stage 2 - Advancing / Markup",
            bias="BULLISH",
            confidence_pct=confidence,
            description="Price in confirmed Stage 2 markup with rising moving averages and institutional accumulation. Trend favors long continuation.",
        )

    # Stage 1: Accumulation / Base
    if abs(ma200_slope) < 0.6 and abs(current_close - ma200) / ma200 < 0.08 and drawdown_pct < -20.0:
        return StageInfo(
            stage_number=1,
            stage_name="Stage 1 - Accumulation / Base",
            bias="NEUTRAL",
            confidence_pct=70,
            description="Price is oscillating sideways around a flattening long-term moving average following a prolonged downtrend. Volatility is contracting.",
        )

    # Stage 3: Distribution / Top
    if drawdown_pct > -15.0 and (current_close < ma50 or ma200_slope < 0.1):
        return StageInfo(
            stage_number=3,
            stage_name="Stage 3 - Distribution / Top",
            bias="BEARISH",
            confidence_pct=75,
            description="Price is topping near cyclical highs with erratic volatility and failing upward momentum. Institutional distribution is suspected.",
        )

    # Default fallback to Base or Early Lifecycle
    return StageInfo(
        stage_number=1,
        stage_name="Stage 1 - Base / Consolidation",
        bias="NEUTRAL",
        confidence_pct=60,
        description="Market is consolidating without an established long-term trend direction.",
    )


def generate_trade_plan(df: pd.DataFrame, stage: StageInfo) -> TradePlan:
    """Generate an institutional actionable trade plan with entry, stop loss, and targets."""
    current_price = round(float(df["Close"].iloc[-1]), 2)
    structure = analyze_market_structure(df)
    s = structure.nearest_support
    r = structure.nearest_resistance

    if stage.stage_number == 4:
        # Avoid knife-catching in Stage 4
        return TradePlan(
            verdict="AVOID",
            current_price=current_price,
            buy_area_min=None,
            buy_area_max=None,
            stop_loss=round(s * 0.95, 2),
            target_1=round(r, 2),
            target_2=round(r * 1.08, 2),
            risk_reward_ratio="N/A",
            rationale=(
                f"Capital preservation priority: Asset is in Stage 4 Markdown with structural LH-LL lower lows. "
                f"Do not catch falling knives until an established base forms above support {s}."
            ),
        )

    elif stage.stage_number == 2:
        # Bullish Stage 2: Buy on Breakout or Weakness
        if current_price >= r * 0.98:
            verdict = "BUY ON BREAKOUT"
            buy_min = round(r, 2)
            buy_max = round(r * 1.02, 2)
            stop_loss = round(r * 0.96, 2)
            t1 = round(r + (r - s) * 0.618, 2)
            t2 = round(r + (r - s) * 1.0, 2)
        else:
            verdict = "BUY ON WEAKNESS"
            buy_min = round(s, 2)
            buy_max = round((s + current_price) / 2, 2)
            stop_loss = round(s * 0.96, 2)
            t1 = round(r, 2)
            t2 = round(r * 1.08, 2)

        risk = buy_max - stop_loss
        reward = t1 - buy_max
        rr_str = f"1:{round(reward / max(0.01, risk), 1)}" if risk > 0 and reward > 0 else "1:2.0"

        return TradePlan(
            verdict=verdict,
            current_price=current_price,
            buy_area_min=buy_min,
            buy_area_max=buy_max,
            stop_loss=stop_loss,
            target_1=t1,
            target_2=t2,
            risk_reward_ratio=rr_str,
            rationale=(
                f"Stage 2 Markup active: Accumulate on pullback near {buy_min}–{buy_max} or confirmed breakout above {r}. "
                f"Risk is well-defined below swing support {stop_loss}."
            ),
        )

    elif stage.stage_number == 1:
        # Stage 1: Accumulate at base support
        buy_min = round(s, 2)
        buy_max = round(s * 1.02, 2)
        stop_loss = round(s * 0.95, 2)
        t1 = round(r, 2)
        t2 = round(r * 1.10, 2)
        risk = buy_max - stop_loss
        reward = t1 - buy_max
        rr_str = f"1:{round(reward / max(0.01, risk), 1)}" if risk > 0 and reward > 0 else "1:2.2"

        return TradePlan(
            verdict="BUY ON WEAKNESS",
            current_price=current_price,
            buy_area_min=buy_min,
            buy_area_max=buy_max,
            stop_loss=stop_loss,
            target_1=t1,
            target_2=t2,
            risk_reward_ratio=rr_str,
            rationale=(
                f"Stage 1 Accumulation: Base building in progress between {s} and {r}. "
                f"Low-risk entry available near base support {buy_min} with stop at {stop_loss}."
            ),
        )

    else:  # Stage 3
        return TradePlan(
            verdict="TAKE PROFIT",
            current_price=current_price,
            buy_area_min=None,
            buy_area_max=None,
            stop_loss=round(structure.ma50 * 0.98, 2),
            target_1=round(r, 2),
            target_2=round(r * 1.05, 2),
            risk_reward_ratio="N/A",
            rationale=(
                f"Stage 3 Distribution warning: Heavy volume churning near cyclical highs. "
                f"Tighten stops below {round(structure.ma50 * 0.98, 2)} and take partial profits into strength."
            ),
        )


def generate_scenarios(df: pd.DataFrame) -> list[ScenarioProjection]:
    """Generate 3 conditional scenarios (Bullish, Bearish, Sideways) for the next 20 bars."""
    current_price = float(df["Close"].iloc[-1])
    structure = analyze_market_structure(df)
    vsa = analyze_vsa(df)
    rsi = calculate_rsi(df["Close"])
    _, _, macd_hist = calculate_macd(df["Close"])
    cmf = calculate_cmf(df)

    bull_factors: list[str] = []
    bear_factors: list[str] = []
    side_factors: list[str] = []

    # Moving Average Stack & Slope
    if structure.ma200 is not None:
        if current_price > structure.ma200:
            bull_factors.append("Price holding above 200-day Moving Average")
        else:
            bear_factors.append("Price suppressed below 200-day Moving Average")
        
        if (structure.ma200_slope_pct or 0.0) > 0.3:
            bull_factors.append("MA200 slope is rising (+0.3%+)")
        elif (structure.ma200_slope_pct or 0.0) < -0.3:
            bear_factors.append("MA200 slope is declining (-0.3%-)")
        else:
            side_factors.append("MA200 is flat and neutral")

    # Market Structure
    if structure.trend_structure == "HH-HL":
        bull_factors.append("Higher Highs & Higher Lows structural trend")
    elif structure.trend_structure == "LH-LL":
        bear_factors.append("Lower Highs & Lower Lows active downtrend")
    else:
        side_factors.append("Pivots forming horizontal consolidation range")

    # Money Flow & VSA
    if cmf > 0.05:
        bull_factors.append("Positive Chaikin Money Flow (net institutional accumulation)")
    elif cmf < -0.05:
        bear_factors.append("Negative Chaikin Money Flow (net capital outflow)")
    else:
        side_factors.append("Neutral money flow volume")

    if vsa.up_down_volume_ratio_20d > 1.2:
        bull_factors.append(f"Dominant up-day buying volume (Ratio: {vsa.up_down_volume_ratio_20d})")
    elif vsa.up_down_volume_ratio_20d < 0.8:
        bear_factors.append(f"Dominant down-day selling volume (Ratio: {vsa.up_down_volume_ratio_20d})")
    else:
        side_factors.append("Balanced volume distribution")

    # Momentum
    if rsi > 52:
        bull_factors.append(f"RSI in bullish expansion territory ({rsi})")
    elif rsi < 45:
        bear_factors.append(f"RSI under selling pressure ({rsi})")

    if macd_hist > 0:
        bull_factors.append("MACD histogram showing positive momentum")
    else:
        bear_factors.append("MACD histogram showing negative momentum")

    # Probability weighting based on evidence
    n_bull = len(bull_factors)
    n_bear = len(bear_factors)
    n_side = max(1, len(side_factors))
    total_score = n_bull + n_bear + n_side

    prob_bull = int(round((n_bull / total_score) * 100))
    prob_bear = int(round((n_bear / total_score) * 100))
    prob_side = 100 - (prob_bull + prob_bear)

    # Sanity bounds to prevent 0 or >100
    if prob_side < 10:
        prob_side = 10
        if prob_bear > prob_bull:
            prob_bear -= 10
        else:
            prob_bull -= 10
    if prob_bull < 5:
        prob_bull = 5
        prob_bear = 100 - prob_side - prob_bull
    if prob_bear < 5:
        prob_bear = 5
        prob_bull = 100 - prob_side - prob_bull

    # Ensure exact sum of 100%
    rem = 100 - (prob_bull + prob_bear + prob_side)
    prob_side += rem

    r = structure.nearest_resistance
    s = structure.nearest_support

    target_bull = round(r + (r - s) * 0.5, 2)
    target_bear = round(max(0.01, s - (r - s) * 0.5), 2)

    return [
        ScenarioProjection(
            name="Bullish Rebound / Breakout",
            direction="UP",
            probability_pct=prob_bull,
            trigger_condition=f"Daily close confirmed above resistance pivot {r}",
            price_target=target_bull,
            price_target_pct=round(((target_bull - current_price) / current_price) * 100, 2),
            supporting_factors=bull_factors or ["Oversold technical bounce potential"],
            opposing_factors=bear_factors or ["High overhead supply"],
        ),
        ScenarioProjection(
            name="Bearish Continuation",
            direction="DOWN",
            probability_pct=prob_bear,
            trigger_condition=f"Breakdown and close below support pivot {s}",
            price_target=target_bear,
            price_target_pct=round(((target_bear - current_price) / current_price) * 100, 2),
            supporting_factors=bear_factors or ["Bearish trend momentum"],
            opposing_factors=bull_factors or ["Deep value buyers at support"],
        ),
        ScenarioProjection(
            name="Base Consolidation",
            direction="SIDEWAYS",
            probability_pct=prob_side,
            trigger_condition=f"Rangebound oscillation between support {s} and resistance {r}",
            price_target=round((s + r) / 2, 2),
            price_target_pct=round(((((s + r) / 2) - current_price) / current_price) * 100, 2),
            supporting_factors=side_factors or ["Equilibrium between buyers and sellers"],
            opposing_factors=["Impending macro catalyst breakout"],
        ),
    ]


def generate_technical_desk_report(
    ticker: str,
    company_name: str,
    df: pd.DataFrame,
    benchmark_df: pd.DataFrame | None = None,
) -> AnalysisDeskResponse:
    """Generate complete institutional Stock Desk report."""
    cache_key = ticker.upper()
    if cache_key in _desk_cache:
        return _desk_cache[cache_key]

    current_price = round(float(df["Close"].iloc[-1]), 2)
    as_of_date = df.index[-1].strftime("%Y-%m-%d") if hasattr(df.index[-1], "strftime") else str(df.index[-1])

    # Core Analysis
    stage = classify_weinstein_stage(df)
    structure = analyze_market_structure(df)
    vsa = analyze_vsa(df)
    scenarios = generate_scenarios(df)
    trade_plan = generate_trade_plan(df, stage)

    # Momentum Metrics
    rsi_val = calculate_rsi(df["Close"], 14)
    rsi_status = "OVERBOUGHT" if rsi_val >= 70 else ("OVERSOLD" if rsi_val <= 30 else "NEUTRAL")

    macd_line, macd_signal, macd_hist = calculate_macd(df["Close"])
    macd_bias = "BULLISH" if macd_hist >= 0 else "BEARISH"

    adx_val = calculate_adx(df, 14)
    trend_strength = "STRONG_TREND" if adx_val >= 25 else ("MODERATE_TREND" if adx_val >= 18 else "WEAK_RANGE")

    stoch_k, stoch_d = calculate_stochastic(df, 14, 3)
    cmf_val = calculate_cmf(df, 20)
    cmf_status = "NET_INFLOW" if cmf_val >= 0.05 else ("NET_OUTFLOW" if cmf_val <= -0.05 else "NEUTRAL")

    momentum = MomentumMetrics(
        rsi_14=rsi_val,
        rsi_status=rsi_status,
        macd_line=macd_line,
        macd_signal=macd_signal,
        macd_histogram=macd_hist,
        macd_bias=macd_bias,
        adx_14=adx_val,
        trend_strength=trend_strength,
        stoch_k=stoch_k,
        stoch_d=stoch_d,
        cmf_20=cmf_val,
        cmf_status=cmf_status,
    )

    # Relative Strength vs Benchmark
    is_idx = ticker.upper().endswith(".JK")
    bench_ticker = "^JKSE" if is_idx else "^GSPC"
    bench_name = "IHSG" if is_idx else "S&P 500"

    stock_1m = 0.0
    bench_1m = 0.0
    if len(df) >= 20:
        c_now = float(df["Close"].iloc[-1])
        c_20 = float(df["Close"].iloc[-20])
        stock_1m = round(((c_now - c_20) / c_20) * 100, 2)

    if benchmark_df is not None and len(benchmark_df) >= 20:
        b_now = float(benchmark_df["Close"].iloc[-1])
        b_20 = float(benchmark_df["Close"].iloc[-20])
        bench_1m = round(((b_now - b_20) / b_20) * 100, 2)

    alpha = round(stock_1m - bench_1m, 2)
    rs_rating = "OUTPERFORMING" if alpha >= 3.0 else ("UNDERPERFORMING" if alpha <= -3.0 else "IN_LINE")

    relative_strength = RelativeStrengthMetrics(
        benchmark_ticker=bench_ticker,
        benchmark_name=bench_name,
        stock_1m_return_pct=stock_1m,
        benchmark_1m_return_pct=bench_1m,
        alpha_pct=alpha,
        rating=rs_rating,
    )

    # Mindset Guardrails tailored to phase
    if stage.stage_number == 4:
        guardrail = (
            "Mindset Rule #1: Capital preservation takes precedence over bottom fishing. "
            "In Stage 4 Markdown, low prices often get cheaper. Never average down on a losing position without confirmed base structure."
        )
    elif stage.stage_number == 2:
        guardrail = (
            "Mindset Rule #1: The trend is your primary edge. Cut losses swiftly at pre-planned stop loss levels "
            "and allow winners to run along key moving averages."
        )
    elif stage.stage_number == 3:
        guardrail = (
            "Mindset Rule #1: Protect unrealized gains. Do not let greed blind you to institutional distribution signatures."
        )
    else:
        guardrail = (
            "Mindset Rule #1: Exercise patience. Accumulation phases take time. Do not jump early before volume confirmation."
        )

    currency = "IDR" if is_idx else "USD"

    report = AnalysisDeskResponse(
        ticker=ticker.upper(),
        company_name=company_name,
        current_price=current_price,
        currency=currency,
        as_of_date=as_of_date,
        stage=stage,
        trade_plan=trade_plan,
        scenarios=scenarios,
        market_structure=structure,
        vsa=vsa,
        momentum=momentum,
        relative_strength=relative_strength,
        mindset_guardrail=guardrail,
    )

    _desk_cache[cache_key] = report
    return report
