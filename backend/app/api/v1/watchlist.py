"""Watchlist endpoints — anonymous mode (no auth required for MVP)."""
from fastapi import APIRouter

from app.models.schemas import WatchlistAddRequest
from app.services import yahoo_finance as yf_service

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
