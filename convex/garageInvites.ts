import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, requireAuthUserId } from "./auth";
import type { Id } from "./_generated/dataModel";
import { assignGarageCarsToMember, validateGarageCars } from "./lib/garageAssignments";
import { requireGarageAdminAccess } from "./lib/garageAccess";
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

const carScopeValidator = v.union(v.literal("all_cars"), v.literal("selected_cars"));

const inviteValidator = v.object({
  _id: v.id("garageInvites"),
  _creationTime: v.number(),
  garageId: v.id("garages"),
  email: v.optional(v.string()),
  role: inviteRoleValidator,
  carScope: carScopeValidator,
  selectedCarIds: v.optional(v.array(v.id("cars"))),
  status: inviteStatusValidator,
  expiresAt: v.number(),
  createdAt: v.number(),
});

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createInviteToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function assertSelectedCarScope(
  carScope: "all_cars" | "selected_cars",
  selectedCarIds: Array<Id<"cars">> | undefined,
): asserts selectedCarIds is Array<Id<"cars">> {
  if (carScope === "selected_cars" && (!selectedCarIds || selectedCarIds.length === 0)) {
    throw new ConvexError("Select at least one vehicle");
  }
}

export const listPendingForGarage = query({
  args: { garageId: v.id("garages") },
  returns: v.array(inviteValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireGarageAdminAccess(ctx, args.garageId, authUserId);

    return await ctx.db
      .query("garageInvites")
      .withIndex("by_garage_id_and_status", (q) =>
        q.eq("garageId", args.garageId).eq("status", "pending"),
      )
      .order("desc")
      .take(50);
  },
});

export const createGarageInvite = mutation({
  args: {
    garageId: v.id("garages"),
    email: v.string(),
    role: v.optional(inviteRoleValidator),
    carScope: v.optional(carScopeValidator),
    selectedCarIds: v.optional(v.array(v.id("cars"))),
  },
  returns: v.id("garageInvites"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireGarageAdminAccess(ctx, args.garageId, authUserId);

    const garage = await ctx.db.get("garages", args.garageId);
    if (!garage || garage.isArchived) {
      throw new ConvexError("Garage not found");
    }

    const email = normalizeEmail(args.email);
    if (!email) {
      throw new ConvexError("Email is required");
    }

    const role = args.role ?? "worker";
    const carScope = args.carScope ?? "all_cars";
    assertSelectedCarScope(carScope, args.selectedCarIds);
    const selectedCarIds =
      carScope === "selected_cars"
        ? await validateGarageCars(ctx, args.garageId, args.selectedCarIds)
        : undefined;

    const existingInvite = await ctx.db
      .query("garageInvites")
      .withIndex("by_garage_id_and_email_and_status", (q) =>
        q.eq("garageId", args.garageId).eq("email", email).eq("status", "pending"),
      )
      .unique();

    if (existingInvite) {
      throw new ConvexError("This email already has a pending invite");
    }

    const now = Date.now();
    const user = await authComponent.getAuthUser(ctx);
    const inviteId = await ctx.db.insert("garageInvites", {
      garageId: args.garageId,
      email,
      inviteToken: createInviteToken(),
      role,
      carScope,
      selectedCarIds,
      status: "pending",
      invitedByAuthUserId: authUserId,
      expiresAt: now + INVITE_TTL_MS,
      createdAt: now,
      updatedAt: now,
    });

    const invite = await ctx.db.get("garageInvites", inviteId);
    if (!invite) {
      throw new ConvexError("Invite could not be created");
    }

    await ctx.scheduler.runAfter(0, internal.emails.sendGarageInviteEmail, {
      inviteId,
      to: email,
      garageName: garage.name,
      inviterEmail: user?.email,
      token: invite.inviteToken,
    });

    return inviteId;
  },
});

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

    if (invite.carScope === "selected_cars") {
      if (!invite.selectedCarIds || invite.selectedCarIds.length === 0) {
        throw new ConvexError("This invite has no selected vehicles");
      }
      await assignGarageCarsToMember(
        ctx,
        invite.garageId,
        invite.selectedCarIds,
        authUserId,
        invite.role,
        invite.invitedByAuthUserId,
        now,
      );
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
