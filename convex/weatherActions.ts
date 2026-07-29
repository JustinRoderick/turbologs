"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { computeDensityAltitudeFt, hPaToInHg, metersToFeet } from "./lib/densityAltitude";
import { openMeteoArchiveBaseUrl, pickClosestHourIndex } from "./lib/openMeteo";

type OpenMeteoHourly = {
  time: Array<string>;
  temperature_2m?: Array<number | null>;
  relative_humidity_2m?: Array<number | null>;
  dew_point_2m?: Array<number | null>;
  surface_pressure?: Array<number | null>;
  pressure_msl?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
  wind_direction_10m?: Array<number | null>;
  wind_gusts_10m?: Array<number | null>;
  precipitation?: Array<number | null>;
  shortwave_radiation?: Array<number | null>;
  soil_temperature_0_to_7cm?: Array<number | null>;
};

function openMeteoBaseUrl(): string {
  return openMeteoArchiveBaseUrl(process.env.OPEN_METEO_API_KEY);
}

export const enrichRunWeather = internalAction({
  args: { runId: v.id("runs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(internal.runInternal.getRunForWeather, { runId: args.runId });
    if (!run || !run.trackId) {
      await ctx.runMutation(internal.runs.markWeatherFailed, {
        runId: args.runId,
        error: "Run or track missing",
      });
      return null;
    }

    const track = await ctx.runQuery(internal.trackInternal.getTrack, { trackId: run.trackId });
    if (!track) {
      await ctx.runMutation(internal.runs.markWeatherFailed, {
        runId: args.runId,
        error: "Track not found",
      });
      return null;
    }

    try {
      const runDate = new Date(run.runAt);
      const dateStr = runDate.toISOString().slice(0, 10);

      const url = new URL(openMeteoBaseUrl());
      url.searchParams.set("latitude", String(track.latitude));
      url.searchParams.set("longitude", String(track.longitude));
      url.searchParams.set("start_date", dateStr);
      url.searchParams.set("end_date", dateStr);
      url.searchParams.set("timezone", "UTC");
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("precipitation_unit", "inch");
      url.searchParams.set(
        "hourly",
        [
          "temperature_2m",
          "relative_humidity_2m",
          "dew_point_2m",
          "surface_pressure",
          "pressure_msl",
          "wind_speed_10m",
          "wind_direction_10m",
          "wind_gusts_10m",
          "precipitation",
          "shortwave_radiation",
          "soil_temperature_0_to_7cm",
        ].join(","),
      );
      if (track.elevationFt !== undefined) {
        url.searchParams.set("elevation", String(track.elevationFt / 3.280839895));
      }
      const apiKey = process.env.OPEN_METEO_API_KEY;
      if (apiKey) {
        url.searchParams.set("apikey", apiKey);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        elevation?: number;
        hourly?: OpenMeteoHourly;
        reason?: string;
        error?: boolean;
      };

      if (payload.error || !payload.hourly?.time?.length) {
        throw new Error(payload.reason ?? "No hourly weather data returned");
      }

      const idx = pickClosestHourIndex(payload.hourly.time, run.runAt);
      const temperatureF = payload.hourly.temperature_2m?.[idx];
      const humidityPct = payload.hourly.relative_humidity_2m?.[idx];
      const dewPointF = payload.hourly.dew_point_2m?.[idx] ?? undefined;
      const surfacePressureHpa =
        payload.hourly.surface_pressure?.[idx] ?? payload.hourly.pressure_msl?.[idx];
      const windMph = payload.hourly.wind_speed_10m?.[idx] ?? undefined;
      const windDirectionDeg = payload.hourly.wind_direction_10m?.[idx] ?? undefined;
      const windGustMph = payload.hourly.wind_gusts_10m?.[idx] ?? undefined;
      const precipitationIn = payload.hourly.precipitation?.[idx] ?? undefined;
      const shortwaveRadiation = payload.hourly.shortwave_radiation?.[idx] ?? undefined;
      const soilTempF = payload.hourly.soil_temperature_0_to_7cm?.[idx];

      if (
        typeof temperatureF !== "number" ||
        typeof humidityPct !== "number" ||
        typeof surfacePressureHpa !== "number"
      ) {
        throw new Error("Incomplete weather fields for density altitude");
      }

      const barometricPressureInHg = hPaToInHg(surfacePressureHpa);
      const densityAltitudeFt = computeDensityAltitudeFt({
        stationPressureInHg: barometricPressureInHg,
        temperatureF,
        dewPointF: typeof dewPointF === "number" ? dewPointF : undefined,
      });

      const elevationFt =
        track.elevationFt ??
        (typeof payload.elevation === "number" ? Math.round(metersToFeet(payload.elevation)) : undefined);

      const trackTempF =
        typeof soilTempF === "number" ? Math.round(soilTempF * 10) / 10 : undefined;

      const observedAt = Date.parse(payload.hourly.time[idx]!);

      await ctx.runMutation(internal.runs.applyWeatherSnapshot, {
        runId: args.runId,
        snapshot: {
          observedAt: Number.isFinite(observedAt) ? observedAt : run.runAt,
          temperatureF,
          humidityPct,
          dewPointF: typeof dewPointF === "number" ? dewPointF : undefined,
          barometricPressureInHg: Math.round(barometricPressureInHg * 1000) / 1000,
          densityAltitudeFt,
          windMph: typeof windMph === "number" ? windMph : undefined,
          windDirectionDeg: typeof windDirectionDeg === "number" ? windDirectionDeg : undefined,
          windGustMph: typeof windGustMph === "number" ? windGustMph : undefined,
          precipitationIn: typeof precipitationIn === "number" ? precipitationIn : undefined,
          shortwaveRadiation: typeof shortwaveRadiation === "number" ? shortwaveRadiation : undefined,
          elevationFt,
          trackTempF,
          trackTempSource: trackTempF === undefined ? "unknown" : "estimated_soil",
        },
      });
    } catch (error) {
      await ctx.runMutation(internal.runs.markWeatherFailed, {
        runId: args.runId,
        error: error instanceof Error ? error.message : "Weather enrichment failed",
      });
    }

    return null;
  },
});
