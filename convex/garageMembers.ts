import { v } from "convex/values";
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import { getAuthUserId } from "./auth";
import { requireGarageAdminAccess } from "./lib/garageAccess";

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

const garageMemberRowValidator = v.object({
  _id: v.id("garageMembers"),
  memberAuthUserId: v.string(),
  email: v.optional(v.string()),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("tuner"),
    v.literal("worker"),
    v.literal("viewer"),
  ),
  status: v.union(v.literal("active"), v.literal("revoked")),
  allCars: v.boolean(),
  joinedAt: v.optional(v.number()),
});

type AuthUserRecord = {
  id: string;
  email: string;
};

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

export const listForGarage = query({
  args: { garageId: v.id("garages") },
  returns: v.array(garageMemberRowValidator),
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return [];
    }

    await requireGarageAdminAccess(ctx, args.garageId, authUserId);

    const memberships = await ctx.db
      .query("garageMembers")
      .withIndex("by_garage_id", (q) => q.eq("garageId", args.garageId))
      .take(100);

    const rows = await Promise.all(
      memberships.map(async (membership) => {
        const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
          model: "user",
          where: [{ field: "id", operator: "eq", value: membership.memberAuthUserId }],
        })) as AuthUserRecord | null;

        return {
          _id: membership._id,
          memberAuthUserId: membership.memberAuthUserId,
          email: user?.email,
          role: membership.role,
          status: membership.status,
          allCars: membership.allCars,
          joinedAt: membership.joinedAt,
        };
      }),
    );

    rows.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "active" ? -1 : 1;
      }
      return (a.email ?? a.memberAuthUserId).localeCompare(b.email ?? b.memberAuthUserId);
    });

    return rows;
  },
});
