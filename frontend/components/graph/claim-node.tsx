"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn, confidenceColor, claimTypeLabel } from "@/lib/utils";

function ClaimNodeComponent({ data, selected }: NodeProps) {
  const d = data as { label: string; claim_type?: string; confidence?: number };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border bg-elevated/80 px-2.5 py-1.5 text-[11px] font-medium text-muted backdrop-blur transition-transform",
        selected ? "scale-105 border-white/30 text-foreground" : "border-white/10"
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: confidenceColor(d.confidence) }}
      />
      <span className="max-w-[120px] truncate">{claimTypeLabel(d.claim_type)}</span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const ClaimNode = memo(ClaimNodeComponent);
