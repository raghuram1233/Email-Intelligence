"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Calendar, FileText, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EntityAvatar } from "@/components/entities/entity-avatar";
import { ConfidenceBadge, StatusBadge } from "@/components/entities/entity-badges";
import { useEntity, useEntityClaims, useEntityRelationships, useEntityTimeline } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { claimTypeLabel, formatDate, truncate } from "@/lib/utils";

export default function EntityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: entity, isLoading, error } = useEntity(id);
  const { data: claims, isLoading: claimsLoading } = useEntityClaims(id);
  const { data: relationships, isLoading: relLoading } = useEntityRelationships(id);
  const { data: timeline, isLoading: timelineLoading } = useEntityTimeline(id);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h2 className="text-lg font-semibold text-foreground">Entity not found</h2>
        <p className="max-w-md text-sm text-muted">
          This entity may have been merged into another canonical entity, or the id is invalid.
        </p>
        <Link href="/entities">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to entities
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !entity) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/entities" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to entities
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <EntityAvatar name={entity.name} type={entity.type} size="lg" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{entity.name}</h1>
                <Badge>{entity.type}</Badge>
              </div>
              {entity.email && (
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <Mail className="h-3.5 w-3.5" /> {entity.email}
                </div>
              )}
              {entity.aliases && entity.aliases.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entity.aliases.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted">
                <Calendar className="h-3 w-3" />
                First seen {formatDate(entity.first_seen)} · Last seen {formatDate(entity.last_seen)}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Stat label="Claims" value={entity.claim_count ?? 0} />
            <Stat label="Evidence" value={entity.evidence_count ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="claims">
        <TabsList>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          {claimsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !claims || claims.length === 0 ? (
            <EmptyState icon={FileText} text="No claims recorded for this entity yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((c) => (
                  <TableRow key={c.id} data-clickable="true">
                    <TableCell>
                      <Link href={`/claims/${encodeURIComponent(c.id)}`} className="hover:text-white">
                        {truncate(`${c.subject} → ${c.object ?? "—"}`, 80)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{claimTypeLabel(c.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <ConfidenceBadge confidence={c.confidence} />
                    </TableCell>
                    <TableCell className="text-muted">{c.evidence_count}</TableCell>
                    <TableCell>
                      <StatusBadge isCurrent={c.is_current} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="relationships">
          {relLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !relationships || relationships.length === 0 ? (
            <EmptyState icon={Share2} text="No connected entities inferred yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relationships.map((r, i) => (
                <Card key={`${r.entity.id}-${i}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <EntityAvatar name={r.entity.name} type={r.entity.type} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/entities/${encodeURIComponent(r.entity.id)}`}
                        className="truncate text-sm font-medium text-foreground hover:text-white"
                      >
                        {r.entity.name}
                      </Link>
                      <div className="text-xs text-muted">{r.entity.type}</div>
                    </div>
                    <Link href={`/claims/${encodeURIComponent(r.claim_id)}`}>
                      <Badge variant="accent">via {claimTypeLabel(r.via_claim_type)}</Badge>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {timelineLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !timeline || timeline.length === 0 ? (
            <EmptyState icon={Calendar} text="No timeline events recorded for this entity yet." />
          ) : (
            <div className="relative space-y-0 pl-5">
              <div className="absolute bottom-1 left-[3px] top-1 w-px bg-white/10" />
              {timeline.map((ev, i) => (
                <div key={i} className="relative pb-6">
                  <div className="absolute -left-5 top-1 h-2 w-2 rounded-full bg-primary shadow-glow" />
                  <div className="text-xs text-muted">{formatDate(ev.timestamp)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{claimTypeLabel(ev.claim_type)}</Badge>
                    <span className="text-sm text-foreground">
                      {truncate(`${ev.subject} → ${ev.object ?? "—"}`, 90)}
                    </span>
                    <ConfidenceBadge confidence={ev.confidence} />
                  </div>
                  {ev.artifact_id && (
                    <Link
                      href={`/artifacts/${encodeURIComponent(ev.artifact_id)}`}
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      View source artifact →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-elevated/50 px-4 py-2 text-center">
      <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
        <Icon className="h-8 w-8 text-muted" />
        <p className="text-sm text-muted">{text}</p>
      </CardContent>
    </Card>
  );
}
