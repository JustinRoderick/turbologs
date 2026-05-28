import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getOnboardingGate } from "@/lib/onboarding-gate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (raw: Record<string, unknown>) => ({
    step: typeof raw.step === "string" ? raw.step : undefined,
    token: typeof raw.token === "string" ? raw.token : undefined,
    intent: typeof raw.intent === "string" ? raw.intent : undefined,
  }),
  beforeLoad: async () => {
    const gate = await getOnboardingGate();
    if (gate.shouldRedirectFromOnboarding) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const search = Route.useSearch();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <OnboardingWizard search={search} />
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
