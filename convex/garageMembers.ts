import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "./auth";

const myGarageRowValidator = v.object({
  garageId: v.id("garages"),
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

export const listMyActiveGarages = query({
  args: {},
  returns: v.array(myGarageRowValidator),
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return [];
    }

    const memberships = await ctx.db
      .query("garageMembers")
      .withIndex("by_member_auth_user_id_and_status", (q) =>
        q.eq("memberAuthUserId", authUserId).eq("status", "active"),
      )
      .take(100);

    const out: Array<{
      garageId: (typeof memberships)[number]["garageId"];
      name: string;
      slug?: string;
      role: (typeof memberships)[number]["role"];
    }> = [];

    for (const m of memberships) {
      const garage = await ctx.db.get(m.garageId);
      if (!garage || garage.isArchived) {
        continue;
      }
      out.push({
        garageId: garage._id,
        name: garage.name,
        slug: garage.slug,
        role: m.role,
      });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));

    return out;
  },
});

export const hasActiveGarageMembership = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return false;
    }

    const row = await ctx.db
      .query("garageMembers")
      .withIndex("by_member_auth_user_id_and_status", (q) =>
        q.eq("memberAuthUserId", authUserId).eq("status", "active"),
      )
      .first();

    return row !== null;
  },
});
