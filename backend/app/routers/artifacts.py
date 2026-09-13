from fastapi import APIRouter, HTTPException, Query

from app.services.artifact_service import ArtifactService

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("")
def list_artifacts(search: str | None = None, skip: int = 0, limit: int = Query(25, le=200)):
    return ArtifactService.list(search=search, skip=skip, limit=limit)


@router.get("/{artifact_id}")
def get_artifact(artifact_id: str):
    artifact = ArtifactService.get(artifact_id)
    if artifact is None:
        raise HTTPException(404, detail="Artifact not found")
    return artifact
