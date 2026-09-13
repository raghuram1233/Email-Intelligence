import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-elevated/60">
        <SearchX className="h-6 w-6 text-muted" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Nothing here</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          We couldn&apos;t find that entity, claim, artifact, or page in the memory graph.
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-soft transition-colors hover:bg-primary/90"
        )}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
