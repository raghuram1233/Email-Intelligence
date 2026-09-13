import type { GraphEdge, GraphNode } from "@/lib/types";

export type GraphPosition = { x: number; y: number };

const ENTITY_RING_RADIUS = 420;
const CLAIM_JITTER = 40;

/**
 * Deterministic radial layout: entity nodes are clustered by entity_type into
 * rings arranged around the canvas center; claim nodes are placed at the
 * midpoint of the entities they connect (via MADE_CLAIM / object edges), with
 * a small index-based jitter to fan out overlapping claims. No physics sim —
 * stable positions read better for a demo than a half-converged force layout.
 */
export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): Map<string, GraphPosition> {
  const positions = new Map<string, GraphPosition>();

  const entityNodes = nodes.filter((n) => n.type === "entity");
  const claimNodes = nodes.filter((n) => n.type === "claim");

  const groups = new Map<string, GraphNode[]>();
  for (const n of entityNodes) {
    const key = n.entity_type ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  const groupKeys = Array.from(groups.keys());
  const groupCount = Math.max(groupKeys.length, 1);

  groupKeys.forEach((key, gi) => {
    const groupNodes = groups.get(key)!;
    const groupAngle = (gi / groupCount) * Math.PI * 2;
    const groupCenterX = Math.cos(groupAngle) * ENTITY_RING_RADIUS;
    const groupCenterY = Math.sin(groupAngle) * ENTITY_RING_RADIUS;
    const perGroupRadius = 40 + Math.min(groupNodes.length * 14, 260);

    groupNodes.forEach((n, i) => {
      const angle = (i / Math.max(groupNodes.length, 1)) * Math.PI * 2;
      positions.set(n.id, {
        x: groupCenterX + Math.cos(angle) * perGroupRadius,
        y: groupCenterY + Math.sin(angle) * perGroupRadius,
      });
    });
  });

  const claimNeighbors = new Map<string, string[]>();
  for (const e of edges) {
    const sourceIsEntity = positions.has(e.source);
    const targetIsEntity = positions.has(e.target);
    const claimId = sourceIsEntity ? e.target : targetIsEntity ? e.source : null;
    const entityId = sourceIsEntity ? e.source : targetIsEntity ? e.target : null;
    if (!claimId || !entityId) continue;
    if (!claimNeighbors.has(claimId)) claimNeighbors.set(claimId, []);
    claimNeighbors.get(claimId)!.push(entityId);
  }

  claimNodes.forEach((n, i) => {
    const neighbors = (claimNeighbors.get(n.id) ?? [])
      .map((id) => positions.get(id))
      .filter((p): p is GraphPosition => !!p);

    if (neighbors.length === 0) {
      const angle = (i / Math.max(claimNodes.length, 1)) * Math.PI * 2;
      positions.set(n.id, {
        x: Math.cos(angle) * (ENTITY_RING_RADIUS + 300),
        y: Math.sin(angle) * (ENTITY_RING_RADIUS + 300),
      });
      return;
    }

    const avgX = neighbors.reduce((s, p) => s + p.x, 0) / neighbors.length;
    const avgY = neighbors.reduce((s, p) => s + p.y, 0) / neighbors.length;
    const jitterAngle = (i % 12) * (Math.PI / 6);
    positions.set(n.id, {
      x: avgX + Math.cos(jitterAngle) * CLAIM_JITTER,
      y: avgY + Math.sin(jitterAngle) * CLAIM_JITTER,
    });
  });

  return positions;
}
