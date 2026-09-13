import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  accent?: string;
  href?: string;
  hint?: string;
}

export function StatCard({ icon: Icon, label, value, accent = "#6366F1", href, hint }: StatCardProps) {
  const content = (
    <Card className="group h-full p-5 transition-colors hover:border-white/20">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 truncate text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
      {hint && <div className="mt-1 truncate text-[11px] text-muted/70">{hint}</div>}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
