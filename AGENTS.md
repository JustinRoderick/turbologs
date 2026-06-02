# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

TurboLogs is a full-stack web app built with **TanStack Start** (React SSR) and **Convex** (cloud BaaS). See `package.json` for all available scripts.

### Required secrets

The following environment variables may be needed (injected as secrets or written to `.env.local`):

- `VITE_CONVEX_URL` — Convex deployment URL (used by the frontend at runtime)
- `VITE_CONVEX_SITE_URL` — Convex HTTP actions/site URL (used by Better Auth integration)
- `VITE_PUBLIC_POSTHOG_KEY` — PostHog project key (used by the frontend analytics provider)
- `VITE_PUBLIC_POSTHOG_HOST` — PostHog host URL (used by the frontend analytics provider)
- `CONVEX_DEPLOYMENT` — Convex deployment identifier for local, authenticated Convex workflows only. Do not assume this is usable in Cursor Cloud.

### Running the app

- **Cursor Cloud / agent-safe path:** `bunx vite dev --port 3000` — starts the Vite SSR dev server on port 3000 without requiring Convex authentication. This is the default path for agents running in Cursor Cloud.
- **Local authenticated full dev only:** `bun run dev` — runs `bunx convex dev --once` then concurrently starts the Vite dev server and Convex dev watcher. Do not run this in Cursor Cloud; it requires Convex authentication and may fail or hang there.
- In Cursor Cloud, create `.env.local` with the required `VITE_` frontend variables only if it is missing. Only add `CONVEX_DEPLOYMENT` in a local environment where Convex authentication is already configured. If secrets are available as environment variables, create it with:
  ```
  echo "VITE_CONVEX_URL=$VITE_CONVEX_URL" > .env.local
  echo "VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL" >> .env.local
  echo "VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY" >> .env.local
  echo "VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST" >> .env.local
  if [ -n "$CONVEX_DEPLOYMENT" ]; then echo "CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT" >> .env.local; fi
  ```

### Convex restrictions in Cursor Cloud

- Do **not** run `bunx convex dev`, `bunx convex dev --once`, `bun run dev`, `bunx convex codegen`, or any other command that requires interactive Convex authentication from Cursor Cloud.
- Do **not** try to refresh `convex/_generated/` from Cursor Cloud. Treat generated Convex files as requiring a local, authenticated environment.
- If a task requires schema pushes, generated Convex code updates, or any other authenticated Convex workflow, stop and tell the user that this step must be performed locally (or in another environment with working Convex auth), then continue with any cloud-safe changes you can still make.
- Prefer validation that does not depend on Convex auth in Cursor Cloud: `bun run lint`, `bun run build`, and the web-only Vite dev server when the required `VITE_` frontend variables are already available.

### Lint / Build / Format

- `bun run lint` — runs OxLint (warnings from shadcn/ui generated components are expected)
- `bun run build` — `vite build && tsc --noEmit`
- `bun run fmt` — OxFmt

### Key caveats

- **Package manager:** The lockfile is `bun.lock`, so use `bun install` for dependency installation and `bun run` / `bunx` for scripts and package binaries.
- **No local database:** All data lives in Convex cloud. No Docker or local DB setup needed.
- **No automated test suite:** The project has no test framework configured; validation is done via lint, type-check, and manual testing.
- **Convex generated files:** `convex/_generated/` is auto-generated, but Cursor Cloud agents should not attempt to regenerate it because Convex auth is not available there. Regenerate these files only in a local, authenticated environment.
