export type VehicleKind = "car" | "truck" | "motorcycle" | "boat" | "other";
export type MotorsportCategory = "drag_racing" | "nascar" | "drifting" | "general";

const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  car: "Car",
  truck: "Truck",
  motorcycle: "Motorcycle",
  boat: "Boat",
  other: "Other",
};

const MOTORSPORT_CATEGORY_LABELS: Record<MotorsportCategory, string> = {
  drag_racing: "Drag racing",
  nascar: "NASCAR / oval",
  drifting: "Drifting",
  general: "General",
};

export function vehicleKindLabel(kind: VehicleKind): string {
  return VEHICLE_KIND_LABELS[kind];
}

export function motorsportCategoryLabel(category: MotorsportCategory): string {
  return MOTORSPORT_CATEGORY_LABELS[category];
}

export function vehicleSubtitle(parts: {
  year?: number;
  make?: string;
  model?: string;
  engine?: string;
}): string | null {
  const ymm = [parts.year, parts.make, parts.model].filter(Boolean).join(" ");
  if (ymm && parts.engine) {
    return `${ymm} · ${parts.engine}`;
  }
  return ymm || parts.engine || null;
}
