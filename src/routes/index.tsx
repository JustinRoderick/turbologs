import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { Home } from "./-home";

export const Route = createFileRoute("/")({
  component: Home,
  // add seo here
});
