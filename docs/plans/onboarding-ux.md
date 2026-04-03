# Onboarding UX specification

This document expands the product and technical plan for first-time (and returning) logged-in users who may create a garage, join via invite, or browse community features without a garage. It aligns with [TODO.md](./TODO.md) (MVP garage flows; Phase 3 forums/community).

## Principles

1. **Optional onboarding** — Users can use global surfaces (home, future forums/events) without creating or joining a garage. Garage-scoped data (cars, runs, datalogs, garage settings) stays behind membership.
2. **Two success paths for “garage setup”** — Create a garage (owner) **or** accept an invite / be added as a member. Either yields an active `garageMembers` row.
3. **Server-authoritative progress** — Step and draft state live in Convex (`userOnboarding`) so users can resume across devices and sessions. Do not rely on `localStorage` alone for “first time” or skip state.
4. **Soft surfaces, hard gates only where intended** — Prefer a dedicated `/onboarding` route plus a dismissible resume banner, not a global redirect that blocks the entire app. Garage-only routes may show their own empty states later.

## User states

| State | Rule |
|--------|------|
| **Anonymous** | Not signed in; no onboarding queries/mutations (except invite preview by secret token). |
| **Authenticated, no active garage** | No `garageMembers` document with `status === "active"` for this `authUserId`. |
| **Authenticated, has garage** | At least one active membership. Onboarding is auto-marked **completed** when membership is created (create garage or accept invite). |

### Completion rules

- **Auto-complete** — On successful `createGarage` or `acceptGarageInvite`, sync onboarding to `completed` (and `completedAt`). If no `userOnboarding` row exists yet, insert one in `completed` state so the UI never shows a stale wizard.
- **Skipped / browse first** — User chooses “Browse without a garage”; store `status: "skipped"` and `skippedAt`. Do not show the full-screen wizard on every visit; show a **resume** banner and a **Settings / account** entry (when those exist) linking to `/onboarding`.
- **In progress** — User started the wizard; `status: "in_progress"` with `currentStepId` and optional drafts. Resume from last step.

## Step flow (UX)

### Step IDs (machine)

| `currentStepId` | Purpose |
|-----------------|--------|
| `welcome` | Value prop: garage vs community; Continue. |
| `choose_path` | Branch: create garage / have invite / browse only. |
| `create_garage` | Short form: name (required), slug, description, location (optional). Submits `garages.createGarage`. |
| `invite` | Paste invite token (or land with `?step=invite&token=`). Preview + `acceptGarageInvite`. |
| `first_car` | Reserved for a future “add first car” step inside the wizard; MVP can jump to success after garage membership. |
| `done` | Terminal UI state after `completed` (optional success screen). |

### Copy outline (draft for design)

**Welcome**

- **Title:** Welcome to TurboLogs
- **Body:** Organize cars, runs, and tunes in a garage—or explore community areas first. You can finish setup anytime.
- **Primary:** Continue
- **Secondary:** (none; avoid clutter)

**Choose path**

- **Title:** How do you want to get started?
- **Card A — Create a garage:** “I’m a team lead or owner and want my own space.”
- **Card B — I have an invite:** “Someone sent me a link or token.”
- **Card C — Browse first:** “I’ll explore forums and events without a garage.”

**Create garage**

- **Title:** Name your garage
- **Fields:** Name (required); Slug (optional, URL-friendly); Description; Location
- **Errors:** Slug taken (from Convex), validation messages inline
- **Primary:** Create garage
- **Back:** Returns to choose path

**Invite**

- **Title:** Join with an invite
- **Field:** Token (paste)
- **Helper:** If the invite was emailed to a specific address, you must be signed in with that email.
- **Primary:** Join garage
- **Back:** Returns to choose path

**Success (post-membership)**

- **Title:** You’re in
- **Body:** Short confirmation; link to home (and later dashboard).

**Browse first**

- After confirm: toast or inline “You can set up a garage anytime from the banner or account settings.” Navigate to `/`.

## Data model (`userOnboarding`)

Single document per user, keyed by `authUserId` (same identifier as `garageMembers.memberAuthUserId` / `requireAuthUserId`).

| Field | Type | Notes |
|-------|------|--------|
| `authUserId` | `string` | Unique via index `by_auth_user_id`. |
| `status` | `not_started` \| `in_progress` \| `completed` \| `skipped` | `not_started` rarely stored; prefer implicit until first write. |
| `currentStepId` | union of step IDs | Terminal: `done` when completed. |
| `pathChoice` | optional `create` \| `invite` \| `browse` | Analytics + resume context. |
| `draftGarage` | optional `{ name, slug?, description?, location? }` | Partial create form. |
| `draftInviteToken` | optional `string` | Saved token before accept. |
| `onboardingVersion` | `number` | Bump when flow changes; enables migrations. |
| `updatedAt` | `number` | `Date.now()`. |
| `completedAt` | optional `number` | Set when `completed`. |
| `skippedAt` | optional `number` | Set when `skipped`. |

