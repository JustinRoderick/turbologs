import { describe, expect, it } from "vitest";
import { canLogRuns, canManageGarageAccess, canModifyVehicles } from "./garageRoles";
import type { GarageMemberRole } from "./garageRoles";

const ALL_ROLES: Array<GarageMemberRole> = ["owner", "admin", "tuner", "worker", "viewer"];

describe("garage role permissions", () => {
  it("lets owners and admins manage garage access only", () => {
    expect(canManageGarageAccess("owner")).toBe(true);
    expect(canManageGarageAccess("admin")).toBe(true);
    expect(canManageGarageAccess("tuner")).toBe(false);
    expect(canManageGarageAccess("worker")).toBe(false);
    expect(canManageGarageAccess("viewer")).toBe(false);
  });

  it("lets non-viewers modify vehicles", () => {
    for (const role of ALL_ROLES) {
      expect(canModifyVehicles(role)).toBe(role !== "viewer");
    }
  });

  it("lets owner/admin/worker/tuner log runs, but not viewers", () => {
    expect(canLogRuns("owner")).toBe(true);
    expect(canLogRuns("admin")).toBe(true);
    expect(canLogRuns("worker")).toBe(true);
    expect(canLogRuns("tuner")).toBe(true);
    expect(canLogRuns("viewer")).toBe(false);
  });
});
