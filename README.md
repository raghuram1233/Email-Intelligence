# Layer10 — Grounded Memory Graph for Email Intelligence

An end-to-end intelligence system that transforms unstructured email corpora into an evidence-grounded knowledge graph in Neo4j, paired with a high-performance FastAPI service layer and an interactive Next.js web application for exploration, analysis, and retrieval.

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│ Raw Email Data  │ ───►  │  LLM Extraction &    │ ───►  │ Neo4j Property Graph   │
│ (RFC-822 / CSV) │       │  Normalizer / Dedup  │       │ (Entities, Claims, Ev) │
└─────────────────┘       └──────────────────────┘       └───────────┬────────────┘
                                                                     │
                                                                     ▼
┌─────────────────────────┐       HTTP / JSON            ┌────────────────────────┐
│ Next.js 15 Frontend     │ ◄──────────────────────────► │ FastAPI Backend        │
│ (Graph, QA, Timeline)   │                              │ (Cypher Service Layer) │
└─────────────────────────┘                              └────────────────────────┘
```

---

## Overview

The system processes unstructured email communications (such as the Enron dataset), extracts structured entities and categorical claims with character-exact evidence spans, resolves duplicates, and persists the network into Neo4j. The data can then be queried through a REST API or navigated visually through an analytical web interface.

### Key Capabilities

- **Strict Evidence Grounding**: Every extracted claim links directly to a verbatim substring quote with character offsets (`char_start`, `char_end`) within the source email artifact.
- **Interactive Graph Exploration**: Force-directed React Flow graph mapping entities, claims, and relationships with neighborhood expansion, depth controls, and type filtering.
- **Evidence-Backed Retrieval QA**: Natural-language question answering backed by graph traversal, returning answers with cited quotes and references to original emails.
- **Entity & Claim Drilldown**: Deep inspection of extracted entities (People, Organizations, Projects, Topics, Locations) and claims (Decisions, Role Assignments, Commitments, Financial Statements) with temporal validity and confidence scores.
- **Duplicate Detection & Audit**: Heuristic and fuzzy duplicate clustering for entities and claims with resolution explanations.
- **Temporal Timeline**: Chronological tracking of dated events, decisions, and communications across the organization.
- **Artifact Inspector**: Full inspection of source email headers, timestamps, and message bodies alongside associated claims and evidence.

---

## Quick Start (Docker)

The fastest way to spin up the complete stack (Neo4j, FastAPI backend, and Next.js frontend):

```bash
docker compose up --build
```

### Service Access Points

| Service | URL | Notes |
| --- | --- | --- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Main user interface |
| **Backend API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI |
| **OpenAPI Specification** | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) | Raw API contract |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474) | Database visual console |

> **Note**: A new Neo4j container initializes with an empty database. Follow [Loading Data](#loading-data) below to populate it.

---

## Loading Data

Choose one of two methods to populate the Neo4j database:

### Option A: Restore the Pre-built Database Dump (Fastest)

A pre-extracted database dump is provided in `Resources/neo4j-2026-03-07T12-43-03.dump`. Because `./Resources` is mounted to `/backups` in `docker-compose.yml`, you can restore it directly:

```bash
# 1. Stop the running neo4j container
docker compose stop neo4j

# 2. Load the database dump into the neo4j data volume
docker compose run --rm neo4j neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true

# 3. Restart the neo4j service
docker compose start neo4j
```

Once restarted, visit [http://localhost:3000](http://localhost:3000) to begin exploring the graph.

### Option B: Run the Ingestion Pipeline

To process raw emails from scratch (e.g. `sample_5.csv` or an Enron CSV export) using a local LLM via Ollama:

1. Ensure [Ollama](https://ollama.com/) is installed and running:
   ```bash
   ollama pull mistral
   ```

2. Install pipeline dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Execute the ingestion pipeline:
   ```bash
   python main.py
   ```

The pipeline parses email records, runs structured LLM extraction, validates evidence spans, normalizes names, deduplicates claims, and inserts nodes and relationships into Neo4j. Ingestion state is tracked in `progress.json` for crash-safe, resumable execution.

---

## Local Development (Without Docker)

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Running Neo4j 5.x instance (local installation, AuraDB, or Docker)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend loads Neo4j configuration from the root `.env` file. If Neo4j is temporarily unreachable during startup, the API returns a structured `503 Service Unavailable` response rather than terminating.

Interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Environment Configuration

### Root `.env`

Used by the ingestion pipeline, `docker-compose.yml`, and local backend runs:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEO4J_URI` | `neo4j://127.0.0.1:7687` | Neo4j Bolt connection URI (`neo4j://neo4j:7687` in Docker) |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | — | Neo4j password |
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | Local Ollama API endpoint |
| `MODEL_NAME` | `mistral:latest` | Target LLM for structured extraction |
| `CSV_PATH` | `sample_5.csv` | Input email dataset CSV |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins for the FastAPI backend |

