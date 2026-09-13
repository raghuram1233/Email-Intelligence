"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityAvatar, EntityTypeIcon } from "@/components/entities/entity-avatar";
import { useEntities } from "@/lib/hooks";
import { entityTypeColor } from "@/lib/utils";
import type { EntityType } from "@/lib/types";

const TYPES: EntityType[] = ["Person", "Organization", "Project", "Topic", "Location"];
const LIMIT = 24;

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function EntitiesPage() {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<EntityType | undefined>(undefined);
  const [sort, setSort] = React.useState<"name" | "type">("name");
  const [skip, setSkip] = React.useState(0);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => setSkip(0), [debouncedSearch, type, sort]);

  const { data, isLoading, isFetching } = useEntities({
    search: debouncedSearch || undefined,
    type,
    sort,
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
        <h2 className="text-lg font-semibold text-foreground">Entities</h2>
        <p className="mt-1 text-sm text-muted">
          Canonical people, organizations, projects, topics, and locations discovered in the memory graph.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setType(undefined)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              type === undefined
                ? "border-primary/40 bg-primary/15 text-white"
                : "border-white/10 text-muted hover:text-foreground"
            }`}
          >
            All
          </button>
          {TYPES.map((t) => {
            const active = type === t;
            const color = entityTypeColor(t);
            return (
              <button
                key={t}
                onClick={() => setType(active ? undefined : t)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  borderColor: active ? `${color}80` : "rgba(255,255,255,0.1)",
                  backgroundColor: active ? `${color}22` : "transparent",
                  color: active ? color : "var(--muted)",
                }}
              >
                <EntityTypeIcon type={t} className="h-3 w-3" />
                {t}
              </button>
            );
          })}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "type")}
            className="rounded-xl border border-white/10 bg-elevated/60 px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="type">Sort: Type</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Users className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No entities match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
          {items.map((e) => (
            <Link key={e.id} href={`/entities/${encodeURIComponent(e.id)}`}>
              <Card className="group h-full transition-colors hover:border-white/20">
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={e.name} type={e.type} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground group-hover:text-white">
                          {e.name}
                        </div>
                        <div className="text-xs text-muted">{e.type}</div>
                      </div>
                    </div>
                    {e.claim_count !== undefined && (
                      <Badge variant="muted">{e.claim_count} claims</Badge>
                    )}
                  </div>
                  {e.email && <div className="truncate text-xs text-muted">{e.email}</div>}
                  {e.aliases && e.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.aliases.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted"
                        >
                          {a}
                        </span>
                      ))}
                      {e.aliases.length > 3 && (
                        <span className="text-[10px] text-muted">+{e.aliases.length - 3} more</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
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
