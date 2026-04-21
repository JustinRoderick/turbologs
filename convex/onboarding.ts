import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, requireAuthUserId } from "./auth";

const ONBOARDING_VERSION = 1;

const onboardingStepIdValidator = v.union(
  v.literal("welcome"),
  v.literal("choose_path"),
  v.literal("create_garage"),
  v.literal("invite"),
  v.literal("first_car"),
  v.literal("done"),
);

const pathChoiceValidator = v.union(v.literal("create"), v.literal("invite"), v.literal("browse"));

const draftGarageValidator = v.object({
  name: v.string(),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
});

const userOnboardingDocValidator = v.object({
  _id: v.id("userOnboarding"),
  _creationTime: v.number(),
  authUserId: v.string(),
  status: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("skipped"),
  ),
  currentStepId: onboardingStepIdValidator,
  pathChoice: v.optional(pathChoiceValidator),
  draftGarage: v.optional(draftGarageValidator),
  draftInviteToken: v.optional(v.string()),
  onboardingVersion: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
  skippedAt: v.optional(v.number()),
});

export const getForCurrentUser = query({
  args: {},
  returns: v.union(v.null(), userOnboardingDocValidator),
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }
    return await ctx.db
      .query("userOnboarding")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
      .unique();
  },
});

export const setOnboardingStep = mutation({
  args: {
    stepId: onboardingStepIdValidator,
    pathChoice: v.optional(pathChoiceValidator),
    draftGarage: v.optional(draftGarageValidator),
    draftInviteToken: v.optional(v.string()),
  },
  returns: v.id("userOnboarding"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (existing?.status === "completed") {
      throw new ConvexError("Onboarding is already completed");
    }

    if (!existing) {
      return await ctx.db.insert("userOnboarding", {
        authUserId,
        status: "in_progress",
        currentStepId: args.stepId,
        pathChoice: args.pathChoice,
        draftGarage: args.draftGarage,
        draftInviteToken: args.draftInviteToken,
        onboardingVersion: ONBOARDING_VERSION,
        updatedAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      status: "in_progress",
      currentStepId: args.stepId,
      updatedAt: now,
      ...(args.pathChoice !== undefined ? { pathChoice: args.pathChoice } : {}),
      ...(args.draftGarage !== undefined ? { draftGarage: args.draftGarage } : {}),
      ...(args.draftInviteToken !== undefined ? { draftInviteToken: args.draftInviteToken } : {}),
    });

    return existing._id;
  },
});

export const markSkipped = mutation({
  args: {
    pathChoice: v.optional(v.literal("browse")),
  },
  returns: v.id("userOnboarding"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (!existing) {
      return await ctx.db.insert("userOnboarding", {
        authUserId,
        status: "skipped",
        currentStepId: "done",
        pathChoice: args.pathChoice ?? "browse",
        onboardingVersion: ONBOARDING_VERSION,
        updatedAt: now,
        skippedAt: now,
      });
    }

    if (existing.status === "completed") {
      throw new ConvexError("Onboarding is already completed");
    }

    await ctx.db.patch(existing._id, {
      status: "skipped",
      currentStepId: "done",
      pathChoice: args.pathChoice ?? existing.pathChoice ?? "browse",
      updatedAt: now,
      skippedAt: now,
    });

    return existing._id;
  },
});

export const markCompletedExplicit = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const authUserId = await requireAuthUserId(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (!existing) {
      await ctx.db.insert("userOnboarding", {
        authUserId,
        status: "completed",
        currentStepId: "done",
        onboardingVersion: ONBOARDING_VERSION,
        updatedAt: now,
        completedAt: now,
      });
      return null;
    }

    await ctx.db.patch(existing._id, {
      status: "completed",
      currentStepId: "done",
      updatedAt: now,
      completedAt: now,
    });

    return null;
  },
});
