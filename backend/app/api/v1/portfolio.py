"""Portfolio Tracker API Router with persistent cloud holdings storage."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.core.security import get_owner_id
from app.db.store import store
from app.models.schemas import (
    PortfolioAnalysisResponse,
    PortfolioAnalyzeRequest,
    PortfolioHoldingItem,
    PortfolioHoldingsReplaceRequest,
)
from app.services import portfolio_engine

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/default", response_model=list[PortfolioHoldingItem])
def get_default_institutional_holdings(response: Response) -> list[PortfolioHoldingItem]:
    """Get the default institutional multi-asset model portfolio holdings."""
    response.headers["Cache-Control"] = "public, max-age=300"
    return portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO


@router.get("/holdings", response_model=list[PortfolioHoldingItem])
def get_saved_portfolio_holdings(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> list[PortfolioHoldingItem]:
    """Fetch user/workspace cloud-persisted portfolio holdings, seeding institutional model if empty."""
    rows = store.list_portfolio_holdings(owner_id)
    if not rows:
        seeded = [h.model_dump() for h in portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO]
        rows = store.replace_portfolio_holdings(owner_id, seeded)
    return [PortfolioHoldingItem(**r) for r in rows]


@router.post("/holdings", response_model=PortfolioHoldingItem)
def upsert_portfolio_holding(
    holding: PortfolioHoldingItem,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> PortfolioHoldingItem:
    """Create or update a portfolio holding in persistent storage."""
    saved = store.upsert_portfolio_holding(owner_id, holding.model_dump())
    return PortfolioHoldingItem(**saved)


@router.put("/holdings", response_model=list[PortfolioHoldingItem])
def replace_portfolio_holdings(
    payload: PortfolioHoldingsReplaceRequest,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> list[PortfolioHoldingItem]:
    """Replace the caller's full persisted portfolio holdings list."""
    rows = store.replace_portfolio_holdings(owner_id, [h.model_dump() for h in payload.holdings])
    return [PortfolioHoldingItem(**r) for r in rows]


@router.delete("/holdings/{holding_id}", response_model=dict)
def delete_portfolio_holding(
    holding_id: str,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> dict:
    """Delete a persisted portfolio holding owned by caller."""
    deleted = store.delete_portfolio_holding(owner_id, holding_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"status": "success", "deleted_id": holding_id}


@router.post("/holdings/reset", response_model=list[PortfolioHoldingItem])
def reset_portfolio_holdings(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> list[PortfolioHoldingItem]:
    """Reset persisted portfolio holdings to the default institutional model."""
    seeded = [h.model_dump() for h in portfolio_engine.DEFAULT_INSTITUTIONAL_PORTFOLIO]
    rows = store.replace_portfolio_holdings(owner_id, seeded)
    return [PortfolioHoldingItem(**r) for r in rows]


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
