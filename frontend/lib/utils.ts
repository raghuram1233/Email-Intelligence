import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { EntityType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const d = value.includes("T") || value.includes(" ") ? new Date(value) : parseISO(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

export function formatDate(value: string | null | undefined, fmt = "MMM d, yyyy"): string {
  const d = toDate(value);
  return d ? format(d, fmt) : "Unknown";
}

export function formatDateTime(value: string | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy 'at' h:mm a") : "Unknown";
}

export function formatRelativeTime(value: string | null | undefined): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "unknown time";
}

export function confidenceLabel(confidence: number | null | undefined): string {
  if (confidence == null) return "Unknown";
  if (confidence >= 0.9) return "Very high";
  if (confidence >= 0.7) return "High";
  if (confidence >= 0.5) return "Moderate";
  return "Low";
}

export function confidenceColor(confidence: number | null | undefined): string {
  if (confidence == null) return "var(--muted)";
  if (confidence >= 0.9) return "var(--success)";
  if (confidence >= 0.7) return "var(--accent)";
  if (confidence >= 0.5) return "var(--warning)";
  return "var(--danger)";
}

const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  Person: "#6366F1",
  Organization: "#06B6D4",
  Project: "#10B981",
  Topic: "#F59E0B",
  Location: "#EF4444",
};

export function entityTypeColor(type: string | undefined): string {
  return ENTITY_TYPE_COLORS[type as EntityType] ?? "#94a3b8";
}

const CLAIM_TYPE_LABELS: Record<string, string> = {
  RoleAssignment: "Role Assignment",
  Decision: "Decision",
  Intent: "Intent",
  Commitment: "Commitment",
  Ownership: "Ownership",
  FinancialStatement: "Financial Statement",
  MeetingPlan: "Meeting Plan",
  Misc: "Miscellaneous",
};

export function claimTypeLabel(type: string | undefined): string {
  if (!type) return "Unknown";
  return CLAIM_TYPE_LABELS[type] ?? type;
}

export function truncate(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
