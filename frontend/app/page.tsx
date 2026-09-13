"use client";

import Link from "next/link";
import {
  Users,
  FileText,
  Mail,
  CheckCircle2,
  Copy,
  MessagesSquare,
  Network,
  Database,
  AlertTriangle,
} from "lucide-react";
import { useStats } from "@/lib/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { formatRelativeTime } from "@/lib/utils";

const BUCKET_COLOR: Record<string, string> = {
  "0.9-1.0": "#10B981",
  "0.7-0.9": "#06B6D4",
  "0.5-0.7": "#F59E0B",
  "0.0-0.5": "#EF4444",
};

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-72" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Can&apos;t reach the memory graph</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Connect Neo4j and start the Layer10 API to see live entities, claims, and evidence stats here.
          </p>
        </div>
      </div>
    );
  }

  const claimsOverTime = stats.charts.claims_over_time.map((d) => ({ x: d.day, y: d.count }));

  let running = 0;
  const entityGrowth = stats.charts.entity_growth.map((d) => {
    running += d.newEntities;
    return { x: d.day, y: running };
  });

  const confidenceBars = stats.charts.confidence_distribution.map((d) => ({
    label: d.bucket,
    value: d.count,
    color: BUCKET_COLOR[d.bucket] ?? "#6366F1",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Memory Graph Overview</h2>
        <p className="mt-1 text-sm text-muted">
          Grounded long-term organizational memory over the Enron email corpus, with evidence-backed claims.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Entities" value={stats.total_entities} accent="#6366F1" />
        <StatCard icon={FileText} label="Total Claims" value={stats.total_claims} accent="#06B6D4" />
        <StatCard icon={Mail} label="Total Artifacts" value={stats.total_artifacts} accent="#10B981" />
        <StatCard icon={Database} label="Total Evidence" value={stats.total_evidence} accent="#94a3b8" />
        <StatCard
          icon={CheckCircle2}
          label="Canonical Entities"
          value={stats.canonical_entities}
          accent="#6366F1"
        />
        <StatCard icon={Copy} label="Duplicate Merges" value={stats.duplicate_merges} accent="#F59E0B" />
        <StatCard
          icon={MessagesSquare}
          label="Questions Answered"
          value={stats.retrieval_questions_answered}
          accent="#06B6D4"
        />
        <StatCard
          icon={Network}
          label="Most Connected Entity"
          value={stats.most_connected_entity?.name ?? "—"}
          hint={stats.most_connected_entity ? `${stats.most_connected_entity.degree} claims` : undefined}
          href={
            stats.most_connected_entity
              ? `/entities/${encodeURIComponent(stats.most_connected_entity.id)}`
              : undefined
          }
          accent="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Claims Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLineChart data={claimsOverTime} color="#6366F1" gradientId="claims-over-time" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity Growth (cumulative)</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLineChart data={entityGrowth} color="#06B6D4" gradientId="entity-growth" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={confidenceBars} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently Ingested Artifacts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recent_artifacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No artifacts ingested yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Ingested</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_artifacts.map((a) => (
                    <TableRow key={a.id} data-clickable="true">
                      <TableCell className="max-w-[280px] truncate font-medium text-foreground">
                        <Link href={`/artifacts/${encodeURIComponent(a.id)}`} className="hover:underline">
                          {a.subject || "(no subject)"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted">{a.sender}</TableCell>
                      <TableCell className="text-muted">{formatRelativeTime(a.timestamp)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="muted">{a.claim_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {stats.recent_artifacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Nothing ingested yet.</p>
            ) : (
              stats.recent_artifacts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">
                      Artifact ingested — <span className="text-muted">{a.subject || "(no subject)"}</span>
                    </p>
                    <p className="text-[11px] text-muted">{formatRelativeTime(a.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
