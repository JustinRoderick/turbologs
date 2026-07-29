import { describe, expect, it } from "vitest";
import {
  celsiusToFahrenheit,
  computeDensityAltitudeFt,
  fahrenheitToCelsius,
  hPaToInHg,
  metersToFeet,
  windDirectionLabel,
} from "./densityAltitude";

describe("unit conversions", () => {
  it("converts Fahrenheit and Celsius", () => {
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 5);
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 5);
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 5);
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 5);
  });

  it("converts pressure and elevation units", () => {
    expect(hPaToInHg(1013.25)).toBeCloseTo(29.921, 2);
    expect(metersToFeet(1000)).toBeCloseTo(3280.84, 1);
  });
});

describe("computeDensityAltitudeFt", () => {
  it("returns 0 for non-positive station pressure", () => {
    expect(
      computeDensityAltitudeFt({
        stationPressureInHg: 0,
        temperatureF: 70,
      }),
    ).toBe(0);
  });

  it("computes a reasonable DA near sea-level standard day", () => {
    const da = computeDensityAltitudeFt({
      stationPressureInHg: 29.92,
      temperatureF: 59,
      dewPointF: 45,
    });
    // Near ISA sea level (~15°C / 59°F), DA should be close to 0 ± a few hundred ft
    expect(da).toBeGreaterThan(-500);
    expect(da).toBeLessThan(1500);
  });

  it("increases DA with hotter, more humid air at the same pressure", () => {
    const coolDry = computeDensityAltitudeFt({
      stationPressureInHg: 29.5,
      temperatureF: 60,
      dewPointF: 30,
    });
    const hotHumid = computeDensityAltitudeFt({
      stationPressureInHg: 29.5,
      temperatureF: 95,
      dewPointF: 70,
    });
    expect(hotHumid).toBeGreaterThan(coolDry);
  });
});

describe("windDirectionLabel", () => {
  it("maps cardinal directions", () => {
    expect(windDirectionLabel(0)).toBe("N");
    expect(windDirectionLabel(90)).toBe("E");
    expect(windDirectionLabel(180)).toBe("S");
    expect(windDirectionLabel(270)).toBe("W");
  });

  it("handles missing and negative values", () => {
    expect(windDirectionLabel(undefined)).toBe("—");
    expect(windDirectionLabel(Number.NaN)).toBe("—");
    expect(windDirectionLabel(-45)).toBe("NW");
  });
});
