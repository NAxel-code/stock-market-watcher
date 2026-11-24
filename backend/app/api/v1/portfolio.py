"""Portfolio Tracker API Router."""

from fastapi import APIRouter, Query, Response

from app.models.schemas import (
    PortfolioAnalysisResponse,
    PortfolioAnalyzeRequest,
    PortfolioHoldingItem,
)
from app.services import portfolio_engine

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/default", response_model=list[PortfolioHoldingItem])
def get_default_institutional_holdings(response: Response) -> list[PortfolioHoldingItem]:
    """Get the default institutional multi-asset model portfolio holdings."""
    response.headers["Cache-Control"] = "public, max-age=300"
    return portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO


@router.get("/analyze", response_model=PortfolioAnalysisResponse)
def get_portfolio_analysis(
    response: Response,
    base_currency: str = Query(default="SGD", description="Base reporting currency (SGD, USD, IDR)"),
) -> PortfolioAnalysisResponse:
    """Analyze the default institutional portfolio in the specified base currency."""
    response.headers["Cache-Control"] = "public, max-age=60"
    return portfolio_engine.analyze_portfolio(
        holdings=portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO,
        base_currency=base_currency,
    )


@router.post("/analyze", response_model=PortfolioAnalysisResponse)
def post_analyze_custom_portfolio(
    request: PortfolioAnalyzeRequest,
    response: Response,
) -> PortfolioAnalysisResponse:
    """Analyze custom user-supplied portfolio holdings with institutional attribution and risk rules."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return portfolio_engine.analyze_portfolio(
        holdings=request.holdings,
        base_currency=request.base_currency,
    )
