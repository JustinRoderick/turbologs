import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ExistingWeather = {
  temperatureF: number;
  humidityPct: number;
  barometricPressureInHg: number;
  dewPointF?: number;
  windMph?: number;
  windDirectionDeg?: number;
  windGustMph?: number;
  trackTempF?: number;
  elevationFt?: number;
  precipitationIn?: number;
} | null;

type ManualWeatherFormProps = {
  runId: Id<"runs">;
  existing?: ExistingWeather;
  onSaved?: () => void;
};

function numOrEmpty(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

export function ManualWeatherForm({ runId, existing, onSaved }: ManualWeatherFormProps) {
  const setManualWeather = useMutation(api.runs.setManualWeather);

  const [temperatureF, setTemperatureF] = useState(numOrEmpty(existing?.temperatureF));
  const [humidityPct, setHumidityPct] = useState(numOrEmpty(existing?.humidityPct));
  const [barometricPressureInHg, setBarometricPressureInHg] = useState(
    numOrEmpty(existing?.barometricPressureInHg),
  );
  const [dewPointF, setDewPointF] = useState(numOrEmpty(existing?.dewPointF));
  const [windMph, setWindMph] = useState(numOrEmpty(existing?.windMph));
  const [windDirectionDeg, setWindDirectionDeg] = useState(
    numOrEmpty(existing?.windDirectionDeg),
  );
  const [windGustMph, setWindGustMph] = useState(numOrEmpty(existing?.windGustMph));
  const [trackTempF, setTrackTempF] = useState(numOrEmpty(existing?.trackTempF));
  const [elevationFt, setElevationFt] = useState(numOrEmpty(existing?.elevationFt));
  const [precipitationIn, setPrecipitationIn] = useState(numOrEmpty(existing?.precipitationIn));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const optionalNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const temp = Number(temperatureF);
      const humidity = Number(humidityPct);
      const pressure = Number(barometricPressureInHg);
      if (![temp, humidity, pressure].every(Number.isFinite)) {
        throw new Error("Air temp, humidity, and pressure are required");
      }
      await setManualWeather({
        runId,
        temperatureF: temp,
        humidityPct: humidity,
        barometricPressureInHg: pressure,
        dewPointF: optionalNumber(dewPointF),
        windMph: optionalNumber(windMph),
        windDirectionDeg: optionalNumber(windDirectionDeg),
        windGustMph: optionalNumber(windGustMph),
        trackTempF: optionalNumber(trackTempF),
        elevationFt: optionalNumber(elevationFt),
        precipitationIn: optionalNumber(precipitationIn),
      });
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weather");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Required: air temp, humidity, and barometer. Density altitude is calculated for you. Everything
        else is optional.
      </p>
      <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="wx-temp">Air temp (°F) *</FieldLabel>
          <Input
            id="wx-temp"
            inputMode="decimal"
            required
            value={temperatureF}
            onChange={(e) => setTemperatureF(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-hum">Humidity (%) *</FieldLabel>
          <Input
            id="wx-hum"
            inputMode="decimal"
            required
            value={humidityPct}
            onChange={(e) => setHumidityPct(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-press">Pressure (inHg) *</FieldLabel>
          <Input
            id="wx-press"
            inputMode="decimal"
            required
            value={barometricPressureInHg}
            onChange={(e) => setBarometricPressureInHg(e.target.value)}
          />
          <FieldDescription>Station / absolute preferred</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-dew">Dew point (°F)</FieldLabel>
          <Input
            id="wx-dew"
            inputMode="decimal"
            value={dewPointF}
            onChange={(e) => setDewPointF(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-wind">Wind (mph)</FieldLabel>
          <Input
            id="wx-wind"
            inputMode="decimal"
            value={windMph}
            onChange={(e) => setWindMph(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-dir">Wind direction (°)</FieldLabel>
          <Input
            id="wx-dir"
            inputMode="decimal"
            value={windDirectionDeg}
            onChange={(e) => setWindDirectionDeg(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-gust">Gust (mph)</FieldLabel>
          <Input
            id="wx-gust"
            inputMode="decimal"
            value={windGustMph}
            onChange={(e) => setWindGustMph(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-track">Track temp (°F)</FieldLabel>
          <Input
            id="wx-track"
            inputMode="decimal"
            value={trackTempF}
            onChange={(e) => setTrackTempF(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-elev">Elevation (ft)</FieldLabel>
          <Input
            id="wx-elev"
            inputMode="decimal"
            value={elevationFt}
            onChange={(e) => setElevationFt(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="wx-precip">Precip (in)</FieldLabel>
          <Input
            id="wx-precip"
            inputMode="decimal"
            value={precipitationIn}
            onChange={(e) => setPrecipitationIn(e.target.value)}
          />
        </Field>
      </FieldGroup>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save manual weather"}
      </Button>
    </form>
  );
}
