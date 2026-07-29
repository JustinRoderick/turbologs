/** Pure garage role helpers (kept free of Convex ctx for unit testing). */

export type GarageMemberRole = "owner" | "admin" | "tuner" | "worker" | "viewer";

const WRITE_ROLES: ReadonlySet<GarageMemberRole> = new Set([
  "owner",
  "admin",
  "tuner",
  "worker",
]);
const ADMIN_ROLES: ReadonlySet<GarageMemberRole> = new Set(["owner", "admin"]);
const RUN_WRITE_ROLES: ReadonlySet<GarageMemberRole> = new Set([
  "owner",
  "admin",
  "worker",
  "tuner",
]);

export function canModifyVehicles(role: GarageMemberRole): boolean {
  return WRITE_ROLES.has(role);
}

export function canManageGarageAccess(role: GarageMemberRole): boolean {
  return ADMIN_ROLES.has(role);
}

export function canLogRuns(role: GarageMemberRole): boolean {
  return RUN_WRITE_ROLES.has(role);
}
