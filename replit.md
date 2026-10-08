# Library Management System

Library catalog and circulation app for students and staff, backed by Supabase Auth and PostgreSQL Row Level Security.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/library-ms run dev` — run the library web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Apply `artifacts/library-ms/supabase/migrations/20261009000000_library_init.sql` in the Supabase project's SQL Editor; it is not a Replit-managed database migration.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- App data and authentication: Supabase Auth + PostgreSQL with RLS; the shared Express API proxies Supabase REST calls with the signed-in user's bearer token.

## Where things live

- `artifacts/library-ms/` — React + Vite app, Supabase migration, and setup instructions
- `artifacts/api-server/src/routes/library.ts` — library endpoints; validates generated schemas and forwards the user's Supabase JWT
- `lib/api-spec/openapi.yaml` — API contract source of truth; regenerate with the command above
- `artifacts/library-ms/supabase/migrations/` — Supabase schema, RLS policies, circulation functions, and sample catalog

## Architecture decisions

- Supabase is intentional for this product; do not move its data to the workspace PostgreSQL database.
- The app never uses a Supabase service-role key. Requests carry the user's JWT, and database RLS remains the authorization boundary.
- New signups always receive the `student` role. Promote the initial administrator manually using the SQL snippet in the app README; never grant admin to the first registrant automatically.
- Book `quantity` means copies currently available to issue. Issue and return operations update it transactionally in guarded database functions.

## Product

- Public searchable book catalog and book details
- Student sign-up/sign-in and personal loan history
- Admin dashboard, catalog CRUD, member list, issue, and return flows

## User preferences

The supplied product brief requests a dark blue visual theme.

## Gotchas

- Apply Supabase schema changes in the external Supabase SQL Editor; Replit Publish does not migrate that database.
- Do not delete circulation rows or add direct client write policies; preserve loan history and keep issue/return mutations inside the guarded RPC functions.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
