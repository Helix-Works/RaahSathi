# Architecture notes

RaahSathi is a pnpm-workspace modular monolith: a Next.js browser application calls a NestJS REST API, which exclusively owns Prisma and PostgreSQL access.
