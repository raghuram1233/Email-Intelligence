# shared/

`openapi.json` is the FastAPI backend's OpenAPI 3.1 schema — the canonical, machine-readable
contract for every `/entities`, `/claims`, `/artifacts`, `/graph`, `/timeline`, `/duplicates`,
`/search`, `/qa`, and `/stats` endpoint (paths, params, response shapes).

`frontend/lib/types.ts` and `frontend/lib/api.ts` are hand-written TypeScript against this same
contract (Python and TypeScript can't share source directly, so there's no build-time link between
them — keep them in sync manually, or regenerate frontend types from this file with a tool like
`openapi-typescript` if the API grows).

The live, always-up-to-date version is also served directly by the running backend:

- Interactive docs: `http://localhost:8000/docs`
- Raw schema: `http://localhost:8000/openapi.json`

To regenerate this snapshot after changing the backend:

```bash
cd backend
python -c "import json; from app.main import app; json.dump(app.openapi(), open('../shared/openapi.json', 'w'), indent=2)"
```
