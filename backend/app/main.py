from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import neo4j.exceptions

from app import config
from app.db import Database
from app.routers import artifacts, claims, duplicates, entities, graph, qa, search, stats, timeline

app = FastAPI(title="Layer10 Memory Graph API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(neo4j.exceptions.ServiceUnavailable)
def neo4j_unavailable_handler(request: Request, exc: neo4j.exceptions.ServiceUnavailable):
    return JSONResponse(status_code=503, content={"detail": "Neo4j database unavailable"})


app.include_router(stats.router)
app.include_router(entities.router)
app.include_router(claims.router)
app.include_router(artifacts.router)
app.include_router(graph.router)
app.include_router(timeline.router)
app.include_router(duplicates.router)
app.include_router(search.router)
app.include_router(qa.router)


@app.get("/")
def health():
    return {"status": "ok", "service": "layer10-api"}


@app.on_event("shutdown")
def shutdown():
    Database.close()
