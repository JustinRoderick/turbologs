import { describe, expect, it } from "vitest";
import {
  ECU_BRAND_OPTIONS,
  formatBytes,
  formatEt,
  formatMph,
  formatRunDate,
} from "./run-format";

describe("formatEt", () => {
  it("formats seconds to three decimals", () => {
    expect(formatEt(9.851)).toBe("9.851");
    expect(formatEt(1.4)).toBe("1.400");
  });

  it("renders placeholders for missing values", () => {
    expect(formatEt(null)).toBe("—");
    expect(formatEt(undefined)).toBe("—");
    expect(formatEt(Number.NaN)).toBe("—");
  });
});

describe("formatMph", () => {
  it("formats trap speed to two decimals", () => {
    expect(formatMph(138.2)).toBe("138.20");
    expect(formatMph(100)).toBe("100.00");
  });

  it("renders placeholders for missing values", () => {
    expect(formatMph(null)).toBe("—");
    expect(formatMph(undefined)).toBe("—");
  });
});

describe("formatBytes", () => {
  it("formats B / KB / MB thresholds", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatRunDate", () => {
  it("returns a non-empty localized date string", () => {
    const formatted = formatRunDate(Date.UTC(2026, 6, 29, 20, 15));
    expect(formatted.length).toBeGreaterThan(5);
    expect(formatted).toMatch(/2026/);
  });
});

describe("ECU_BRAND_OPTIONS", () => {
  it("includes the MVP ECU brands", () => {
    expect(ECU_BRAND_OPTIONS.map((o) => o.value)).toEqual([
      "fueltech",
      "holley",
      "haltech",
      "other",
    ]);
  });
});
