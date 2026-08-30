import "server-only";

import { z } from "zod";

const postgresUrl = z
  .url()
  .refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol), {
    message: "must be a PostgreSQL connection URL",
  });

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: postgresUrl,
    DIRECT_URL: postgresUrl.optional(),
    SHADOW_DATABASE_URL: postgresUrl.optional(),
    AUTH_MOBILE_LOOKUP_PEPPER: z.string().min(32),
    AUTH_OTP_PEPPER: z.string().min(32),
    AUTH_DEMO_OTP: z.string().regex(/^[0-9]{6}$/),
    SHOW_REVIEWER_LOGIN_HINTS: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    PAYMENT_PROVIDER_WEBHOOK_SECRET: z.string().min(32),
  })
  .transform((environment, context) => {
    if (environment.NODE_ENV === "production") {
      for (const key of ["DATABASE_URL", "DIRECT_URL", "SHADOW_DATABASE_URL"] as const) {
        const value = environment[key];
        if (value && !["require", "verify-full"].includes(new URL(value).searchParams.get("sslmode")?.toLowerCase() ?? "")) {
          context.addIssue({ code: "custom", message: `${key} must require TLS in production.` });
        }
      }
      for (const key of ["AUTH_MOBILE_LOOKUP_PEPPER", "AUTH_OTP_PEPPER", "PAYMENT_PROVIDER_WEBHOOK_SECRET"] as const) {
        if (/placeholder|change-me|development/i.test(environment[key])) {
          context.addIssue({ code: "custom", message: `${key} must not use a placeholder in production.` });
        }
      }
    }
    return environment;
  });

export type ServerEnvironment = z.infer<typeof environmentSchema>;

export function parseEnvironment(environment: Record<string, string | undefined>): ServerEnvironment {
  return environmentSchema.parse(environment);
}

let cachedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  cachedEnvironment ??= parseEnvironment(process.env);
  return cachedEnvironment;
}
