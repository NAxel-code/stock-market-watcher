"""Price alerts API endpoints for threshold monitoring."""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from app.models.schemas import PriceAlertCreate, PriceAlertResponse
from app.services import yahoo_finance as yf_service

router = APIRouter(prefix="/alerts", tags=["alerts"])

# In-memory store for active price alerts
_active_alerts: dict[str, dict] = {}


@router.post("", response_model=PriceAlertResponse)
def create_alert(payload: PriceAlertCreate) -> PriceAlertResponse:
    """Create a price alert threshold for a stock."""
    alert_id = str(uuid.uuid4())
    alert_data = {
        "id": alert_id,
        "ticker": payload.ticker.upper(),
        "target_price": payload.target_price,
        "condition": payload.condition,
        "is_active": True,
        "created_at": datetime.now(UTC).isoformat(),
    }
    _active_alerts[alert_id] = alert_data
    return PriceAlertResponse(**alert_data)


@router.get("", response_model=list[PriceAlertResponse])
def list_alerts() -> list[PriceAlertResponse]:
    """List all active price alerts."""
    return [PriceAlertResponse(**a) for a in _active_alerts.values()]


@router.delete("/{alert_id}", response_model=dict)
def delete_alert(alert_id: str) -> dict:
    """Delete an active price alert."""
    if alert_id not in _active_alerts:
        raise HTTPException(status_code=404, detail="Alert not found")
    del _active_alerts[alert_id]
    return {"status": "success", "deleted_id": alert_id}


@router.post("/evaluate", response_model=list[dict])
def evaluate_alerts() -> list[dict]:
    """Check all active alerts against current market prices and return triggered alerts."""
    triggered: list[dict] = []
    for alert_id, alert in list(_active_alerts.items()):
        if not alert.get("is_active"):
            continue

        try:
            quote = yf_service.get_quote(alert["ticker"])
            current = quote.current_price
            target = alert["target_price"]
            condition = alert["condition"]

            is_triggered = False
            if condition == "ABOVE" and current >= target:
                is_triggered = True
            elif condition == "BELOW" and current <= target:
                is_triggered = True

            if is_triggered:
                alert["is_active"] = False
                triggered.append({
                    "alert_id": alert_id,
                    "ticker": alert["ticker"],
                    "condition": condition,
                    "target_price": target,
                    "current_price": current,
                    "message": f"{alert['ticker']} has crossed {condition} {target} (Current: {current})",
                })
        except Exception:
            continue

    return triggered
