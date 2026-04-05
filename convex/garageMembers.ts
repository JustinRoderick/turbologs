import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "./auth";

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
