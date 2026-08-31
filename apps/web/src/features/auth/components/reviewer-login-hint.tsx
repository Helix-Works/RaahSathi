import type { ReviewerLoginHint as ReviewerLoginHintValue } from "@/features/auth/types";

export function ReviewerLoginHint({
  hint,
  field,
}: Readonly<{
  hint: ReviewerLoginHintValue;
  field: "mobile" | "otp";
}>) {
  const label = field === "mobile" ? hint.mobileLabel : hint.otpLabel;
  const values = field === "mobile" ? hint.mobileNumbers : [hint.otp];

  return (
    <div className="rounded-control border border-primary/15 bg-secondary/70 px-3 py-2 text-sm leading-5 text-secondary-foreground">
      <p>
        <span className="font-bold">{label}:</span>{" "}
        {values.map((value, index) => (
          <span key={value}>
            {index > 0 ? <span aria-hidden="true"> / </span> : null}
            <code>{value}</code>
          </span>
        ))}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint.notice}</p>
    </div>
  );
}
