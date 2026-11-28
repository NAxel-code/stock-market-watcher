from fastapi import APIRouter, Query, Response

from app.models.schemas import (
    AnalysisDeskResponse,
    StockHistoryResponse,
    StockQuoteResponse,
    StockSearchResult,
)
from app.services import yahoo_finance as yf_service

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search", response_model=list[StockSearchResult])
def search_stocks(
    response: Response,
    q: str = Query(..., min_length=1, max_length=50)
) -> list[StockSearchResult]:
    """Search stock tickers by keyword with primary listings ranked first."""
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    return yf_service.search_tickers(q)


@router.get("/batch", response_model=list[StockQuoteResponse])
def batch_quotes(
    response: Response,
    tickers: str = Query(..., description="Comma-separated ticker symbols, max 60")
) -> list[StockQuoteResponse]:
    """Get batch quotes for multiple tickers."""
    response.headers["Cache-Control"] = "public, max-age=30, s-maxage=30, stale-while-revalidate=60"
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()][:60]
    return yf_service.get_batch_quotes(ticker_list)


@router.get("/{ticker}/quote", response_model=StockQuoteResponse)
def get_quote(ticker: str, response: Response) -> StockQuoteResponse:
    """Get real-time quote for a single ticker."""
    response.headers["Cache-Control"] = "public, max-age=30, s-maxage=30, stale-while-revalidate=60"
    return yf_service.get_quote(ticker.upper())


@router.get("/{ticker}/history", response_model=StockHistoryResponse)
def get_history(
    ticker: str,
    response: Response,
    period: str = Query(default="1m", pattern="^(1d|1w|1m|3m|1y)$"),
) -> StockHistoryResponse:
    """Get historical OHLCV data. Period: 1d, 1w, 1m, 3m, 1y."""
    response.headers["Cache-Control"] = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600"
    return yf_service.get_history(ticker.upper(), period)


@router.get("/{ticker}/desk", response_model=AnalysisDeskResponse)
def get_technical_desk(ticker: str, response: Response) -> AnalysisDeskResponse:
    """Get institutional technical desk analysis report for ticker."""
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    return yf_service.get_technical_desk(ticker.upper())
