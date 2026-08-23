"use client";

import type { ServiceKey } from "@raahsathi/contracts/applications";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startApplication } from "@/features/applications/api";

export function StartApplicationButton({ serviceKey, label, loginPath }: Readonly<{ serviceKey: ServiceKey; label: string; loginPath: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setPending(true);
    setFailed(false);
    try {
      const application = await startApplication(serviceKey);
      router.push(`/applications/${application.id}`);
      router.refresh();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
        router.push(loginPath);
        return;
      }
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" onClick={start} disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {label}
      </Button>
      {failed ? <p className="text-sm text-destructive" role="alert">Unable to start safely. Please try again.</p> : null}
    </div>
  );
}
