"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Users, FileText, Mail, Search as SearchIcon, CornerDownLeft } from "lucide-react";
import { useCommandPalette } from "./command-palette-context";
import { useSearch } from "@/lib/hooks";
import { entityTypeColor, claimTypeLabel, truncate } from "@/lib/utils";
import type { ArtifactSummary, ClaimSummary, EntitySummary } from "@/lib/types";

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounced(query);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data, isFetching } = useSearch(debouncedQuery);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  if (!open) return null;

  const hasResults =
    !!data && (data.entities.length > 0 || data.claims.length > 0 || data.artifacts.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[12vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          className="glass w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 shadow-glow"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <SearchIcon className="h-4 w-4 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, organizations, claims, artifacts..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
              esc
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {debouncedQuery.trim().length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">
                Start typing to search the memory graph.
              </p>
            )}
            {debouncedQuery.trim().length > 0 && isFetching && (
              <p className="px-3 py-6 text-center text-sm text-muted">Searching…</p>
            )}
            {debouncedQuery.trim().length > 0 && !isFetching && !hasResults && (
              <p className="px-3 py-6 text-center text-sm text-muted">No results found.</p>
            )}

            {data && data.entities.length > 0 && (
              <ResultGroup label="Entities" icon={Users}>
                {data.entities.slice(0, 6).map((e: EntitySummary) => (
                  <ResultRow
                    key={e.id}
                    onClick={() => goTo(`/entities/${encodeURIComponent(e.id)}`)}
                    dotColor={entityTypeColor(e.type)}
                    primary={e.name}
                    secondary={e.type}
                  />
                ))}
              </ResultGroup>
            )}

            {data && data.claims.length > 0 && (
              <ResultGroup label="Claims" icon={FileText}>
                {data.claims.slice(0, 6).map((c: ClaimSummary) => (
                  <ResultRow
                    key={c.id}
                    onClick={() => goTo(`/claims/${encodeURIComponent(c.id)}`)}
                    dotColor="#94a3b8"
                    primary={truncate(`${c.subject} — ${c.object ?? ""}`, 70)}
                    secondary={claimTypeLabel(c.type)}
                  />
                ))}
              </ResultGroup>
            )}

            {data && data.artifacts.length > 0 && (
              <ResultGroup label="Artifacts" icon={Mail}>
                {data.artifacts.slice(0, 6).map((a: ArtifactSummary) => (
                  <ResultRow
                    key={a.id}
                    onClick={() => goTo(`/artifacts/${encodeURIComponent(a.id)}`)}
                    dotColor="#6366F1"
                    primary={truncate(a.subject || "(no subject)", 70)}
                    secondary={a.sender}
                  />
                ))}
              </ResultGroup>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResultGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({
  onClick,
  dotColor,
  primary,
  secondary,
}: {
  onClick: () => void;
  dotColor: string;
  primary: string;
  secondary?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5"
    >
      <span className="flex items-center gap-2.5 truncate">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="truncate text-foreground">{primary}</span>
        {secondary && <span className="shrink-0 text-xs text-muted">{secondary}</span>}
      </span>
      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 group-hover:opacity-100" />
    </button>
  );
}
