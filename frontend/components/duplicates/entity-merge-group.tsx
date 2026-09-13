"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, entityTypeColor, initials } from "@/lib/utils";
import type { DuplicateEntityGroup, EntitySummary } from "@/lib/types";

function EntityChip({ entity, size = "sm" }: { entity: EntitySummary; size?: "sm" | "lg" }) {
  const color = entityTypeColor(entity.type);
  return (
    <Link
      href={`/entities/${encodeURIComponent(entity.id)}`}
      className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-elevated/50 px-3 py-2 transition-colors hover:border-white/20"
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
          size === "lg" ? "h-9 w-9 text-sm" : "h-7 w-7 text-[10px]"
        )}
        style={{ backgroundColor: color }}
      >
        {initials(entity.name)}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-medium text-foreground group-hover:text-white",
            size === "lg" ? "text-sm" : "text-xs"
          )}
        >
          {entity.name}
        </span>
        {entity.aliases?.length > 0 && (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {entity.aliases.slice(0, 3).map((a) => (
              <Badge key={a} variant="muted" className="px-1.5 py-0 text-[10px]">
                {a}
              </Badge>
            ))}
          </span>
        )}
      </span>
    </Link>
  );
}

export function EntityMergeGroup({ group }: { group: DuplicateEntityGroup }) {
  const pct = Math.round(group.similarity * 100);
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Merge candidate</span>
          <Badge variant={pct >= 90 ? "success" : pct >= 82 ? "accent" : "muted"}>{pct}% similar</Badge>
        </div>

        <div className="space-y-1.5">
          {group.variants.map((v) => (
            <EntityChip key={v.id} entity={v} />
          ))}
        </div>

        <div className="flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-muted" />
        </div>

        <div className="rounded-xl border border-success/30 bg-success/5 p-1">
          <div className="mb-1 px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-success">
            Canonical
          </div>
          <EntityChip entity={group.canonical} size="lg" />
        </div>

        <p className="border-t border-white/10 pt-3 text-xs text-muted">{group.reason}</p>
      </CardContent>
    </Card>
  );
}
