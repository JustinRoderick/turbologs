import { ConvexError, v } from "convex/values";

export const ecuBrandValidator = v.union(
  v.literal("fueltech"),
  v.literal("holley"),
  v.literal("haltech"),
  v.literal("other"),
);

export const runResultValidator = v.union(
  v.literal("win"),
  v.literal("loss"),
  v.literal("solo"),
  v.literal("redlight"),
  v.literal("unknown"),
);

export const laneValidator = v.union(v.literal("left"), v.literal("right"));

export const treeTypeValidator = v.union(
  v.literal("pro"),
  v.literal("sportsman"),
  v.literal("unknown"),
);

export const weatherStatusValidator = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("failed"),
  v.literal("manual"),
);

export const trackSurfaceValidator = v.union(
  v.literal("concrete"),
  v.literal("asphalt"),
  v.literal("other"),
);

export const trackDocValidator = v.object({
  _id: v.id("tracks"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  country: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  elevationFt: v.optional(v.number()),
  timezone: v.optional(v.string()),
  surface: trackSurfaceValidator,
  isPublicCatalog: v.boolean(),
  createdByGarageId: v.optional(v.id("garages")),
  createdByAuthUserId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const weatherSnapshotValidator = v.object({
  _id: v.id("weatherSnapshots"),
  temperatureF: v.number(),
  humidityPct: v.number(),
  dewPointF: v.optional(v.number()),
  barometricPressureInHg: v.number(),
  densityAltitudeFt: v.number(),
  windMph: v.optional(v.number()),
  windDirectionDeg: v.optional(v.number()),
  windGustMph: v.optional(v.number()),
  trackTempF: v.optional(v.number()),
  trackTempSource: v.optional(
    v.union(v.literal("estimated_soil"), v.literal("manual"), v.literal("unknown")),
  ),
  elevationFt: v.optional(v.number()),
  precipitationIn: v.optional(v.number()),
  observedAt: v.number(),
  source: v.union(v.literal("manual"), v.literal("api")),
  provider: v.optional(v.union(v.literal("open_meteo"), v.literal("manual"))),
});

export const runSummaryValidator = v.object({
  _id: v.id("runs"),
  garageId: v.id("garages"),
  carId: v.id("cars"),
  trackId: v.optional(v.id("tracks")),
  runAt: v.number(),
  trackName: v.optional(v.string()),
  eventName: v.optional(v.string()),
  lane: v.optional(laneValidator),
  reactionTime: v.optional(v.number()),
  dialInSeconds: v.optional(v.number()),
  result: v.optional(runResultValidator),
  sixtyFt: v.optional(v.number()),
  threeThirtyFt: v.optional(v.number()),
  oneEighthEt: v.optional(v.number()),
  oneEighthMph: v.optional(v.number()),
  thousandFt: v.optional(v.number()),
  quarterEt: v.optional(v.number()),
  quarterMph: v.optional(v.number()),
  weatherStatus: v.optional(weatherStatusValidator),
  densityAltitudeFt: v.optional(v.number()),
  notes: v.optional(v.string()),
});

export function assertTimingInRange(label: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ConvexError(`${label} must be between ${min} and ${max}`);
  }
}
