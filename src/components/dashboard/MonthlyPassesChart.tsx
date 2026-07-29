"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MonthlyPassesChartProps = {
  title?: string;
  description?: string;
  data: Array<{ month: string; label: string; count: number }>;
};

const chartConfig = {
  count: {
    label: "Passes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MonthlyPassesChart({
  title = "Passes by month",
  description = "Last six months of logged activity",
  data,
}: MonthlyPassesChartProps) {
  const hasData = data.some((row) => row.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No passes in this window yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
