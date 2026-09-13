"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { User, Building2, FolderKanban, Hash, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Person: User,
  Organization: Building2,
  Project: FolderKanban,
  Topic: Hash,
  Location: MapPin,
};

function EntityNodeComponent({ data, selected }: NodeProps) {
  const d = data as { label: string; entity_type?: string; color?: string };
  const Icon = ICONS[d.entity_type ?? ""] ?? User;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-surface/90 px-3 py-2 text-xs font-medium text-foreground shadow-soft backdrop-blur transition-transform",
        selected ? "scale-105 border-white/40 shadow-glow" : "border-white/10"
      )}
      style={{ borderLeftColor: d.color, borderLeftWidth: 3 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: d.color }} />
      <span className="max-w-[140px] truncate">{d.label}</span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const EntityNode = memo(EntityNodeComponent);
