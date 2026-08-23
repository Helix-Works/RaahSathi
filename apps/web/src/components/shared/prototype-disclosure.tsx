import { ShieldCheck } from "lucide-react";

type PrototypeDisclosureProps = Readonly<{
  title: string;
  description: string;
}>;

export function PrototypeDisclosure({
  title,
  description,
}: PrototypeDisclosureProps) {
  return (
    <aside
      className="flex gap-3 rounded-md border border-primary-foreground/30 bg-primary-foreground/5 p-4 text-primary-foreground"
      aria-labelledby="prototype-disclosure-title"
    >
      <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <h2 id="prototype-disclosure-title" className="text-sm font-extrabold">
          {title}
        </h2>
        <p className="text-sm leading-6">{description}</p>
      </div>
    </aside>
  );
}
