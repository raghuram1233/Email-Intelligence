from fastapi import APIRouter

from app.services.merge_service import MergeService

router = APIRouter(prefix="/duplicates", tags=["duplicates"])


@router.get("/entities")
def get_duplicate_entities():
    return MergeService.entity_duplicates()


@router.get("/claims")
def get_duplicate_claims():
    return MergeService.claim_duplicates()
