import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthUserId } from "./auth";

export const createGarage = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  returns: v.id("garages"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const now = Date.now();

    if (args.slug) {
      const existingGarageWithSlug = await ctx.db
        .query("garages")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique();

      if (existingGarageWithSlug) {
        throw new ConvexError("Garage slug is already in use");
      }
    }

    const garageId = await ctx.db.insert("garages", {
      ownerAuthUserId: authUserId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      location: args.location,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("garageMembers", {
      garageId,
      memberAuthUserId: authUserId,
      role: "owner",
      status: "active",
      allCars: true,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return garageId;
  },
});
