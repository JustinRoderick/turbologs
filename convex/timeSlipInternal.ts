import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getExtraction = internalQuery({
  args: { extractionId: v.id("timeSlipExtractions") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("timeSlipExtractions"),
      sourceStorageId: v.optional(v.id("_storage")),
      extractionStatus: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const extraction = await ctx.db.get("timeSlipExtractions", args.extractionId);
    if (!extraction) return null;
    return {
      _id: extraction._id,
      sourceStorageId: extraction.sourceStorageId,
      extractionStatus: extraction.extractionStatus,
    };
  },
});
