import { createFileRoute } from "@tanstack/react-router";
import SignInScreen from "./-sign-in";

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: (raw: Record<string, unknown>) => ({
    redirect: typeof raw.redirect === "string" ? raw.redirect : undefined,
  }),
  component: SignInScreen,
});
