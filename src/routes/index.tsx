import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { Home } from "./-home";

export const Route = createFileRoute("/")({
  component: Home,
  /*
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.auth.getCurrentUser, {}),
      ),
      // Load multiple queries in parallel if needed
    ]);
  },
  */
});
