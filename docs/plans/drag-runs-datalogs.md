# Datalog Storage Plan

**Status:** Implemented (Convex Storage MVP)

## MVP storage

Use **Convex Storage** (`storageProvider: "convex_storage"`). Schema already supports S3 fields for a later migration.

## Metadata

On `datalogFiles`:

- Existing storage + visibility + parseStatus fields
- Add `ecuBrand`: `fueltech` | `holley` | `haltech` | `other`
- Add `ecuSoftware` optional string
- `parseStatus` stays `pending` until a real parser exists

## Flow

1. `datalogFiles.generateUploadUrl` (auth + car write access)
2. Client POSTs file to Convex upload URL
3. `datalogFiles.attachToRun` saves metadata linked to `runId`
4. `datalogFiles.getUrl` returns signed download URL after access check

## Viewing

- Download button + file name/size/ECU badge
- Image/PDF preview when content-type allows
- No FuelTech/Holley/Haltech binary chart parsing in MVP

## Limits

- Max 50MB per file (client + server check)
- Allowed: common log/binary/csv/zip mime types + octet-stream
