"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConnectivity = error instanceof ApiError && error.status === 0;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {isConnectivity ? "Can't reach the Layer10 API" : "Something went wrong"}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          {isConnectivity
            ? "The backend service may not be running. Start it with uvicorn (or docker compose up) and try again."
            : error.message || "An unexpected error occurred while loading this view."}
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
