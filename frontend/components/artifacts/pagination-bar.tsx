"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationBar({
  skip,
  limit,
  total,
  onPrev,
  onNext,
}: {
  skip: number;
  limit: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total === 0) return null;
  const from = skip + 1;
  const to = Math.min(skip + limit, total);

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-muted">
      <span>
        Showing <span className="text-foreground">{from}</span>–
        <span className="text-foreground">{to}</span> of{" "}
        <span className="text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={skip === 0}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={to >= total}>
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
