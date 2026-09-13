from fastapi import APIRouter
from pydantic import BaseModel

from app.services.retrieval_service import RetrievalService

router = APIRouter(tags=["qa"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/qa")
def ask_question(body: QuestionRequest):
    return RetrievalService.answer(body.question)
