# Tracks Plan

**Status:** Implemented

## Model

New table `tracks`:

- `name`, `slug` (optional), `city`, `state`, `country`
- `latitude`, `longitude`, `elevationFt` (from Open-Meteo elevation API when missing)
- `timezone` (IANA string, optional; used for display)
- `surface` (`concrete` | `asphalt` | `other`)
- `isPublicCatalog` (seeded known strips) vs garage-created
- `createdByGarageId` optional for custom tracks
- `createdByAuthUserId`, timestamps

## UX

- Combobox search by name/state while adding a run
- “Add track” dialog: name + city/state + lat/lng (paste from maps) or browser geolocation
- On create, action resolves elevation via Open-Meteo Elevation API

## Seed (initial catalog)

Hand-seed common US strips (e.g. Bandimere, zMAX, Gainesville, Bristol, Indy, Sonoma, Seattle, Maple Grove). Expand later.

## APIs

- `tracks.search({ query })`
- `tracks.listCatalog()`
- `tracks.create({ ... })`
- `tracks.get({ trackId })`
- Internal: `tracks.resolveElevation`
