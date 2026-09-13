from fastapi import APIRouter, Query

from app.services.graph_service import GraphService

router = APIRouter(tags=["graph"])


@router.get("/graph")
def get_graph(
    entity_type: str | None = None,
    min_confidence: float | None = None,
    limit: int = Query(300, le=2000),
):
    return GraphService.graph(entity_type=entity_type, min_confidence=min_confidence, limit=limit)
