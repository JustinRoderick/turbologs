/** Pure Open-Meteo helpers used by weather enrichment actions. */

/**
 * Pick the hourly archive row closest to a run timestamp.
 * Returns 0 when the times array is empty.
 */
export function pickClosestHourIndex(times: Array<string>, targetMs: number): number {
  if (times.length === 0) {
    return 0;
  }

  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]!);
    if (Number.isNaN(t)) {
      continue;
    }
    const diff = Math.abs(t - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function openMeteoArchiveBaseUrl(apiKey: string | undefined): string {
  if (apiKey) {
    return "https://customer-archive-api.open-meteo.com/v1/archive";
  }
  return "https://archive-api.open-meteo.com/v1/archive";
}
