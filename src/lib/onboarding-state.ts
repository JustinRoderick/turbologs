import type { Doc } from "../../convex/_generated/dataModel";

export function isOnboardingComplete(
  row: Doc<"userOnboarding"> | null,
  hasActiveGarage: boolean,
): boolean {
  if (hasActiveGarage) {
    return true;
  }
  return row?.status === "completed";
}

export function shouldShowResumeBanner(
  row: Doc<"userOnboarding"> | null,
  hasActiveGarage: boolean,
): boolean {
  return !hasActiveGarage && !isOnboardingComplete(row, hasActiveGarage);
}

export function shouldRedirectFromOnboardingPage(
  row: Doc<"userOnboarding"> | null,
  hasActiveGarage: boolean,
): boolean {
  return hasActiveGarage || row?.status === "completed";
}
