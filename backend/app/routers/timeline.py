from fastapi import APIRouter, Query

from app.services.timeline_service import TimelineService

router = APIRouter(tags=["timeline"])


@router.get("/timeline")
def get_timeline(
    entity: str | None = None,
    claim_type: str | None = None,
    min_confidence: float | None = None,
    limit: int = Query(200, le=1000),
):
    return TimelineService.timeline(
        entity=entity, claim_type=claim_type, min_confidence=min_confidence, limit=limit
    )
