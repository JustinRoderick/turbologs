import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { trackDocValidator } from "./runValidators";

export const getTrack = internalQuery({
  args: { trackId: v.id("tracks") },
  returns: v.union(trackDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("tracks", args.trackId);
  },
});
