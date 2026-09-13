export type EntityType = "Person" | "Organization" | "Project" | "Topic" | "Location";

export type ClaimType =
  | "RoleAssignment"
  | "Decision"
  | "Intent"
  | "Commitment"
  | "Ownership"
  | "FinancialStatement"
  | "MeetingPlan"
  | "Misc";

export interface EntitySummary {
  id: string;
  normalized_name: string;
  name: string;
  title?: string;
  type: EntityType;
  email: string | null;
  aliases: string[];
  claim_count?: number;
  degree?: number;
}

export interface EntityDetail extends EntitySummary {
  evidence_count: number;
  first_seen: string | null;
  last_seen: string | null;
}

export interface EntityRelationship {
  entity: EntitySummary;
  via_claim_type: string;
  claim_id: string;
}

export interface EntityTimelineEntry {
  type: string;
  timestamp: string | null;
  claim_type: ClaimType | string;
  claim_id: string;
  subject: string;
  object: string | null;
  confidence: number;
  artifact_id: string | null;
  artifact_subject: string | null;
}

export interface ClaimSummary {
  id: string;
  claim_id: string;
  type: ClaimType;
  subject: string;
  object: string | null;
  valid_from: string | null;
  event_time: string | null;
  confidence: number;
  valid_to: string | null;
  is_current: boolean;
  evidence_count: number;
}

export interface EvidenceItem {
  evidence_id: string;
  quote: string;
  char_start: number;
  char_end: number;
  message_id: string | null;
  extracted_at: string | null;
  artifact_id: string | null;
  artifact_subject: string | null;
  artifact_sender: string | null;
  artifact_timestamp: string | null;
}

export interface ClaimDetail extends ClaimSummary {
  subject_entity: EntitySummary | null;
  evidence: EvidenceItem[];
  distinct_artifacts: number;
  merge_explanation: string;
}

export interface ArtifactSummary {
  id: string;
  artifact_id: string;
  title?: string;
  subject: string;
  sender: string;
  timestamp: string;
  claim_count: number;
}

export interface EvidenceSpanRef {
  claim_id: string;
  claim_type: ClaimType | string;
  quote: string;
  char_start: number;
  char_end: number;
}

export interface ArtifactDetail extends ArtifactSummary {
  claims: ClaimSummary[];
  evidence_spans: EvidenceSpanRef[];
  entities: EntitySummary[];
}

export interface GraphNode {
  id: string;
  type: "entity" | "claim";
  entity_type?: EntityType;
  claim_type?: ClaimType;
  label: string;
  color: string;
  confidence?: number;
  raw_id: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineEvent {
  event_type: "artifact_ingested" | "claim_observed" | "claim_superseded";
  timestamp: string | null;
  entity: string | null;
  entity_id: string | null;
  claim_id: string | null;
  claim_type: ClaimType | string | null;
  subject: string | null;
  object: string | null;
  confidence: number | null;
  artifact_id: string | null;
}

export interface StatsResponse {
  total_entities: number;
  total_claims: number;
  total_artifacts: number;
  total_evidence: number;
  canonical_entities: number;
  duplicate_merges: number;
  retrieval_questions_answered: number;
  most_connected_entity: { name: string; id: string; degree: number } | null;
  recent_artifacts: ArtifactSummary[];
  charts: {
    confidence_distribution: { bucket: string; count: number }[];
    claims_over_time: { day: string; count: number }[];
    entity_growth: { day: string; newEntities: number }[];
  };
}

export interface DuplicateEntityGroup {
  canonical: EntitySummary;
  variants: EntitySummary[];
  similarity: number;
  reason: string;
}

export interface DuplicateEntitiesResponse {
  groups: DuplicateEntityGroup[];
}

export interface MergedClaimGroup {
  claim: ClaimSummary;
  evidence_count: number;
  distinct_artifacts: number;
  reason: string;
}

export interface NearDuplicateClaimGroup {
  claims: ClaimSummary[];
  similarity: number;
  reason: string;
}

export interface DuplicateClaimsResponse {
  merged_groups: MergedClaimGroup[];
  near_duplicate_groups: NearDuplicateClaimGroup[];
}

export interface SearchResponse {
  entities: EntitySummary[];
  claims: ClaimSummary[];
  artifacts: ArtifactSummary[];
}

export interface QaEvidenceCard {
  quote: string;
  artifact_id: string | null;
  artifact_subject: string | null;
  artifact_sender: string | null;
  artifact_timestamp: string | null;
  relevance_score: number;
  claim_id: string | null;
}

export interface QaResponse {
  question: string;
  keywords: string[];
  answer: string;
  confidence: number;
  linked_entities: EntitySummary[];
  linked_claims: ClaimSummary[];
  evidence: QaEvidenceCard[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface EntityListParams {
  search?: string;
  type?: EntityType | string;
  skip?: number;
  limit?: number;
  sort?: string;
}

export interface ClaimListParams {
  search?: string;
  type?: ClaimType | string;
  current?: boolean;
  min_confidence?: number;
  skip?: number;
  limit?: number;
}

export interface ArtifactListParams {
  search?: string;
  skip?: number;
  limit?: number;
}

export interface GraphParams {
  entity_type?: EntityType | string;
  min_confidence?: number;
  limit?: number;
}

export interface TimelineParams {
  entity?: string;
  claim_type?: ClaimType | string;
  min_confidence?: number;
  limit?: number;
}
