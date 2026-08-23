"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api";

export type AccountPresentation = Readonly<{
  label: string;
  logoutLabel: string;
  loggingOutLabel: string;
  logoutFailedLabel: string;
}>;

export function LogoutButton({
  presentation,
  className,
  buttonClassName,
}: Readonly<{
  presentation: AccountPresentation;
  className?: string;
  buttonClassName?: string;
}>) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");

  const logout = async () => {
    setState("submitting");

    try {
      await authApi.logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setState("error");
    }
  };

  return (
    <div className={className}>
      <Button
        className={buttonClassName}
        variant="ghost"
        size="sm"
        onClick={logout}
        disabled={state === "submitting"}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {state === "submitting"
          ? presentation.loggingOutLabel
          : presentation.logoutLabel}
      </Button>
      {state === "error" ? (
        <p className="mt-1 text-xs font-bold text-error" role="alert">
          {presentation.logoutFailedLabel}
        </p>
      ) : null}
    </div>
  );
}
