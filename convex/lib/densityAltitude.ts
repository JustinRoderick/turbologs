/** Density altitude helpers for drag-racing weather enrichment. */

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function hPaToInHg(hPa: number): number {
  return hPa * 0.0295299830714;
}

export function metersToFeet(meters: number): number {
  return meters * 3.280839895;
}

/**
 * Approximate density altitude (ft) from station pressure (inHg),
 * air temperature (°F), and dew point (°F).
 *
 * Uses pressure altitude + ISA temperature correction with a humidity
 * adjustment via virtual temperature approximation.
 */
export function computeDensityAltitudeFt(args: {
  stationPressureInHg: number;
  temperatureF: number;
  dewPointF?: number;
}): number {
  const { stationPressureInHg, temperatureF, dewPointF } = args;
  if (stationPressureInHg <= 0) {
    return 0;
  }

  const pressureAltitudeFt = 145366.45 * (1 - Math.pow(stationPressureInHg / 29.92126, 0.190284));
  const tempC = fahrenheitToCelsius(temperatureF);
  const dewC =
    dewPointF === undefined ? tempC - ((100 - 50) / 5) : fahrenheitToCelsius(dewPointF);

  // Magnus approximation for vapor pressure (hPa)
  const e = 6.112 * Math.exp((17.67 * dewC) / (dewC + 243.5));
  const stationPressureHpa = stationPressureInHg / 0.0295299830714;
  const virtualTempK = (tempC + 273.15) / (1 - 0.378 * (e / Math.max(stationPressureHpa, 1)));
  const virtualTempC = virtualTempK - 273.15;
  const isaTempC = 15 - (pressureAltitudeFt * 1.98) / 1000;
  const densityAltitudeFt = pressureAltitudeFt + 118.8 * (virtualTempC - isaTempC);

  return Math.round(densityAltitudeFt);
}

export function windDirectionLabel(degrees: number | undefined): string {
  if (degrees === undefined || Number.isNaN(degrees)) {
    return "—";
  }
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return dirs[idx] ?? "—";
}
