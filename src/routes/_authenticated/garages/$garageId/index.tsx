import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { VehicleCard, type VehicleCardData } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/garages/$garageId/")({
  component: GaragePage,
});

function GaragePage() {
  const { garageId } = Route.useParams();
  const garageIdTyped = garageId as Id<"garages">;

  const garage = useQuery(api.vehicles.getGarageSummary, { garageId: garageIdTyped });
  const vehicles = useQuery(api.vehicles.listByGarage, { garageId: garageIdTyped });

  if (garage === undefined || vehicles === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading garage…</p>
      </div>
    );
  }

  if (garage === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Garage not found</CardTitle>
            <CardDescription>You may not have access to this garage.</CardDescription>
          </CardHeader>
        </Card>
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const canAddVehicle = garage.role !== "viewer";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{garage.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            Your role: {garage.role}
            {garage.slug ? ` · ${garage.slug}` : ""}
          </p>
        </div>
        {canAddVehicle ? (
          <Button asChild>
            <Link to="/garages/$garageId/vehicles/new" params={{ garageId }}>
              <Plus className="size-4" />
              Add vehicle
            </Link>
          </Button>
        ) : null}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Vehicles</h2>
        {vehicles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No vehicles yet</CardTitle>
              <CardDescription>
                Add your first vehicle to start logging runs, tunes, and setup data for this garage.
              </CardDescription>
            </CardHeader>
            {canAddVehicle ? (
              <div className="px-6 pb-6">
                <Button asChild>
                  <Link to="/garages/$garageId/vehicles/new" params={{ garageId }}>
                    <Plus className="size-4" />
                    Add vehicle
                  </Link>
                </Button>
              </div>
            ) : null}
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle: VehicleCardData) => (
              <li key={vehicle._id}>
                <VehicleCard vehicle={vehicle} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="link" className="w-fit px-0" asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
