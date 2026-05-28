import type { Doc } from "../../../convex/_generated/dataModel";

export type OnboardingStepId =
  | "welcome"
  | "choose_path"
  | "create_garage"
  | "invite"
  | "first_car"
  | "done";

export type OnboardingSearch = {
  step?: string;
  token?: string;
  intent?: string;
};

export function resolveInitialStep(
  onboarding: Doc<"userOnboarding"> | null,
  search: OnboardingSearch,
): OnboardingStepId {
  if (search.step === "invite" || search.intent === "join") {
    return "invite";
  }
  if (search.intent === "create") {
    return "create_garage";
  }

  if (onboarding?.status === "in_progress" && onboarding.currentStepId !== "done") {
    return onboarding.currentStepId;
  }

  if (onboarding?.status === "skipped") {
    return "choose_path";
  }

  return "welcome";
}

export function convexErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
