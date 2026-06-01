import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent, requireAuthUserId } from "./auth";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assignGarageCarsToMember, validateGarageCars } from "./lib/garageAssignments";
import { getActiveGarageMember, requireGarageAdminAccess } from "./lib/garageAccess";

const accessRoleValidator = v.union(
  v.literal("admin"),
  v.literal("tuner"),
  v.literal("worker"),
  v.literal("viewer"),
);

const carScopeValidator = v.union(v.literal("all_cars"), v.literal("selected_cars"));

const accessRequestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("denied"),
  v.literal("cancelled"),
);

const accessRequestRowValidator = v.object({
  _id: v.id("garageAccessRequests"),
  _creationTime: v.number(),
  garageId: v.id("garages"),
  requesterAuthUserId: v.string(),
  requesterEmail: v.string(),
  message: v.optional(v.string()),
  requestedRole: accessRoleValidator,
  carScope: carScopeValidator,
  selectedCarIds: v.optional(v.array(v.id("cars"))),
  status: accessRequestStatusValidator,
  createdAt: v.number(),
});

type AuthUserRecord = {
  id: string;
  email: string;
};

type QueryOrMutationCtx = QueryCtx | MutationCtx;

function cleanMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim();
  return trimmed ? trimmed.slice(0, 1000) : undefined;
}

function assertSelectedCarScope(
  carScope: "all_cars" | "selected_cars",
  selectedCarIds: Array<Id<"cars">> | undefined,
): asserts selectedCarIds is Array<Id<"cars">> {
  if (carScope === "selected_cars" && (!selectedCarIds || selectedCarIds.length === 0)) {
    throw new ConvexError("Select at least one vehicle");
  }
}

async function getAuthUserById(
  ctx: QueryOrMutationCtx,
  authUserId: string,
): Promise<AuthUserRecord | null> {
  const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "id", operator: "eq", value: authUserId }],
  })) as AuthUserRecord | null;

  return user;
}

export const getGarageAccessPreview = query({
  args: { garageId: v.id("garages") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("garages"),
      name: v.string(),
      slug: v.optional(v.string()),
      location: v.optional(v.string()),
      alreadyMember: v.boolean(),
      pendingRequest: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const garage = await ctx.db.get("garages", args.garageId);
    if (!garage || garage.isArchived) {
      return null;
    }

    const member = await getActiveGarageMember(ctx, args.garageId, authUserId);
    const requests = await ctx.db
      .query("garageAccessRequests")
      .withIndex("by_garage_id_and_requester_auth_user_id", (q) =>
        q.eq("garageId", args.garageId).eq("requesterAuthUserId", authUserId),
      )
      .order("desc")
      .take(10);

    return {
      _id: garage._id,
      name: garage.name,
      slug: garage.slug,
      location: garage.location,
      alreadyMember: member?.status === "active",
      pendingRequest: requests.some((request) => request.status === "pending"),
    };
  },
});

export const listPendingForGarage = query({
  args: { garageId: v.id("garages") },
  returns: v.array(accessRequestRowValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    await requireGarageAdminAccess(ctx, args.garageId, authUserId);

    return await ctx.db
      .query("garageAccessRequests")
      .withIndex("by_garage_id_and_status", (q) =>
        q.eq("garageId", args.garageId).eq("status", "pending"),
      )
      .order("desc")
      .take(50);
  },
});

