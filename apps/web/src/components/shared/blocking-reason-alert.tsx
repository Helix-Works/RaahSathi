import { OctagonAlert } from "lucide-react";

import { Alert } from "@/components/ui/alert";

export function BlockingReasonAlert({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <Alert variant="warning" className="flex items-start gap-3">
      <OctagonAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="font-extrabold">{title}</h3>
        <p>{description}</p>
      </div>
    </Alert>
  );
}
