"""Persistent cloud watchlist endpoints with cross-device workspace/user sync."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_owner_id
from app.db.store import store
from app.models.schemas import (
    WatchlistAddRequest,
    WatchlistCorrelationRequest,
    WatchlistCorrelationResponse,
    WatchlistItem,
    WatchlistStateResponse,
    WatchlistSyncRequest,
)
from app.services import yahoo_finance as yf_service
from app.services.technical_desk import calculate_watchlist_correlation

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

DEFAULT_TICKERS = yf_service.DEFAULT_WATCHLIST


@router.get("/default", response_model=list[str])
def get_default_watchlist() -> list[str]:
    """Return the default pre-seeded watchlist tickers."""
    return DEFAULT_TICKERS


@router.get("", response_model=WatchlistStateResponse)
def get_user_watchlist(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> WatchlistStateResponse:
    """Get persistent cloud watchlist for the current user or workspace."""
    items = store.get_watchlist(owner_id)
    if not items:
        return WatchlistStateResponse(owner_id=owner_id, tickers=[], items=[])
    return WatchlistStateResponse(
        owner_id=owner_id,
        tickers=[i["ticker"] for i in items],
        items=[WatchlistItem(**i) for i in items],
    )


@router.post("/items", response_model=WatchlistStateResponse)
def add_watchlist_item(
    request: WatchlistAddRequest,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> WatchlistStateResponse:
    """Persist a ticker to the caller's cloud watchlist."""
    items = store.add_watchlist_ticker(owner_id, request.ticker)
    return WatchlistStateResponse(
        owner_id=owner_id,
        tickers=[i["ticker"] for i in items],
        items=[WatchlistItem(**i) for i in items],
    )


@router.delete("/items/{ticker}", response_model=WatchlistStateResponse)
def remove_watchlist_item(
    ticker: str,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> WatchlistStateResponse:
    """Remove a ticker from the caller's cloud watchlist."""
    items = store.remove_watchlist_ticker(owner_id, ticker)
    return WatchlistStateResponse(
        owner_id=owner_id,
        tickers=[i["ticker"] for i in items],
        items=[WatchlistItem(**i) for i in items],
    )


@router.post("/sync", response_model=WatchlistStateResponse)
def sync_watchlist(
    request: WatchlistSyncRequest,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> WatchlistStateResponse:
    """Synchronize/replace cloud watchlist tickers for multi-device consistency."""
    items = store.sync_watchlist(owner_id, request.tickers)
    return WatchlistStateResponse(
        owner_id=owner_id,
        tickers=[i["ticker"] for i in items],
        items=[WatchlistItem(**i) for i in items],
    )


@router.post("/validate", response_model=dict)
def validate_ticker(request: WatchlistAddRequest) -> dict:
    """Validate that a ticker exists before adding to watchlist."""
    try:
        quote = yf_service.get_quote(request.ticker)
        return {"valid": True, "ticker": quote.ticker, "name": quote.company_name}
    except Exception:
        return {"valid": False, "ticker": request.ticker, "name": ""}


@router.post("/correlation", response_model=WatchlistCorrelationResponse)
def get_correlation(request: WatchlistCorrelationRequest) -> WatchlistCorrelationResponse:
    """Compute empirical and Marchenko-Pastur denoised correlation matrix for given tickers."""
    return calculate_watchlist_correlation(request.tickers)
