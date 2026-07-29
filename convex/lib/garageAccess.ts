import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { canLogRuns, canManageGarageAccess, canModifyVehicles } from "./garageRoles";

export async function getActiveGarageMember(
  ctx: QueryCtx | MutationCtx,
  garageId: Id<"garages">,
  authUserId: string,
): Promise<Doc<"garageMembers"> | null> {
  return await ctx.db
    .query("garageMembers")
    .withIndex("by_garage_id_and_member_auth_user_id", (q) =>
      q.eq("garageId", garageId).eq("memberAuthUserId", authUserId),
    )
    .unique();
}

export async function requireActiveGarageMember(
  ctx: QueryCtx | MutationCtx,
  garageId: Id<"garages">,
  authUserId: string,
): Promise<Doc<"garageMembers">> {
  const member = await getActiveGarageMember(ctx, garageId, authUserId);
  if (!member || member.status !== "active") {
    throw new ConvexError("You do not have access to this garage");
  }
  return member;
}

export async function requireGarageWriteAccess(
  ctx: MutationCtx,
  garageId: Id<"garages">,
  authUserId: string,
): Promise<Doc<"garageMembers">> {
  const member = await requireActiveGarageMember(ctx, garageId, authUserId);
  if (!canModifyVehicles(member.role)) {
    throw new ConvexError("You do not have permission to modify vehicles in this garage");
  }
  return member;
}

export async function requireGarageAdminAccess(
  ctx: QueryCtx | MutationCtx,
  garageId: Id<"garages">,
  authUserId: string,
): Promise<Doc<"garageMembers">> {
  const member = await requireActiveGarageMember(ctx, garageId, authUserId);
  if (!canManageGarageAccess(member.role)) {
    throw new ConvexError("Only garage owners and admins can manage access");
  }
  return member;
}

export async function canViewVehicle(
  ctx: QueryCtx | MutationCtx,
  car: Doc<"cars">,
  member: Doc<"garageMembers">,
): Promise<boolean> {
  if (member.allCars) {
    return true;
  }

  const assignment = await ctx.db
    .query("carAssignments")
    .withIndex("by_car_id_and_member_auth_user_id", (q) =>
      q.eq("carId", car._id).eq("memberAuthUserId", member.memberAuthUserId),
    )
    .unique();

  return assignment?.status === "active";
}

export async function requireVehicleViewAccess(
  ctx: QueryCtx | MutationCtx,
  carId: Id<"cars">,
  authUserId: string,
): Promise<{ car: Doc<"cars">; member: Doc<"garageMembers"> }> {
  const car = await ctx.db.get("cars", carId);
  if (!car || !car.isActive) {
    throw new ConvexError("Vehicle not found");
  }
  const member = await requireActiveGarageMember(ctx, car.garageId, authUserId);
  if (!(await canViewVehicle(ctx, car, member))) {
    throw new ConvexError("You do not have access to this vehicle");
  }
  return { car, member };
}

export async function requireVehicleRunWriteAccess(
  ctx: MutationCtx,
  carId: Id<"cars">,
  authUserId: string,
): Promise<{ car: Doc<"cars">; member: Doc<"garageMembers"> }> {
  const { car, member } = await requireVehicleViewAccess(ctx, carId, authUserId);
  if (!canLogRuns(member.role)) {
    throw new ConvexError("You do not have permission to log runs for this vehicle");
  }
  return { car, member };
}