### Convex functions (public)

- `onboarding.getForCurrentUser` — Returns `null` if no row (treat UI as “no persisted state yet”).
- `onboarding.setOnboardingStep` — Upsert; advances step and optional drafts.
- `onboarding.markSkipped` — `skipped` + `skippedAt`; optional `pathChoice: "browse"`.
- `onboarding.markCompletedExplicit` — Rare; optional for future “Done” without garage (not used in MVP garage path).
- `garageMembers.hasActiveGarageMembership` — Boolean for gating banner and wizard.
- `garageInvites.getInvitePreviewByToken` — Public query; token acts as secret capability.
- `garageInvites.acceptGarageInvite` — Authenticated; validates pending, non-expired, email match if present.

### Internal sync

- `onboardingSync.completeOnboardingAfterGarageMembership(ctx, authUserId)` — Called from `createGarage` and `acceptGarageInvite`.

### Index addition

- `garageMembers`: `by_member_auth_user_id_and_status` on `["memberAuthUserId", "status"]` for efficient “has any active membership” checks.

## Routing and triggers

| Trigger | Behavior |
|---------|----------|
| User visits `/onboarding` | Authenticated: show wizard from `currentStepId` or start at `welcome` and persist on first step change. Unauthenticated: prompt to sign in. |
| Search params | `?step=invite&token=…` deep-links to invite step with token prefilled. |
| After sign-up / sign-in (future) | Optional soft navigate to `/onboarding` if `!hasActiveGarage && onboarding.status` not `completed` and not `skipped`. |
| Resume banner | Shown when authenticated, `!hasActiveGarage`, and onboarding is `in_progress` or `skipped` (or no row yet—product choice: MVP shows banner only when row exists and not completed; optional expansion to “never started” with CTA). **Implemented:** banner when `!hasActiveGarage` and onboarding is not `completed`. |
| Settings / account | Link “Garage setup” → `/onboarding` (add when account UI exists). |

## Edge cases

1. **User accepts invite while a draft create form exists** — Membership sync sets onboarding `completed`; drafts are irrelevant; next load shows no wizard banner (for garage completion path).
2. **User creates garage outside the wizard** — Same: sync on `createGarage` marks completed.
3. **Invite expired or revoked** — Show clear error; keep user on invite step with ability to change path.
4. **Invite email mismatch** — If `garageInvites.email` is set, require signed-in user email to match (case-insensitive); error explains the constraint.
5. **Duplicate membership** — If already an active member, reject accept with a friendly message (or no-op success; implementation chooses strict error for clarity).
6. **Selected cars scope** — Invites may use `carScope: "selected_cars"`; member is created with `allCars: false`; car assignments are owner-managed later (no change to invite schema in MVP).

## Analytics (recommended events)

PostHog or equivalent:

- `onboarding_started` — `{ version }`
- `onboarding_step_viewed` — `{ step_id }`
- `onboarding_path_selected` — `{ path: create | invite | browse }`
- `onboarding_garage_created` — `{ onboarding_version }`
- `onboarding_invite_accepted`
- `onboarding_skipped_browse`
- `onboarding_completed` — `{ reason: membership | explicit }`

**KPI alignment (from TODO.md):** Track “garage + first car” separately (e.g. `first_car_created`) from `onboarding_completed`.

## Implementation map

| Area | Location |
|------|----------|
| Schema | `convex/schema.ts` |
| Onboarding API | `convex/onboarding.ts` |
| Membership helper query | `convex/garageMembers.ts` |
| Invite preview + accept | `convex/garageInvites.ts` |
| Sync helper | `convex/onboardingSync.ts` |
| `createGarage` hook | `convex/garages.ts` |
| UI | `src/routes/onboarding.tsx`, `src/components/onboarding/OnboardingResumeBanner.tsx` |
| Root shell | `src/routes/__root.tsx` |

## Future work

- Soft redirect after OAuth to `/onboarding` when eligible.
- Full sign-in/up routes wired in TanStack Router (currently auth UI may be minimal).
- Forums/events routes; banner copy can mention them explicitly.
- `first_car` step wired to car creation mutation once UX is ready.
- `userOnboarding` migration when `onboardingVersion` increments.
