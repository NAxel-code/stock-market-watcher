from fastapi import APIRouter, Query

from app.models.schemas import (
    StockHistoryResponse,
    StockQuoteResponse,
    StockSearchResult,
)
from app.services import yahoo_finance as yf_service

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search", response_model=list[StockSearchResult])
def search_stocks(q: str = Query(..., min_length=1, max_length=50)) -> list[StockSearchResult]:
    """Search stock tickers by keyword."""
    return yf_service.search_tickers(q)


@router.get("/batch", response_model=list[StockQuoteResponse])
def batch_quotes(
    tickers: str = Query(..., description="Comma-separated ticker symbols, max 20")
) -> list[StockQuoteResponse]:
    """Get batch quotes for multiple tickers."""
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:20]
    return yf_service.get_batch_quotes(ticker_list)


@router.get("/{ticker}/quote", response_model=StockQuoteResponse)
def get_quote(ticker: str) -> StockQuoteResponse:
    """Get real-time quote for a single ticker."""
    return yf_service.get_quote(ticker.upper())


@router.get("/{ticker}/history", response_model=StockHistoryResponse)
def get_history(
    ticker: str,
    period: str = Query(default="1m", pattern="^(1d|1w|1m|3m|1y)$"),
) -> StockHistoryResponse:
    """Get historical OHLCV data. Period: 1d, 1w, 1m, 3m, 1y."""
    return yf_service.get_history(ticker.upper(), period)
