# TurboLogs Implementation Roadmap

This guide turns the PRD/TODO in [TODO.md](./TODO.md) into an execution order that fits the current codebase. The goal is to finish the MVP in a standard SDLC flow: stabilize foundations, verify auth and tenant boundaries, build paid/account infrastructure, implement core racing workflows, then harden with tests, observability, and release readiness.

## Current State Snapshot

### Already in place

- TanStack Start app structure with authenticated route grouping.
- Convex schema covering the intended MVP and later phases: garages, members, invites, access requests, cars, assignments, weather, runs, maintenance, setup logs, files, metrics, predictions, onboarding, and audit events.
- Better Auth wiring for email/password and Google auth.
- Convex Better Auth integration for SSR/client auth tokens.
- Onboarding wizard with create garage, invite token join, browse-first state, and resume banner.
- Garage dashboard and garage detail route.
- Vehicle creation and garage vehicle listing.
- Membership invites, pending invite listing, selected-car invite scope, and access request review flows.
- Resend component and email mutations for invites/access requests.
- Stripe component registered and checkout actions started.
- Tailwind/shadcn UI foundation and many primitives.
- Bun lockfile and Bun-oriented agent docs.

### Still incomplete or unverified

- Auth needs end-to-end manual and automated verification across email/password, Google, redirects, sessions, logout, onboarding, and SSR.
- Payments exist as low-level Stripe actions only; there is no product/tier model, billing UI, entitlement model, webhook handling policy, or plan enforcement.
- Core app logic is mostly schema-only for runs, maintenance, setup logs, weather, datalog/tune files, analytics, predictions, and audit trails.
- Garage/car CRUD is incomplete: edit/archive flows, garage settings, member management actions, and assignment changes need to be finished.
- Testing is not meaningfully configured beyond a `vitest` script.
- Production ops work remains: env validation, monitoring, release checklist, data retention, backups, and security review.

## Delivery Principles

1. Build in vertical slices: schema, Convex functions, route/UI, validation, permissions, tests, and manual QA for each feature.
2. Do not build analytics or AI before the underlying run/weather/tune data is reliable.
3. Treat garage membership and car assignment checks as the core security boundary.
4. Keep the MVP manual-first: manual run entry, manual weather entry, and upload metadata before parsers/OCR/predictions.
5. Add audit events and tests as features are built, not as a last-minute cleanup.

## Phase 0 - Stabilize The Development Baseline

Purpose: make the app consistently buildable and testable before adding larger feature work.

