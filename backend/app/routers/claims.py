from fastapi import APIRouter, HTTPException, Query

from app.services.claim_service import ClaimService

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("")
def list_claims(
    search: str | None = None,
    type: str | None = None,
    current: bool | None = None,
    min_confidence: float | None = None,
    skip: int = 0,
    limit: int = Query(25, le=200),
):
    return ClaimService.list(
        search=search,
        type=type,
        current=current,
        min_confidence=min_confidence,
        skip=skip,
        limit=limit,
    )


@router.get("/{claim_id}")
def get_claim(claim_id: str):
    claim = ClaimService.get(claim_id)
    if claim is None:
        raise HTTPException(404, detail="Claim not found")
    return claim
