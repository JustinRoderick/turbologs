import type { PostHog } from "posthog-js";

export const ONBOARDING_ANALYTICS_VERSION = 1;

export function captureOnboardingEvent(
  posthog: PostHog | undefined,
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!posthog) {
    return;
  }
  posthog.capture(event, properties);
}
