import type { MutationCtx } from "./_generated/server";

const ONBOARDING_VERSION = 1;

export async function completeOnboardingAfterGarageMembership(
  ctx: MutationCtx,
  authUserId: string,
): Promise<void> {
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
    return;
  }

  await ctx.db.patch(existing._id, {
    status: "completed",
    currentStepId: "done",
    updatedAt: now,
    completedAt: now,
  });
}
