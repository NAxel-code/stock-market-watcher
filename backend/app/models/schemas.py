from pydantic import BaseModel, Field


class StockQuoteResponse(BaseModel):
    ticker: str = Field(..., examples=["AAPL"])
    company_name: str = Field(..., examples=["Apple Inc."])
    current_price: float = Field(..., examples=[150.25])
    previous_close: float = Field(..., examples=[148.0])
    change: float = Field(..., examples=[2.25])
    change_percent: float = Field(..., examples=[1.52])
    market_cap: float | None = None
    volume: int | None = None
    day_high: float | None = None
    day_low: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
    currency: str = "USD"
    is_stale: bool = False
    # IDX & Bloomberg Domain Enhancements
    is_idx: bool = False
    ara_price: float | None = None
    arb_price: float | None = None
    tick_size: int | None = None
    lot_size: int = 100
    fifty_two_week_position: float | None = None
    # CoinGecko Enhancements
    sector: str | None = None
    industry: str | None = None
    distance_from_52w_high: float | None = None
    distance_from_52w_low: float | None = None
    sparkline_7d: list[float] = Field(default_factory=list)


class HistoryPoint(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockHistoryResponse(BaseModel):
    ticker: str
    period: str
    data: list[HistoryPoint]


class StockSearchResult(BaseModel):
    ticker: str
    name: str
    exchange: str
    type: str = "EQUITY"


class MarketIndex(BaseModel):
    name: str
    ticker: str
    current_price: float
    change: float
    change_percent: float
    is_stale: bool = False


class TopMover(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    change_percent: float
    currency: str = "USD"


class MarketSummaryResponse(BaseModel):
    indices: list[MarketIndex]
    top_gainers: list[TopMover]
    top_losers: list[TopMover]


class MarketSessionInfo(BaseModel):
    market: str
    is_open: bool
    session_name: str
    current_time_local: str
    timezone: str


class MarketStatusResponse(BaseModel):
    idx: MarketSessionInfo
    us: MarketSessionInfo


class WatchlistAddRequest(BaseModel):
    ticker: str = Field(..., max_length=10, examples=["MSFT"])


class WatchlistItem(BaseModel):
    ticker: str
    added_at: str


class BatchQuoteRequest(BaseModel):
    tickers: list[str] = Field(..., max_length=60)


class PriceAlertCreate(BaseModel):
    ticker: str = Field(..., max_length=10, examples=["BBCA.JK"])
    target_price: float = Field(..., gt=0, examples=[6200.0])
    condition: str = Field("ABOVE", pattern="^(ABOVE|BELOW)$")


class PriceAlertResponse(BaseModel):
    id: str
    ticker: str
    target_price: float
    condition: str
    is_active: bool = True
    created_at: str


class HealthResponse(BaseModel):
    status: str
    service: str


# --- Stock Desk Institutional Technical Analysis Schemas ---


class StageInfo(BaseModel):
    stage_number: int = Field(..., ge=1, le=4, description="Weinstein Stage: 1=Base, 2=Markup, 3=Distribution, 4=Markdown")
    stage_name: str = Field(..., examples=["Stage 4 - Markdown / Downtrend"])
    bias: str = Field(..., examples=["BEARISH", "BULLISH", "NEUTRAL"])
    confidence_pct: int = Field(..., ge=0, le=100, examples=[85])
    description: str


class TradePlan(BaseModel):
    verdict: str = Field(..., examples=["AVOID", "BUY ON BREAKOUT", "BUY ON WEAKNESS", "TAKE PROFIT", "HOLD"])
    current_price: float
    buy_area_min: float | None = None
    buy_area_max: float | None = None
    stop_loss: float | None = None
    target_1: float | None = None
    target_2: float | None = None
    risk_reward_ratio: str = Field(..., examples=["1:2.5", "N/A"])
    rationale: str


class ScenarioProjection(BaseModel):
    name: str = Field(..., examples=["Bullish Rebound", "Bearish Continuation", "Base Consolidation"])
    direction: str = Field(..., examples=["UP", "DOWN", "SIDEWAYS"])
    probability_pct: int = Field(..., ge=0, le=100)
    trigger_condition: str
    price_target: float | None = None
    price_target_pct: float | None = None
    supporting_factors: list[str] = Field(default_factory=list)
    opposing_factors: list[str] = Field(default_factory=list)


class MarketStructure(BaseModel):
    trend_structure: str = Field(..., examples=["LH-LL", "HH-HL", "NEUTRAL"])
    trend_description: str
    nearest_support: float
    nearest_resistance: float
    drawdown_300d_pct: float
    peak_300d_price: float
    ma20: float
    ma50: float
    ma200: float | None = None
    ma200_slope_pct: float | None = None
    ma_stack_status: str = Field(..., examples=["BEARISH_ALIGNMENT", "BULLISH_ALIGNMENT", "MIXED"])


class VsaMetrics(BaseModel):
    up_down_volume_ratio_20d: float
    participation_status: str = Field(..., examples=["Dominant Selling Pressure", "Dominant Buying Pressure", "Balanced Participation"])
    is_selling_climax: bool = False
    is_stopping_volume: bool = False
    is_absorption: bool = False
    volume_surge_ratio: float


class MomentumMetrics(BaseModel):
    rsi_14: float
    rsi_status: str = Field(..., examples=["OVERSOLD", "NEUTRAL", "OVERBOUGHT"])
    macd_line: float
    macd_signal: float
    macd_histogram: float
    macd_bias: str = Field(..., examples=["BULLISH", "BEARISH"])
    adx_14: float
    trend_strength: str = Field(..., examples=["STRONG_TREND", "MODERATE_TREND", "WEAK_RANGE"])
    stoch_k: float
    stoch_d: float
    cmf_20: float
    cmf_status: str = Field(..., examples=["NET_INFLOW", "NET_OUTFLOW", "NEUTRAL"])


class RelativeStrengthMetrics(BaseModel):
    benchmark_ticker: str = Field(..., examples=["^JKSE", "^GSPC"])
    benchmark_name: str = Field(..., examples=["IHSG", "S&P 500"])
    stock_1m_return_pct: float
    benchmark_1m_return_pct: float
    alpha_pct: float
    rating: str = Field(..., examples=["OUTPERFORMING", "IN_LINE", "UNDERPERFORMING"])
    kalman_beta: float = Field(default=1.0, description="Dynamic beta estimated via 1D state-space Kalman Filter")
    kalman_beta_drift: str = Field(default="STABLE", description="BETA_EXPANDING, BETA_DEFENSIVE, or STABLE")
    decoupling_score: float = Field(default=0.0, description="Idiosyncratic decoupling index from benchmark (0-100%)")


class WatchlistCorrelationRequest(BaseModel):
    tickers: list[str] = Field(default_factory=list, description="List of ticker symbols to correlate (max 16)")


class WatchlistCorrelationResponse(BaseModel):
    tickers: list[str]
    raw_correlation: list[list[float]]
    denoised_correlation: list[list[float]]
    lambda_plus: float
    signal_count: int
    noise_count: int
    interpretation: str


class AnalysisDeskResponse(BaseModel):
    ticker: str
    company_name: str
    current_price: float
    currency: str = "USD"
    as_of_date: str
    stage: StageInfo
    trade_plan: TradePlan
    scenarios: list[ScenarioProjection]
    market_structure: MarketStructure
    vsa: VsaMetrics
    momentum: MomentumMetrics
    relative_strength: RelativeStrengthMetrics
    mindset_guardrail: str

