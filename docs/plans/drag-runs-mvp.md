# Drag Runs MVP — Master Plan

## Goal

Let garage members log drag-racing passes against a known track, auto-enrich weather (including density altitude), attach datalogs, optionally OCR a time slip, and see a per-vehicle performance dashboard.

## Defaults (open questions resolved for MVP)

| Question | Decision | Rationale |
| --- | --- | --- |
| Track temperature | Auto-estimate from Open-Meteo `soil_temperature_0_to_7cm`, allow manual override | No public API exposes asphalt IR; soil skin is the best proxy |
| Storage | Convex Storage for MVP; schema already supports S3 | Works without AWS credentials; S3 can be enabled later |
| ECU “view” | Store/download/view raw files with ECU metadata; no proprietary parsers yet | FuelTech/Holley/Haltech formats need vendor tooling |
| OCR | Multimodal vision via OpenAI-compatible API; human review required before applying | Best structured extraction for time slips without Textract setup |
| Weather provider | Open-Meteo Historical + Forecast Archive | Lat/lng + timestamp, free for non-commercial; commercial needs `OPEN_METEO_API_KEY` |
| Who can create runs | Owner, admin, worker; tuner optional (allowed for assigned cars); viewer never | Matches roadmap recommendation |
| Required run fields | Track, run date/time, 60ft, 1/4 ET, 1/4 MPH | Dial-in, RT, increments optional |

## Workstreams

1. [Tracks](./drag-runs-tracks.md)
2. [Runs + dashboard](./drag-runs-core.md)
3. [Weather enrichment](./drag-runs-weather.md)
4. [Datalog storage](./drag-runs-datalogs.md)
5. [Time-slip OCR](./drag-runs-timeslip-ocr.md)

## Delivery order

1. Schema extensions (`tracks`, run fields, weather enrichment status)
2. Tracks CRUD + search
3. Runs CRUD + vehicle detail/dashboard routes
4. Weather action (Open-Meteo + DA)
5. Datalog upload/download via Convex Storage
6. Time-slip image upload + OCR review flow

## MVP done when

- [x] User picks a track (or creates one with lat/lng)
- [x] User logs a drag run with core timing fields
- [x] Weather + DA auto-attach (or manual fallback if API unavailable)
- [x] User can upload a datalog tagged with ECU brand
- [x] User can upload a time-slip photo, review OCR fields, apply to run
- [x] Vehicle page shows run history + best ET/MPH charts

## Status — implemented (2026-07-29)

Backend: `convex/tracks.ts`, `runs.ts`, `weatherActions.ts`, `datalogFiles.ts`, `timeSlip*`.
Frontend: vehicle dashboard, add-run form, run detail + attachments.

### Local follow-up

1. Run `bunx convex codegen` or `bun run dev` so schema/API sync to your Convex deployment (codegen may fail without Convex network/auth).
2. Set Convex env: optional `OPEN_METEO_API_KEY`, `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`, `OPENAI_VISION_MODEL`) for OCR.
3. Smoke-test: seed tracks → log run → confirm weather → upload datalog → OCR slip.
