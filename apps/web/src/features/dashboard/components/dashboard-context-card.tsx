import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type DashboardContextCardProps = Readonly<{
  icon: ReactNode;
  status?: ReactNode;
  title: string;
  description: string;
  tone?: "default" | "urgent" | "muted";
}>;

export function DashboardContextCard({
  icon,
  status,
  title,
  description,
  tone = "default",
}: DashboardContextCardProps) {
  return (
    <Card variant={tone} className="h-full">
      <CardContent className="flex h-full flex-col gap-4 pt-5 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          {icon}
          {status}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-snug">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
