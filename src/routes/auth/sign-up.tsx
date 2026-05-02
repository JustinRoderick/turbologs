import { createFileRoute } from "@tanstack/react-router";
import { SignUpScreen } from "./-sign-up";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpScreen,
});
