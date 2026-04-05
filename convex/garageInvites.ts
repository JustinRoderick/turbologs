import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent, requireAuthUserId } from "./auth";
import { completeOnboardingAfterGarageMembership } from "./onboardingSync";

const inviteRoleValidator = v.union(
  v.literal("admin"),
  v.literal("tuner"),
  v.literal("worker"),
  v.literal("viewer"),
);

const inviteStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("expired"),
);

export const getInvitePreviewByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      garageName: v.string(),
      role: inviteRoleValidator,
      inviteStatus: inviteStatusValidator,
      isExpired: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const trimmed = args.token.trim();
    if (!trimmed) {
      return null;
    }

    const invite = await ctx.db
      .query("garageInvites")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", trimmed))
      .unique();

    if (!invite) {
      return null;
    }

    const garage = await ctx.db.get(invite.garageId);
    if (!garage) {
      return null;
    }

    const now = Date.now();
    const isExpired = invite.status === "pending" && invite.expiresAt < now;

    return {
      garageName: garage.name,
      role: invite.role,
      inviteStatus: invite.status,
      isExpired,
    };
  },
});

export const acceptGarageInvite = mutation({
  args: { token: v.string() },
  returns: v.id("garages"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const trimmed = args.token.trim();
    if (!trimmed) {
      throw new ConvexError("Invite token is required");
    }

    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const invite = await ctx.db
      .query("garageInvites")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", trimmed))
      .unique();

    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new ConvexError("This invite is no longer valid");
    }

    const now = Date.now();
    if (invite.expiresAt < now) {
      await ctx.db.patch(invite._id, {
        status: "expired",
        updatedAt: now,
      });
      throw new ConvexError("This invite has expired");
    }

    if (invite.email) {
      const normalizedInviteEmail = invite.email.trim().toLowerCase();
      const normalizedUserEmail = user.email.trim().toLowerCase();
      if (normalizedUserEmail !== normalizedInviteEmail) {
        throw new ConvexError("Sign in with the email this invite was sent to");
      }
    }

    const existing = await ctx.db
      .query("garageMembers")
      .withIndex("by_garage_id_and_member_auth_user_id", (q) =>
        q.eq("garageId", invite.garageId).eq("memberAuthUserId", authUserId),
      )
      .unique();

    if (existing?.status === "active") {
      throw new ConvexError("You are already a member of this garage");
    }

    if (existing && existing.status === "revoked") {
      await ctx.db.patch(existing._id, {
        status: "active",
        role: invite.role,
        allCars: invite.carScope === "all_cars",
        invitedByAuthUserId: invite.invitedByAuthUserId,
        joinedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("garageMembers", {
        garageId: invite.garageId,
        memberAuthUserId: authUserId,
        role: invite.role,
        status: "active",
        allCars: invite.carScope === "all_cars",
        invitedByAuthUserId: invite.invitedByAuthUserId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedByAuthUserId: authUserId,
      acceptedAt: now,
      updatedAt: now,
    });

    await completeOnboardingAfterGarageMembership(ctx, authUserId);

    return invite.garageId;
  },
});
