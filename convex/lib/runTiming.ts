import { assertTimingInRange } from "../runValidators";

export type RunTimingFields = {
  sixtyFt?: number;
  threeThirtyFt?: number;
  oneEighthEt?: number;
  oneEighthMph?: number;
  thousandFt?: number;
  quarterEt?: number;
  quarterMph?: number;
  reactionTime?: number;
  dialInSeconds?: number;
};

/**
 * Validate drag-pass timing fields against MVP ranges.
 * When `requireCore` is true, 60ft / 1/4 ET / 1/4 MPH are required.
 */
export function validateRunTiming(args: RunTimingFields, options?: { requireCore?: boolean }): void {
  const requireCore = options?.requireCore ?? true;

  if (requireCore) {
    if (args.sixtyFt === undefined) {
      throw new Error("60ft is required");
    }
    if (args.quarterEt === undefined) {
      throw new Error("1/4 ET is required");
    }
    if (args.quarterMph === undefined) {
      throw new Error("1/4 MPH is required");
    }
  }

  if (args.sixtyFt !== undefined) {
    assertTimingInRange("60ft", args.sixtyFt, 0.8, 5);
  }
  if (args.quarterEt !== undefined) {
    assertTimingInRange("1/4 ET", args.quarterEt, 4, 30);
  }
  if (args.quarterMph !== undefined) {
    assertTimingInRange("1/4 MPH", args.quarterMph, 40, 350);
  }
  if (args.threeThirtyFt !== undefined) {
    assertTimingInRange("330ft", args.threeThirtyFt, 1.5, 12);
  }
  if (args.oneEighthEt !== undefined) {
    assertTimingInRange("1/8 ET", args.oneEighthEt, 2.5, 20);
  }
  if (args.oneEighthMph !== undefined) {
    assertTimingInRange("1/8 MPH", args.oneEighthMph, 40, 300);
  }
  if (args.thousandFt !== undefined) {
    assertTimingInRange("1000ft", args.thousandFt, 3, 25);
  }
  if (args.reactionTime !== undefined) {
    assertTimingInRange("Reaction time", args.reactionTime, -1, 2);
  }
  if (args.dialInSeconds !== undefined) {
    assertTimingInRange("Dial-in", args.dialInSeconds, 4, 30);
  }
}

export function hasCompleteCoreTiming(args: {
  sixtyFt?: number;
  quarterEt?: number;
  quarterMph?: number;
}): boolean {
  return args.sixtyFt !== undefined && args.quarterEt !== undefined && args.quarterMph !== undefined;
}
