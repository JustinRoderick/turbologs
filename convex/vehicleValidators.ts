import { ConvexError, v } from "convex/values";

export const vehicleKindValidator = v.union(
  v.literal("car"),
  v.literal("truck"),
  v.literal("motorcycle"),
  v.literal("boat"),
  v.literal("other"),
);

export const motorsportCategoryValidator = v.union(
  v.literal("drag_racing"),
  v.literal("nascar"),
  v.literal("drifting"),
  v.literal("general"),
);

export const dragRacingProfileValidator = v.object({
  category: v.literal("drag_racing"),
  competitionClass: v.optional(v.string()),
  powerAdder: v.optional(
    v.union(
      v.literal("naturally_aspirated"),
      v.literal("turbo"),
      v.literal("supercharged"),
      v.literal("nitrous"),
      v.literal("other"),
    ),
  ),
  dialInSeconds: v.optional(v.number()),
  transmission: v.optional(v.string()),
  tireSize: v.optional(v.string()),
  tireCompound: v.optional(v.string()),
});

export const nascarProfileValidator = v.object({
  category: v.literal("nascar"),
  series: v.optional(
    v.union(v.literal("cup"), v.literal("xfinity"), v.literal("trucks"), v.literal("other")),
  ),
  carNumber: v.optional(v.string()),
  teamName: v.optional(v.string()),
  restrictorPlate: v.optional(v.boolean()),
  setupNotes: v.optional(v.string()),
});

export const driftingProfileValidator = v.object({
  category: v.literal("drifting"),
  competitionClass: v.optional(v.string()),
  horsepower: v.optional(v.number()),
  angleKit: v.optional(v.boolean()),
  tireCompoundFront: v.optional(v.string()),
  tireCompoundRear: v.optional(v.string()),
});

export const generalMotorsportProfileValidator = v.object({
  category: v.literal("general"),
  disciplineNotes: v.optional(v.string()),
});

export const motorsportProfileValidator = v.union(
  dragRacingProfileValidator,
  nascarProfileValidator,
  driftingProfileValidator,
  generalMotorsportProfileValidator,
);

export const marineProfileValidator = v.object({
  hullType: v.optional(v.string()),
  engineType: v.optional(
    v.union(v.literal("jet"), v.literal("outboard"), v.literal("inboard"), v.literal("other")),
  ),
  lengthFt: v.optional(v.number()),
});

export const vehicleCardValidator = v.object({
  _id: v.id("cars"),
  garageId: v.id("garages"),
  name: v.string(),
  vehicleKind: vehicleKindValidator,
  motorsportCategory: motorsportCategoryValidator,
  year: v.optional(v.number()),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  engine: v.optional(v.string()),
  totalPasses: v.number(),
  isActive: v.boolean(),
});

export const createVehicleArgsValidator = {
  garageId: v.id("garages"),
  name: v.string(),
  vehicleKind: vehicleKindValidator,
  motorsportCategory: motorsportCategoryValidator,
  year: v.optional(v.number()),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  vin: v.optional(v.string()),
  engine: v.optional(v.string()),
  transmission: v.optional(v.string()),
  tire: v.optional(v.string()),
  weightLbs: v.optional(v.number()),
  drivetrain: v.optional(v.string()),
  notes: v.optional(v.string()),
  motorsportProfile: v.optional(motorsportProfileValidator),
  marineProfile: v.optional(marineProfileValidator),
};

function profileMatchesCategory(
  category: "drag_racing" | "nascar" | "drifting" | "general",
  profile: { category: string } | undefined,
): boolean {
  if (!profile) {
    return category === "general";
  }
  return profile.category === category;
}

export function assertMotorsportProfile(
  motorsportCategory: "drag_racing" | "nascar" | "drifting" | "general",
  motorsportProfile: { category: string } | undefined,
): void {
  if (!profileMatchesCategory(motorsportCategory, motorsportProfile)) {
    throw new ConvexError("Motorsport profile must match the selected category");
  }
}
