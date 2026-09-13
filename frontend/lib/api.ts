import type {
  ArtifactDetail,
  ArtifactListParams,
  ArtifactSummary,
  ClaimDetail,
  ClaimListParams,
  ClaimSummary,
  DuplicateClaimsResponse,
  DuplicateEntitiesResponse,
  EntityDetail,
  EntityListParams,
  EntityRelationship,
  EntitySummary,
  EntityTimelineEntry,
  GraphParams,
  GraphResponse,
  Paginated,
  QaResponse,
  SearchResponse,
  StatsResponse,
  TimelineEvent,
  TimelineParams,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Could not reach the Layer10 API at ${API_URL}. Is the backend running?`);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(res.status, message || `Request to ${path} failed`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/stats");
}

export function listEntities(params?: EntityListParams): Promise<Paginated<EntitySummary>> {
  return apiFetch(`/entities${buildQuery(params as Record<string, unknown>)}`);
}

export function getEntity(id: string): Promise<EntityDetail> {
  return apiFetch(`/entities/${encodeURIComponent(id)}`);
}

export function getEntityClaims(
  id: string,
  params?: { skip?: number; limit?: number }
): Promise<ClaimSummary[]> {
  return apiFetch(`/entities/${encodeURIComponent(id)}/claims${buildQuery(params)}`);
}

export function getEntityRelationships(id: string): Promise<EntityRelationship[]> {
  return apiFetch(`/entities/${encodeURIComponent(id)}/relationships`);
}

export function getEntityTimeline(id: string): Promise<EntityTimelineEntry[]> {
  return apiFetch(`/entities/${encodeURIComponent(id)}/timeline`);
}

export function listClaims(params?: ClaimListParams): Promise<Paginated<ClaimSummary>> {
  return apiFetch(`/claims${buildQuery(params as Record<string, unknown>)}`);
}

export function getClaim(id: string): Promise<ClaimDetail> {
  return apiFetch(`/claims/${encodeURIComponent(id)}`);
}

export function listArtifacts(params?: ArtifactListParams): Promise<Paginated<ArtifactSummary>> {
  return apiFetch(`/artifacts${buildQuery(params as Record<string, unknown>)}`);
}

export function getArtifact(id: string): Promise<ArtifactDetail> {
  return apiFetch(`/artifacts/${encodeURIComponent(id)}`);
}

export function getGraph(params?: GraphParams): Promise<GraphResponse> {
  return apiFetch(`/graph${buildQuery(params as Record<string, unknown>)}`);
}

export function getTimeline(params?: TimelineParams): Promise<TimelineEvent[]> {
  return apiFetch(`/timeline${buildQuery(params as Record<string, unknown>)}`);
}

export function getDuplicateEntities(): Promise<DuplicateEntitiesResponse> {
  return apiFetch("/duplicates/entities");
}

export function getDuplicateClaims(): Promise<DuplicateClaimsResponse> {
  return apiFetch("/duplicates/claims");
}

export function search(query: string): Promise<SearchResponse> {
  return apiFetch("/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export function askQuestion(question: string): Promise<QaResponse> {
  return apiFetch("/qa", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
