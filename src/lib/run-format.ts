export function formatEt(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
  return seconds.toFixed(3);
}

export function formatMph(mph: number | null | undefined): string {
  if (mph === null || mph === undefined || Number.isNaN(mph)) return "—";
  return mph.toFixed(2);
}

export function formatRunDate(runAt: number): string {
  return new Date(runAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ECU_BRAND_OPTIONS = [
  { value: "fueltech", label: "FuelTech" },
  { value: "holley", label: "Holley" },
  { value: "haltech", label: "Haltech" },
  { value: "other", label: "Other" },
] as const;

export type EcuBrand = (typeof ECU_BRAND_OPTIONS)[number]["value"];
