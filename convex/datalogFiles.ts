import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./auth";
import {
  requireVehicleRunWriteAccess,
  requireVehicleViewAccess,
} from "./lib/garageAccess";
import { ecuBrandValidator } from "./runValidators";

const MAX_DATALOG_BYTES = 50 * 1024 * 1024;

const datalogDocValidator = v.object({
  _id: v.id("datalogFiles"),
  runId: v.optional(v.id("runs")),
  fileName: v.string(),
  fileType: v.string(),
  fileSizeBytes: v.number(),
  ecuBrand: v.optional(ecuBrandValidator),
  ecuSoftware: v.optional(v.string()),
  uploadedAt: v.number(),
  url: v.union(v.string(), v.null()),
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

export const attachToRun = mutation({
  args: {
    carId: v.id("cars"),
    runId: v.id("runs"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSizeBytes: v.number(),
    ecuBrand: v.optional(ecuBrandValidator),
    ecuSoftware: v.optional(v.string()),
  },
  returns: v.id("datalogFiles"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const { car } = await requireVehicleRunWriteAccess(ctx, args.carId, authUserId);

    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived || run.carId !== car._id) {
      throw new ConvexError("Run not found for this vehicle");
    }

    if (args.fileSizeBytes <= 0 || args.fileSizeBytes > MAX_DATALOG_BYTES) {
      throw new ConvexError("Datalog must be between 1 byte and 50MB");
    }

    const fileName = args.fileName.trim();
    if (!fileName) {
      throw new ConvexError("File name is required");
    }

    if (args.ecuBrand) {
      await ctx.db.patch("runs", run._id, {
        ecuBrand: args.ecuBrand,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("datalogFiles", {
      garageId: car.garageId,
      carId: car._id,
      runId: run._id,
      uploadedByAuthUserId: authUserId,
      storageProvider: "convex_storage",
      storageId: args.storageId,
      fileName,
      fileType: args.fileType || "application/octet-stream",
      fileSizeBytes: args.fileSizeBytes,
      ecuBrand: args.ecuBrand,
      ecuSoftware: args.ecuSoftware?.trim() || undefined,
      visibility: "garage",
      parseStatus: "pending",
      uploadedAt: Date.now(),
    });
  },
});

export const listByRun = query({
  args: { runId: v.id("runs") },
  returns: v.array(datalogDocValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const run = await ctx.db.get("runs", args.runId);
    if (!run || run.isArchived) {
      return [];
    }
    await requireVehicleViewAccess(ctx, run.carId, authUserId);

    const files = await ctx.db
      .query("datalogFiles")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .take(50);

    const result = [];
    for (const file of files) {
      if (file.deletedAt) continue;
      const url = file.storageId ? await ctx.storage.getUrl(file.storageId) : null;
      result.push({
        _id: file._id,
        runId: file.runId,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSizeBytes: file.fileSizeBytes,
        ecuBrand: file.ecuBrand,
        ecuSoftware: file.ecuSoftware,
        uploadedAt: file.uploadedAt,
        url,
      });
    }
    return result;
  },
});

export const remove = mutation({
  args: { fileId: v.id("datalogFiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const file = await ctx.db.get("datalogFiles", args.fileId);
    if (!file || file.deletedAt) {
      throw new ConvexError("File not found");
    }
    await requireVehicleRunWriteAccess(ctx, file.carId, authUserId);
    if (file.storageId) {
      await ctx.storage.delete(file.storageId);
    }
    await ctx.db.patch("datalogFiles", args.fileId, {
      deletedAt: Date.now(),
      storageId: undefined,
    });
    return null;
  },
});
