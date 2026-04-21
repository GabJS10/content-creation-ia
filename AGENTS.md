# Agents

## Stack
- **Monorepo**: pnpm workspace + turbo
- **Apps**: `apps/api` (Hono, port 3000), `apps/web` (React + Vite, port 5173)
- **Shared**: `packages/types` — `User`, `Idea`, `GeneratedContent`, etc.

## Commands
```bash
pnpm dev          # turbo dev — runs all apps concurrently
pnpm build        # turbo build — builds all packages
pnpm lint         # turbo lint — runs `tsc --noEmit` per package
pnpm format       # prettier --write on all TS/TSX/JS/JSON
```

Run a single app: `pnpm --filter @content-creation-ia/api dev`

## Key quirks
- **DB**: Neon PostgreSQL via `DATABASE_URL` in `.env`. Drizzle migrations live in `apps/api/src/db/migrations`, schema in `apps/api/src/db/schema/index.ts`. Run migrations with `drizzle-kit push` (not yet in package scripts).
- **Linting**: The root `lint` task is `tsc --noEmit`, not eslint. ESLint parser is configured but no `eslint` script exists in packages.
- **CORS**: API allows origin `http://localhost:5173` only.
- **Web dev server**: port 5173. `apps/web/vite.config.ts` has no proxy config — API calls must target `http://localhost:3000` directly.