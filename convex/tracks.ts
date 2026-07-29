import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./auth";
import { metersToFeet } from "./lib/densityAltitude";
import { requireActiveGarageMember } from "./lib/garageAccess";
import { trackDocValidator, trackSurfaceValidator } from "./runValidators";

const CATALOG_TRACKS = [
  {
    name: "Bandimere Speedway",
    slug: "bandimere-speedway",
    city: "Morrison",
    state: "CO",
    country: "US",
    latitude: 39.6619,
    longitude: -105.1889,
    timezone: "America/Denver",
    surface: "concrete" as const,
  },
  {
    name: "zMAX Dragway",
    slug: "zmax-dragway",
    city: "Concord",
    state: "NC",
    country: "US",
    latitude: 35.3517,
    longitude: -80.6825,
    timezone: "America/New_York",
    surface: "concrete" as const,
  },
  {
    name: "Gainesville Raceway",
    slug: "gainesville-raceway",
    city: "Gainesville",
    state: "FL",
    country: "US",
    latitude: 29.7594,
    longitude: -82.2758,
    timezone: "America/New_York",
    surface: "concrete" as const,
  },
  {
    name: "Bristol Dragway",
    slug: "bristol-dragway",
    city: "Bristol",
    state: "TN",
    country: "US",
    latitude: 36.5161,
    longitude: -82.2569,
    timezone: "America/New_York",
    surface: "concrete" as const,
  },
  {
    name: "Lucas Oil Raceway at Indianapolis",
    slug: "lucas-oil-raceway",
    city: "Brownsburg",
    state: "IN",
    country: "US",
    latitude: 39.8125,
    longitude: -86.3406,
    timezone: "America/Indiana/Indianapolis",
    surface: "concrete" as const,
  },
  {
    name: "Sonoma Raceway",
    slug: "sonoma-raceway",
    city: "Sonoma",
    state: "CA",
    country: "US",
    latitude: 38.1611,
    longitude: -122.4547,
    timezone: "America/Los_Angeles",
    surface: "asphalt" as const,
  },
  {
    name: "Pacific Raceways",
    slug: "pacific-raceways",
    city: "Kent",
    state: "WA",
    country: "US",
    latitude: 47.3214,
    longitude: -122.1447,
    timezone: "America/Los_Angeles",
    surface: "asphalt" as const,
  },
  {
    name: "Maple Grove Raceway",
    slug: "maple-grove-raceway",
    city: "Mohnton",
    state: "PA",
    country: "US",
    latitude: 40.2247,
    longitude: -75.9911,
    timezone: "America/New_York",
    surface: "concrete" as const,
  },
  {
    name: "Route 66 Raceway",
    slug: "route-66-raceway",
    city: "Joliet",
    state: "IL",
    country: "US",
    latitude: 41.4744,
    longitude: -88.0572,
    timezone: "America/Chicago",
    surface: "concrete" as const,
  },
  {
    name: "The Strip at Las Vegas Motor Speedway",
    slug: "lvms-strip",
    city: "Las Vegas",
    state: "NV",
    country: "US",
    latitude: 36.2719,
    longitude: -115.0122,
    timezone: "America/Los_Angeles",
    surface: "concrete" as const,
  },
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const get = query({
  args: { trackId: v.id("tracks") },
  returns: v.union(trackDocValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);
    return await ctx.db.get("tracks", args.trackId);
  },
});

export const search = query({
  args: {
    query: v.string(),
    garageId: v.optional(v.id("garages")),
  },
  returns: v.array(trackDocValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    if (args.garageId) {
      await requireActiveGarageMember(ctx, args.garageId, authUserId);
    }

    const q = args.query.trim();
    if (q.length === 0) {
      const catalog = await ctx.db
        .query("tracks")
        .withIndex("by_is_public_catalog", (idx) => idx.eq("isPublicCatalog", true))
        .take(40);
      return catalog.sort((a, b) => a.name.localeCompare(b.name));
    }

    const searched = await ctx.db
      .query("tracks")
      .withSearchIndex("search_name", (s) => s.search("name", q))
      .take(25);

    return searched;
  },
});

export const ensureCatalogSeeded = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    await requireAuthUserId(ctx);
    return await ctx.runMutation(internal.tracks.seedCatalog, {});
  },
});

export const create = mutation({
  args: {
    garageId: v.id("garages"),
    name: v.string(),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    elevationFt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    surface: v.optional(trackSurfaceValidator),
  },
  returns: v.id("tracks"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireActiveGarageMember(ctx, args.garageId, authUserId);

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Track name is required");
    }
    if (args.latitude < -90 || args.latitude > 90) {
      throw new ConvexError("Latitude must be between -90 and 90");
    }
    if (args.longitude < -180 || args.longitude > 180) {
      throw new ConvexError("Longitude must be between -180 and 180");
    }

    const now = Date.now();
    const trackId = await ctx.db.insert("tracks", {
      name,
      slug: slugify(name),
      city: args.city?.trim() || undefined,
      state: args.state?.trim() || undefined,
      country: (args.country?.trim() || "US").toUpperCase(),
      latitude: args.latitude,
      longitude: args.longitude,
      elevationFt: args.elevationFt,
      timezone: args.timezone,
      surface: args.surface ?? "asphalt",
      isPublicCatalog: false,
      createdByGarageId: args.garageId,
      createdByAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
    });

    if (args.elevationFt === undefined) {
      await ctx.scheduler.runAfter(0, internal.trackActions.resolveElevation, { trackId });
    }

    return trackId;
  },
});

export const seedCatalog = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    let inserted = 0;
    for (const track of CATALOG_TRACKS) {
      const existing = await ctx.db
        .query("tracks")
        .withIndex("by_slug", (q) => q.eq("slug", track.slug))
        .unique();
      if (existing) {
        continue;
      }
      await ctx.db.insert("tracks", {
        ...track,
        isPublicCatalog: true,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }
    return inserted;
  },
});

export const applyElevation = internalMutation({
  args: {
    trackId: v.id("tracks"),
    elevationMeters: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("tracks", args.trackId, {
      elevationFt: Math.round(metersToFeet(args.elevationMeters)),
      updatedAt: Date.now(),
    });
    return null;
  },
});
