import { describe, expect, it } from "vitest";
import {
  average,
  formatMonthLabel,
  lastNMonthKeys,
  monthKeyFromMs,
  topNamedCounts,
} from "./dashboardStats";

describe("dashboardStats", () => {
  it("builds month keys and labels", () => {
    expect(monthKeyFromMs(Date.UTC(2026, 6, 29))).toBe("2026-07");
    expect(formatMonthLabel("2026-07")).toBe("Jul 26");
  });

  it("returns the last N month keys ending at now", () => {
    const keys = lastNMonthKeys(Date.UTC(2026, 6, 15), 3);
    expect(keys).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  it("averages values and ranks named counts", () => {
    expect(average([])).toBeNull();
    expect(average([9.9, 10.1])).toBe(10);
    expect(
      topNamedCounts(
        new Map([
          ["Bandimere", 5],
          ["zMAX", 2],
          ["Bristol", 5],
        ]),
        2,
      ),
    ).toEqual([
      { name: "Bandimere", count: 5 },
      { name: "Bristol", count: 5 },
    ]);
  });
});
