import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building2, Plus, UserPlus } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
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

type MyGarageRow = {
  garageId: Id<"garages">;
  name: string;
  slug?: string | undefined;
  role: "owner" | "admin" | "tuner" | "worker" | "viewer";
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const gate = await getDashboardOnboardingGate();
    if (gate.needsOnboarding) {
      throw redirect({ to: "/onboarding", search: { intent: undefined } });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const garages = useQuery(api.garageMembers.listMyActiveGarages, {});

  if (garages === undefined) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading your garages…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Garages you own or belong to as an active member.
        </p>
      </header>

      {garages.length === 0 ? (
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="size-5 text-red-500" />
              No garages yet
            </CardTitle>
            <CardDescription className="text-gray-400">
              Create a new garage or join one with an invite to start logging runs and tunes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link
                to="/onboarding"
                search={{ intent: "create" }}
                className="inline-flex items-center gap-2"
              >
                <Plus className="size-4" />
                Create a garage
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-gray-700">
              <Link
                to="/onboarding"
                search={{ intent: "join" }}
                className="inline-flex items-center gap-2"
              >
                <UserPlus className="size-4" />
                Join a garage
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {garages.map((g: MyGarageRow) => (
            <li key={g.garageId}>
              <Card className="border-gray-800 bg-gray-900 transition-colors hover:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <CardDescription className="capitalize text-gray-400">
                    Role: {g.role}
                    {g.slug ? ` · ${g.slug}` : ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
