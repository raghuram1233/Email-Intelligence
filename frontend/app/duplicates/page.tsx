"use client";

import { Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDuplicateClaims, useDuplicateEntities } from "@/lib/hooks";
import { EntityMergeGroup } from "@/components/duplicates/entity-merge-group";
import { MergedClaimCard, NearDuplicateClaimCard } from "@/components/duplicates/claim-merge-groups";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface/50 py-16 text-center">
      <Copy className="h-6 w-6 text-muted" />
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}

function CardSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full" />
      ))}
    </div>
  );
}

function EntityMergesPanel() {
  const { data, isLoading } = useDuplicateEntities();

  if (isLoading) return <CardSkeletons />;
  if (!data || data.groups.length === 0) {
    return (
      <EmptyState message="No likely entity duplicates detected — the corpus is already well-deduplicated by name/email matching at ingestion." />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.groups.map((g) => (
        <EntityMergeGroup key={g.canonical.id} group={g} />
      ))}
    </div>
  );
}

function ClaimMergesPanel() {
  const { data, isLoading } = useDuplicateClaims();

  if (isLoading) return <CardSkeletons />;

  const merged = data?.merged_groups ?? [];
  const near = data?.near_duplicate_groups ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Merged at Ingestion</h3>
          <p className="text-xs text-muted">
            Claims that independently absorbed evidence from multiple artifacts because they share an
            identical (type, subject, object, event_time) key.
          </p>
        </div>
        {merged.length === 0 ? (
          <EmptyState message="No claims currently have supporting evidence from more than one artifact." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {merged.map((g) => (
              <MergedClaimCard key={g.claim.id} group={g} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Near-Duplicates Not Auto-Merged</h3>
          <p className="text-xs text-muted">
            Claims that describe near-identical statements but weren&apos;t merged because their exact
            keys differ — surfaced here for transparency rather than silently guessed at.
          </p>
        </div>
        {near.length === 0 ? (
          <EmptyState message="No ambiguous near-duplicate claims found." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {near.map((g, i) => (
              <NearDuplicateClaimCard key={i} group={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DuplicatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Duplicate Explorer</h2>
        <p className="mt-1 text-sm text-muted">
          Live-computed merge candidates and canonicalization decisions across the memory graph.
        </p>
      </div>

      <Tabs defaultValue="entities">
        <TabsList>
          <TabsTrigger value="entities">Entity Merges</TabsTrigger>
          <TabsTrigger value="claims">Claim Merges</TabsTrigger>
        </TabsList>
        <TabsContent value="entities">
          <EntityMergesPanel />
        </TabsContent>
        <TabsContent value="claims">
          <ClaimMergesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