### Frontend `.env.local`

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Target FastAPI backend URL |

---

## Graph Data Model & Schema

The graph schema enforces strict evidence provenance. Every entity and claim is grounded in source artifacts through verifiable quotes:

```
(:Entity) ──[:MADE_CLAIM]──► (:Claim) ──[:SUPPORTED_BY]──► (:Evidence) ──[:FROM_ARTIFACT]──► (:Artifact)
```

![Graph Schema Example](Resources/Partial.png)

### Node Definitions

- **`Entity`**: Real-world actors or subjects.
  - Properties: `normalized_name`, `name`, `type` (`Person`, `Organization`, `Project`, `Topic`, `Location`), `email`, `aliases`
- **`Claim`**: Assertions, commitments, or events extracted from text.
  - Properties: `claim_id`, `type` (`RoleAssignment`, `Decision`, `Intent`, `Commitment`, `Ownership`, `FinancialStatement`, `MeetingPlan`, `Misc`), `subject`, `object`, `valid_from`, `valid_to`, `event_time`, `confidence`
- **`Evidence`**: Exact character slice from the source text validating the claim.
  - Properties: `evidence_id`, `quote`, `char_start`, `char_end`, `message_id`
- **`Artifact`**: The original email document.
  - Properties: `artifact_id`, `subject`, `sender`, `timestamp`

### Relationships

- `(Entity)-[:MADE_CLAIM]->(Claim)`: Associates the actor with an asserted claim.
- `(Claim)-[:SUPPORTED_BY]->(Evidence)`: Grounds the assertion in one or more verbatim quotes.
- `(Evidence)-[:FROM_ARTIFACT]->(Artifact)`: Traces evidence to the specific source email.

---

## API Reference

