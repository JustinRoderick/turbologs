import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { validateRunTiming } from "./runTiming";
import { assertTimingInRange } from "../runValidators";

describe("assertTimingInRange", () => {
  it("accepts values inside the range", () => {
    expect(() => assertTimingInRange("60ft", 1.5, 0.8, 5)).not.toThrow();
  });

  it("rejects values outside the range", () => {
    expect(() => assertTimingInRange("60ft", 0.5, 0.8, 5)).toThrow(ConvexError);
    expect(() => assertTimingInRange("60ft", 6, 0.8, 5)).toThrow(ConvexError);
  });

  it("rejects non-finite numbers", () => {
    expect(() => assertTimingInRange("ET", Number.NaN, 4, 30)).toThrow(ConvexError);
    expect(() => assertTimingInRange("ET", Number.POSITIVE_INFINITY, 4, 30)).toThrow(
      ConvexError,
    );
  });
});

describe("validateRunTiming", () => {
  const validPass = {
    sixtyFt: 1.42,
    quarterEt: 9.85,
    quarterMph: 138.2,
  };

  it("accepts a valid required pass", () => {
    expect(() => validateRunTiming(validPass)).not.toThrow();
  });

  it("accepts optional increments within range", () => {
    expect(() =>
      validateRunTiming({
        ...validPass,
        threeThirtyFt: 4.1,
        oneEighthEt: 6.4,
        oneEighthMph: 110,
        thousandFt: 8.2,
        reactionTime: 0.05,
        dialInSeconds: 9.9,
      }),
    ).not.toThrow();
  });

  it("rejects an impossible 60ft", () => {
    expect(() => validateRunTiming({ ...validPass, sixtyFt: 0.2 })).toThrow(ConvexError);
  });

  it("rejects trap speed that is too low for a quarter-mile pass", () => {
    expect(() => validateRunTiming({ ...validPass, quarterMph: 20 })).toThrow(ConvexError);
  });

  it("rejects dial-in outside ET range", () => {
    expect(() =>
      validateRunTiming({
        ...validPass,
        dialInSeconds: 1,
      }),
    ).toThrow(ConvexError);
  });

  it("allows empty timing when core is not required (time-slip later)", () => {
    expect(() => validateRunTiming({}, { requireCore: false })).not.toThrow();
  });

  it("requires core fields when enterTimingManually path is used", () => {
    expect(() => validateRunTiming({}, { requireCore: true })).toThrow(/60ft is required/);
  });
});
