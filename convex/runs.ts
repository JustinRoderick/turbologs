import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./auth";
import {
  canViewVehicle,
  requireActiveGarageMember,
  requireVehicleRunWriteAccess,
  requireVehicleViewAccess,
} from "./lib/garageAccess";
import { canLogRuns } from "./lib/garageRoles";
import { validateRunTiming, hasCompleteCoreTiming } from "./lib/runTiming";
import { computeDensityAltitudeFt } from "./lib/densityAltitude";
import {
  average,
  formatMonthLabel,
  lastNMonthKeys,
  monthKeyFromMs,
  topNamedCounts,
} from "./lib/dashboardStats";
import {
  ecuBrandValidator,
  laneValidator,
  runResultValidator,
  runSummaryValidator,
  treeTypeValidator,
  weatherSnapshotValidator,
  weatherStatusValidator,
} from "./runValidators";

const namedCountValidator = v.object({
  name: v.string(),
  count: v.number(),
});

const monthlyCountValidator = v.object({
  month: v.string(),
  label: v.string(),
  count: v.number(),
});

const resultBreakdownValidator = v.object({
  win: v.number(),
  loss: v.number(),
  solo: v.number(),
  redlight: v.number(),
  unknown: v.number(),
});

const carDashboardChartsValidator = v.object({
  runAt: v.array(v.number()),
  quarterEt: v.array(v.number()),
  quarterMph: v.array(v.number()),
  sixtyFt: v.array(v.number()),
  densityAltitudeFt: v.array(v.union(v.number(), v.null())),
  monthlyPasses: v.array(monthlyCountValidator),
  trackBreakdown: v.array(namedCountValidator),
  resultBreakdown: resultBreakdownValidator,
});


const createRunArgs = {
  carId: v.id("cars"),
  trackId: v.id("tracks"),
  runAt: v.number(),
  eventName: v.optional(v.string()),
  lane: v.optional(laneValidator),
  treeType: v.optional(treeTypeValidator),
  reactionTime: v.optional(v.number()),
  dialInSeconds: v.optional(v.number()),
  delayBox: v.optional(v.number()),
  result: v.optional(runResultValidator),
  sixtyFt: v.optional(v.number()),
  threeThirtyFt: v.optional(v.number()),
  oneEighthEt: v.optional(v.number()),
  oneEighthMph: v.optional(v.number()),
  thousandFt: v.optional(v.number()),
  quarterEt: v.optional(v.number()),
  quarterMph: v.optional(v.number()),
  ecuBrand: v.optional(ecuBrandValidator),
  notes: v.optional(v.string()),
  /** When true, require core timing fields (no physical slip / manual entry). */
  enterTimingManually: v.optional(v.boolean()),
  skipWeatherEnrichment: v.optional(v.boolean()),
};

