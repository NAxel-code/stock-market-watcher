from fastapi import APIRouter, HTTPException, Query, Response
from app.models.schemas import SecurityMasterItem, SecurityMasterResponse
from app.services import security_master

router = APIRouter(prefix="/securities", tags=["Security Master"])


@router.get("/master", response_model=SecurityMasterResponse)
def get_security_master(
    response: Response,
    exchange: str | None = Query(default=None, description="Filter by exchange (US, SGX, IDX)"),
    sector: str | None = Query(default=None, description="Filter by sector"),
    asset_type: str | None = Query(default=None, description="Filter by asset type (EQUITY, ETF, INDEX)"),
    q: str | None = Query(default=None, description="Search by ticker symbol or company name"),
    limit: int = Query(default=50, ge=1, le=200, description="Max records to return"),
):
    """Retrieve security master universe with optional exchange/sector/query filters."""
    response.headers["Cache-Control"] = "public, max-age=300"
    return security_master.list_securities(
        exchange=exchange,
        sector=sector,
        asset_type=asset_type,
        query=q,
        limit=limit,
    )


@router.get("/{ticker}", response_model=SecurityMasterItem)
def get_security_detail(ticker: str, response: Response):
    """Get security master metadata for a specific ticker."""
    sec = security_master.get_security(ticker)
    if not sec:
        raise HTTPException(status_code=404, detail=f"Security '{ticker}' not found in Security Master.")
    response.headers["Cache-Control"] = "public, max-age=3600"
    return sec


@router.post("/master", response_model=SecurityMasterItem)
def upsert_security_item(item: SecurityMasterItem):
    """Upsert or register a security in the master catalog."""
    return security_master.upsert_security(item)