The FastAPI service exposes modular endpoints for programmatic graph querying:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/stats` | Graph summary metrics (counts of entities, claims, evidence, artifacts) |
| `GET` | `/entities` | Paginated entity list with search and type filters |
| `GET` | `/entities/{id}` | Detailed entity view with aliases and degree centrality |
| `GET` | `/entities/{id}/relationships` | Inferred entity-to-entity relationship network |
| `GET` | `/entities/{id}/timeline` | Chronological feed of claims involving an entity |
| `GET` | `/claims` | Claims list filterable by type, confidence threshold, and subject |
| `GET` | `/claims/{id}` | Claim detail with supporting evidence quotes and source artifacts |
| `GET` | `/artifacts` | Paginated email artifacts with metadata |
| `GET` | `/artifacts/{id}` | Raw email content, headers, and linked evidence items |
| `GET` | `/graph` | Subgraph export (nodes and edges) formatted for graph visualizations |
| `GET` | `/timeline` | Global chronological feed of dated claims across the corpus |
| `GET` | `/duplicates/entities` | Clustered potential duplicate entities with similarity scores |
| `GET` | `/duplicates/claims` | Clustered duplicate claims with canonicalization explanations |
| `POST` | `/search` | Full-text keyword search across entities and claims |
| `POST` | `/qa` | Grounded question answering with evidence pack retrieval |

Full OpenAPI specifications and type schemas are stored in [shared/README.md](shared/README.md) and viewable live at `/docs`.

---

## Web Application Features

The Next.js frontend provides dedicated analytical interfaces for each layer of the knowledge graph:

1. **Overview Dashboard (`/`)**: System-wide statistics, entity type distributions, confidence histograms, and quick links.
2. **Interactive Memory Graph (`/graph`)**: Interactive canvas rendering entity and claim subgraphs with node selection, drag-and-drop layout, and side-panel details.
3. **Evidence-Grounded QA (`/qa`)**: Ask natural-language questions; the system retrieves relevant claims, compiles an evidence package, and generates answers with verifiable citations.
4. **Entity Explorer (`/entities`)**: Filter and search people, organizations, and projects; view aliases, communication frequency, and related entities.
5. **Claims Explorer (`/claims`)**: Browse structured claims by type, confidence score, and validity dates.
6. **Temporal Timeline (`/timeline`)**: Track decisions, plans, and commitments in chronological order.
7. **Duplicate & Merge Inspector (`/duplicates`)**: Review entity resolution clusters and claim deduplication metrics.
8. **Artifact Browser (`/artifacts`)**: Inspect original RFC-822 email headers and full message text alongside parsed evidence.
9. **Command Palette (`⌘K` / `Ctrl+K`)**: Global search shortcut accessible across all views.

---

## Project Structure

```
.
├── backend/                  # FastAPI REST API service
│   ├── app/
│   │   ├── routers/          # API route definitions
│   │   ├── services/         # Cypher query services per domain
│   │   ├── config.py         # Backend configuration and environment loading
│   │   ├── db.py             # Neo4j driver lifecycle management
│   │   └── main.py           # Application entrypoint and middleware
│   ├── Dockerfile            # Backend container specification
│   └── requirements.txt      # Backend Python dependencies
├── frontend/                 # Next.js 15 App Router web application
│   ├── app/                  # Application routes and pages
│   ├── components/           # UI components, layout, and graph visualizer
│   ├── lib/                  # Typed API client, query hooks, and schemas
│   ├── Dockerfile            # Frontend container specification
│   └── package.json          # Frontend dependencies
├── shared/                   # Shared API contracts
│   ├── openapi.json          # Exported OpenAPI 3.1 specification
│   └── README.md             # Schema regeneration instructions
├── Resources/                # Sample datasets, database dumps, and assets
│   ├── neo4j-*.dump          # Pre-built Neo4j database backup
│   └── *.png                 # Visual schema assets
├── config.py                 # Ingestion pipeline configuration
├── extraction.py             # Email cleaning and structured LLM extraction
├── prompts.py                # LLM extraction prompts and schema rules
├── normalizer.py             # Name normalization and evidence validation
├── models.py                 # Pydantic domain models
├── graph_builder.py          # Neo4j ingestion and Cypher write queries
├── deduper.py                # Claim deduplication logic
├── qa_pipeline.py            # CLI-based question answering and retrieval
├── main.py                   # Main pipeline execution script
├── docker-compose.yml        # Multi-container orchestration (Neo4j, API, Web)
└── requirements.txt          # Root Python dependencies for ingestion
```

---

## Ingestion Pipeline Details

The root Python modules handle raw data ingestion:

| Module | Purpose |
| --- | --- |
| `main.py` | Pipeline driver with resumable progress tracking via `progress.json` |
| `extraction.py` | Parses RFC-822 email text, extracts headers, calls LLM, and validates responses |
| `prompts.py` | Strict prompt templates enforcing JSON schema and character offset requirements |
| `normalizer.py` | Canonicalizes names, cleans whitespace, and verifies evidence substrings |
| `models.py` | Pydantic definitions for entities, claims, and evidence units |
| `graph_builder.py` | Batched Cypher queries creating nodes, constraints, and relationships in Neo4j |
| `deduper.py` | Hash-based identification and merging of duplicate claims |
| `qa_pipeline.py` | Command-line keyword retrieval and QA pipeline |

### Ingestion Safeguards

- **Strict Evidence Validation**: An extracted claim is rejected if its evidence quote cannot be matched verbatim to the source email text within the specified character offsets.
- **Resumability**: Processed email IDs are recorded in `progress.json`, allowing long-running ingestion runs to resume seamlessly after interruptions.
- **Deterministic Identity**: Claim uniqueness is calculated from a normalized hash of `type|subject|object|valid_from` to prevent duplicate writes.