export const create = mutation({
  args: createRunArgs,
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const { car } = await requireVehicleRunWriteAccess(ctx, args.carId, authUserId);

    const track = await ctx.db.get("tracks", args.trackId);
    if (!track) {
      throw new ConvexError("Track not found");
    }

    try {
      validateRunTiming(args, { requireCore: args.enterTimingManually === true });
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      throw new ConvexError(error instanceof Error ? error.message : "Invalid timing values");
    }

    if (args.runAt > Date.now() + 24 * 60 * 60 * 1000) {
      throw new ConvexError("Run time cannot be more than 24 hours in the future");
    }

    const now = Date.now();
    const runId = await ctx.db.insert("runs", {
      garageId: car.garageId,
      carId: car._id,
      trackId: track._id,
      runAt: args.runAt,
      trackName: track.name,
      eventName: args.eventName?.trim() || undefined,
      lane: args.lane,
      treeType: args.treeType,
      reactionTime: args.reactionTime,
      dialInSeconds: args.dialInSeconds,
      delayBox: args.delayBox,
      result: args.result,
      sixtyFt: args.sixtyFt,
      threeThirtyFt: args.threeThirtyFt,
      oneEighthEt: args.oneEighthEt,
      oneEighthMph: args.oneEighthMph,
      thousandFt: args.thousandFt,
      quarterEt: args.quarterEt,
      quarterMph: args.quarterMph,
      weatherStatus: args.skipWeatherEnrichment ? "manual" : "pending",
      ecuBrand: args.ecuBrand,
      notes: args.notes?.trim() || undefined,
      isArchived: false,
      createdByAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch("cars", car._id, {
      totalPasses: car.totalPasses + 1,
      updatedAt: now,
    });

    if (!args.skipWeatherEnrichment) {
      await ctx.scheduler.runAfter(0, internal.weatherActions.enrichRunWeather, { runId });
    }

    return runId;
  },
});

export const update = mutation({
  args: {
    runId: v.id("runs"),
    eventName: v.optional(v.string()),
    lane: v.optional(laneValidator),
    treeType: v.optional(treeTypeValidator),
    reactionTime: v.optional(v.number()),
    dialInSeconds: v.optional(v.number()),
    delayBox: v.optional(v.number()),
    result: v.optional(runResultValidator),
    sixtyFt: v.optional(v.number()),
    threeThirtyFt: v.optional(v.number()),
    oneEighthEt: v.optional(v.number()),
    oneEighthMph: v.optional(v.number()),
    thousandFt: v.optional(v.number()),
    quarterEt: v.optional(v.number()),
    quarterMph: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      throw new ConvexError("Run not found");
    }
    await requireVehicleRunWriteAccess(ctx, run.carId, authUserId);

    const next = {
      sixtyFt: args.sixtyFt ?? run.sixtyFt,
      threeThirtyFt: args.threeThirtyFt ?? run.threeThirtyFt,
      oneEighthEt: args.oneEighthEt ?? run.oneEighthEt,
      oneEighthMph: args.oneEighthMph ?? run.oneEighthMph,
      thousandFt: args.thousandFt ?? run.thousandFt,
      quarterEt: args.quarterEt ?? run.quarterEt,
      quarterMph: args.quarterMph ?? run.quarterMph,
      reactionTime: args.reactionTime ?? run.reactionTime,
      dialInSeconds: args.dialInSeconds ?? run.dialInSeconds,
    };

    try {
      if (hasCompleteCoreTiming(next)) {
        validateRunTiming(next, { requireCore: true });
      } else {
        validateRunTiming(next, { requireCore: false });
      }
    } catch (error) {
      throw new ConvexError(error instanceof Error ? error.message : "Invalid timing values");
    }

    await ctx.db.patch("runs", args.runId, {
      eventName: args.eventName !== undefined ? args.eventName.trim() || undefined : run.eventName,
      lane: args.lane ?? run.lane,
      treeType: args.treeType ?? run.treeType,
      reactionTime: next.reactionTime,
      dialInSeconds: next.dialInSeconds,
      delayBox: args.delayBox ?? run.delayBox,
      result: args.result ?? run.result,
      sixtyFt: next.sixtyFt,
      threeThirtyFt: next.threeThirtyFt,
      oneEighthEt: next.oneEighthEt,
      oneEighthMph: next.oneEighthMph,
      thousandFt: next.thousandFt,
      quarterEt: next.quarterEt,
      quarterMph: next.quarterMph,
      notes: args.notes !== undefined ? args.notes.trim() || undefined : run.notes,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const archive = mutation({
  args: { runId: v.id("runs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      throw new ConvexError("Run not found");
    }
    const { car } = await requireVehicleRunWriteAccess(ctx, run.carId, authUserId);
    const now = Date.now();
    await ctx.db.patch("runs", args.runId, { isArchived: true, updatedAt: now });
    await ctx.db.patch("cars", car._id, {
      totalPasses: Math.max(0, car.totalPasses - 1),
      updatedAt: now,
    });
    return null;
  },
});

export const get = query({
  args: { runId: v.id("runs") },
  returns: v.union(
    v.null(),
    v.object({
      run: v.object({
        _id: v.id("runs"),
        garageId: v.id("garages"),
        carId: v.id("cars"),
        trackId: v.optional(v.id("tracks")),
        runAt: v.number(),
        trackName: v.optional(v.string()),
        eventName: v.optional(v.string()),
        lane: v.optional(laneValidator),
        treeType: v.optional(treeTypeValidator),
        reactionTime: v.optional(v.number()),
        dialInSeconds: v.optional(v.number()),
        delayBox: v.optional(v.number()),
        result: v.optional(runResultValidator),
        sixtyFt: v.optional(v.number()),
        threeThirtyFt: v.optional(v.number()),
        oneEighthEt: v.optional(v.number()),
        oneEighthMph: v.optional(v.number()),
        thousandFt: v.optional(v.number()),
        quarterEt: v.optional(v.number()),
        quarterMph: v.optional(v.number()),
        weatherSnapshotId: v.optional(v.id("weatherSnapshots")),
        weatherStatus: v.optional(weatherStatusValidator),
        weatherError: v.optional(v.string()),
        ecuBrand: v.optional(ecuBrandValidator),
        notes: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
      canEdit: v.boolean(),
      weather: v.union(weatherSnapshotValidator, v.null()),
      track: v.union(
        v.object({
          _id: v.id("tracks"),
          name: v.string(),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          latitude: v.number(),
          longitude: v.number(),
          elevationFt: v.optional(v.number()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      return null;
    }
    const { member } = await requireVehicleViewAccess(ctx, run.carId, authUserId);
    const canEdit = canLogRuns(member.role);

    const weather = run.weatherSnapshotId
      ? await ctx.db.get("weatherSnapshots", run.weatherSnapshotId)
      : null;
    const track = run.trackId ? await ctx.db.get("tracks", run.trackId) : null;

    return {
      run: {
        _id: run._id,
        garageId: run.garageId,
        carId: run.carId,
        trackId: run.trackId,
        runAt: run.runAt,
        trackName: run.trackName,
        eventName: run.eventName,
        lane: run.lane,
        treeType: run.treeType,
        reactionTime: run.reactionTime,
        dialInSeconds: run.dialInSeconds,
        delayBox: run.delayBox,
        result: run.result,
        sixtyFt: run.sixtyFt,
        threeThirtyFt: run.threeThirtyFt,
        oneEighthEt: run.oneEighthEt,
        oneEighthMph: run.oneEighthMph,
        thousandFt: run.thousandFt,
        quarterEt: run.quarterEt,
        quarterMph: run.quarterMph,
        weatherSnapshotId: run.weatherSnapshotId,
        weatherStatus: run.weatherStatus,
        weatherError: run.weatherError,
        ecuBrand: run.ecuBrand,
        notes: run.notes,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      },
      canEdit,
      weather: weather
        ? {
            _id: weather._id,
            temperatureF: weather.temperatureF,
            humidityPct: weather.humidityPct,
            dewPointF: weather.dewPointF,
            barometricPressureInHg: weather.barometricPressureInHg,
            densityAltitudeFt: weather.densityAltitudeFt,
            windMph: weather.windMph,
            windDirectionDeg: weather.windDirectionDeg,
            windGustMph: weather.windGustMph,
            trackTempF: weather.trackTempF,
            trackTempSource: weather.trackTempSource,
            elevationFt: weather.elevationFt,
            precipitationIn: weather.precipitationIn,
            observedAt: weather.observedAt,
            source: weather.source,
            provider: weather.provider,
          }
        : null,
      track: track
        ? {
            _id: track._id,
            name: track.name,
            city: track.city,
            state: track.state,
            latitude: track.latitude,
            longitude: track.longitude,
            elevationFt: track.elevationFt,
          }
        : null,
    };
  },
});

export const listByCar = query({
  args: {
    carId: v.id("cars"),
    limit: v.optional(v.number()),
  },
  returns: v.array(runSummaryValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireVehicleViewAccess(ctx, args.carId, authUserId);
    const limit = Math.min(args.limit ?? 50, 100);

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_car_id_and_run_at", (q) => q.eq("carId", args.carId))
      .order("desc")
      .take(limit * 2);

    const summaries = [];
    for (const run of runs) {
      if (run.isArchived) continue;
      let densityAltitudeFt: number | undefined;
      if (run.weatherSnapshotId) {
        const weather = await ctx.db.get("weatherSnapshots", run.weatherSnapshotId);
        densityAltitudeFt = weather?.densityAltitudeFt;
      }
      summaries.push({
        _id: run._id,
        garageId: run.garageId,
        carId: run.carId,
        trackId: run.trackId,
        runAt: run.runAt,
        trackName: run.trackName,
        eventName: run.eventName,
        lane: run.lane,
        reactionTime: run.reactionTime,
        dialInSeconds: run.dialInSeconds,
        result: run.result,
        sixtyFt: run.sixtyFt,
        threeThirtyFt: run.threeThirtyFt,
        oneEighthEt: run.oneEighthEt,
        oneEighthMph: run.oneEighthMph,
        thousandFt: run.thousandFt,
        quarterEt: run.quarterEt,
        quarterMph: run.quarterMph,
        weatherStatus: run.weatherStatus,
        densityAltitudeFt,
        notes: run.notes,
      });
      if (summaries.length >= limit) break;
    }
    return summaries;
  },
});

export const dashboardByCar = query({
  args: { carId: v.id("cars"), now: v.number() },
  returns: v.object({
    totalRuns: v.number(),
    lastRunAt: v.union(v.number(), v.null()),
    bestQuarterEt: v.union(v.number(), v.null()),
    bestQuarterMph: v.union(v.number(), v.null()),
    bestSixtyFt: v.union(v.number(), v.null()),
    bestReactionTime: v.union(v.number(), v.null()),
    averageQuarterEt: v.union(v.number(), v.null()),
    averageQuarterMph: v.union(v.number(), v.null()),
    averageSixtyFt: v.union(v.number(), v.null()),
    averageReactionTime: v.union(v.number(), v.null()),
    averageDensityAltitudeFt: v.union(v.number(), v.null()),
    weatherReadyCount: v.number(),
    weatherCoveragePct: v.number(),
    winRatePct: v.union(v.number(), v.null()),
    tracksVisited: v.number(),
    recent: v.array(runSummaryValidator),
    charts: carDashboardChartsValidator,
  }),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireVehicleViewAccess(ctx, args.carId, authUserId);

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_car_id_and_run_at", (q) => q.eq("carId", args.carId))
      .order("desc")
      .take(200);

    const active = runs.filter((r) => !r.isArchived);
    const timed = active.filter((r) => hasCompleteCoreTiming(r));
    const now = args.now;
    const monthKeys = lastNMonthKeys(now, 6);
    const monthlyMap = new Map(monthKeys.map((key) => [key, 0]));
    const trackCounts = new Map<string, number>();
    const resultBreakdown = { win: 0, loss: 0, solo: 0, redlight: 0, unknown: 0 };

    let bestQuarterEt: number | null = null;
    let bestQuarterMph: number | null = null;
    let bestSixtyFt: number | null = null;
    let bestReactionTime: number | null = null;
    let weatherReadyCount = 0;
    const etValues: Array<number> = [];
    const mphValues: Array<number> = [];
    const sixtyValues: Array<number> = [];
    const reactionValues: Array<number> = [];
    const daValues: Array<number> = [];
    let decidedRounds = 0;
    let wins = 0;

    const chartRuns = [...timed].reverse().slice(-40);
    const charts = {
      runAt: [] as Array<number>,
      quarterEt: [] as Array<number>,
      quarterMph: [] as Array<number>,
      sixtyFt: [] as Array<number>,
      densityAltitudeFt: [] as Array<number | null>,
      monthlyPasses: [] as Array<{ month: string; label: string; count: number }>,
      trackBreakdown: [] as Array<{ name: string; count: number }>,
      resultBreakdown,
    };

    const recent = [];
    for (const run of active) {
      if (hasCompleteCoreTiming(run)) {
        bestQuarterEt =
          bestQuarterEt === null ? run.quarterEt! : Math.min(bestQuarterEt, run.quarterEt!);
        bestQuarterMph =
          bestQuarterMph === null ? run.quarterMph! : Math.max(bestQuarterMph, run.quarterMph!);
        bestSixtyFt = bestSixtyFt === null ? run.sixtyFt! : Math.min(bestSixtyFt, run.sixtyFt!);
        etValues.push(run.quarterEt!);
        mphValues.push(run.quarterMph!);
        sixtyValues.push(run.sixtyFt!);
      }

      if (run.reactionTime !== undefined) {
        bestReactionTime =
          bestReactionTime === null
            ? run.reactionTime
            : Math.min(bestReactionTime, run.reactionTime);
        reactionValues.push(run.reactionTime);
      }

      const month = monthKeyFromMs(run.runAt);
      if (monthlyMap.has(month)) {
        monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
      }

      const trackName = run.trackName?.trim() || "Unknown track";
      trackCounts.set(trackName, (trackCounts.get(trackName) ?? 0) + 1);

      const resultKey = run.result ?? "unknown";
      if (resultKey in resultBreakdown) {
        resultBreakdown[resultKey as keyof typeof resultBreakdown] += 1;
      } else {
        resultBreakdown.unknown += 1;
      }
      if (run.result === "win" || run.result === "loss") {
        decidedRounds += 1;
        if (run.result === "win") wins += 1;
      }

      let densityAltitudeFt: number | undefined;
      if (run.weatherSnapshotId) {
        const weather = await ctx.db.get("weatherSnapshots", run.weatherSnapshotId);
        densityAltitudeFt = weather?.densityAltitudeFt;
        if (weather?.densityAltitudeFt !== undefined) {
          daValues.push(weather.densityAltitudeFt);
        }
      }
      if (run.weatherStatus === "ready" || run.weatherStatus === "manual") {
        weatherReadyCount += 1;
      }

      if (recent.length < 12) {
        recent.push({
          _id: run._id,
          garageId: run.garageId,
          carId: run.carId,
          trackId: run.trackId,
          runAt: run.runAt,
          trackName: run.trackName,
          eventName: run.eventName,
          lane: run.lane,
          reactionTime: run.reactionTime,
          dialInSeconds: run.dialInSeconds,
          result: run.result,
          sixtyFt: run.sixtyFt,
          threeThirtyFt: run.threeThirtyFt,
          oneEighthEt: run.oneEighthEt,
          oneEighthMph: run.oneEighthMph,
          thousandFt: run.thousandFt,
          quarterEt: run.quarterEt,
          quarterMph: run.quarterMph,
          weatherStatus: run.weatherStatus,
          densityAltitudeFt,
          notes: run.notes,
        });
      }
    }

    for (const run of chartRuns) {
      charts.runAt.push(run.runAt);
      charts.quarterEt.push(run.quarterEt!);
      charts.quarterMph.push(run.quarterMph!);
      charts.sixtyFt.push(run.sixtyFt!);
      if (run.weatherSnapshotId) {
        const weather = await ctx.db.get("weatherSnapshots", run.weatherSnapshotId);
        charts.densityAltitudeFt.push(weather?.densityAltitudeFt ?? null);
      } else {
        charts.densityAltitudeFt.push(null);
      }
    }

    charts.monthlyPasses = monthKeys.map((month) => ({
      month,
      label: formatMonthLabel(month),
      count: monthlyMap.get(month) ?? 0,
    }));
    charts.trackBreakdown = topNamedCounts(trackCounts, 8);
    charts.resultBreakdown = resultBreakdown;

    return {
      totalRuns: active.length,
      lastRunAt: active[0]?.runAt ?? null,
      bestQuarterEt,
      bestQuarterMph,
      bestSixtyFt,
      bestReactionTime,
      averageQuarterEt: average(etValues),
      averageQuarterMph: average(mphValues),
      averageSixtyFt: average(sixtyValues),
      averageReactionTime: average(reactionValues),
      averageDensityAltitudeFt:
        daValues.length > 0 ? Math.round(daValues.reduce((a, b) => a + b, 0) / daValues.length) : null,
      weatherReadyCount,
      weatherCoveragePct:
        active.length === 0 ? 0 : Math.round((weatherReadyCount / active.length) * 100),
      winRatePct: decidedRounds === 0 ? null : Math.round((wins / decidedRounds) * 100),
      tracksVisited: trackCounts.size,
      recent,
      charts,
    };
  },
});

export const dashboardByGarage = query({
  args: { garageId: v.id("garages"), now: v.number() },
  returns: v.object({
    totalVehicles: v.number(),
    totalRuns: v.number(),
    activeMembers: v.number(),
    pendingInvites: v.number(),
    pendingAccessRequests: v.number(),
    lastRunAt: v.union(v.number(), v.null()),
    bestQuarterEt: v.union(v.number(), v.null()),
    bestQuarterMph: v.union(v.number(), v.null()),
    bestSixtyFt: v.union(v.number(), v.null()),
    averageQuarterEt: v.union(v.number(), v.null()),
    weatherCoveragePct: v.number(),
    winRatePct: v.union(v.number(), v.null()),
    recent: v.array(
      v.object({
        _id: v.id("runs"),
        carId: v.id("cars"),
        carName: v.string(),
        runAt: v.number(),
        trackName: v.optional(v.string()),
        sixtyFt: v.optional(v.number()),
        quarterEt: v.optional(v.number()),
        quarterMph: v.optional(v.number()),
        result: v.optional(runResultValidator),
        densityAltitudeFt: v.optional(v.number()),
      }),
    ),
    charts: v.object({
      monthlyPasses: v.array(monthlyCountValidator),
      passesByVehicle: v.array(namedCountValidator),
      trackBreakdown: v.array(namedCountValidator),
      resultBreakdown: resultBreakdownValidator,
    }),
  }),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const member = await requireActiveGarageMember(ctx, args.garageId, authUserId);

    const vehicles = await ctx.db
      .query("cars")
      .withIndex("by_garage_id_and_is_active", (q) =>
        q.eq("garageId", args.garageId).eq("isActive", true),
      )
      .take(100);

    const visibleCars = [];
    const carNameById = new Map<string, string>();
    for (const car of vehicles) {
      if (await canViewVehicle(ctx, car, member)) {
        visibleCars.push(car);
        carNameById.set(car._id, car.name);
      }
    }
    const visibleCarIds = new Set(visibleCars.map((car) => car._id));

    const members = await ctx.db
      .query("garageMembers")
      .withIndex("by_garage_id", (q) => q.eq("garageId", args.garageId))
      .take(200);
    const activeMembers = members.filter((m) => m.status === "active").length;

    const invites = await ctx.db
      .query("garageInvites")
      .withIndex("by_garage_id_and_status", (q) =>
        q.eq("garageId", args.garageId).eq("status", "pending"),
      )
      .take(100);
    const accessRequests = await ctx.db
      .query("garageAccessRequests")
      .withIndex("by_garage_id_and_status", (q) =>
        q.eq("garageId", args.garageId).eq("status", "pending"),
      )
      .take(100);

    const runs = await ctx.db
      .query("runs")
      .withIndex("by_garage_id_and_run_at", (q) => q.eq("garageId", args.garageId))
      .order("desc")
      .take(400);

    const active = runs.filter((r) => !r.isArchived && visibleCarIds.has(r.carId));
    const now = args.now;
    const monthKeys = lastNMonthKeys(now, 6);
    const monthlyMap = new Map(monthKeys.map((key) => [key, 0]));
    const trackCounts = new Map<string, number>();
    const vehicleCounts = new Map<string, number>();
    const resultBreakdown = { win: 0, loss: 0, solo: 0, redlight: 0, unknown: 0 };

    let bestQuarterEt: number | null = null;
    let bestQuarterMph: number | null = null;
    let bestSixtyFt: number | null = null;
    let weatherReadyCount = 0;
    const etValues: Array<number> = [];
    let decidedRounds = 0;
    let wins = 0;

    const recent = [];
    for (const run of active) {
      if (hasCompleteCoreTiming(run)) {
        bestQuarterEt =
          bestQuarterEt === null ? run.quarterEt! : Math.min(bestQuarterEt, run.quarterEt!);
        bestQuarterMph =
          bestQuarterMph === null ? run.quarterMph! : Math.max(bestQuarterMph, run.quarterMph!);
        bestSixtyFt = bestSixtyFt === null ? run.sixtyFt! : Math.min(bestSixtyFt, run.sixtyFt!);
        etValues.push(run.quarterEt!);
      }

      const month = monthKeyFromMs(run.runAt);
      if (monthlyMap.has(month)) {
        monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
      }

      const trackName = run.trackName?.trim() || "Unknown track";
      trackCounts.set(trackName, (trackCounts.get(trackName) ?? 0) + 1);

      const carName = carNameById.get(run.carId) ?? "Vehicle";
      vehicleCounts.set(carName, (vehicleCounts.get(carName) ?? 0) + 1);

      const resultKey = run.result ?? "unknown";
      if (resultKey in resultBreakdown) {
        resultBreakdown[resultKey as keyof typeof resultBreakdown] += 1;
      } else {
        resultBreakdown.unknown += 1;
      }
      if (run.result === "win" || run.result === "loss") {
        decidedRounds += 1;
        if (run.result === "win") wins += 1;
      }
      if (run.weatherStatus === "ready" || run.weatherStatus === "manual") {
        weatherReadyCount += 1;
      }

      if (recent.length < 10) {
        let densityAltitudeFt: number | undefined;
        if (run.weatherSnapshotId) {
          const weather = await ctx.db.get("weatherSnapshots", run.weatherSnapshotId);
          densityAltitudeFt = weather?.densityAltitudeFt;
        }
        recent.push({
          _id: run._id,
          carId: run.carId,
          carName,
          runAt: run.runAt,
          trackName: run.trackName,
          sixtyFt: run.sixtyFt,
          quarterEt: run.quarterEt,
          quarterMph: run.quarterMph,
          result: run.result,
          densityAltitudeFt,
        });
      }
    }

    // Ensure inactive-but-visible vehicles still appear with 0 if they have no recent runs in window
    for (const car of visibleCars) {
      if (!vehicleCounts.has(car.name)) {
        vehicleCounts.set(car.name, 0);
      }
    }

    return {
      totalVehicles: visibleCars.length,
      totalRuns: active.length,
      activeMembers,
      pendingInvites: invites.length,
      pendingAccessRequests: accessRequests.length,
      lastRunAt: active[0]?.runAt ?? null,
      bestQuarterEt,
      bestQuarterMph,
      bestSixtyFt,
      averageQuarterEt: average(etValues),
      weatherCoveragePct:
        active.length === 0 ? 0 : Math.round((weatherReadyCount / active.length) * 100),
      winRatePct: decidedRounds === 0 ? null : Math.round((wins / decidedRounds) * 100),
      recent,
      charts: {
        monthlyPasses: monthKeys.map((month) => ({
          month,
          label: formatMonthLabel(month),
          count: monthlyMap.get(month) ?? 0,
        })),
        passesByVehicle: topNamedCounts(vehicleCounts, 10),
        trackBreakdown: topNamedCounts(trackCounts, 8),
        resultBreakdown,
      },
    };
  },
});

export const setManualWeather = mutation({
  args: {
    runId: v.id("runs"),
    temperatureF: v.number(),
    humidityPct: v.number(),
    barometricPressureInHg: v.number(),
    dewPointF: v.optional(v.number()),
    windMph: v.optional(v.number()),
    windDirectionDeg: v.optional(v.number()),
    windGustMph: v.optional(v.number()),
    trackTempF: v.optional(v.number()),
    elevationFt: v.optional(v.number()),
    precipitationIn: v.optional(v.number()),
  },
  returns: v.id("weatherSnapshots"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      throw new ConvexError("Run not found");
    }
    await requireVehicleRunWriteAccess(ctx, run.carId, authUserId);

    if (!Number.isFinite(args.temperatureF) || args.temperatureF < -40 || args.temperatureF > 150) {
      throw new ConvexError("Air temperature must be between -40 and 150 °F");
    }
    if (!Number.isFinite(args.humidityPct) || args.humidityPct < 0 || args.humidityPct > 100) {
      throw new ConvexError("Humidity must be between 0 and 100%");
    }
    if (
      !Number.isFinite(args.barometricPressureInHg) ||
      args.barometricPressureInHg < 20 ||
      args.barometricPressureInHg > 35
    ) {
      throw new ConvexError("Barometric pressure must be between 20 and 35 inHg");
    }

    const densityAltitudeFt = computeDensityAltitudeFt({
      stationPressureInHg: args.barometricPressureInHg,
      temperatureF: args.temperatureF,
      dewPointF: args.dewPointF,
    });

    const now = Date.now();
    const snapshotFields = {
      garageId: run.garageId,
      carId: run.carId,
      trackId: run.trackId,
      runId: run._id,
      source: "manual" as const,
      provider: "manual" as const,
      observedAt: run.runAt,
      temperatureF: args.temperatureF,
      humidityPct: args.humidityPct,
      dewPointF: args.dewPointF,
      barometricPressureInHg: args.barometricPressureInHg,
      densityAltitudeFt,
      windMph: args.windMph,
      windDirectionDeg: args.windDirectionDeg,
      windGustMph: args.windGustMph,
      precipitationIn: args.precipitationIn,
      elevationFt: args.elevationFt,
      trackTempF: args.trackTempF,
      trackTempSource: args.trackTempF !== undefined ? ("manual" as const) : undefined,
      createdAt: now,
    };

    let weatherSnapshotId = run.weatherSnapshotId;
    if (weatherSnapshotId) {
      const existing = await ctx.db.get("weatherSnapshots", weatherSnapshotId);
      if (existing) {
        await ctx.db.patch("weatherSnapshots", weatherSnapshotId, {
          ...snapshotFields,
          createdAt: existing.createdAt,
        });
      } else {
        weatherSnapshotId = await ctx.db.insert("weatherSnapshots", snapshotFields);
      }
    } else {
      weatherSnapshotId = await ctx.db.insert("weatherSnapshots", snapshotFields);
    }

    await ctx.db.patch("runs", args.runId, {
      weatherSnapshotId,
      weatherStatus: "manual",
      weatherError: undefined,
      updatedAt: now,
    });

    return weatherSnapshotId;
  },
});

export const retryWeatherEnrichment = mutation({
  args: { runId: v.id("runs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      throw new ConvexError("Run not found");
    }
    await requireVehicleRunWriteAccess(ctx, run.carId, authUserId);
    if (!run.trackId) {
      throw new ConvexError("Track is required before weather can be fetched");
    }

    await ctx.db.patch("runs", args.runId, {
      weatherStatus: "pending",
      weatherError: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.weatherActions.enrichRunWeather, {
      runId: args.runId,
    });
    return null;
  },
});

export const applyWeatherSnapshot = internalMutation({
  args: {
    runId: v.id("runs"),
    snapshot: v.object({
      observedAt: v.number(),
      temperatureF: v.number(),
      humidityPct: v.number(),
      dewPointF: v.optional(v.number()),
      barometricPressureInHg: v.number(),
      densityAltitudeFt: v.number(),
      windMph: v.optional(v.number()),
      windDirectionDeg: v.optional(v.number()),
      windGustMph: v.optional(v.number()),
      precipitationIn: v.optional(v.number()),
      shortwaveRadiation: v.optional(v.number()),
      elevationFt: v.optional(v.number()),
      trackTempF: v.optional(v.number()),
      trackTempSource: v.optional(
        v.union(v.literal("estimated_soil"), v.literal("manual"), v.literal("unknown")),
      ),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get("runs", args.runId);
    if (!run) return null;

    const now = Date.now();
    const weatherSnapshotId = await ctx.db.insert("weatherSnapshots", {
      garageId: run.garageId,
      carId: run.carId,
      trackId: run.trackId,
      runId: run._id,
      source: "api",
      provider: "open_meteo",
      observedAt: args.snapshot.observedAt,
      temperatureF: args.snapshot.temperatureF,
      humidityPct: args.snapshot.humidityPct,
      dewPointF: args.snapshot.dewPointF,
      barometricPressureInHg: args.snapshot.barometricPressureInHg,
      densityAltitudeFt: args.snapshot.densityAltitudeFt,
      windMph: args.snapshot.windMph,
      windDirectionDeg: args.snapshot.windDirectionDeg,
      windGustMph: args.snapshot.windGustMph,
      precipitationIn: args.snapshot.precipitationIn,
      shortwaveRadiation: args.snapshot.shortwaveRadiation,
      elevationFt: args.snapshot.elevationFt,
      trackTempF: args.snapshot.trackTempF,
      trackTempSource: args.snapshot.trackTempSource,
      createdAt: now,
    });

    await ctx.db.patch("runs", args.runId, {
      weatherSnapshotId,
      weatherStatus: "ready",
      weatherError: undefined,
      updatedAt: now,
    });
    return null;
  },
});

export const markWeatherFailed = internalMutation({
  args: {
    runId: v.id("runs"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("runs", args.runId, {
      weatherStatus: "failed",
      weatherError: args.error,
      updatedAt: Date.now(),
    });
    return null;
  },
});
