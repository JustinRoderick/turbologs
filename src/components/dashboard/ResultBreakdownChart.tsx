"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ResultBreakdown = {
  win: number;
  loss: number;
  solo: number;
  redlight: number;
  unknown: number;
};

type ResultBreakdownChartProps = {
  title?: string;
  description?: string;
  breakdown: ResultBreakdown;
};

const chartConfig = {
  win: { label: "Win", color: "var(--chart-1)" },
  loss: { label: "Loss", color: "var(--chart-5)" },
  solo: { label: "Solo", color: "var(--chart-2)" },
  redlight: { label: "Redlight", color: "var(--chart-3)" },
  unknown: { label: "Unknown", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function ResultBreakdownChart({
  title = "Round results",
  description = "How passes finished when a result was logged",
  breakdown,
}: ResultBreakdownChartProps) {
  const data = (Object.keys(chartConfig) as Array<keyof ResultBreakdown>)
    .map((key) => ({
      key,
      name: chartConfig[key].label,
      value: breakdown[key],
      fill: `var(--color-${key})`,
    }))
    .filter((row) => row.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Log win/loss/solo results on passes to unlock this chart.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} strokeWidth={2}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
