import { describe, expect, it } from "vitest";
import { openMeteoArchiveBaseUrl, pickClosestHourIndex } from "./openMeteo";

describe("pickClosestHourIndex", () => {
  const hours = [
    "2026-07-29T18:00:00.000Z",
    "2026-07-29T19:00:00.000Z",
    "2026-07-29T20:00:00.000Z",
    "2026-07-29T21:00:00.000Z",
  ];

  it("returns 0 for an empty times array", () => {
    expect(pickClosestHourIndex([], Date.parse("2026-07-29T19:30:00.000Z"))).toBe(0);
  });

  it("picks the nearest hour to the run timestamp", () => {
    const target = Date.parse("2026-07-29T19:20:00.000Z");
    expect(pickClosestHourIndex(hours, target)).toBe(1);
  });

  it("picks a later hour when that is closer", () => {
    const target = Date.parse("2026-07-29T20:40:00.000Z");
    expect(pickClosestHourIndex(hours, target)).toBe(3);
  });

  it("skips invalid timestamps and still finds a match", () => {
    const mixed = ["not-a-date", "2026-07-29T19:00:00.000Z", "also-bad"];
    const target = Date.parse("2026-07-29T19:05:00.000Z");
    expect(pickClosestHourIndex(mixed, target)).toBe(1);
  });
});

describe("openMeteoArchiveBaseUrl", () => {
  it("uses the public archive URL without an API key", () => {
    expect(openMeteoArchiveBaseUrl(undefined)).toBe(
      "https://archive-api.open-meteo.com/v1/archive",
    );
    expect(openMeteoArchiveBaseUrl("")).toBe("https://archive-api.open-meteo.com/v1/archive");
  });

  it("uses the commercial customer URL when a key is present", () => {
    expect(openMeteoArchiveBaseUrl("secret-key")).toBe(
      "https://customer-archive-api.open-meteo.com/v1/archive",
    );
  });
});
