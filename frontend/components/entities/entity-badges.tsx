import { Badge } from "@/components/ui/badge";
import { confidenceColor, confidenceLabel } from "@/lib/utils";

export function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  const color = confidenceColor(confidence);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: `${color}4d`, backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {confidence != null ? confidence.toFixed(2) : "—"} · {confidenceLabel(confidence)}
    </span>
  );
}

export function StatusBadge({ isCurrent }: { isCurrent: boolean }) {
  return isCurrent ? (
    <Badge variant="success">Current</Badge>
  ) : (
    <Badge variant="muted">Historical</Badge>
  );
}
