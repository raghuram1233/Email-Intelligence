from fastapi import APIRouter
from pydantic import BaseModel

from app.services.search_service import SearchService

router = APIRouter(tags=["search"])


class SearchRequest(BaseModel):
    query: str


@router.post("/search")
def search(body: SearchRequest):
    return SearchService.search(body.query)
