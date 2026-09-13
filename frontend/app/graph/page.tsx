"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { X, User, Building2, FolderKanban, Hash, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useGraph } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, claimTypeLabel, confidenceLabel } from "@/lib/utils";
import type { GraphNode } from "@/lib/types";
import { layoutGraph } from "@/components/graph/layout";
import { EntityNode } from "@/components/graph/entity-node";
import { ClaimNode } from "@/components/graph/claim-node";

const ENTITY_TYPES = ["Person", "Organization", "Project", "Topic", "Location"] as const;

const ENTITY_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Person: User,
  Organization: Building2,
  Project: FolderKanban,
  Topic: Hash,
  Location: MapPin,
};

const nodeTypes = { entity: EntityNode, claim: ClaimNode };

export default function GraphPage() {
  const [entityType, setEntityType] = React.useState<string | undefined>(undefined);
  const [minConfidence, setMinConfidence] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<GraphNode | null>(null);

  const { data, isLoading, isError } = useGraph({
    entity_type: entityType,
    min_confidence: minConfidence > 0 ? minConfidence : undefined,
    limit: 400,
  });

  const { nodes, edges } = React.useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const positions = layoutGraph(data.nodes, data.edges);
    const q = search.trim().toLowerCase();

    const rfNodes: Node[] = data.nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      const matches = q.length === 0 || n.label.toLowerCase().includes(q);
      return {
        id: n.id,
        type: n.type,
        position: pos,
        data: { ...n },
        style: { opacity: matches ? 1 : 0.25 },
      };
    });

    const rfEdges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.label === "MADE_CLAIM",
      style: { stroke: "rgba(148,163,184,0.35)" },
      labelStyle: { fill: "#94a3b8", fontSize: 10 },
      labelBgStyle: { fill: "#111827", fillOpacity: 0.8 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [data, search]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    const raw = data?.nodes.find((n) => n.id === node.id);
    if (raw) setSelected(raw);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted">Could not load the memory graph. Is the backend running?</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10">
      {nodes.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted">No graph data yet — ingest some emails first.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.15}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.08)" />
          <Controls className="!border !border-white/10 !bg-surface !shadow-soft" />
          <MiniMap
            className="!border !border-white/10 !bg-surface"
            nodeColor={(n) => (n.data as { color?: string })?.color ?? "#6366F1"}
            maskColor="rgba(11,16,32,0.7)"
          />
        </ReactFlow>
      )}

      <Card className="absolute left-4 top-4 z-10 w-72 space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Highlight nodes..."
            className="h-8"
          />
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Entity type</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setEntityType(undefined)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                !entityType
                  ? "border-primary/40 bg-primary/15 text-white"
                  : "border-white/10 text-muted hover:text-foreground"
              )}
            >
              All
            </button>
            {ENTITY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setEntityType(entityType === t ? undefined : t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  entityType === t
                    ? "border-primary/40 bg-primary/15 text-white"
                    : "border-white/10 text-muted hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted">
            <span>Min confidence</span>
            <span className="text-foreground">{minConfidence.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </Card>

      <Card className="absolute bottom-4 left-4 z-10 space-y-1.5 p-3">
        {ENTITY_TYPES.map((t) => {
          const Icon = ENTITY_TYPE_ICON[t];
          return (
            <div key={t} className="flex items-center gap-2 text-[11px] text-muted">
              <Icon className="h-3 w-3" />
              {t}
            </div>
          );
        })}
      </Card>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 top-0 z-20 h-full w-96 overflow-y-auto border-l border-white/10 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {selected.type === "entity" ? "Entity" : "Claim"}
              </h3>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.type === "entity" ? (
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-semibold text-foreground">{selected.label}</div>
                  <Badge variant="muted" className="mt-1">
                    {selected.entity_type}
                  </Badge>
                </div>
                <Link href={`/entities/${encodeURIComponent(selected.raw_id)}`}>
                  <Button size="sm" className="w-full">
                    View full profile →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-lg font-semibold text-foreground">{claimTypeLabel(selected.claim_type)}</div>
                  {selected.confidence != null && (
                    <Badge variant="muted" className="mt-1">
                      {confidenceLabel(selected.confidence)} confidence
                    </Badge>
                  )}
                </div>
                <Link href={`/claims/${encodeURIComponent(selected.raw_id)}`}>
                  <Button size="sm" className="w-full">
                    View claim →
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
