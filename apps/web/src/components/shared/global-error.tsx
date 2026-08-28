"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function GlobalError({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive-surface">
            <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
          </div>
          {error.digest ? (
            <p className="rounded-control border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          ) : null}
          <Button onClick={reset} variant="outline">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
