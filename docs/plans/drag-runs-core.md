# Runs + Dashboard Plan

**Status:** Implemented

## Schema changes on `runs`

Keep existing timing fields; add:

- `trackId: Id<"tracks">` (required for new runs)
- Keep `trackName` as denormalized display cache
- `reactionTime`, `dialInSeconds`, `delayBox`, `result` (`win` | `loss` | `solo` | `redlight` | `unknown`)
- `treeType` (`pro` | `sportsman` | `unknown`)
- `isArchived: boolean`
- `weatherStatus` (`pending` | `ready` | `failed` | `manual`)
- `ecuBrand` optional for convenience when attaching datalog

## Permissions

- Read: active member with vehicle visibility
- Write: owner/admin/worker; tuner if assigned (or allCars)
- Viewer: read only

## Functions

- `runs.create` → insert run, bump `cars.totalPasses`, schedule weather enrichment
- `runs.update`, `runs.archive`
- `runs.get`, `runs.listByCar`, `runs.dashboardByCar`

## Dashboard metrics

- Best 1/4 ET, best trap MPH, best 60ft
- Recent N runs
- ET / MPH / 60ft trend series for charts
- Weather overlay when snapshot exists (DA + temp)

## UI routes

- `/garages/$garageId/vehicles/$vehicleId` — detail + dashboard + run list
- `/garages/$garageId/vehicles/$vehicleId/runs/new` — add run wizard
- `/garages/$garageId/vehicles/$vehicleId/runs/$runId` — run detail
