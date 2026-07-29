import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getRunForWeather = internalQuery({
  args: { runId: v.id("runs") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("runs"),
      garageId: v.id("garages"),
      carId: v.id("cars"),
      trackId: v.optional(v.id("tracks")),
      runAt: v.number(),
      weatherStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("ready"),
          v.literal("failed"),
          v.literal("manual"),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("runs", args.runId);
    if (!run) return null;
    return {
      _id: run._id,
      garageId: run.garageId,
      carId: run.carId,
      trackId: run.trackId,
      runAt: run.runAt,
      weatherStatus: run.weatherStatus,
    };
  },
});
