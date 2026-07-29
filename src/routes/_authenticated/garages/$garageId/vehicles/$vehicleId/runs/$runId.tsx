import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ArrowLeft, CloudSun, RefreshCw } from "lucide-react";
import { api } from "../../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../../convex/_generated/dataModel";
import { ManualWeatherForm } from "@/components/runs/ManualWeatherForm";
import { RunAttachmentsPanel } from "@/components/runs/RunAttachmentsPanel";
import { formatEt, formatMph, formatRunDate } from "@/lib/run-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute(
  "/_authenticated/garages/$garageId/vehicles/$vehicleId/runs/$runId",
)({
  component: RunDetailPage,
});

function RunDetailPage() {
  const { garageId, vehicleId, runId } = Route.useParams();
  const detail = useQuery(api.runs.get, { runId: runId as Id<"runs"> });
  const retryWeather = useMutation(api.runs.retryWeatherEnrichment);
  const [showManualWeather, setShowManualWeather] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading run…</p>
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm">Run not found.</p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link to="/garages/$garageId/vehicles/$vehicleId" params={{ garageId, vehicleId }}>
            Back to vehicle
          </Link>
        </Button>
      </div>
    );
  }

  const { run, weather, track, canEdit } = detail;
  const weatherFailed = run.weatherStatus === "failed";
  const weatherMissing = !weather;
  const shouldOfferManual =
    canEdit && (weatherFailed || weatherMissing || run.weatherStatus === "manual" || showManualWeather);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <header>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link to="/garages/$garageId/vehicles/$vehicleId" params={{ garageId, vehicleId }}>
            <ArrowLeft className="size-4" />
            Back to vehicle
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{formatRunDate(run.runAt)}</h1>
          {run.result ? <Badge variant="secondary" className="capitalize">{run.result}</Badge> : null}
          {run.weatherStatus ? (
            <Badge variant="outline" className="capitalize">
              Weather: {run.weatherStatus}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {run.trackName ?? "Unknown track"}
          {track?.city || track?.state
            ? ` · ${[track.city, track.state].filter(Boolean).join(", ")}`
            : ""}
          {run.eventName ? ` · ${run.eventName}` : ""}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="60ft" value={formatEt(run.sixtyFt)} />
        <Metric label="1/4 ET" value={formatEt(run.quarterEt)} />
        <Metric label="Trap MPH" value={formatMph(run.quarterMph)} />
        <Metric label="Reaction" value={formatEt(run.reactionTime)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full slip</CardTitle>
          {!run.sixtyFt && !run.quarterEt ? (
            <CardDescription>
              Timing not entered yet — scan a time slip below or edit this run after OCR.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-3 text-sm">
            <Item label="330ft" value={formatEt(run.threeThirtyFt)} />
            <Item label="1/8 ET" value={formatEt(run.oneEighthEt)} />
            <Item label="1/8 MPH" value={formatMph(run.oneEighthMph)} />
            <Item label="1000ft" value={formatEt(run.thousandFt)} />
            <Item label="Dial-in" value={formatEt(run.dialInSeconds)} />
            <Item label="Lane" value={run.lane ?? "—"} />
            <Item label="Tree" value={run.treeType ?? "—"} />
            <Item label="ECU" value={run.ecuBrand ?? "—"} />
          </dl>
          {run.notes ? <p className="mt-4 text-sm text-muted-foreground">{run.notes}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CloudSun className="size-4" />
                Weather
              </CardTitle>
              <CardDescription>
                Auto-fetched from Open-Meteo for the track coordinates and run hour. If that fails,
                enter conditions manually — density altitude is calculated for you.
              </CardDescription>
            </div>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                {run.trackId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={retrying || run.weatherStatus === "pending"}
                    onClick={() => {
                      setRetrying(true);
                      void retryWeather({ runId: run._id })
                        .catch(() => undefined)
                        .finally(() => setRetrying(false));
                    }}
                  >
                    <RefreshCw className="size-4" />
                    {retrying ? "Retrying…" : "Retry auto weather"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant={shouldOfferManual && showManualWeather ? "secondary" : "outline"}
                  onClick={() => setShowManualWeather((v) => !v)}
                >
                  {showManualWeather || weatherFailed ? "Manual entry" : "Enter weather manually"}
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {run.weatherStatus === "pending" ? (
            <p className="text-sm text-muted-foreground">Fetching weather for this pass…</p>
          ) : null}
          {weatherFailed ? (
            <p className="text-sm text-destructive">
              Automatic weather failed{run.weatherError ? `: ${run.weatherError}` : ""}. Enter
              conditions manually below.
            </p>
          ) : null}
          {weather ? (
            <dl className="grid gap-3 sm:grid-cols-3 text-sm">
              <Item label="Air temp" value={`${weather.temperatureF.toFixed(1)} °F`} />
              <Item label="Humidity" value={`${weather.humidityPct.toFixed(0)}%`} />
              <Item label="Pressure" value={`${weather.barometricPressureInHg.toFixed(2)} inHg`} />
              <Item label="Density altitude" value={`${Math.round(weather.densityAltitudeFt)} ft`} />
              <Item
                label="Wind"
                value={
                  weather.windMph !== undefined
                    ? `${weather.windMph.toFixed(1)} mph @ ${weather.windDirectionDeg ?? "—"}°`
                    : "—"
                }
              />
              <Item
                label="Track temp"
                value={
                  weather.trackTempF !== undefined ? `${weather.trackTempF.toFixed(1)} °F` : "—"
                }
              />
              <Item
                label="Dew point"
                value={weather.dewPointF !== undefined ? `${weather.dewPointF.toFixed(1)} °F` : "—"}
              />
              <Item
                label="Gust"
                value={weather.windGustMph !== undefined ? `${weather.windGustMph.toFixed(1)} mph` : "—"}
              />
              <Item
                label="Elevation"
                value={weather.elevationFt !== undefined ? `${Math.round(weather.elevationFt)} ft` : "—"}
              />
              <Item label="Source" value={weather.source} />
            </dl>
          ) : null}

          {canEdit && (weatherFailed || showManualWeather || run.weatherStatus === "manual") ? (
            <div className="rounded-md border bg-muted/20 p-4">
              <ManualWeatherForm
                runId={run._id}
                existing={weather}
                onSaved={() => setShowManualWeather(false)}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RunAttachmentsPanel carId={run.carId} runId={run._id} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize tabular-nums">{value}</dd>
    </div>
  );
}
