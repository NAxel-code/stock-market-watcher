from fastapi import APIRouter, Query, Response

from app.models.schemas import (
    FXRatesResponse,
    MarketStatusResponse,
    MarketSummaryResponse,
    MarketsOverviewResponse,
)
from app.services import data_collector, markets_screen, yahoo_finance as yf_service

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/overview", response_model=MarketsOverviewResponse)
def get_markets_overview_endpoint(response: Response) -> MarketsOverviewResponse:
    """Get multi-asset markets screen overview: Indices, ETFs, FX, Yields, Commodities, and Unusual Moves."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    return markets_screen.get_markets_overview()


@router.get("/summary", response_model=MarketSummaryResponse)
def get_market_summary(response: Response) -> MarketSummaryResponse:
    """Get market indices (US + IDX + SGX) and top movers."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    return yf_service.get_market_summary()


@router.get("/status", response_model=MarketStatusResponse)
def get_market_status(response: Response) -> MarketStatusResponse:
    """Get real-time market operational status and sessions for IDX (WIB), SGX (SGT), and US (EST)."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    return yf_service.get_all_market_statuses()


@router.get("/fx", response_model=FXRatesResponse)
def get_fx_rates(response: Response) -> FXRatesResponse:
    """Get live foreign exchange rates (USD/SGD, USD/IDR, USD/JPY, SGD/IDR, SGD/JPY, EUR/USD)."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    return yf_service.get_live_fx_rates()


@router.get("/convert")
def convert_currency(
    amount: float = Query(default=1.0, gt=0, description="Amount to convert"),
    from_currency: str = Query(default="USD", description="Source 3-letter currency code"),
    to_currency: str = Query(default="IDR", description="Target 3-letter currency code"),
):
    """Unified FX conversion endpoint using live rates and triangulation."""
    return data_collector.convert_fx(amount, from_currency, to_currency)


@router.get("/health")
def get_data_health(response: Response):
    """Retrieve data health, collection metrics, latency, and stale tracking."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return data_collector.get_health_telemetry()


@router.post("/collect")
def trigger_data_collection():
    """Manual or scheduled cron trigger for market data collection and cache warming."""
    return data_collector.run_collection_cycle()

