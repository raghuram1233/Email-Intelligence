"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Share2,
  Users,
  FileText,
  Mail,
  MessagesSquare,
  Copy,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStats } from "@/lib/hooks";
import type { StatsResponse } from "@/lib/types";

type NumericStatKey = {
  [K in keyof StatsResponse]: StatsResponse[K] extends number ? K : never;
}[keyof StatsResponse];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  statKey: NumericStatKey | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, statKey: null },
  { href: "/graph", label: "Memory Graph", icon: Share2, statKey: null },
  { href: "/entities", label: "Entities", icon: Users, statKey: "total_entities" },
  { href: "/claims", label: "Claims", icon: FileText, statKey: "total_claims" },
  { href: "/artifacts", label: "Artifacts", icon: Mail, statKey: "total_artifacts" },
  { href: "/qa", label: "Retrieval / QA", icon: MessagesSquare, statKey: null },
  { href: "/duplicates", label: "Duplicates", icon: Copy, statKey: "duplicate_merges" },
  { href: "/timeline", label: "Timeline", icon: History, statKey: null },
  { href: "/settings", label: "Settings", icon: Settings, statKey: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: stats } = useStats();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-surface/60">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-glow">
          L10
        </div>
        <div>
          <div className="text-sm font-semibold leading-none text-gradient">Layer10</div>
          <div className="mt-1 text-[11px] leading-none text-muted">Memory Graph</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const count = item.statKey ? stats?.[item.statKey] : undefined;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-white"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn("h-4 w-4", active ? "text-primary" : "text-muted group-hover:text-foreground")}
                />
                {item.label}
              </span>
              {count !== undefined && count !== null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                    active ? "bg-primary/25 text-white" : "bg-white/5 text-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-muted">
        Grounded organizational memory over the Enron email corpus.
      </div>
    </aside>
  );
}
