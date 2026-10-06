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
    tickers: list[str] = Field(..., max_length=20)


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
