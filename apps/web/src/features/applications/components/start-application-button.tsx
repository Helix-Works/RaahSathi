"use client";

import type { ServiceKey } from "@raahsathi/contracts/applications";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startApplication } from "@/features/applications/api";
import { ApiClientError } from "@/lib/api";

export function StartApplicationButton({ serviceKey, label, errorLabel, eligibleLicenceRequiredLabel, loginPath }: Readonly<{ serviceKey: ServiceKey; label: string; errorLabel: string; eligibleLicenceRequiredLabel: string; loginPath: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string>();

  const start = async () => {
    setPending(true);
    setFailure(undefined);
    try {
      const application = await startApplication(serviceKey);
      router.push(`/applications/${application.id}`);
      router.refresh();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
        router.push(loginPath);
        return;
      }
      setFailure(error instanceof ApiClientError && error.code === "ELIGIBLE_LICENCE_REQUIRED"
        ? eligibleLicenceRequiredLabel
        : errorLabel);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button className="w-full sm:w-auto" type="button" size="lg" onClick={start} disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {label}
      </Button>
      {failure ? <p className="border-l-2 border-foreground pl-2 text-sm font-bold text-foreground" role="alert">{failure}</p> : null}
    </div>
  );
}
