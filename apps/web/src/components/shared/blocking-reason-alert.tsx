import { OctagonAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BlockingReasonAlert({
  title,
  description,
  headingId,
}: Readonly<{ title: string; description: string; headingId?: string }>) {
  return (
    <Alert variant="warning" className="flex items-start gap-3">
      <OctagonAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="space-y-1">
        <AlertTitle id={headingId}>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
}
