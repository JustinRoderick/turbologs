import { createServerFn } from "@tanstack/react-start";
import type { Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { fetchAuthQuery } from "./auth-server";

function onboardingNeedsRedirect(row: Doc<"userOnboarding"> | null): boolean {
  if (row === null) {
    return true;
  }
  return row.status === "not_started" || row.status === "in_progress";
}

export const getDashboardOnboardingGate = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ needsOnboarding: boolean }> => {
    const row = await fetchAuthQuery(api.onboarding.getForCurrentUser, {});
    return { needsOnboarding: onboardingNeedsRedirect(row) };
  },
);
