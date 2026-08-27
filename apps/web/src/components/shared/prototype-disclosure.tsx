import { ShieldCheck } from "lucide-react";
import { useId } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { cn } from "@/lib/utils";

type PrototypeDisclosureProps = Readonly<{
  title: string;
  description: string;
  tone?: "default" | "inverse";
}>;

export function PrototypeDisclosure({
  title,
  description,
  tone = "default",
}: PrototypeDisclosureProps) {
  const titleId = useId();

  return (
    <aside
      className={cn(
        "flex gap-3 rounded-panel border p-4",
        tone === "inverse"
          ? "border-primary-foreground/20 bg-primary-foreground/8 text-primary-foreground"
          : "border-primary/20 bg-secondary text-secondary-foreground",
      )}
      aria-labelledby={titleId}
    >
      <IconTile tone={tone === "inverse" ? "inverse" : "default"} size="sm">
        <ShieldCheck aria-hidden="true" />
      </IconTile>
      <div className="space-y-1">
        <h2 id={titleId} className="text-sm font-bold">
          {title}
        </h2>
        <p
          className={cn(
            "text-sm leading-6",
            tone === "inverse" && "text-primary-foreground/78",
          )}
        >
          {description}
        </p>
      </div>
    </aside>
  );
}
