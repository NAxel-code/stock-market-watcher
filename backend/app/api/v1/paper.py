"""Cloud-synced Paper Trading Simulator endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_owner_id
from app.db.store import store
from app.models.schemas import PaperStatePayload

router = APIRouter(prefix="/paper", tags=["paper"])


@router.get("/state", response_model=PaperStatePayload)
def get_paper_state(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> PaperStatePayload:
    """Retrieve persisted paper trading cash, open positions, and trade history."""
    state = store.get_paper_state(owner_id)
    if not state:
        state = store.reset_paper_state(owner_id)
    return PaperStatePayload(**state)


@router.put("/state", response_model=PaperStatePayload)
def save_paper_state(
    payload: PaperStatePayload,
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> PaperStatePayload:
    """Persist paper trading account state for multi-device sync."""
    saved = store.save_paper_state(owner_id, payload.model_dump())
    return PaperStatePayload(**saved)


@router.post("/reset", response_model=PaperStatePayload)
def reset_paper_state(
    owner_id: Annotated[str, Depends(get_owner_id)],
) -> PaperStatePayload:
    """Reset paper trading account to default $100,000 starting capital."""
    reset_data = store.reset_paper_state(owner_id)
    return PaperStatePayload(**reset_data)
