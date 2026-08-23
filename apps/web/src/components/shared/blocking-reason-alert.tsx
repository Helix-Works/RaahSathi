import { OctagonAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BlockingReasonAlert({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <Alert variant="warning" className="flex items-start gap-3">
      <OctagonAlert className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
}