1. Confirm local env setup.
   - Required frontend env: `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST`.
   - Required Convex/server env: `BETTER_AUTH_SECRET`, `SITE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, Resend sender/API configuration as needed.
   - Document local, preview, and production values without committing secrets.

2. Normalize package commands.
   - Use `bun install`, `bun run lint`, `bun run build`, `bun run test`, and `bunx` for one-off package binaries.
   - Consider updating `package.json` scripts that still call package binaries through non-Bun runners so Bun is the default all the way down.

3. Run baseline validation.
   - `bun run lint`
   - `bun run build`
   - `bun run test`
   - Fix type/build errors before feature work.

4. Fix obvious foundation defects discovered during baseline validation.
   - Verify Convex helper signatures, especially membership/assignment helpers.
   - Confirm generated Convex API matches current schema/functions in a local authenticated Convex environment.
   - Confirm email and Stripe components are registered and configured.

Exit criteria:

- The app builds locally.
- Convex generated files are current in an authenticated local environment.
- Lint/build/test commands are known and documented.
- Any known blocking compile/runtime errors are fixed.

## Phase 1 - Product Boundaries And Acceptance Criteria

Purpose: reduce ambiguity before implementing large workflows.

1. Freeze MVP scope.
   - In MVP: auth, onboarding, garage management, vehicle management, member access, manual runs, manual weather, maintenance/setup logs, datalog/tune uploads, basic per-car dashboard, billing foundation.
   - Out of MVP: OCR, datalog parser automation, AI predictions, marketplace, forums, leaderboards, complex paid-tier metering unless needed for launch.

2. Write acceptance criteria per epic.
   - Auth/account
   - Onboarding/garage creation
   - Invites/access requests
   - Vehicle management
   - Runs/weather
   - Maintenance/setup
   - File uploads
   - Billing/payments
   - Dashboard/analytics

3. Define the permission matrix.
   - Owner: all garage, billing, member, vehicle, run, file, and settings actions.
   - Admin: most garage operations except ownership transfer/billing if desired.
   - Tuner: assigned cars, datalogs/tunes, tuning notes.
   - Worker: assigned/all cars, maintenance/setup/run updates depending on policy.
   - Viewer: read-only.

4. Decide billing model.
   - Example: free tier for one garage/limited vehicles, paid tier for larger garage/file storage/collaboration.
   - Decide whether billing is per user, per garage, or per owner account.

Exit criteria:

- TODO/PRD is converted into explicit MVP acceptance criteria.
- Permission matrix is written and used as the implementation contract.
- Billing model is chosen before payment UI is built.

## Phase 2 - Auth, Session, And Onboarding Verification

Purpose: prove users can safely enter the app and land in the right garage state.

1. Test Better Auth flows manually first.
   - Email/password sign-up.
   - Email/password sign-in.
   - Google sign-in/sign-up.
   - Redirect after protected route access.
   - Session persistence after refresh.
   - Server-side authenticated Convex queries during SSR.
   - Logout and protected route redirect.

2. Add auth route improvements.
   - Add a visible sign-out control in the authenticated shell.
   - Add account/profile route shell.
   - Decide whether forgot-password is MVP; remove dead UI or implement it.
   - Add auth error states for OAuth callback failures.

3. Verify onboarding behavior.
   - New user can choose create garage and reach dashboard.
   - New user can browse first and later resume setup.
   - User with active garage is redirected away from onboarding.
   - Invite token deep-link pre-fills and accepts.
   - Email-scoped invite rejects the wrong signed-in email.

4. Add tests.
   - Unit test redirect sanitizer and onboarding state helpers.
   - Integration-style tests for Convex auth-guarded mutations where feasible.
   - Playwright or similar E2E smoke tests for sign-up/sign-in/onboarding in local/dev.

Exit criteria:

- Auth flows are manually verified.
- Basic auth/onboarding tests exist.
- A new user can create a garage in under 3 minutes.
- Session and protected-route behavior is reliable.

## Phase 3 - Multi-Tenancy, Invites, And Access Control

Purpose: lock down the most important security boundary before adding sensitive data.

1. Complete garage access rules.
   - Centralize permission helpers for garage read, garage write, admin, billing, member management, and car-scoped access.
   - Add helpers for file visibility and run/log mutation permissions before those features are built.
   - Ensure selected-car access works for all future car-scoped queries.

2. Finish invite/access request workflows.
   - Owner/admin can invite by email.
   - Owner/admin can choose role and all-cars vs selected-cars.
   - Invited user receives email and accepts.
   - Uninvited user can request access from garage page.
   - Owner/admin can approve or deny request.
   - Approved selected-car user can only see assigned vehicles.

3. Add member management.
   - List active members.
   - Change role.
   - Change car scope/assignments.
   - Revoke member access.
   - Revoke pending invite.
   - Resend invite.

4. Add audit events for security-sensitive actions.
   - Invite created/accepted/revoked.
   - Access request approved/denied.
   - Member role changed.
   - Member revoked.
   - Car assignment changed.

Exit criteria:

- Role and car-scope rules are enforced in Convex, not only in UI.
- Membership changes are auditable.
- Access-control tests cover cross-garage and selected-car denial cases.

## Phase 4 - Payments And Entitlements

Purpose: make Stripe useful to the app rather than only having checkout actions.

1. Define plans and entitlements.
   - Plan records or constants: free, pro/team, optional enterprise.
   - Limits: garages, vehicles, members, storage, uploads, advanced analytics.
   - Decide whether entitlements attach to `ownerAuthUserId`, `garageId`, or both. For this app, garage-level subscription is likely cleaner because collaboration centers on garages.

2. Complete Stripe configuration.
   - Create Stripe products/prices.
   - Store price IDs in Convex env or a typed config.
   - Configure webhook endpoint and secrets.
   - Verify `@convex-dev/stripe` webhook route registration.
   - Decide success/cancel routes beyond `/?success=true`.

3. Build billing domain functions.
   - `getBillingStatusForGarage`.
   - `createGarageSubscriptionCheckout`.
   - `createBillingPortalSession` if supported/needed.
   - `syncSubscriptionEntitlements` from Stripe state.
   - `hasEntitlement` helper for feature gates.

4. Build billing UI.
   - Garage settings billing tab.
   - Current plan/status.
   - Upgrade/downgrade/cancel/manage billing button.
   - Payment success/cancel screens.

5. Enforce limits.
   - Vehicle creation limit.
   - Member/invite limit.
   - Storage/upload limit.
   - Advanced analytics/prediction gates if phase-gated.

6. Test payments.
   - Stripe test checkout succeeds.
   - Failed/cancelled checkout returns safely.
   - Webhook updates entitlement state.
   - Expired/cancelled subscription removes paid entitlements.

Exit criteria:

- A garage owner can upgrade in Stripe test mode.
- The app can answer “what plan is this garage on?”
- At least one meaningful entitlement is enforced in backend code.

## Phase 5 - Garage And Vehicle Core Completion

Purpose: finish the current core object model before building logs and dashboards on top of it.

1. Garage CRUD.
   - Edit name, slug, description, location.
   - Archive garage with confirmation.
   - Optional ownership transfer.
   - Garage settings route.

2. Vehicle CRUD.
   - Edit vehicle profile.
   - Archive/reactivate vehicle.
   - Vehicle detail route.
   - Vehicle profile summary with class/category-specific fields.

3. Vehicle access integration.
   - Vehicle detail/list queries must respect selected-car assignments.
   - Member assignment UI should show which vehicles each member can access.

4. Dashboard basics.
   - Garage stats: vehicle count, members, pending invites, recent activity.
   - Vehicle cards include recent run/maintenance summary once those features exist.

Exit criteria:

- Garage owners can maintain their garage and vehicles without database-only changes.
- Viewers cannot mutate.
- Selected-car members cannot see unassigned cars.

## Phase 6 - Manual Runs, Weather, Maintenance, And Setup Logs

Purpose: implement the actual racing data workflows that make the app useful.

1. Create shared validation.
   - Use Convex validators and client-side Zod/form validation for the same concepts.
   - Validate ET/MPH ranges, dates, optional incrementals, and weather ranges.

2. Runs.
   - Convex functions: create, update, delete/archive, list by car, get run detail.
   - UI: add run form, run detail, run list/table.
   - Increment `cars.totalPasses` safely when runs are added/removed.
   - Link optional weather snapshot.

3. Weather snapshots.
   - Manual weather entry first.
   - Attach weather to run.
   - Add derived density altitude later if source/API is selected.

4. Maintenance logs.
   - Convex functions: create/update/archive/list by car.
   - UI: maintenance timeline and add/edit form.
   - Track engine pass count/hours and next due values.

5. Suspension/setup logs.
   - Convex functions: create/update/archive/list by car.
   - UI: setup timeline and add/edit form.
   - Keep category-specific setup fields scoped to MVP needs.

6. Timeline.
   - Combined per-car timeline: runs, maintenance, setup, file uploads.
   - Start simple; optimize after usage.

Exit criteria:

- Owner/worker can log runs, maintenance, and setup.
- Tuner/worker/viewer permissions match the matrix.
- Per-car history is usable on mobile.

## Phase 7 - File Storage And Collaboration

Purpose: support datalog and tune workflows without prematurely building parsers.

1. Choose storage implementation.
   - MVP option A: Convex storage for simpler launch.
   - MVP option B: S3 signed upload/download as described in TODO.
   - If using S3, define bucket, IAM, CORS, lifecycle, and signed URL functions.

2. Implement upload metadata.
   - Datalog files: car, optional run, uploader, size/type, visibility, parse status.
   - Tune files: car, optional run, version, status, approval, notes.
   - Soft delete and replacement/supersession.

3. Implement secure file access.
   - Owner/admin full access.
   - Tuner/worker based on car assignment and file visibility.
   - Viewer read-only only where allowed.
   - Download URLs generated by authorized backend functions only.

4. Build UI.
   - Per-car file library.
   - Upload datalog.
   - Upload tune.
   - Tune version list and active tune marker.
   - Owner approval flow if required.

5. Audit uploads.
   - Upload, download if needed, replacement, deletion, active tune changes.

Exit criteria:

- Tuner can upload/view tune or datalog files for assigned cars.
- Unauthorized users cannot access file metadata or download URLs.
- Owner can see and manage file history.

## Phase 8 - MVP Analytics And Dashboards

Purpose: make entered data valuable without relying on AI or parsers.

1. Per-car dashboard.
   - Best ET/trap MPH.
   - Recent runs.
   - Run count over time.
   - Maintenance due summary.
   - Active tune.

2. Charts.
   - ET trend.
   - MPH trend.
   - 60ft trend.
   - Weather overlays when available.

3. Comparisons.
   - Compare selected runs.
   - Show setup/weather/tune differences.

4. Garage dashboard.
   - Recent activity.
   - Top vehicles.
   - Pending maintenance.
   - Collaboration summary.

Exit criteria:

- Dashboard visualizes real run data.
- Users can identify trends from manually entered data.
- Charts are mobile-friendly and fast for common query sizes.

## Phase 9 - Quality, Security, And Ops Hardening

Purpose: turn the MVP into something safe enough for alpha/beta users.

1. Test strategy.
   - Unit tests for pure helpers.
   - Convex function tests for authorization and validators.
   - E2E smoke tests for auth, onboarding, garage, vehicle, run entry, upload, billing.
   - Regression tests for cross-garage access denial.

2. Security review.
   - Every Convex query/mutation checks auth and tenancy.
   - No sensitive data exposed through public preview queries except intentional secret-token invite previews.
   - Rate-limit auth-adjacent or abuse-prone mutations: invites, access requests, uploads.
   - Validate file types/sizes.

3. Audit logging.
   - Implement reusable audit helper.
   - Add audit logs to membership, billing, upload, run deletion, tune activation, and role changes.

4. Observability.
   - PostHog events for activation funnel.
   - Error tracking or exception capture.
   - Convex logs review process.
   - Payment webhook failure monitoring.

5. Data/ops.
   - Backup/recovery strategy.
   - Retention policy.
   - Production env checklist.
   - Deployment runbook.

Exit criteria:

- Critical flows have automated coverage.
- Security-sensitive mutations are audited.
- Production deployment has a checklist and rollback plan.

## Phase 10 - Alpha, Beta, And Launch

Purpose: validate with real users before expanding scope.

1. Internal alpha.
   - Seed/sample garage data.
   - Test with real auth, Stripe test mode, and file upload test assets.
   - Track activation: account, garage, first vehicle, first run, first invite.

2. Closed beta.
   - Invite a small group of racers/tuners.
   - Watch onboarding and run-entry friction.
   - Collect feedback on fields, charts, file workflows, and permissions.

3. Launch readiness.
   - Finalize pricing.
   - Switch Stripe and email to production configuration.
   - Verify legal/privacy language.
   - Confirm backup, monitoring, and support process.

Exit criteria:

- MVP acceptance criteria are met by real users.
- Known launch blockers are resolved or explicitly deferred.
- KPIs are tracked from the first production cohort.

## Recommended Near-Term Sprint Order

### Sprint 1: Foundation and auth proof

- Normalize Bun commands in `package.json`.
- Refresh Convex generated files locally.
- Fix any build/type/runtime defects.
- Add sign-out/profile basics.
- Manually verify auth and onboarding flows.
- Add first auth/onboarding tests.

### Sprint 2: Access control closure

- Finalize permission matrix.
- Add/verify selected-car authorization tests.
- Finish member management actions.
- Add audit helper and audit access changes.
- Verify email invites/access requests end to end.

### Sprint 3: Billing foundation

- Define plans and garage-level entitlements.
- Complete Stripe checkout/webhook/status flow.
- Add billing settings UI.
- Enforce one backend entitlement.
- Test Stripe test-mode happy/cancel/webhook paths.

### Sprint 4: Garage and vehicle completion

- Add garage settings/edit/archive.
- Add vehicle detail/edit/archive.
- Improve dashboard stats.
- Make member assignments visible/editable.

### Sprint 5: Manual racing data

- Build run CRUD.
- Build manual weather snapshots.
- Build maintenance/setup logs.
- Add per-car timeline.

### Sprint 6: Uploads

- Decide Convex storage vs S3 for MVP.
- Build signed upload/download and file metadata functions.
- Build datalog/tune library UI.
- Add file visibility and audit events.

### Sprint 7: Dashboards and alpha hardening

- Build per-car charts.
- Add garage dashboard summaries.
- Add E2E smoke tests.
- Prepare internal alpha checklist.

## Key Decisions To Make Now

- Should subscriptions belong to a garage or a user account? Recommended: garage.
- Is S3 required for MVP, or can Convex storage ship first? Recommended: use the simplest compliant storage for alpha, then migrate if needed.
- Which roles can create runs? Recommended MVP: owner/admin/worker, tuner optional for assigned cars, viewer never.
- Should tuners upload active tunes directly? Recommended MVP: tuner uploads draft, owner/admin can mark active.
- What data is required for a valid run? Recommended MVP: run date, car, 60ft, quarter ET, quarter MPH, with other increments optional.
- Which datalog formats are v1? Recommended: defer parsing and support upload/metadata first.

## Definition Of MVP Done

- A user can sign up/sign in, create a garage, add a vehicle, invite a collaborator, and enforce collaborator access.
- A garage member with proper permissions can add runs, manual weather, maintenance, setup logs, datalogs, and tune files.
- A car dashboard shows run history and basic performance charts.
- Stripe test-mode billing works and at least one paid entitlement is enforced.
- Critical auth, tenancy, billing, and core data flows have tests.
- Sensitive operations are audited.
- The app has a production env/deploy checklist.
