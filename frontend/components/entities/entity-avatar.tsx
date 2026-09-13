import { User, Building2, FolderKanban, Hash, MapPin } from "lucide-react";
import { cn, entityTypeColor, initials } from "@/lib/utils";
import type { EntityType } from "@/lib/types";

const TYPE_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  Person: User,
  Organization: Building2,
  Project: FolderKanban,
  Topic: Hash,
  Location: MapPin,
};

export function EntityTypeIcon({ type, className }: { type: string | undefined; className?: string }) {
  const Icon = TYPE_ICONS[type as EntityType] ?? Hash;
  return <Icon className={className} />;
}

export function EntityAvatar({
  name,
  type,
  size = "md",
}: {
  name: string | null | undefined;
  type: string | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const color = entityTypeColor(type);
  const dims = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full border font-semibold", dims)}
      style={{
        backgroundColor: `${color}1a`,
        borderColor: `${color}4d`,
        color,
      }}
    >
      {initials(name)}
    </div>
  );
}
