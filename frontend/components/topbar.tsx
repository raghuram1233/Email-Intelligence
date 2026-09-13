"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useCommandPalette } from "./command-palette-context";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/graph": "Memory Graph",
  "/entities": "Entities",
  "/claims": "Claims",
  "/artifacts": "Artifacts",
  "/qa": "Retrieval / QA",
  "/duplicates": "Duplicate Explorer",
  "/timeline": "Timeline",
  "/settings": "Settings",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = "/" + pathname.split("/")[1];
  return TITLES[base] ?? "Layer10";
}

export function Topbar() {
  const pathname = usePathname();
  const { setOpen } = useCommandPalette();

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6">
      <h1 className="text-base font-semibold text-foreground">{titleFor(pathname)}</h1>
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 items-center justify-between rounded-xl border border-white/10 bg-elevated/50 px-3 py-1.5 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Search entities, claims, artifacts...
        </span>
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
