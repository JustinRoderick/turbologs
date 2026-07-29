"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type NamedCountChartProps = {
  title: string;
  description: string;
  data: Array<{ name: string; count: number }>;
  emptyMessage?: string;
  color?: string;
};

export function NamedCountBarChart({
  title,
  description,
  data,
  emptyMessage = "Nothing to chart yet.",
  color = "var(--chart-2)",
}: NamedCountChartProps) {
  const chartConfig = {
    count: {
      label: "Count",
      color,
    },
  } satisfies ChartConfig;

  const chartData = data.map((row) => ({
    ...row,
    shortName: row.name.length > 18 ? `${row.name.slice(0, 16)}…` : row.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="shortName"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <ChartTooltip
                content={<ChartTooltipContent labelKey="name" nameKey="count" />}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined;
                  return row?.name ?? "";
                }}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
