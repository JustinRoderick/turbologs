/** Shared aggregation helpers for vehicle/garage dashboards. */

export function monthKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}`;
}

export function lastNMonthKeys(nowMs: number, count: number): Array<string> {
  const keys: Array<string> = [];
  const d = new Date(nowMs);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const cursor = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    keys.push(monthKeyFromMs(cursor.getTime()));
  }
  return keys;
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  if (!year || !month) return key;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export function average(values: Array<number>): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / values.length) * 1000) / 1000;
}

export type NamedCount = { name: string; count: number };

export function topNamedCounts(
  counts: Map<string, number>,
  limit: number,
): Array<NamedCount> {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}
