import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ArrowLeft, CloudSun, Gauge, Plus, Timer } from "lucide-react";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { MonthlyPassesChart } from "@/components/dashboard/MonthlyPassesChart";
import { NamedCountBarChart } from "@/components/dashboard/NamedCountBarChart";
import { ResultBreakdownChart } from "@/components/dashboard/ResultBreakdownChart";
import { RunPerformanceCharts } from "@/components/runs/RunPerformanceCharts";
import { formatEt, formatMph, formatRunDate } from "@/lib/run-format";
import {
  motorsportCategoryLabel,
  vehicleKindLabel,
  vehicleSubtitle,
} from "@/lib/vehicle-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/garages/$garageId/vehicles/$vehicleId/")({
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { garageId, vehicleId } = Route.useParams();
  const carId = vehicleId as Id<"cars">;
  const [now] = useState(() => Date.now());

  const vehicle = useQuery(api.vehicles.get, { carId });
  const dashboard = useQuery(api.runs.dashboardByCar, vehicle ? { carId, now } : "skip");

  if (vehicle === undefined || (vehicle && dashboard === undefined)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading vehicle dashboard…</p>
      </div>
    );
  }

  if (vehicle === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle not found</CardTitle>
            <CardDescription>You may not have access to this vehicle.</CardDescription>
          </CardHeader>
        </Card>
        <Button variant="link" className="mt-4 px-0" asChild>
          <Link to="/garages/$garageId" params={{ garageId }}>
            Back to garage
          </Link>
        </Button>
      </div>
    );
  }

  const canLog = vehicle.role !== "viewer";
  const subtitle = vehicleSubtitle(vehicle);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/garages/$garageId" params={{ garageId }}>
              <ArrowLeft className="size-4" />
              {vehicle.garageName}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{vehicle.name}</h1>
            <Badge variant="secondary">{vehicleKindLabel(vehicle.vehicleKind)}</Badge>
            <Badge variant="outline">{motorsportCategoryLabel(vehicle.motorsportCategory)}</Badge>
          </div>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          {dashboard?.lastRunAt ? (
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Last pass · {formatRunDate(dashboard.lastRunAt)}
            </p>
          ) : null}
        </div>
        {canLog ? (
          <Button asChild>
            <Link
              to="/garages/$garageId/vehicles/$vehicleId/runs/new"
              params={{ garageId, vehicleId }}
            >
              <Plus className="size-4" />
              Log run
            </Link>
          </Button>
        ) : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Passes" value={String(dashboard?.totalRuns ?? 0)} hint="Active (non-archived)" />
        <DashboardStatCard label="Best 1/4 ET" value={formatEt(dashboard?.bestQuarterEt)} hint={`Avg ${formatEt(dashboard?.averageQuarterEt)}`} />
        <DashboardStatCard label="Best trap MPH" value={formatMph(dashboard?.bestQuarterMph)} hint={`Avg ${formatMph(dashboard?.averageQuarterMph)}`} />
        <DashboardStatCard label="Best 60ft" value={formatEt(dashboard?.bestSixtyFt)} hint={`Avg ${formatEt(dashboard?.averageSixtyFt)}`} />
        <DashboardStatCard
          label="Best RT"
          value={formatEt(dashboard?.bestReactionTime)}
          hint={`Avg ${formatEt(dashboard?.averageReactionTime)}`}
        />
        <DashboardStatCard
          label="Win rate"
          value={dashboard?.winRatePct === null || dashboard?.winRatePct === undefined ? "—" : `${dashboard.winRatePct}%`}
          hint="Among win/loss rounds"
        />
        <DashboardStatCard
          label="Weather coverage"
          value={`${dashboard?.weatherCoveragePct ?? 0}%`}
          hint={`${dashboard?.weatherReadyCount ?? 0} passes with weather`}
        />
        <DashboardStatCard
          label="Avg DA"
          value={
            dashboard?.averageDensityAltitudeFt === null || dashboard?.averageDensityAltitudeFt === undefined
              ? "—"
              : `${dashboard.averageDensityAltitudeFt} ft`
          }
          hint={`${dashboard?.tracksVisited ?? 0} tracks visited`}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4" />
              Vehicle snapshot
            </CardTitle>
            <CardDescription>Specs that affect how you read the charts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <SpecRow label="Engine" value={vehicle.engine} />
            <SpecRow label="Transmission" value={vehicle.transmission} />
            <SpecRow label="Tire" value={vehicle.tire} />
            <SpecRow label="Weight" value={vehicle.weightLbs ? `${vehicle.weightLbs} lbs` : undefined} />
            <SpecRow label="Drivetrain" value={vehicle.drivetrain} />
            <SpecRow label="Lifetime passes" value={String(vehicle.totalPasses)} />
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Timer className="size-3.5" />
                Consistency
              </CardDescription>
              <CardTitle className="text-lg">Averages tell the real story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Best marks show potential. Averages show whether the car repeats that potential under
                changing weather and track conditions.
              </p>
              <p>
                Use 60ft + DA together: if launches scatter while DA is stable, look at clutch,
                boost, or tire pressure before chasing ET.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CloudSun className="size-3.5" />
                Weather readiness
              </CardDescription>
              <CardTitle className="text-lg tabular-nums">{dashboard?.weatherCoveragePct ?? 0}%</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Passes with ready/manual weather attached. Higher coverage makes DA overlays and
              weather-corrected comparisons more trustworthy.
            </CardContent>
          </Card>
        </div>
      </section>

      {dashboard ? <RunPerformanceCharts charts={dashboard.charts} /> : null}

      {dashboard ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <MonthlyPassesChart data={dashboard.charts.monthlyPasses} />
          <NamedCountBarChart
            title="Tracks"
            description="Where this car has been racing"
            data={dashboard.charts.trackBreakdown}
            emptyMessage="Log runs with a track to populate this chart."
            color="var(--chart-3)"
          />
          <ResultBreakdownChart breakdown={dashboard.charts.resultBreakdown} />
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Recent runs</h2>
          {canLog ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/garages/$garageId/vehicles/$vehicleId/runs/new"
                params={{ garageId, vehicleId }}
              >
                <Plus className="size-4" />
                Add
              </Link>
            </Button>
          ) : null}
        </div>

        {(dashboard?.recent.length ?? 0) === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No runs yet</CardTitle>
              <CardDescription>
                Log your first pass with track location to unlock weather, DA, and trend charts.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Track</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">60ft</th>
                  <th className="px-3 py-2 font-medium">1/4 ET</th>
                  <th className="px-3 py-2 font-medium">MPH</th>
                  <th className="px-3 py-2 font-medium">DA</th>
                </tr>
              </thead>
              <tbody>
                {dashboard!.recent.map((run) => (
                  <tr key={run._id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        to="/garages/$garageId/vehicles/$vehicleId/runs/$runId"
                        params={{ garageId, vehicleId, runId: run._id }}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {formatRunDate(run.runAt)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{run.trackName ?? "—"}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{run.result ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{formatEt(run.sixtyFt)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatEt(run.quarterEt)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatMph(run.quarterMph)}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {run.densityAltitudeFt !== undefined ? Math.round(run.densityAltitudeFt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
