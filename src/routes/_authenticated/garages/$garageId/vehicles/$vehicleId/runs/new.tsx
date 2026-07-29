import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../../convex/_generated/dataModel";
import { AddRunForm } from "@/components/runs/AddRunForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_authenticated/garages/$garageId/vehicles/$vehicleId/runs/new",
)({
  component: NewRunPage,
});

function NewRunPage() {
  const { garageId, vehicleId } = Route.useParams();
  const carId = vehicleId as Id<"cars">;
  const vehicle = useQuery(api.vehicles.get, { carId });

  if (vehicle === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (vehicle === null || vehicle.role === "viewer") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">You cannot log runs for this vehicle.</p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link to="/garages/$garageId/vehicles/$vehicleId" params={{ garageId, vehicleId }}>
            Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link to="/garages/$garageId/vehicles/$vehicleId" params={{ garageId, vehicleId }}>
            <ArrowLeft className="size-4" />
            {vehicle.name}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Log a drag run</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the track, enter times, and we’ll attach weather automatically.
        </p>
      </div>
      <AddRunForm garageId={garageId as Id<"garages">} carId={carId} />
    </div>
  );
}
