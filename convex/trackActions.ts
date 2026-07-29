"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const resolveElevation = internalAction({
  args: { trackId: v.id("tracks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const track = await ctx.runQuery(internal.trackInternal.getTrack, { trackId: args.trackId });
    if (!track) {
      return null;
    }

    const url = new URL("https://api.open-meteo.com/v1/elevation");
    url.searchParams.set("latitude", String(track.latitude));
    url.searchParams.set("longitude", String(track.longitude));

    const response = await fetch(url);
    if (!response.ok) {
      console.error("Open-Meteo elevation failed", await response.text());
      return null;
    }

    const data = (await response.json()) as { elevation?: Array<number> };
    const elevationMeters = data.elevation?.[0];
    if (typeof elevationMeters !== "number") {
      return null;
    }

    await ctx.runMutation(internal.tracks.applyElevation, {
      trackId: args.trackId,
      elevationMeters,
    });
    return null;
  },
});
