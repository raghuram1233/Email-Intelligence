"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, FileQuestion, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityAvatar } from "@/components/entities/entity-avatar";
import { ConfidenceBadge, StatusBadge } from "@/components/entities/entity-badges";
import { useClaim } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { claimTypeLabel, formatDate, formatDateTime } from "@/lib/utils";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: claim, isLoading, error } = useClaim(id);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h2 className="text-lg font-semibold text-foreground">Claim not found</h2>
        <p className="max-w-md text-sm text-muted">
          This claim may have been merged into another canonical claim, or the id is invalid.
        </p>
        <Link href="/claims">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to claims
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !claim) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const merged = claim.evidence_count > 1;

  return (
    <div className="space-y-5">
      <Link href="/claims" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to claims
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{claimTypeLabel(claim.type)}</Badge>
            <StatusBadge isCurrent={claim.is_current} />
            <ConfidenceBadge confidence={claim.confidence} />
          </div>

          <h1 className="text-xl font-semibold leading-snug text-foreground">
            {claim.subject_entity ? (
              <Link href={`/entities/${encodeURIComponent(claim.subject_entity.id)}`} className="hover:text-white hover:underline">
                {claim.subject}
              </Link>
            ) : (
              claim.subject
            )}
            {claim.object && <span className="text-muted"> → {claim.object}</span>}
          </h1>

          <div className="flex flex-wrap gap-6 border-t border-white/10 pt-4 text-xs text-muted">
            {claim.subject_entity && (
              <div className="flex items-center gap-2">
                <EntityAvatar name={claim.subject_entity.name} type={claim.subject_entity.type} size="sm" />
                <Link href={`/entities/${encodeURIComponent(claim.subject_entity.id)}`} className="hover:text-foreground">
                  {claim.subject_entity.name}
                </Link>
              </div>
            )}
            <div>Event time: {formatDate(claim.event_time)}</div>
            <div>Valid from: {formatDate(claim.valid_from)}</div>
            <div>Valid to: {claim.valid_to ? formatDate(claim.valid_to) : "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/30 bg-accent/[0.06]">
        <CardContent className="flex gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Why was this merged?</h3>
              <Badge variant={merged ? "accent" : "muted"}>{merged ? "Merged" : "Single-source"}</Badge>
            </div>
            <p className="text-sm text-muted">{claim.merge_explanation}</p>
            <div className="flex gap-4 pt-1 text-xs text-muted">
              <span>
                <span className="font-medium text-foreground">{claim.evidence_count}</span> evidence excerpt(s)
              </span>
              <span>
                <span className="font-medium text-foreground">{claim.distinct_artifacts}</span> distinct artifact(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Supporting Evidence</h3>
        {claim.evidence.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <FileQuestion className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted">No supporting evidence recorded for this claim.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claim.evidence.map((ev) => (
              <Card key={ev.evidence_id}>
                <CardContent className="space-y-3 p-5">
                  <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-foreground/90">
                    &ldquo;{ev.quote}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <div className="flex items-center gap-3">
                      {ev.artifact_sender && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {ev.artifact_sender}
                        </span>
                      )}
                      <span>{formatDateTime(ev.artifact_timestamp)}</span>
                    </div>
                    {ev.artifact_id && (
                      <Link
                        href={`/artifacts/${encodeURIComponent(ev.artifact_id)}`}
                        className="font-medium text-accent hover:underline"
                      >
                        View in artifact →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
