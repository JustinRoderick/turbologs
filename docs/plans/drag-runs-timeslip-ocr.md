# Time-Slip OCR Plan

**Status:** Implemented (requires `OPENAI_API_KEY` for OCR; manual entry still works without it)

## Flow

1. User uploads time-slip photo (Convex Storage)
2. Create `timeSlipExtractions` row with `needs_review` / `processing`
3. Action calls OpenAI-compatible vision model (`OPENAI_API_KEY`, model `gpt-4o-mini` or `gpt-4o`)
4. Parse structured JSON: 60ft, 330, 1/8 ET/MPH, 1000, 1/4 ET/MPH, RT, dial-in, lane, car number
5. User reviews/edits fields → Apply to run (or create run from extraction)

## Env

- `OPENAI_API_KEY` (Convex env)
- Optional `OPENAI_BASE_URL` for compatible providers

## Safety

- Never auto-apply without human confirmation
- Store `ocrRawText` + `confidence`
- If no API key: upload still works; status `failed` with message to enter manually

## UI

- On add-run and run-detail: “Scan time slip” panel
- Review form with confidence indicators
- Apply button patches run timing fields
