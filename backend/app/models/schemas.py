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
    currency: str = "USD"
    is_primary: bool = True


class FXRateItem(BaseModel):
    pair: str  # e.g. "USD/SGD", "USD/IDR", "USD/JPY", "SGD/IDR"
    from_currency: str
    to_currency: str
    rate: float
    change: float = 0.0
    change_percent: float = 0.0


class FXRatesResponse(BaseModel):
    rates: list[FXRateItem]
    as_of: str


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
    sgx: MarketSessionInfo | None = None


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


class SecurityMasterItem(BaseModel):
    ticker: str
    name: str
    exchange: str
    currency: str
    asset_type: str = "EQUITY"
    sector: str | None = None
    industry: str | None = None
    isin: str | None = None
    cik: str | None = None
    is_primary: bool = True
    is_active: bool = True


class SecurityMasterResponse(BaseModel):
    total: int
    securities: list[SecurityMasterItem]
    as_of: str


# ==========================================
# Markets Screen Telemetry Models
# ==========================================
class MarketInstrument(BaseModel):
    ticker: str
    name: str
    category: str  # 'INDEX' | 'ETF' | 'FX' | 'RATE' | 'COMMODITY'
    current_price: float
    change: float
    change_percent: float
    unit: str = "$"
    as_of: str
    source: str
    is_stale: bool = False


class YieldCurvePoint(BaseModel):
    tenor: str  # '3M', '6M', '2Y', '5Y', '10Y', '30Y'
    yield_rate: float  # in percentage, e.g. 4.25
    change_bps: float  # basis points change, e.g. -2.5
    country: str  # 'US', 'SG', 'ID'
    source: str = "Central Bank / Treasury"


class UnusualMover(BaseModel):
    ticker: str
    name: str
    exchange: str
    current_price: float
    change_percent: float
    daily_volatility_1y: float
    z_score_shock: float  # daily return / 1y daily vol
    direction: str  # 'SURGE' | 'DUMP'


class MarketsOverviewResponse(BaseModel):
    as_of: str
    indices: list[MarketInstrument]
    etfs: list[MarketInstrument]
    fx_rates: list[MarketInstrument]
    sovereign_rates: list[YieldCurvePoint]
    commodities: list[MarketInstrument]
    unusual_moves: list[UnusualMover]


# ==========================================
# Portfolio Tracker Models
# ==========================================
class PortfolioHoldingItem(BaseModel):
    id: str
    ticker: str
    company_name: str
    exchange: str  # 'US' | 'SGX' | 'IDX' | 'LSE'
    asset_type: str = "EQUITY"
    shares: float
    lot_size: int = 1
    cost_basis: float
    currency: str  # 'USD' | 'SGD' | 'IDR' | 'GBP'
    purchase_date: str | None = None
    sector: str | None = None
    country: str | None = None  # 'US', 'SG', 'ID', 'IE' (Ireland UCITS)
    fees: float = 0.0
    notes: str | None = None


class HoldingPerformance(BaseModel):
    holding: PortfolioHoldingItem
    current_price: float
    current_value_native: float
    current_value_base: float
    cost_value_base: float
    unrealized_pnl_base: float
    unrealized_pnl_percent: float
    weight_percent: float
    stock_return_pct: float
    fx_return_pct: float
    stock_alpha_contribution_base: float
    fx_contribution_base: float
    est_annual_dividend_gross: float
    est_annual_dividend_net: float
    us_withholding_tax_applied: bool
    is_us_situs: bool
    is_above_8pct_cap: bool
    is_above_12pct_trim: bool


class PortfolioAllocationBreakdown(BaseModel):
    by_sector: dict[str, float]
    by_country: dict[str, float]
    by_currency: dict[str, float]


class PortfolioRiskMetrics(BaseModel):
    portfolio_beta: float
    annualized_volatility: float
    max_drawdown: float
    sharpe_ratio: float
    position_cap_warnings: list[str]
    us_estate_tax_exposure_usd: float
    us_estate_tax_limit_usd: float = 60000.0
    us_estate_tax_alert: bool
    us_estate_tax_message: str


class PortfolioAnalysisResponse(BaseModel):
    base_currency: str = "SGD"
    as_of: str
    total_cost_base: float
    total_value_base: float
    unrealized_pnl_base: float
    unrealized_pnl_percent: float
    total_stock_move_pnl_base: float
    total_fx_move_pnl_base: float
    total_annual_dividend_gross_base: float
    total_annual_dividend_net_base: float
    holdings: list[HoldingPerformance]
    allocation: PortfolioAllocationBreakdown
    risk: PortfolioRiskMetrics
    benchmark_comparison: dict[str, float]


class PortfolioAnalyzeRequest(BaseModel):
    base_currency: str = "SGD"
    holdings: list[PortfolioHoldingItem]



