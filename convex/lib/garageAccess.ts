import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type GarageMemberRole = Doc<"garageMembers">["role"];

const WRITE_ROLES: ReadonlySet<GarageMemberRole> = new Set(["owner", "admin", "tuner", "worker"]);

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
  if (!WRITE_ROLES.has(member.role)) {
    throw new ConvexError("You do not have permission to modify vehicles in this garage");
  }
  return member;
}

export async function canViewVehicle(
  ctx: QueryCtx,
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
