"use client";

import * as React from "react";
import { History, LayoutList, GitCommitHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimeline } from "@/lib/hooks";
import { TimelineEventCard, eventDotColor } from "@/components/timeline/timeline-event-card";

const CLAIM_TYPES = [
  "RoleAssignment",
  "Decision",
  "Intent",
  "Commitment",
  "Ownership",
  "FinancialStatement",
  "MeetingPlan",
  "Misc",
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function TimelinePage() {
  const [entity, setEntity] = React.useState("");
  const [claimType, setClaimType] = React.useState("");
  const [minConfidence, setMinConfidence] = React.useState(0);
  const [view, setView] = React.useState<"horizontal" | "list">("horizontal");

  const debouncedEntity = useDebounced(entity);

  const { data, isLoading } = useTimeline({
    entity: debouncedEntity || undefined,
    claim_type: claimType || undefined,
    min_confidence: minConfidence > 0 ? minConfidence : undefined,
  });

  const events = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
          <p className="mt-1 text-sm text-muted">
            Chronological memory: artifact ingestion, claim observations, and superseded facts.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-elevated/50 p-1">
          <Button
            size="sm"
            variant={view === "horizontal" ? "default" : "ghost"}
            onClick={() => setView("horizontal")}
          >
            <GitCommitHorizontal className="h-3.5 w-3.5" /> Horizontal
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
            <LayoutList className="h-3.5 w-3.5" /> List
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-surface/60 p-4">
        <Input
          placeholder="Filter by entity name..."
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="w-56"
        />
        <select
          value={claimType}
          onChange={(e) => setClaimType(e.target.value)}
          className="h-9 rounded-xl border border-white/10 bg-elevated/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <option value="">All claim types</option>
          {CLAIM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Min confidence</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="accent-primary"
          />
          <span className="w-9 tabular-nums text-foreground">{Math.round(minConfidence * 100)}%</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-64 shrink-0" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface/50 py-16 text-center">
          <History className="h-6 w-6 text-muted" />
          <p className="text-sm text-muted">No timeline events match these filters.</p>
        </div>
      ) : view === "horizontal" ? (
        <div className="overflow-x-auto pb-4">
          <div className="relative inline-flex min-w-full gap-6 px-2 pt-8">
            <div className="pointer-events-none absolute left-0 right-0 top-2 h-px bg-white/10" />
            {events.map((e, i) => (
              <div key={i} className="relative flex shrink-0 flex-col items-center">
                <span
                  className="absolute -top-6 h-3 w-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: eventDotColor(e.event_type) }}
                />
                <TimelineEventCard event={e} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => (
            <TimelineEventCard key={i} event={e} compact />
          ))}
        </div>
      )}
    </div>
  );
}
