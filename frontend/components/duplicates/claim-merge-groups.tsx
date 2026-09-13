"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { claimTypeLabel, formatDate, truncate } from "@/lib/utils";
import type { ClaimSummary, MergedClaimGroup, NearDuplicateClaimGroup } from "@/lib/types";

function confidenceVariant(confidence: number | null | undefined) {
  if (confidence == null) return "muted" as const;
  if (confidence >= 0.9) return "success" as const;
  if (confidence >= 0.7) return "accent" as const;
  if (confidence >= 0.5) return "warning" as const;
  return "danger" as const;
}

export function MergedClaimCard({ group }: { group: MergedClaimGroup }) {
  const c = group.claim;
  return (
    <Link href={`/claims/${encodeURIComponent(c.id)}`}>
      <Card className="transition-colors hover:border-white/20">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="muted" className="mb-1.5">
                {claimTypeLabel(c.type)}
              </Badge>
              <p className="truncate text-sm font-medium text-foreground">
                {c.subject} {c.object && <span className="text-muted">→ {truncate(c.object, 60)}</span>}
              </p>
            </div>
            <Badge variant={confidenceVariant(c.confidence)}>{Math.round(c.confidence * 100)}%</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span>{group.evidence_count} evidence excerpt(s)</span>
            <span>{group.distinct_artifacts} distinct artifact(s)</span>
          </div>
          <p className="border-t border-white/10 pt-3 text-xs text-muted">{group.reason}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ClaimMiniRow({ c }: { c: ClaimSummary }) {
  return (
    <Link
      href={`/claims/${encodeURIComponent(c.id)}`}
      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"
    >
      <span className="min-w-0 truncate text-foreground">
        {c.subject} {c.object && <span className="text-muted">→ {truncate(c.object, 40)}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-muted">
        {formatDate(c.event_time ?? c.valid_from)}
        <Badge variant={confidenceVariant(c.confidence)} className="px-1.5 py-0">
          {Math.round(c.confidence * 100)}%
        </Badge>
      </span>
    </Link>
  );
}

export function NearDuplicateClaimCard({ group }: { group: NearDuplicateClaimGroup }) {
  const pct = Math.round(group.similarity * 100);
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Badge variant="warning">{pct}% text similarity</Badge>
          <span className="text-xs text-muted">{group.claims.length} claims in cluster</span>
        </div>
        <div className="divide-y divide-white/5 rounded-xl border border-white/10">
          {group.claims.map((c) => (
            <ClaimMiniRow key={c.id} c={c} />
          ))}
        </div>
        <p className="border-t border-white/10 pt-3 text-xs text-muted">{group.reason}</p>
      </CardContent>
    </Card>
  );
}
