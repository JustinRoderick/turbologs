import type { Id } from "../../../convex/_generated/dataModel";
import type { MotorsportCategory, VehicleKind } from "@/lib/vehicle-labels";
import {
  motorsportCategoryLabel,
  vehicleKindLabel,
  vehicleSubtitle,
} from "@/lib/vehicle-labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type VehicleCardData = {
  _id: Id<"cars">;
  garageId: Id<"garages">;
  name: string;
  vehicleKind: VehicleKind;
  motorsportCategory: MotorsportCategory;
  year?: number;
  make?: string;
  model?: string;
  engine?: string;
  totalPasses: number;
};

type VehicleCardProps = {
  vehicle: VehicleCardData;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const subtitle = vehicleSubtitle(vehicle);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{vehicle.name}</CardTitle>
          <Badge variant="secondary">{vehicleKindLabel(vehicle.vehicleKind)}</Badge>
          <Badge variant="outline">{motorsportCategoryLabel(vehicle.motorsportCategory)}</Badge>
        </div>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {vehicle.totalPasses === 1 ? "1 pass logged" : `${vehicle.totalPasses} passes logged`}
        </p>
      </CardContent>
    </Card>
  );
}
