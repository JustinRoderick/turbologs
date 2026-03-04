import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/anotherPage")({
  component: AnotherPage,
});

function AnotherPage() {
  const { data: currentUser } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));

  return (
    <main className="p-8 flex flex-col gap-16">
      <h1 className="text-4xl font-bold text-center">Convex + Tanstack Start</h1>
      <div className="flex flex-col gap-8 max-w-lg mx-auto">
        <p>This page no longer uses starter number demo functions.</p>
        <p>Authenticated user: {currentUser?.email ?? "Not signed in"}</p>
        <Link to="/" className="text-blue-600 underline hover:no-underline">
          Back
        </Link>
      </div>
    </main>
  );
}
