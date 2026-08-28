# Hostinger deployment

RaahSathi is deployed as one Next.js application from the repository root. Do
not set `apps/web` as the Hostinger application root: the pnpm workspace and
the `@raahsathi/contracts` workspace dependency must resolve from the root.

## Hostinger settings

```text
Repository: https://github.com/Helix-Works/RaahSathi
Branch: main
Node: 22.x (22.12.0 or newer)
Package manager: pnpm 11.22.0
Install: pnpm install --frozen-lockfile
Build: pnpm build
Start: pnpm --filter @raahsathi/web start
Output directory: none
```

Use the platform-provided `PORT`; Next.js defaults to port 3000 when no port
is supplied.

## Production environment

Configure these in Hostinger's environment settings. Never commit their values:

```text
DATABASE_URL
DIRECT_URL
SHADOW_DATABASE_URL
AUTH_MOBILE_LOOKUP_PEPPER
AUTH_OTP_PEPPER
AUTH_DEMO_OTP
PAYMENT_PROVIDER_WEBHOOK_SECRET
TRUST_PROXY_HEADERS=true
NEXT_PUBLIC_DATA_SOURCE=real
```

Use PostgreSQL URLs with `sslmode=require` (or `verify-full`) in production.
`TEST_DATABASE_URL` and demo reset variables are not normal production
runtime settings.

## Database release sequence

Run migrations against the intended production database before starting the
new application version:

```bash
pnpm install --frozen-lockfile
pnpm --filter @raahsathi/web prisma:generate
pnpm exec prisma migrate deploy --schema apps/web/prisma/schema.prisma
pnpm build
pnpm --filter @raahsathi/web start
```

Never run `prisma migrate reset` against production. Do not seed production
unless the synthetic demo dataset is explicitly required.

## Domain

Attach the purchased primary domain in Hostinger, enable SSL, and configure
`www` as an alias or redirect to the primary HTTPS hostname. No application
URL is hardcoded, so no code change is required for the final domain.

## Release policy

Deploy only `main`. Changes should land through reviewed pull requests. Do not
enable automatic deployment or change GitHub settings until the repository
owner approves that configuration.
