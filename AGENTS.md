# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

TurboLogs is a full-stack web app built with **TanStack Start** (React SSR) and **Convex** (cloud BaaS). See `package.json` for all available scripts.

### Required secrets

The following environment variables must be set (injected as secrets or written to `.env.local`):

- `VITE_CONVEX_URL` — Convex deployment URL (used by the frontend at runtime)
- `CONVEX_DEPLOYMENT` — Convex deployment identifier (used by `npx convex dev`)

### Running the app

- **Dev server (web only):** `npx vite dev --port 3000` — starts the Vite SSR dev server on port 3000. This connects to the cloud Convex backend via `VITE_CONVEX_URL`.
- **Full dev (web + Convex watcher):** `npm run dev` — runs `npx convex dev --once` then concurrently starts the Vite dev server and Convex dev watcher. The Convex watcher requires `CONVEX_DEPLOYMENT` and will push schema/function changes to the cloud.
- The `.env.local` file must exist with `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` for the dev server to work. If secrets are available as environment variables, create it with:
  ```
  echo "VITE_CONVEX_URL=$VITE_CONVEX_URL" > .env.local
  echo "CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT" >> .env.local
  ```

### Lint / Build / Format

- `npm run lint` — runs OxLint (warnings from shadcn/ui generated components are expected)
- `npm run build` — `vite build && tsc --noEmit`
- `npm run format` — Prettier

### Key caveats

- **Package manager:** The lockfile is `bun.lock`, so use `bun install` for dependency installation. Scripts use `npm run` / `npx` which work fine with bun-installed `node_modules`.
- **No local database:** All data lives in Convex cloud. No Docker or local DB setup needed.
- **No automated test suite:** The project has no test framework configured; validation is done via lint, type-check, and manual testing.
- **Convex generated files:** `convex/_generated/` is auto-generated. Running `npx convex dev` or `npx convex dev --once` regenerates these files when schema or functions change.
