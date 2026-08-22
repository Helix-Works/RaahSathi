# Feature module convention

Create a feature folder only when implementing that citizen-facing capability.
Keep its components, validation, and data access together. Server Components are
the default; add `"use client"` only at the smallest interactive boundary.

When temporary deterministic data is needed, expose matching `real.ts` and
`mock.ts` adapters behind `src/lib/data-source.ts`. Product code must select the
adapter centrally and must not import fixtures directly. Do not add mock routes,
mock servers, or production fallbacks to fixture data.
