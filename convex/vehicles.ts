import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./auth";
import { canViewVehicle, requireActiveGarageMember, requireGarageWriteAccess } from "./lib/garageAccess";
import {
  assertMotorsportProfile,
  createVehicleArgsValidator,
  vehicleCardValidator,
} from "./vehicleValidators";

const garageSummaryValidator = v.object({
  _id: v.id("garages"),
  name: v.string(),
  slug: v.optional(v.string()),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("tuner"),
    v.literal("worker"),
    v.literal("viewer"),
  ),
});

export const getGarageSummary = query({
  args: { garageId: v.id("garages") },
  returns: v.union(v.null(), garageSummaryValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const member = await requireActiveGarageMember(ctx, args.garageId, authUserId);

    const garage = await ctx.db.get("garages", args.garageId);
    if (!garage || garage.isArchived) {
      return null;
    }

    return {
      _id: garage._id,
      name: garage.name,
      slug: garage.slug,
      role: member.role,
    };
  },
});

export const listByGarage = query({
  args: { garageId: v.id("garages") },
  returns: v.array(vehicleCardValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const member = await requireActiveGarageMember(ctx, args.garageId, authUserId);

    const vehicles = await ctx.db
      .query("cars")
      .withIndex("by_garage_id_and_is_active", (q) =>
        q.eq("garageId", args.garageId).eq("isActive", true),
      )
      .take(100);

    const visible: Array<{
      _id: (typeof vehicles)[number]["_id"];
      garageId: (typeof vehicles)[number]["garageId"];
      name: string;
      vehicleKind: "car" | "truck" | "motorcycle" | "boat" | "other";
      motorsportCategory: "drag_racing" | "nascar" | "drifting" | "general";
      year?: number;
      make?: string;
      model?: string;
      engine?: string;
      totalPasses: number;
      isActive: boolean;
    }> = [];

    for (const vehicle of vehicles) {
      if (!(await canViewVehicle(ctx, vehicle, member))) {
        continue;
      }

      visible.push({
        _id: vehicle._id,
        garageId: vehicle.garageId,
        name: vehicle.name,
        vehicleKind: vehicle.vehicleKind ?? "car",
        motorsportCategory: vehicle.motorsportCategory ?? "general",
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        engine: vehicle.engine,
        totalPasses: vehicle.totalPasses,
        isActive: vehicle.isActive,
      });
    }

    visible.sort((a, b) => a.name.localeCompare(b.name));

    return visible;
  },
});

export const create = mutation({
  args: createVehicleArgsValidator,
  returns: v.id("cars"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireGarageWriteAccess(ctx, args.garageId, authUserId);

    const garage = await ctx.db.get("garages", args.garageId);
    if (!garage || garage.isArchived) {
      throw new ConvexError("Garage not found");
    }

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Vehicle name is required");
    }

    assertMotorsportProfile(args.motorsportCategory, args.motorsportProfile);

    if (args.vehicleKind === "boat" && !args.marineProfile) {
      throw new ConvexError("Marine details are required for boats");
    }

    if (args.vehicleKind !== "boat" && args.marineProfile) {
      throw new ConvexError("Marine details are only used for boats");
    }

    const now = Date.now();

    return await ctx.db.insert("cars", {
      garageId: args.garageId,
      name,
      vehicleKind: args.vehicleKind,
      motorsportCategory: args.motorsportCategory,
      motorsportProfile: args.motorsportProfile,
      marineProfile: args.marineProfile,
      year: args.year,
      make: args.make?.trim() || undefined,
      model: args.model?.trim() || undefined,
      vin: args.vin?.trim() || undefined,
      engine: args.engine?.trim() || undefined,
      transmission: args.transmission?.trim() || undefined,
      tire: args.tire?.trim() || undefined,
      weightLbs: args.weightLbs,
      drivetrain: args.drivetrain?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      totalPasses: 0,
      isActive: true,
      createdByAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const vehicleKindValueValidator = v.union(
  v.literal("car"),
  v.literal("truck"),
  v.literal("motorcycle"),
  v.literal("boat"),
  v.literal("other"),
);

const motorsportCategoryValueValidator = v.union(
  v.literal("drag_racing"),
  v.literal("nascar"),
  v.literal("drifting"),
  v.literal("general"),
);

export const getCategoryOptions = query({
  args: {},
  returns: v.object({
    vehicleKinds: v.array(
      v.object({
        value: vehicleKindValueValidator,
        label: v.string(),
      }),
    ),
    motorsportCategories: v.array(
      v.object({
        value: motorsportCategoryValueValidator,
        label: v.string(),
        description: v.string(),
      }),
    ),
  }),
  handler: async () => {
    return {
      vehicleKinds: [
        { value: "car" as const, label: "Car" },
        { value: "truck" as const, label: "Truck" },
        { value: "motorcycle" as const, label: "Motorcycle" },
        { value: "boat" as const, label: "Boat / watercraft" },
        { value: "other" as const, label: "Other" },
      ],
      motorsportCategories: [
        {
          value: "drag_racing" as const,
          label: "Drag racing",
          description: "ET, dial-in, power adder, and tire setup",
        },
        {
          value: "nascar" as const,
          label: "NASCAR / oval",
          description: "Series, car number, and oval setup notes",
        },
        {
          value: "drifting" as const,
          label: "Drifting",
          description: "Competition class, horsepower, and tire compounds",
        },
        {
          value: "general" as const,
          label: "General / other",
          description: "Basic vehicle info for other disciplines",
        },
      ],
    };
  },
});
