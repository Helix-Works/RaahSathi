import type { ReactNode } from "react";

import { IconTile } from "@/components/shared/icon-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PencilLine } from "lucide-react";

type ApplicationCurrentSectionProps = Readonly<{
  eyebrow: string;
  title: string;
  children: ReactNode;
}>;

export function ApplicationCurrentSection({ eyebrow, title, children }: ApplicationCurrentSectionProps) {
  return (
    <section aria-labelledby="current-application-section-title">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-surface-muted">
          <div className="flex items-center gap-3">
            <IconTile size="sm"><PencilLine aria-hidden="true" /></IconTile>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{eyebrow}</p>
              <CardTitle id="current-application-section-title">{title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 sm:pt-6">{children}</CardContent>
      </Card>
    </section>
  );
}
