"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { QaEvidenceCard as QaEvidenceCardType } from "@/lib/types";

export function EvidenceCard({ evidence }: { evidence: QaEvidenceCardType }) {
  return (
    <Link
      href={evidence.artifact_id ? `/artifacts/${encodeURIComponent(evidence.artifact_id)}` : "#"}
      className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-elevated/40 p-3 transition-colors hover:border-primary/40 hover:bg-elevated/60"
    >
      <p className="text-sm italic leading-relaxed text-foreground">&ldquo;{evidence.quote}&rdquo;</p>
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span className="truncate">
          {evidence.artifact_sender ?? "Unknown sender"} &middot;{" "}
          {evidence.artifact_timestamp ? formatDateTime(evidence.artifact_timestamp) : "unknown time"}
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 tabular-nums">
          score {evidence.relevance_score.toFixed(0)}
        </span>
      </div>
      {evidence.artifact_subject && (
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate group-hover:text-primary">{evidence.artifact_subject}</span>
        </div>
      )}
    </Link>
  );
}
