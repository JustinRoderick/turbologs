import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { isOnboardingComplete } from "@/lib/onboarding-state";
import { Button } from "@/components/ui/button";

export function OnboardingResumeBanner() {
  const onboarding = useQuery(api.onboarding.getForCurrentUser, {});
  const hasActiveGarage = useQuery(api.garageMembers.hasActiveGarageMembership, {});
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || onboarding === undefined || hasActiveGarage === undefined) {
    return null;
  }

  if (isOnboardingComplete(onboarding, hasActiveGarage)) {
    return null;
  }

  const isSkipped = onboarding?.status === "skipped";
  const message = isSkipped
    ? "You’re browsing without a garage. Set one up anytime to log cars, runs, and tunes."
    : onboarding?.status === "in_progress"
      ? "Finish garage setup to unlock your team workspace."
      : "Create or join a garage to start logging runs and tunes with your team.";

  const cta = isSkipped ? "Set up garage" : "Continue setup";

  return (
    <div
      className="border-b border-red-900/40 bg-red-950/50 px-4 py-3"
      role="region"
      aria-label="Garage setup reminder"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm text-red-100/90">{message}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link
              to="/onboarding"
              search={{ step: undefined, token: undefined, intent: undefined }}
            >
              {cta}
            </Link>
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-red-200/80 hover:text-red-50"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss reminder"
            type="button"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
