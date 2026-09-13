"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/artifacts/pagination-bar";
import { useArtifacts } from "@/lib/hooks";
import { formatRelativeTime, truncate } from "@/lib/utils";

const LIMIT = 20;

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ArtifactsPage() {
  const [search, setSearch] = React.useState("");
  const [skip, setSkip] = React.useState(0);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => {
    setSkip(0);
  }, [debouncedSearch]);

  const { data, isLoading, isError } = useArtifacts({
    search: debouncedSearch || undefined,
    skip,
    limit: LIMIT,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Artifacts</h2>
        <p className="mt-1 text-sm text-muted">
          Source emails ingested into the memory graph, with extracted claims and evidence.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject or sender..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="px-4 py-10 text-center text-sm text-muted">
            Couldn&apos;t load artifacts. Check that the backend is running.
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted">
            No artifacts match your search.
          </div>
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="divide-y divide-white/5">
            {data.items.map((a) => (
              <Link
                key={a.id}
                href={`/artifacts/${encodeURIComponent(a.id)}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-elevated/60">
                  <Mail className="h-3.5 w-3.5 text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {truncate(a.subject || "(no subject)", 90)}
                  </div>
                  <div className="truncate text-xs text-muted">{a.sender}</div>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatRelativeTime(a.timestamp)}
                </span>
                <Badge variant="muted" className="shrink-0">
                  {a.claim_count} claim{a.claim_count === 1 ? "" : "s"}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {data && (
          <PaginationBar
            skip={skip}
            limit={LIMIT}
            total={data.total}
            onPrev={() => setSkip((s) => Math.max(0, s - LIMIT))}
            onNext={() => setSkip((s) => s + LIMIT)}
          />
        )}
      </Card>
    </div>
  );
}
