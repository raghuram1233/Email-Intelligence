"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "./api";
import type {
  ArtifactListParams,
  ClaimListParams,
  EntityListParams,
  GraphParams,
  TimelineParams,
} from "./types";

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: api.getStats });
}

export function useEntities(params: EntityListParams = {}) {
  return useQuery({
    queryKey: ["entities", params],
    queryFn: () => api.listEntities(params),
  });
}

export function useEntity(id: string | undefined) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => api.getEntity(id as string),
    enabled: !!id,
  });
}

export function useEntityClaims(id: string | undefined, params: { skip?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["entity-claims", id, params],
    queryFn: () => api.getEntityClaims(id as string, params),
    enabled: !!id,
  });
}

export function useEntityRelationships(id: string | undefined) {
  return useQuery({
    queryKey: ["entity-relationships", id],
    queryFn: () => api.getEntityRelationships(id as string),
    enabled: !!id,
  });
}

export function useEntityTimeline(id: string | undefined) {
  return useQuery({
    queryKey: ["entity-timeline", id],
    queryFn: () => api.getEntityTimeline(id as string),
    enabled: !!id,
  });
}

export function useClaims(params: ClaimListParams = {}) {
  return useQuery({
    queryKey: ["claims", params],
    queryFn: () => api.listClaims(params),
  });
}

export function useClaim(id: string | undefined) {
  return useQuery({
    queryKey: ["claim", id],
    queryFn: () => api.getClaim(id as string),
    enabled: !!id,
  });
}

export function useArtifacts(params: ArtifactListParams = {}) {
  return useQuery({
    queryKey: ["artifacts", params],
    queryFn: () => api.listArtifacts(params),
  });
}

export function useArtifact(id: string | undefined) {
  return useQuery({
    queryKey: ["artifact", id],
    queryFn: () => api.getArtifact(id as string),
    enabled: !!id,
  });
}

export function useGraph(params: GraphParams = {}) {
  return useQuery({
    queryKey: ["graph", params],
    queryFn: () => api.getGraph(params),
  });
}

export function useTimeline(params: TimelineParams = {}) {
  return useQuery({
    queryKey: ["timeline", params],
    queryFn: () => api.getTimeline(params),
  });
}

export function useDuplicateEntities() {
  return useQuery({
    queryKey: ["duplicate-entities"],
    queryFn: api.getDuplicateEntities,
  });
}

export function useDuplicateClaims() {
  return useQuery({
    queryKey: ["duplicate-claims"],
    queryFn: api.getDuplicateClaims,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
  });
}

export function useAskQuestion() {
  return useMutation({
    mutationFn: (question: string) => api.askQuestion(question),
  });
}
