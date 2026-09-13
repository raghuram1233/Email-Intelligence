---

# Layer10 — Grounded Memory Graph

A demo-ready web application on top of the Layer10 take-home pipeline: the Enron email corpus is ingested, an LLM extracts structured entities and claims with evidence spans, everything is deduplicated and persisted to Neo4j, and this repo now wraps that graph with a **FastAPI backend** and a **Next.js frontend** for exploring it — memory graph visualization, entity/claim drill-down, evidence-backed retrieval QA, duplicate-merge inspection, and a temporal timeline.

The original ingestion pipeline (`extraction.py`, `graph_builder.py`, `deduper.py`, `qa_pipeline.py`, etc.) is untouched — the web app is a read layer on top of the same Neo4j graph it already writes to.

```
CSV Emails → LLM Extraction → Dedup/Normalize → Neo4j   (existing pipeline, unchanged)
                                                    │
                                                    ▼
                                    FastAPI backend/  (Cypher service layer)
                                                    │
                                                    ▼
                                    Next.js frontend/ (dashboard, graph, QA, ...)
```

---

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: **http://localhost:3000**
- Backend API + docs: **http://localhost:8000/docs**
- Neo4j Browser: **http://localhost:7474**

This starts a fresh Neo4j instance, the FastAPI backend, and the Next.js frontend, wired together. Neo4j starts **empty** — see [Loading data](#loading-data) below to populate it, either by running the ingestion pipeline or restoring the included dump.

Requires Docker Desktop (or another Docker Engine) running locally.

---

## Environment variables

Root `.env` (already present, used by the ingestion pipeline, `docker-compose.yml`, and the backend when run outside Docker):

| Variable         | Default                        | Used by                          |
| ---------------- | ------------------------------- | --------------------------------- |
| `NEO4J_URI`       | `neo4j://127.0.0.1:7687`        | pipeline, backend (non-Docker)    |
| `NEO4J_USER`      | `neo4j`                         | pipeline, backend, `docker-compose.yml` |
| `NEO4J_PASSWORD`  | —                                | pipeline, backend, `docker-compose.yml` |
| `OLLAMA_URL`      | `http://localhost:11434/api/generate` | ingestion pipeline (`extraction.py`) |
| `MODEL_NAME`      | `mistral:latest`                | ingestion pipeline |
| `CSV_PATH`        | `sample_5.csv`                  | ingestion pipeline (`main.py`) |

Inside `docker-compose.yml`, the backend is pointed at the `neo4j` service by container name (`neo4j://neo4j:7687`) rather than `127.0.0.1` — you don't need to change anything, this is handled automatically.

`frontend/.env.local` (copy from `frontend/.env.local.example` for local `npm run dev`; not needed for Docker, where it's injected by `docker-compose.yml`):

| Variable                | Default                 |
| ------------------------ | ------------------------ |
| `NEXT_PUBLIC_API_URL`    | `http://localhost:8000` |

`backend` also reads `CORS_ORIGINS` (comma-separated, default `http://localhost:3000`) if you serve the frontend from somewhere else.

---

## Running without Docker

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend reads Neo4j credentials from the root `.env` (via `python-dotenv`) — same variables the ingestion pipeline uses. It responds with a clean `503 {"detail": "Neo4j database unavailable"}` instead of crashing if Neo4j isn't reachable yet, so you can bring the backend up before Neo4j.

API docs (Swagger UI) are auto-generated at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Visit `http://localhost:3000`.

---

## Neo4j connection

Any Neo4j 5.x instance works — Aura, a local install, or the `neo4j` service in `docker-compose.yml`. Point `NEO4J_URI`/`NEO4J_USER`/`NEO4J_PASSWORD` at it. The schema written by `graph_builder.py` and read by `backend/app/services/`:

```
(:Entity {normalized_name, name, type, email, aliases})
(:Claim {claim_id, type, subject, object, valid_from, event_time, confidence, valid_to})
(:Evidence {evidence_id, quote, char_start, char_end, message_id})
(:Artifact {artifact_id, subject, sender, timestamp})

(Entity)-[:MADE_CLAIM]->(Claim)
(Claim)-[:SUPPORTED_BY]->(Evidence)
(Evidence)-[:FROM_ARTIFACT]->(Artifact)
```

## Loading data

You have two options:

**A. Run the ingestion pipeline** (produces fresh data from `sample_5.csv` or your own Enron CSV export, requires Ollama running locally):

```bash
pip install -r requirements.txt
python main.py
```

Progress is resumable via `progress.json` (see [Core modules](#core-modules-ingestion-pipeline) below for pipeline details).

**B. Restore the included Neo4j dump** (`Resources/neo4j-2026-03-07T12-43-03.dump`) — a prior run's data, useful for demoing the UI immediately without running the LLM pipeline:

```bash
# with the neo4j container stopped
docker compose stop neo4j
docker run --rm -v email-intelligence_neo4j_data:/data -v "$(pwd)/Resources:/backups" \
  neo4j:5.24-community neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true
docker compose start neo4j
```

(Adjust the volume name if your Compose project directory name differs — check with `docker volume ls`.)

---

## Sample queries

Once data is loaded, try the API directly:

```bash
curl http://localhost:8000/stats

curl -X POST http://localhost:8000/qa \
  -H "Content-Type: application/json" \
  -d '{"question": "Who owns Project Atlas?"}'

curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Skilling"}'

curl "http://localhost:8000/entities?search=enron&type=Organization"
curl "http://localhost:8000/claims?type=Decision&min_confidence=0.7"
curl "http://localhost:8000/duplicates/entities"
```

...or just use the UI: **Retrieval / QA** (`/qa`) for grounded question answering, **⌘K / Ctrl+K** anywhere for global search, **Memory Graph** (`/graph`) to explore visually.

---

## Screenshots

Not included in this commit — the app wasn't run against a live Neo4j instance in this environment (Docker Desktop / a local Neo4j server wasn't available here to capture real screens). Once you've run `docker compose up` and loaded data, the natural shots for a demo video are: the Dashboard (`/`), the Memory Graph (`/graph`) with a node's detail panel open, a Claim detail page (`/claims/[id]`) showing its evidence and merge explanation, and the Retrieval/QA page (`/qa`) mid-answer with its evidence pack expanded.

---

## Project layout

```
backend/           FastAPI service layer (routers/ + services/, isolated Cypher per resource)
frontend/          Next.js 15 (App Router) + TypeScript + Tailwind + React Flow + TanStack Query
docker-compose.yml Neo4j + backend + frontend
Resources/          Prior submission artifacts, including a Neo4j dump for quick demo data
*.py (root)         Original ingestion pipeline — unchanged, still the source of truth for writes
```

### Backend (`backend/app/`)

| Path | Purpose |
| --- | --- |
| `services/*.py` | One service per resource (`EntityService`, `ClaimService`, `ArtifactService`, `GraphService`, `TimelineService`, `MergeService`, `RetrievalService`, `SearchService`, `StatsService`) — all Cypher lives here |
| `routers/*.py` | Thin FastAPI routers delegating to services |
| `main.py` | App wiring, CORS, Neo4j-unavailable → 503 handler |
| `db.py` | Lazy Neo4j driver singleton |

`GET /entities/{id}/relationships` and `GET /graph`'s entity↔entity edges are inferred at query time by matching a claim's free-text `object` field against other entity names — there's no explicit entity-entity edge in the schema, so this is a best-effort join, not a stored relationship.

`GET /duplicates/entities` and `/duplicates/claims` compute duplicate groups live via fuzzy string matching (`difflib`) over the current graph — there's no persisted merge-history log, so "why was this merged" reasoning is derived (similarity score + explanation string), not replayed from an audit trail.

### Frontend (`frontend/`)

Next.js App Router, one route per nav item (Dashboard, Memory Graph, Entities, Claims, Artifacts, Retrieval/QA, Duplicates, Timeline, Settings), a typed API client + TanStack Query hooks in `lib/`, and a shared dark design system in `components/ui/`. See `frontend/lib/types.ts` for the full API contract.

---

## Core modules (ingestion pipeline)

| File               | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `extraction.py`    | Load emails, clean body, call LLM and validate output   |
| `prompts.py`       | LLM prompt template enforcing strict extraction rules   |
| `normalizer.py`    | String normalization, deduplication, evidence fixing    |
| `models.py`        | Pydantic models for entities/claims/evidence            |
| `graph_builder.py` | Neo4j wrapper for inserting artifacts, entities, claims |
| `deduper.py`       | Utility to merge duplicate claims                       |
| `qa_pipeline.py`   | Keyword-based search & simple QA over the graph (CLI; the web app's `/qa` endpoint reimplements this logic self-contained in `backend/app/services/retrieval_service.py`) |
| `query.py`         | Example CLI usage of `MemoryQA` |
| `main.py`          | Resume-safe ingestion pipeline |

### Dataset

Designed for the [Enron Email Dataset](https://www.kaggle.com/datasets/wcukierski/enron-email-dataset) (~500K emails). Expects a CSV with a `message`/`content` column containing full RFC-822 raw email text; `extraction.py` parses subject/sender/timestamp/body from it.

### Notes & tips

* The extraction prompt is strict — adjust `prompts.py` for domain adaptation.
* Claims without valid evidence spans are discarded.
* `progress.json` ensures crash-safe, resumable ingestion.
* Claim identity is hash-based (`type|subject|object|valid_from`) to prevent duplication.
* You can extend the QA layer with embeddings for semantic search.

---
