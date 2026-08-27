import { Clock3 } from "lucide-react";

import { IconTile } from "@/components/shared/icon-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HistoryItem = Readonly<{
  id: string;
  label: string;
  sectionName?: string;
  timestamp: string;
}>;

type ApplicationHistoryProps = Readonly<{
  title: string;
  emptyLabel: string;
  items: readonly HistoryItem[];
}>;

export function ApplicationHistory({ title, emptyLabel, items }: ApplicationHistoryProps) {
  return (
    <section aria-labelledby="application-history-title">
      <Card>
        <CardHeader><CardTitle id="application-history-title">{title}</CardTitle></CardHeader>
        <CardContent>
          {items.length ? (
            <ol className="space-y-0">
              {items.map((item, index) => (
                <li key={item.id} className="relative grid grid-cols-[auto_1fr] gap-3 pb-5 last:pb-0">
                  {index < items.length - 1 ? <span className="absolute bottom-0 left-[1.12rem] top-9 border-l border-border" aria-hidden="true" /> : null}
                  <IconTile tone="neutral" size="sm" className="relative z-10"><Clock3 aria-hidden="true" /></IconTile>
                  <div className="space-y-1 pt-1">
                    <p className="font-semibold leading-6">{item.label}{item.sectionName ? ` — ${item.sectionName}` : ""}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.timestamp}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm leading-6 text-muted-foreground">{emptyLabel}</p>}
        </CardContent>
      </Card>
    </section>
  );
}
