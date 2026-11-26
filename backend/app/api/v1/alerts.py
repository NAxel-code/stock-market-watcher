"""Persistent price alerts API endpoints backed by database storage and 24/7 worker evaluation."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_owner_id
from app.db.store import store
from app.models.schemas import PriceAlertCreate, PriceAlertResponse
from app.services.alert_worker import evaluate_pending_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=PriceAlertResponse)
def create_alert(
    payload: PriceAlertCreate,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> PriceAlertResponse:
    """Create a persistent price alert threshold scoped to the user or workspace."""
    alert = store.create_alert(
        owner_id=owner_id,
        ticker=payload.ticker,
        target_price=payload.target_price,
        condition=payload.condition,
    )
    return PriceAlertResponse(**alert)


@router.get("", response_model=list[PriceAlertResponse])
def list_alerts(
    owner_id: Annotated[str, Depends(get_owner_id)],
    active_only: bool = False,
) -> list[PriceAlertResponse]:
    """List persistent price alerts for the current user or workspace."""
    rows = store.list_alerts(owner_id=owner_id, include_triggered=not active_only)
    return [PriceAlertResponse(**a) for a in rows]


@router.get("/triggered", response_model=list[PriceAlertResponse])
def list_triggered_alerts(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> list[PriceAlertResponse]:
    """List alerts triggered in the background even while client tabs were closed."""
    rows = store.list_triggered_alerts(owner_id=owner_id)
    return [PriceAlertResponse(**a) for a in rows]


@router.delete("/{alert_id}", response_model=dict)
def delete_alert(
    alert_id: str,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> dict:
    """Delete a persistent price alert owned by the caller."""
    deleted = store.delete_alert(owner_id=owner_id, alert_id=alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "deleted_id": alert_id}


@router.post("/evaluate", response_model=list[dict])
def evaluate_alerts(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> list[dict]:
    """Evaluate active alerts for the caller against live market quotes."""
    return evaluate_pending_alerts(owner_id=owner_id)
