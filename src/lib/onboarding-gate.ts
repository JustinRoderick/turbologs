import { createServerFn } from "@tanstack/react-start";
import { api } from "../../convex/_generated/api";
import { fetchAuthQuery } from "./auth-server";
import { shouldRedirectFromOnboardingPage, shouldShowResumeBanner } from "./onboarding-state";

export {
  isOnboardingComplete,
  shouldRedirectFromOnboardingPage,
  shouldShowResumeBanner,
} from "./onboarding-state";

export const getOnboardingGate = createServerFn({ method: "GET" }).handler(async () => {
  const [onboarding, hasActiveGarage] = await Promise.all([
    fetchAuthQuery(api.onboarding.getForCurrentUser, {}),
    fetchAuthQuery(api.garageMembers.hasActiveGarageMembership, {}),
  ]);

  return {
    onboarding,
    hasActiveGarage,
    showResumeBanner: shouldShowResumeBanner(onboarding, hasActiveGarage),
    shouldRedirectFromOnboarding: shouldRedirectFromOnboardingPage(onboarding, hasActiveGarage),
  };
});
