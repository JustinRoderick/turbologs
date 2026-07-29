"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { formatEt, formatMph, formatRunDate } from "@/lib/run-format";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RunChartsProps = {
  charts: {
    runAt: Array<number>;
    quarterEt: Array<number>;
    quarterMph: Array<number>;
    sixtyFt: Array<number>;
    densityAltitudeFt: Array<number | null>;
  };
};

const etConfig = {
  quarterEt: { label: "1/4 ET", color: "var(--chart-1)" },
} satisfies ChartConfig;

const mphConfig = {
  quarterMph: { label: "Trap MPH", color: "var(--chart-2)" },
} satisfies ChartConfig;

const launchConfig = {
  sixtyFt: { label: "60ft", color: "var(--chart-3)" },
  densityAltitudeFt: { label: "DA (ft)", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function RunPerformanceCharts({ charts }: RunChartsProps) {
  const data = charts.runAt.map((runAt, i) => ({
    runAt,
    label: formatRunDate(runAt),
    quarterEt: charts.quarterEt[i],
    quarterMph: charts.quarterMph[i],
    sixtyFt: charts.sixtyFt[i],
    densityAltitudeFt: charts.densityAltitudeFt[i],
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance trends</CardTitle>
          <CardDescription>Log a few passes to unlock ET, MPH, and 60ft charts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1/4 mile ET</CardTitle>
          <CardDescription>Lower is quicker — last {data.length} passes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={etConfig} className="aspect-auto h-56 w-full">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => formatEt(Number(v))}
                width={48}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { label?: string } | undefined;
                      return row?.label ?? "";
                    }}
                    formatter={(value) => formatEt(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="quarterEt"
                stroke="var(--color-quarterEt)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trap MPH</CardTitle>
          <CardDescription>Higher is faster through the lights</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={mphConfig} className="aspect-auto h-56 w-full">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => formatMph(Number(v))}
                width={48}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { label?: string } | undefined;
                      return row?.label ?? "";
                    }}
                    formatter={(value) => formatMph(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="quarterMph"
                stroke="var(--color-quarterMph)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">60ft + density altitude</CardTitle>
          <CardDescription>Launch consistency vs weather DA when available</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={launchConfig} className="aspect-auto h-64 w-full">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis
                yAxisId="left"
                domain={["auto", "auto"]}
                width={44}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={["auto", "auto"]}
                width={52}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { label?: string } | undefined;
                      return row?.label ?? "";
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sixtyFt"
                stroke="var(--color-sixtyFt)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="densityAltitudeFt"
                stroke="var(--color-densityAltitudeFt)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
