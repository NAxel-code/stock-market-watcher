"""Watchlist endpoints — anonymous mode (no auth required for MVP)."""
from fastapi import APIRouter

from app.models.schemas import (
    WatchlistAddRequest,
    WatchlistCorrelationRequest,
    WatchlistCorrelationResponse,
)
from app.services import yahoo_finance as yf_service
from app.services.technical_desk import calculate_watchlist_correlation

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

DEFAULT_TICKERS = yf_service.DEFAULT_WATCHLIST


@router.get("/default", response_model=list[str])
def get_default_watchlist() -> list[str]:
    """Return the default pre-seeded watchlist tickers."""
    return DEFAULT_TICKERS


@router.post("/validate", response_model=dict)
def validate_ticker(request: WatchlistAddRequest) -> dict:
    """Validate that a ticker exists before adding to local watchlist."""
    try:
        quote = yf_service.get_quote(request.ticker)
        return {"valid": True, "ticker": quote.ticker, "name": quote.company_name}
    except Exception:
        return {"valid": False, "ticker": request.ticker, "name": ""}


@router.post("/correlation", response_model=WatchlistCorrelationResponse)
def get_correlation(request: WatchlistCorrelationRequest) -> WatchlistCorrelationResponse:
    """Compute empirical and Marchenko-Pastur denoised correlation matrix for given tickers."""
    return calculate_watchlist_correlation(request.tickers)
