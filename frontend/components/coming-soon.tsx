import { Skeleton } from "@/components/ui/skeleton";

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <p className="text-sm text-muted">{label} is coming online.</p>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
