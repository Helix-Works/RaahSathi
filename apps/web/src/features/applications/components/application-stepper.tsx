import { Check, CircleDot, Circle } from "lucide-react";

import { IconTile } from "@/components/shared/icon-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StepState = "completed" | "current" | "upcoming";

type ApplicationStep = Readonly<{
  key: string;
  name: string;
  state: StepState;
  stateLabel: string;
}>;

type ApplicationStepperProps = Readonly<{
  title: string;
  steps: readonly ApplicationStep[];
}>;

function StepIcon({ state }: Readonly<{ state: StepState }>) {
  if (state === "completed") return <Check aria-hidden="true" />;
  if (state === "current") return <CircleDot aria-hidden="true" />;
  return <Circle aria-hidden="true" />;
}

export function ApplicationStepper({ title, steps }: ApplicationStepperProps) {
  return (
    <section aria-labelledby="application-sections-title">
      <Card>
        <CardHeader><CardTitle id="application-sections-title">{title}</CardTitle></CardHeader>
        <CardContent className="pt-5 sm:pt-6">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.key} className="relative h-full min-w-0">
                <div className="flex h-full min-w-0 rounded-item border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <IconTile
                      tone={step.state === "completed" ? "success" : step.state === "current" ? "default" : "neutral"}
                      size="sm"
                    >
                      <StepIcon state={step.state} />
                    </IconTile>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground" aria-hidden="true">{String(index + 1).padStart(2, "0")}</p>
                      <p className="font-semibold leading-6">{step.name}</p>
                      <p className="text-sm leading-5 text-muted-foreground">{step.stateLabel}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
