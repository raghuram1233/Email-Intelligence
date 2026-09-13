# Shared Schema Contracts

`openapi.json` is the OpenAPI 3.1 specification exported from the FastAPI backend. It serves as the canonical contract defining schemas, route parameters, and response shapes for all API endpoints (`/entities`, `/claims`, `/artifacts`, `/graph`, `/timeline`, `/duplicates`, `/search`, `/qa`, `/stats`).

The TypeScript interfaces in `frontend/lib/types.ts` and client methods in `frontend/lib/api.ts` mirror these definitions.

## Live API Documentation

When the backend service is running, the interactive documentation and schema are served at:

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Raw OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## Regenerating the Specification

To update `shared/openapi.json` after making backend schema or router changes:

```bash
cd backend
python -c "import json; from app.main import app; json.dump(app.openapi(), open('../shared/openapi.json', 'w'), indent=2)"
```
