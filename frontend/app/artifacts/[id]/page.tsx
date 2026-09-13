"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion, Hash, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useArtifact } from "@/lib/hooks";
import {
  claimTypeLabel,
  confidenceColor,
  confidenceLabel,
  entityTypeColor,
  formatDateTime,
  initials,
  truncate,
} from "@/lib/utils";
import { claimTypeColor } from "@/components/artifacts/claim-type-color";
import { ApiError } from "@/lib/api";

export default function ArtifactDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { data: artifact, isLoading, error } = useArtifact(id);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-elevated/60">
          <FileQuestion className="h-6 w-6 text-muted" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {notFound ? "Artifact not found" : "Couldn't load this artifact"}
        </h2>
        <Link href="/artifacts" className="text-sm text-primary hover:underline">
          Back to artifacts
        </Link>
      </div>
    );
  }

  const spans = [...artifact.evidence_spans].sort((a, b) => a.char_start - b.char_start);

  return (
    <div className="space-y-4">
      <Link
        href="/artifacts"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to artifacts
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-elevated/60">
                  <Mail className="h-4 w-4 text-muted" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold leading-snug text-foreground">
                    {artifact.subject || "(no subject)"}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    From <span className="text-foreground">{artifact.sender}</span> &middot;{" "}
                    {formatDateTime(artifact.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted">
                <Hash className="h-3 w-3" />
                <code className="truncate">{artifact.artifact_id}</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Excerpts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {spans.length === 0 && (
                <p className="text-sm text-muted">
                  No extracted evidence spans recorded for this artifact.
                </p>
              )}
              {spans.map((span, i) => (
                <blockquote
                  key={`${span.claim_id}-${span.char_start}-${i}`}
                  className="rounded-xl bg-elevated/40 px-4 py-3"
                >
                  <p className="text-sm italic leading-relaxed text-foreground">
                    &ldquo;{span.quote}&rdquo;
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="muted" className="gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: claimTypeColor(span.claim_type) }}
                      />
                      {claimTypeLabel(span.claim_type)}
                    </Badge>
                    <Link
                      href={`/claims/${encodeURIComponent(span.claim_id)}`}
                      className="text-[11px] text-muted hover:text-primary hover:underline"
                    >
                      View supported claim
                    </Link>
                  </div>
                </blockquote>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Entities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {artifact.entities.length === 0 && (
                <p className="text-sm text-muted">No entities extracted.</p>
              )}
              {artifact.entities.map((e) => (
                <Link
                  key={e.id}
                  href={`/entities/${encodeURIComponent(e.id)}`}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: entityTypeColor(e.type) }}
                  >
                    {initials(e.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{e.name}</span>
                    <span className="block text-[11px] text-muted">{e.type}</span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extracted Claims</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {artifact.claims.length === 0 && (
                <p className="text-sm text-muted">No claims extracted.</p>
              )}
              {artifact.claims.map((c) => (
                <Link
                  key={c.id}
                  href={`/claims/${encodeURIComponent(c.id)}`}
                  className="block rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <p className="truncate text-sm text-foreground">
                    {truncate(`${c.subject} → ${c.object ?? "—"}`, 60)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="muted">{claimTypeLabel(c.type)}</Badge>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: confidenceColor(c.confidence) }}
                    >
                      {confidenceLabel(c.confidence)}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extraction Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Artifact ID</span>
                <code className="max-w-[60%] truncate text-foreground">{artifact.artifact_id}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Claims</span>
                <span className="text-foreground">{artifact.claims.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Evidence spans</span>
                <span className="text-foreground">{spans.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
