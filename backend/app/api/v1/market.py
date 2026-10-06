from fastapi import APIRouter

from app.models.schemas import MarketStatusResponse, MarketSummaryResponse
from app.services import yahoo_finance as yf_service

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/summary", response_model=MarketSummaryResponse)
def get_market_summary() -> MarketSummaryResponse:
    """Get market indices (US + IDX) and top movers."""
    return yf_service.get_market_summary()


@router.get("/status", response_model=MarketStatusResponse)
def get_market_status() -> MarketStatusResponse:
    """Get real-time market operational status and sessions for IDX (WIB) and US (EST)."""
    return yf_service.get_all_market_statuses()
