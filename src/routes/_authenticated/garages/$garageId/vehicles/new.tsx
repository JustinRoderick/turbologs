import { createFileRoute, Link } from "@tanstack/react-router";
import { AddVehicleForm } from "@/components/vehicles/AddVehicleForm";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/garages/$garageId/vehicles/new")({
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const { garageId } = Route.useParams();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Add vehicle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a motorsport category to see the fields relevant to your discipline.
        </p>
      </header>

      <AddVehicleForm garageId={garageId as Id<"garages">} />

      <Button variant="link" className="w-fit px-0" asChild>
        <Link to="/garages/$garageId" params={{ garageId }}>
          Back to garage
        </Link>
      </Button>
    </div>
  );
}
