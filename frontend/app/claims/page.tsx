"use client";

import * as React from "react";
import Link from "next/link";
import { Search, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfidenceBadge, StatusBadge } from "@/components/entities/entity-badges";
import { useClaims } from "@/lib/hooks";
import { claimTypeLabel, truncate } from "@/lib/utils";
import type { ClaimType } from "@/lib/types";

const CLAIM_TYPES: ClaimType[] = [
  "RoleAssignment",
  "Decision",
  "Intent",
  "Commitment",
  "Ownership",
  "FinancialStatement",
  "MeetingPlan",
  "Misc",
];
const LIMIT = 25;

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ClaimsPage() {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<ClaimType | undefined>(undefined);
  const [current, setCurrent] = React.useState<"all" | "current" | "historical">("all");
  const [minConfidence, setMinConfidence] = React.useState(0);
  const [skip, setSkip] = React.useState(0);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => setSkip(0), [debouncedSearch, type, current, minConfidence]);

  const { data, isLoading, isFetching } = useClaims({
    search: debouncedSearch || undefined,
    type,
    current: current === "all" ? undefined : current === "current",
    min_confidence: minConfidence > 0 ? minConfidence : undefined,
    skip,
    limit: LIMIT,
  });

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + LIMIT, total);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Claims</h2>
        <p className="mt-1 text-sm text-muted">
          Canonical statements extracted and deduplicated from the memory graph.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject or object..."
              className="pl-9"
            />
          </div>
          <select
            value={type ?? ""}
            onChange={(e) => setType((e.target.value || undefined) as ClaimType | undefined)}
            className="rounded-xl border border-white/10 bg-elevated/60 px-3 py-1.5 text-sm text-foreground focus:outline-none"
          >
            <option value="">All types</option>
            {CLAIM_TYPES.map((t) => (
              <option key={t} value={t}>
                {claimTypeLabel(t)}
              </option>
            ))}
          </select>
          <select
            value={current}
            onChange={(e) => setCurrent(e.target.value as typeof current)}
            className="rounded-xl border border-white/10 bg-elevated/60 px-3 py-1.5 text-sm text-foreground focus:outline-none"
          >
            <option value="all">Current & historical</option>
            <option value="current">Current only</option>
            <option value="historical">Historical only</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted">Min confidence: {minConfidence.toFixed(2)}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="h-1.5 w-40 accent-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <FileText className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No claims match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={isFetching ? "opacity-60" : ""}>
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
              {items.map((c) => (
                <TableRow key={c.id} data-clickable="true">
                  <TableCell>
                    <Link href={`/claims/${encodeURIComponent(c.id)}`} className="hover:text-white">
                      {truncate(`${c.subject} → ${c.object ?? "—"}`, 90)}
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
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-muted">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - LIMIT))}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={skip + LIMIT >= total}
              onClick={() => setSkip(skip + LIMIT)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
