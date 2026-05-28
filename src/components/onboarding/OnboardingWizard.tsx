import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "@posthog/react";
import { Building2, Compass, Mail, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  ONBOARDING_ANALYTICS_VERSION,
  captureOnboardingEvent,
} from "@/lib/onboarding-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { convexErrorMessage, resolveInitialStep } from "./types";
import type { OnboardingSearch, OnboardingStepId } from "./types";

type OnboardingWizardProps = {
  search: OnboardingSearch;
};

export function OnboardingWizard({ search }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const onboarding = useQuery(api.onboarding.getForCurrentUser, {});
  const setStep = useMutation(api.onboarding.setOnboardingStep);
  const markSkipped = useMutation(api.onboarding.markSkipped);
  const createGarage = useMutation(api.garages.createGarage);
  const acceptInvite = useMutation(api.garageInvites.acceptGarageInvite);

  const [step, setLocalStep] = useState<OnboardingStepId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [garageName, setGarageName] = useState("");
  const [garageSlug, setGarageSlug] = useState("");
  const [garageDescription, setGarageDescription] = useState("");
  const [garageLocation, setGarageLocation] = useState("");
  const [inviteToken, setInviteToken] = useState(search.token?.trim() ?? "");

  const startedRef = useRef(false);
  const lastTrackedStep = useRef<OnboardingStepId | null>(null);

  const activeStep = step ?? (onboarding !== undefined ? resolveInitialStep(onboarding, search) : null);

  useEffect(() => {
    if (onboarding === undefined) {
      return;
    }
    if (onboarding?.draftGarage) {
      setGarageName(onboarding.draftGarage.name);
      setGarageSlug(onboarding.draftGarage.slug ?? "");
      setGarageDescription(onboarding.draftGarage.description ?? "");
      setGarageLocation(onboarding.draftGarage.location ?? "");
    }
    if (onboarding?.draftInviteToken) {
      setInviteToken(onboarding.draftInviteToken);
    }
  }, [onboarding]);

  useEffect(() => {
    if (search.token) {
      setInviteToken(search.token.trim());
    }
  }, [search.token]);

  useEffect(() => {
    if (activeStep === null || startedRef.current) {
      return;
    }
    startedRef.current = true;
    captureOnboardingEvent(posthog, "onboarding_started", {
      version: ONBOARDING_ANALYTICS_VERSION,
    });
  }, [activeStep, posthog]);

  useEffect(() => {
    if (activeStep === null || lastTrackedStep.current === activeStep) {
      return;
    }
    lastTrackedStep.current = activeStep;
    captureOnboardingEvent(posthog, "onboarding_step_viewed", { step_id: activeStep });
  }, [activeStep, posthog]);

  const invitePreview = useQuery(
    api.garageInvites.getInvitePreviewByToken,
    inviteToken.trim().length > 0 ? { token: inviteToken.trim() } : "skip",
  );

  if (onboarding === undefined || activeStep === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  async function persistStep(
    nextStep: OnboardingStepId,
    extras?: {
      pathChoice?: "create" | "invite" | "browse";
      draftGarage?: Doc<"userOnboarding">["draftGarage"];
      draftInviteToken?: string;
    },
  ) {
    setError(null);
    await setStep({
      stepId: nextStep,
      ...extras,
    });
    setLocalStep(nextStep);
  }

  async function goToChoosePath() {
    await persistStep("choose_path");
  }

  async function handleWelcomeContinue() {
    await persistStep("choose_path");
  }

  async function handlePathCreate() {
    captureOnboardingEvent(posthog, "onboarding_path_selected", { path: "create" });
    await persistStep("create_garage", { pathChoice: "create" });
  }

  async function handlePathInvite() {
    captureOnboardingEvent(posthog, "onboarding_path_selected", { path: "invite" });
    await persistStep("invite", { pathChoice: "invite" });
  }

  async function handlePathBrowse() {
    captureOnboardingEvent(posthog, "onboarding_path_selected", { path: "browse" });
    setSubmitting(true);
    setError(null);
    try {
      await markSkipped({ pathChoice: "browse" });
      captureOnboardingEvent(posthog, "onboarding_skipped_browse");
      toast.success("You can set up a garage anytime from the banner or account settings.");
      void navigate({ to: "/" });
    } catch (e) {
      setError(convexErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGarage(event: React.FormEvent) {
    event.preventDefault();
    const name = garageName.trim();
    if (!name) {
      setError("Garage name is required");
      return;
    }

    const draftGarage = {
      name,
      slug: garageSlug.trim() || undefined,
      description: garageDescription.trim() || undefined,
      location: garageLocation.trim() || undefined,
    };

    setSubmitting(true);
    setError(null);
    try {
      await persistStep("create_garage", { pathChoice: "create", draftGarage });
      await createGarage(draftGarage);
      captureOnboardingEvent(posthog, "onboarding_garage_created", {
        onboarding_version: ONBOARDING_ANALYTICS_VERSION,
      });
      captureOnboardingEvent(posthog, "onboarding_completed", { reason: "membership" });
      toast.success("Garage created — you're all set.");
      void navigate({ to: "/dashboard" });
    } catch (e) {
      setError(convexErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptInvite(event: React.FormEvent) {
    event.preventDefault();
    const token = inviteToken.trim();
    if (!token) {
      setError("Invite token is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await persistStep("invite", { pathChoice: "invite", draftInviteToken: token });
      await acceptInvite({ token });
      captureOnboardingEvent(posthog, "onboarding_invite_accepted");
      captureOnboardingEvent(posthog, "onboarding_completed", { reason: "membership" });
      toast.success("You joined the garage.");
      void navigate({ to: "/dashboard" });
    } catch (e) {
      setError(convexErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      {activeStep === "welcome" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome to TurboLogs</CardTitle>
            <CardDescription>
              Organize cars, runs, and tunes in a garage—or explore community areas first. You can
              finish setup anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void handleWelcomeContinue()} type="button">
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeStep === "choose_path" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">How do you want to get started?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PathCard
              icon={<Building2 className="size-5 text-red-400" />}
              title="Create a garage"
              description="I’m a team lead or owner and want my own space."
              onClick={() => void handlePathCreate()}
              disabled={submitting}
            />
            <PathCard
              icon={<Mail className="size-5 text-red-400" />}
              title="I have an invite"
              description="Someone sent me a link or token."
              onClick={() => void handlePathInvite()}
              disabled={submitting}
            />
            <PathCard
              icon={<Compass className="size-5 text-red-400" />}
              title="Browse first"
              description="I’ll explore forums and events without a garage."
              onClick={() => void handlePathBrowse()}
              disabled={submitting}
            />
            <BackButton onClick={() => void persistStep("welcome")} disabled={submitting} />
          </CardContent>
        </Card>
      ) : null}

      {activeStep === "create_garage" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Name your garage</CardTitle>
            <CardDescription>Required fields are marked. Slug must be unique if provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(e) => void handleCreateGarage(e)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="garage-name">Name</FieldLabel>
                  <Input
                    id="garage-name"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="Midwest Motorsports"
                    required
                    autoComplete="organization"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="garage-slug">Slug (optional)</FieldLabel>
                  <Input
                    id="garage-slug"
                    value={garageSlug}
                    onChange={(e) => setGarageSlug(e.target.value)}
                    placeholder="midwest-ms"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="garage-description">Description</FieldLabel>
                  <Textarea
                    id="garage-description"
                    value={garageDescription}
                    onChange={(e) => setGarageDescription(e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="garage-location">Location</FieldLabel>
                  <Input
                    id="garage-location"
                    value={garageLocation}
                    onChange={(e) => setGarageLocation(e.target.value)}
                    placeholder="City, state"
                  />
                </Field>
              </FieldGroup>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-col gap-2">
                <Button className="w-full" disabled={submitting} type="submit">
                  {submitting ? "Creating…" : "Create garage"}
                </Button>
                <BackButton onClick={() => void goToChoosePath()} disabled={submitting} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeStep === "invite" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Join with an invite</CardTitle>
            <CardDescription>
              Paste the token from your invite link. If the invite was emailed to a specific address,
              sign in with that email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(e) => void handleAcceptInvite(e)}>
              <Field>
                <FieldLabel htmlFor="invite-token">Invite token</FieldLabel>
                <Input
                  id="invite-token"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="Paste invite token"
                  autoComplete="off"
                />
              </Field>
              {invitePreview === undefined && inviteToken.trim() ? (
                <p className="text-xs text-muted-foreground">Checking invite…</p>
              ) : null}
              {invitePreview === null && inviteToken.trim() ? (
                <p className="text-sm text-destructive">Invite not found. Check the token and try again.</p>
              ) : null}
              {invitePreview ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{invitePreview.garageName}</p>
                  <p className="text-muted-foreground capitalize">
                    Role: {invitePreview.role}
                    {invitePreview.isExpired ? " · Expired" : ""}
                    {invitePreview.inviteStatus !== "pending" ? ` · ${invitePreview.inviteStatus}` : ""}
                  </p>
                </div>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-col gap-2">
                <Button className="w-full" disabled={submitting} type="submit">
                  {submitting ? "Joining…" : "Join garage"}
                </Button>
                <BackButton onClick={() => void goToChoosePath()} disabled={submitting} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeStep === "done" || activeStep === "first_car" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">You&apos;re in</CardTitle>
            <CardDescription>Your account is ready. Head to the dashboard to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void navigate({ to: "/dashboard" })} type="button">
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PathCard({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-xl border border-border/80 bg-card/50 p-4 text-left transition-colors hover:border-red-800/50 hover:bg-red-950/20 disabled:opacity-50"
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function BackButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="w-fit gap-1 text-muted-foreground"
      onClick={onClick}
      disabled={disabled}
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}
