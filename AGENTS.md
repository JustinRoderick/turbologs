# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

TurboLogs is a full-stack web app built with **TanStack Start** (React SSR) and **Convex** (cloud BaaS). See `package.json` for all available scripts.

### Required secrets

The following environment variables may be needed (injected as secrets or written to `.env.local`):

- `VITE_CONVEX_URL` — Convex deployment URL (used by the frontend at runtime)
- `CONVEX_DEPLOYMENT` — Convex deployment identifier for local, authenticated Convex workflows only. Do not assume this is usable in Cursor Cloud.

### Running the app

- **Cursor Cloud / agent-safe path:** `npx vite dev --port 3000` — starts the Vite SSR dev server on port 3000 without requiring Convex authentication. This is the default path for agents running in Cursor Cloud.
- **Local authenticated full dev only:** `npm run dev` — runs `npx convex dev --once` then concurrently starts the Vite dev server and Convex dev watcher. Do not run this in Cursor Cloud; it requires Convex authentication and may fail or hang there.
- In Cursor Cloud, create `.env.local` with `VITE_CONVEX_URL` only if it is missing. Only add `CONVEX_DEPLOYMENT` in a local environment where Convex authentication is already configured. If secrets are available as environment variables, create it with:
  ```
  echo "VITE_CONVEX_URL=$VITE_CONVEX_URL" > .env.local
  if [ -n "$CONVEX_DEPLOYMENT" ]; then echo "CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT" >> .env.local; fi
  ```

### Convex restrictions in Cursor Cloud

- Do **not** run `npx convex dev`, `npx convex dev --once`, `npm run dev`, `npx convex codegen`, or any other command that requires interactive Convex authentication from Cursor Cloud.
- Do **not** try to refresh `convex/_generated/` from Cursor Cloud. Treat generated Convex files as requiring a local, authenticated environment.
- If a task requires schema pushes, generated Convex code updates, or any other authenticated Convex workflow, stop and tell the user that this step must be performed locally (or in another environment with working Convex auth), then continue with any cloud-safe changes you can still make.
- Prefer validation that does not depend on Convex auth in Cursor Cloud: `npm run lint`, `npm run build`, and the web-only Vite dev server when `VITE_CONVEX_URL` is already available.

### Lint / Build / Format

- `npm run lint` — runs OxLint (warnings from shadcn/ui generated components are expected)
- `npm run build` — `vite build && tsc --noEmit`
- `npm run format` — Prettier

### Key caveats

- **Package manager:** The lockfile is `bun.lock`, so use `bun install` for dependency installation. Scripts use `npm run` / `npx` which work fine with bun-installed `node_modules`.
- **No local database:** All data lives in Convex cloud. No Docker or local DB setup needed.
- **No automated test suite:** The project has no test framework configured; validation is done via lint, type-check, and manual testing.
- **Convex generated files:** `convex/_generated/` is auto-generated, but Cursor Cloud agents should not attempt to regenerate it because Convex auth is not available there. Regenerate these files only in a local, authenticated environment.
