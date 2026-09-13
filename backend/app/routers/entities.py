from fastapi import APIRouter, HTTPException, Query

from app.services.entity_service import EntityService

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("")
def list_entities(
    search: str | None = None,
    type: str | None = None,
    skip: int = 0,
    limit: int = Query(25, le=200),
    sort: str = "name",
):
    return EntityService.list(search=search, type=type, skip=skip, limit=limit, sort=sort)


@router.get("/{entity_id}")
def get_entity(entity_id: str):
    entity = EntityService.get(entity_id)
    if entity is None:
        raise HTTPException(404, detail="Entity not found")
    return entity


@router.get("/{entity_id}/claims")
def get_entity_claims(entity_id: str, skip: int = 0, limit: int = Query(25, le=200)):
    return EntityService.claims(entity_id, skip=skip, limit=limit)


@router.get("/{entity_id}/relationships")
def get_entity_relationships(entity_id: str):
    return EntityService.relationships(entity_id)


@router.get("/{entity_id}/timeline")
def get_entity_timeline(entity_id: str):
    return EntityService.timeline(entity_id)
