import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export function uniqueCarIds(carIds: Array<Id<"cars">>): Array<Id<"cars">> {
  return [...new Set(carIds)];
}

export async function validateGarageCars(
  ctx: MutationCtx,
  garageId: Id<"garages">,
  carIds: Array<Id<"cars">>,
): Promise<Array<Id<"cars">>> {
  const uniqueIds = uniqueCarIds(carIds);
  if (uniqueIds.length === 0) {
    throw new ConvexError("Select at least one vehicle");
  }

  const cars = await Promise.all(uniqueIds.map((carId) => ctx.db.get("cars", carId)));
  for (const car of cars) {
    if (!car || car.garageId !== garageId || !car.isActive) {
      throw new ConvexError("One or more selected vehicles are not available");
    }
  }

  return uniqueIds;
}

export async function assignGarageCarsToMember(
  ctx: MutationCtx,
  garageId: Id<"garages">,
  carIds: Array<Id<"cars">>,
  memberAuthUserId: string,
  role: "admin" | "tuner" | "worker" | "viewer",
  assignedByAuthUserId: string,
  now: number,
): Promise<void> {
  const uniqueIds = await validateGarageCars(ctx, garageId, carIds);

  for (const carId of uniqueIds) {
    const existing = await ctx.db
      .query("carAssignments")
      .withIndex("by_car_id_and_member_auth_user_id", (q) =>
        q.eq("carId", carId).eq("memberAuthUserId", memberAuthUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch("carAssignments", existing._id, {
        garageId,
        role,
        status: "active",
        assignedByAuthUserId,
        updatedAt: now,
      });
      continue;
    }

    await ctx.db.insert("carAssignments", {
      garageId,
      carId,
      memberAuthUserId,
      role,
      status: "active",
      assignedByAuthUserId,
      createdAt: now,
      updatedAt: now,
    });
  }
}
