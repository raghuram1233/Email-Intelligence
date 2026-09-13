"use client";

import Link from "next/link";
import { FileText, History, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { claimTypeLabel, formatDate, truncate } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

const EVENT_META: Record<TimelineEvent["event_type"], { icon: typeof Mail; label: string; color: string }> = {
  artifact_ingested: { icon: Mail, label: "Artifact ingested", color: "#6366F1" },
  claim_observed: { icon: FileText, label: "Claim observed", color: "#06B6D4" },
  claim_superseded: { icon: History, label: "Claim superseded", color: "#F59E0B" },
};

function confidenceVariant(confidence: number | null | undefined) {
  if (confidence == null) return "muted" as const;
  if (confidence >= 0.9) return "success" as const;
  if (confidence >= 0.7) return "accent" as const;
  if (confidence >= 0.5) return "warning" as const;
  return "danger" as const;
}

export function eventDotColor(type: TimelineEvent["event_type"]) {
  return EVENT_META[type]?.color ?? "#94a3b8";
}

export function TimelineEventCard({ event, compact = false }: { event: TimelineEvent; compact?: boolean }) {
  const meta = EVENT_META[event.event_type] ?? EVENT_META.claim_observed;
  const Icon = meta.icon;

  return (
    <Card className={compact ? "" : "w-64 shrink-0"}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
            {meta.label}
          </span>
          <span className="text-[11px] text-muted">{formatDate(event.timestamp)}</span>
        </div>

        {event.claim_type && (
          <Badge variant="muted" className="text-[10px]">
            {claimTypeLabel(event.claim_type)}
          </Badge>
        )}

        {event.subject && (
          <p className="text-sm text-foreground">
            {truncate(event.subject, 60)}
            {event.object && <span className="text-muted"> → {truncate(event.object, 50)}</span>}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {event.entity_id && event.entity && (
            <Link
              href={`/entities/${encodeURIComponent(event.entity_id)}`}
              className="text-xs text-primary hover:underline"
            >
              {event.entity}
            </Link>
          )}
          {event.confidence != null && (
            <Badge variant={confidenceVariant(event.confidence)} className="text-[10px]">
              {Math.round(event.confidence * 100)}%
            </Badge>
          )}
          {event.artifact_id && (
            <Link
              href={`/artifacts/${encodeURIComponent(event.artifact_id)}`}
              className="text-xs text-muted hover:text-foreground hover:underline"
            >
              View source →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