export const requestGarageAccess = mutation({
  args: {
    garageId: v.id("garages"),
    message: v.optional(v.string()),
    carScope: v.optional(carScopeValidator),
    selectedCarIds: v.optional(v.array(v.id("cars"))),
  },
  returns: v.id("garageAccessRequests"),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const garage = await ctx.db.get("garages", args.garageId);
    if (!garage || garage.isArchived) {
      throw new ConvexError("Garage not found");
    }

    const member = await getActiveGarageMember(ctx, args.garageId, authUserId);
    if (member?.status === "active") {
      throw new ConvexError("You already have access to this garage");
    }

    const existingRequests = await ctx.db
      .query("garageAccessRequests")
      .withIndex("by_garage_id_and_requester_auth_user_id", (q) =>
        q.eq("garageId", args.garageId).eq("requesterAuthUserId", authUserId),
      )
      .order("desc")
      .take(10);

    if (existingRequests.some((request) => request.status === "pending")) {
      throw new ConvexError("You already have a pending request for this garage");
    }

    const carScope = args.carScope ?? "all_cars";
    assertSelectedCarScope(carScope, args.selectedCarIds);
    const selectedCarIds =
      carScope === "selected_cars"
        ? await validateGarageCars(ctx, args.garageId, args.selectedCarIds)
        : undefined;

    const now = Date.now();
    const requestId = await ctx.db.insert("garageAccessRequests", {
      garageId: args.garageId,
      requesterAuthUserId: authUserId,
      requesterEmail: user.email.trim().toLowerCase(),
      message: cleanMessage(args.message),
      requestedRole: "worker",
      carScope,
      selectedCarIds,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    const owner = await getAuthUserById(ctx, garage.ownerAuthUserId);
    if (owner?.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendGarageAccessRequestEmail, {
        requestId,
        to: owner.email,
        garageName: garage.name,
        requesterEmail: user.email,
        message: cleanMessage(args.message),
        garageId: args.garageId,
      });
    }

    return requestId;
  },
});

export const approveAccessRequest = mutation({
  args: { requestId: v.id("garageAccessRequests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const request = await ctx.db.get("garageAccessRequests", args.requestId);
    if (!request) {
      throw new ConvexError("Access request not found");
    }
    if (request.status !== "pending") {
      throw new ConvexError("This access request has already been reviewed");
    }

    await requireGarageAdminAccess(ctx, request.garageId, authUserId);

    const garage = await ctx.db.get("garages", request.garageId);
    if (!garage || garage.isArchived) {
      throw new ConvexError("Garage not found");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("garageMembers")
      .withIndex("by_garage_id_and_member_auth_user_id", (q) =>
        q.eq("garageId", request.garageId).eq("memberAuthUserId", request.requesterAuthUserId),
      )
      .unique();

    if (existing?.status === "active") {
      await ctx.db.patch(existing._id, {
        role: request.requestedRole,
        allCars: request.carScope === "all_cars",
        updatedAt: now,
      });
    } else if (existing) {
      await ctx.db.patch(existing._id, {
        status: "active",
        role: request.requestedRole,
        allCars: request.carScope === "all_cars",
        invitedByAuthUserId: authUserId,
        joinedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("garageMembers", {
        garageId: request.garageId,
        memberAuthUserId: request.requesterAuthUserId,
        role: request.requestedRole,
        status: "active",
        allCars: request.carScope === "all_cars",
        invitedByAuthUserId: authUserId,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (request.carScope === "selected_cars") {
      if (!request.selectedCarIds || request.selectedCarIds.length === 0) {
        throw new ConvexError("This request has no selected vehicles");
      }
      await assignGarageCarsToMember(
        ctx,
        request.garageId,
        request.selectedCarIds,
        request.requesterAuthUserId,
        request.requestedRole,
        authUserId,
        now,
      );
    }

    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedByAuthUserId: authUserId,
      reviewedAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendGarageAccessDecisionEmail, {
      to: request.requesterEmail,
      garageName: garage.name,
      garageId: request.garageId,
      approved: true,
    });

    return null;
  },
});

export const denyAccessRequest = mutation({
  args: { requestId: v.id("garageAccessRequests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    const request = await ctx.db.get("garageAccessRequests", args.requestId);
    if (!request) {
      throw new ConvexError("Access request not found");
    }
    if (request.status !== "pending") {
      throw new ConvexError("This access request has already been reviewed");
    }

    await requireGarageAdminAccess(ctx, request.garageId, authUserId);

    const garage = await ctx.db.get("garages", request.garageId);
    if (!garage || garage.isArchived) {
      throw new ConvexError("Garage not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "denied",
      reviewedByAuthUserId: authUserId,
      reviewedAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendGarageAccessDecisionEmail, {
      to: request.requesterEmail,
      garageName: garage.name,
      garageId: request.garageId,
      approved: false,
    });

    return null;
  },
});
