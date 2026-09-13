"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandPaletteProvider } from "./command-palette-context";
import { TooltipProvider } from "./ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
