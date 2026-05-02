import { createFileRoute } from "@tanstack/react-router";
import { SignInScreen } from "./-sign-in";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInScreen,
});
