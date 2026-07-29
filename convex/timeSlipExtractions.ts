import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./auth";
import {
  requireVehicleRunWriteAccess,
  requireVehicleViewAccess,
} from "./lib/garageAccess";
import { laneValidator } from "./runValidators";

const extractionValidator = v.object({
  _id: v.id("timeSlipExtractions"),
  runId: v.optional(v.id("runs")),
  extractionStatus: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("needs_review"),
  ),
  confidence: v.optional(v.number()),
  reactionTime: v.optional(v.number()),
  dialInSeconds: v.optional(v.number()),
  lane: v.optional(laneValidator),
  sixtyFt: v.optional(v.number()),
  threeThirtyFt: v.optional(v.number()),
  oneEighthEt: v.optional(v.number()),
  oneEighthMph: v.optional(v.number()),
  thousandFt: v.optional(v.number()),
  quarterEt: v.optional(v.number()),
  quarterMph: v.optional(v.number()),
  ocrRawText: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  imageUrl: v.union(v.string(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const generateUploadUrl = mutation({
  args: { carId: v.id("cars") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireVehicleRunWriteAccess(ctx, args.carId, authUserId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createFromUpload = mutation({
  args: {
    carId: v.id("cars"),
    runId: v.optional(v.id("runs")),
    storageId: v.id("_storage"),
  },
  returns: v.id("timeSlipExtractions"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const { car } = await requireVehicleRunWriteAccess(ctx, args.carId, authUserId);

    if (args.runId) {
      const run = await ctx.db.get("runs", args.runId);
      if (!run || run.carId !== car._id || run.isArchived) {
        throw new ConvexError("Run not found for this vehicle");
      }
    }

    const now = Date.now();
    const extractionId = await ctx.db.insert("timeSlipExtractions", {
      garageId: car.garageId,
      carId: car._id,
      runId: args.runId,
      sourceStorageId: args.storageId,
      extractionStatus: "pending",
      createdByAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.timeSlipActions.extractFromImage, {
      extractionId,
    });

    return extractionId;
  },
});

export const get = query({
  args: { extractionId: v.id("timeSlipExtractions") },
  returns: v.union(extractionValidator, v.null()),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const extraction = await ctx.db.get("timeSlipExtractions", args.extractionId);
    if (!extraction) return null;
    await requireVehicleViewAccess(ctx, extraction.carId, authUserId);
    const imageUrl = extraction.sourceStorageId
      ? await ctx.storage.getUrl(extraction.sourceStorageId)
      : null;
    return {
      _id: extraction._id,
      runId: extraction.runId,
      extractionStatus: extraction.extractionStatus,
      confidence: extraction.confidence,
      reactionTime: extraction.reactionTime,
      dialInSeconds: extraction.dialInSeconds,
      lane: extraction.lane,
      sixtyFt: extraction.sixtyFt,
      threeThirtyFt: extraction.threeThirtyFt,
      oneEighthEt: extraction.oneEighthEt,
      oneEighthMph: extraction.oneEighthMph,
      thousandFt: extraction.thousandFt,
      quarterEt: extraction.quarterEt,
      quarterMph: extraction.quarterMph,
      ocrRawText: extraction.ocrRawText,
      errorMessage: extraction.errorMessage,
      imageUrl,
      createdAt: extraction.createdAt,
      updatedAt: extraction.updatedAt,
    };
  },
});

export const applyToRun = mutation({
  args: {
    extractionId: v.id("timeSlipExtractions"),
    runId: v.id("runs"),
    reactionTime: v.optional(v.number()),
    dialInSeconds: v.optional(v.number()),
    lane: v.optional(laneValidator),
    sixtyFt: v.number(),
    threeThirtyFt: v.optional(v.number()),
    oneEighthEt: v.optional(v.number()),
    oneEighthMph: v.optional(v.number()),
    thousandFt: v.optional(v.number()),
    quarterEt: v.number(),
    quarterMph: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const extraction = await ctx.db.get("timeSlipExtractions", args.extractionId);
    if (!extraction) {
      throw new ConvexError("Extraction not found");
    }
    await requireVehicleRunWriteAccess(ctx, extraction.carId, authUserId);

    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.carId !== extraction.carId || run.isArchived) {
      throw new ConvexError("Run not found for this vehicle");
    }

    const now = Date.now();
    await ctx.db.patch("runs", args.runId, {
      reactionTime: args.reactionTime,
      dialInSeconds: args.dialInSeconds,
      lane: args.lane,
      sixtyFt: args.sixtyFt,
      threeThirtyFt: args.threeThirtyFt,
      oneEighthEt: args.oneEighthEt,
      oneEighthMph: args.oneEighthMph,
      thousandFt: args.thousandFt,
      quarterEt: args.quarterEt,
      quarterMph: args.quarterMph,
      updatedAt: now,
    });

    await ctx.db.patch("timeSlipExtractions", args.extractionId, {
      runId: args.runId,
      extractionStatus: "completed",
      reactionTime: args.reactionTime,
      dialInSeconds: args.dialInSeconds,
      lane: args.lane,
      sixtyFt: args.sixtyFt,
      threeThirtyFt: args.threeThirtyFt,
      oneEighthEt: args.oneEighthEt,
      oneEighthMph: args.oneEighthMph,
      thousandFt: args.thousandFt,
      quarterEt: args.quarterEt,
      quarterMph: args.quarterMph,
      reviewedByAuthUserId: authUserId,
      reviewedAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const markProcessing = internalMutation({
  args: { extractionId: v.id("timeSlipExtractions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("timeSlipExtractions", args.extractionId, {
      extractionStatus: "processing",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const saveExtractionResult = internalMutation({
  args: {
    extractionId: v.id("timeSlipExtractions"),
    status: v.union(v.literal("needs_review"), v.literal("failed")),
    confidence: v.optional(v.number()),
    reactionTime: v.optional(v.number()),
    dialInSeconds: v.optional(v.number()),
    lane: v.optional(laneValidator),
    sixtyFt: v.optional(v.number()),
    threeThirtyFt: v.optional(v.number()),
    oneEighthEt: v.optional(v.number()),
    oneEighthMph: v.optional(v.number()),
    thousandFt: v.optional(v.number()),
    quarterEt: v.optional(v.number()),
    quarterMph: v.optional(v.number()),
    ocrRawText: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { extractionId, status, errorMessage, ...fields } = args;
    await ctx.db.patch("timeSlipExtractions", extractionId, {
      extractionStatus: status,
      ...fields,
      errorMessage,
      extractedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});
