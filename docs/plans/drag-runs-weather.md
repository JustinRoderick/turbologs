# Weather Enrichment Plan

**Status:** Implemented

## Provider

**Open-Meteo** Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`).

For commercial production: set `OPEN_METEO_API_KEY` and use `https://customer-archive-api.open-meteo.com`.

## Requested hourly fields

- `temperature_2m`
- `relative_humidity_2m`
- `dewpoint_2m`
- `surface_pressure` (or `pressure_msl`)
- `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`
- `precipitation`
- `shortwave_radiation`
- `soil_temperature_0_to_7cm` → **track temp estimate**
- `elevation` from response / Elevation API

Units: `temperature_unit=fahrenheit`, `wind_speed_unit=mph`, `precipitation_unit=inch`

## Density altitude

Computed server-side (not provided by API):

1. Convert F → C, inHg ↔ hPa as needed
2. Pressure altitude from station/surface pressure
3. DA via standard aviation approximation using temp + dew point / virtual temp

Store on `weatherSnapshots`:

- Existing fields + `dewPointF`, `windGustMph`, `precipitationIn`, `shortwaveRadiation`, `elevationFt`
- `trackTempSource`: `estimated_soil` | `manual` | `unknown`
- `provider`: `open_meteo`
- `rawPayloadHash` optional for debugging

## Flow

1. `runs.create` inserts run with `weatherStatus: "pending"`
2. Schedules `internal.weather.enrichRunWeather`
3. Action fetches Open-Meteo for track lat/lng + run hour
4. Mutation writes immutable `weatherSnapshots` row and patches run

Manual override: user can edit track temp / full snapshot on run detail.
