from fastapi import APIRouter

from app.services.stats_service import StatsService

router = APIRouter(tags=["stats"])


@router.get("/stats")
def get_stats():
    return StatsService.stats()
