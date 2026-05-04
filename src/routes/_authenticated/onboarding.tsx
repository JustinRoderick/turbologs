import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardOnboardingGate } from "@/lib/dashboard-gate";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (raw: Record<string, unknown>) => ({
    intent: typeof raw.intent === "string" ? raw.intent : undefined,
  }),
  beforeLoad: async () => {
    const gate = await getDashboardOnboardingGate();
    if (!gate.needsOnboarding) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { intent } = Route.useSearch();
  const onboarding = useQuery(api.onboarding.getForCurrentUser, {});
  const setStep = useMutation(api.onboarding.setOnboardingStep);

  const headline =
    intent === "join"
      ? "Join a garage"
      : intent === "create"
        ? "Create your first garage"
        : "Finish setup";

  const sub =
    intent === "join"
      ? "Use an invite from a garage admin to join their team. You can paste your invite token when that flow is wired up."
      : intent === "create"
        ? "Start the onboarding flow to create a garage and add your first car."
        : "Complete onboarding to unlock your dashboard and garages.";

  async function handleStart() {
    await setStep({ stepId: "welcome" });
  }

  if (onboarding === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-12">
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="text-xl">{headline}</CardTitle>
          <CardDescription className="text-gray-400">{sub}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {onboarding === null ? (
            <p className="text-sm text-gray-300">
              Welcome to Turbologs. Continue to record your onboarding progress and set up your
              workspace.
            </p>
          ) : (
            <p className="text-sm text-gray-300">
              Current step:{" "}
              <span className="font-medium text-gray-100">{onboarding.currentStepId}</span>
              {onboarding.status === "in_progress" ? " (in progress)" : null}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleStart()}
              type="button"
            >
              {onboarding === null ? "Start onboarding" : "Save progress (welcome step)"}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Return home</Link>
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Completing onboarding marks your account ready for garages and team invites.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
