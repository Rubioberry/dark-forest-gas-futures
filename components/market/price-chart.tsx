"use client";

/**
 * Price Chart Component
 *
 * Displays historical price data for all market outcomes in a multi-line chart.
 * Uses recharts via shadcn chart components for a polished, interactive chart.
 */

import { useMemo, useState } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { Outcome } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

type TimeFrame = "24h" | "7d" | "30d" | "all";

interface PriceChartProps {
  outcomes: Outcome[];
  selectedOutcomeId?: number;
  showLegend?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDateForTimeframe(timestamp: number, timeframe: TimeFrame): string {
  const date = new Date(timestamp * 1000);

  if (timeframe === "24h") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (timeframe === "7d") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// =============================================================================
// Price Chart Component
// =============================================================================

export function PriceChart({ outcomes, selectedOutcomeId, showLegend = false }: PriceChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");

  // Build chart config for all outcomes
  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    outcomes.forEach((outcome, index) => {
      let color = `var(--chart-${(index % 10) + 1})`;
      if (outcome.title.toLowerCase() === "yes") color = "#10b981"; // emerald-500
      if (outcome.title.toLowerCase() === "no") color = "#f43f5e"; // rose-500

      config[`outcome_${outcome.id}`] = {
        label: outcome.title,
        color,
      };
    });
    return config;
  }, [outcomes]);

  // Merge all outcome price data into a unified time series
  const chartData = useMemo(() => {
    const allPriceData: Map<number, Record<string, number>> = new Map();

    outcomes.forEach((outcome) => {
      // Handle both snake_case (API) and camelCase (type) field names
      const priceCharts = (outcome as unknown as Record<string, unknown>).price_charts ?? outcome.priceCharts;
      
      if (!priceCharts || !Array.isArray(priceCharts)) return;

      // Find the timeframe data
      const timeframeData = priceCharts.find(
        (chart: { timeframe: string }) => chart.timeframe === timeFrame
      );

      if (!timeframeData?.prices) return;

      // Add each price point to the map
      timeframeData.prices.forEach((point: { timestamp: number; value: number }) => {
        const existing = allPriceData.get(point.timestamp) || { timestamp: point.timestamp };
        existing[`outcome_${outcome.id}`] = point.value;
        allPriceData.set(point.timestamp, existing);
      });
    });

    // Convert to array and sort by timestamp
    return Array.from(allPriceData.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [outcomes, timeFrame]);

  const topOutcome = useMemo(() => {
    return outcomes.reduce((top, current) =>
      current.price > top.price ? current : top
    );
  }, [outcomes]);

  const changePercent = useMemo(() => {
    const priceCharts = (topOutcome as unknown as Record<string, unknown>).price_charts ?? topOutcome.priceCharts;
    if (!priceCharts || !Array.isArray(priceCharts)) return 0;
    
    const timeframeData = priceCharts.find(
      (chart: { timeframe: string }) => chart.timeframe === timeFrame
    );
    return timeframeData?.changePercent ?? 0;
  }, [topOutcome, timeFrame]);

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with timeframe selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {selectedOutcomeId !== undefined && (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">
                {((outcomes.find(o => o.id === selectedOutcomeId)?.price ?? 0) * 100).toFixed(1)}%
              </p>
              <p
                className={cn(
                  "text-sm",
                  changePercent >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {changePercent >= 0 ? "+" : ""}
                {(changePercent * 100).toFixed(1)}% ({timeFrame})
              </p>
            </div>
          )}
        </div>

        <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
          <TabsList>
            <TabsTrigger value="24h" className="text-xs">
              24H
            </TabsTrigger>
            <TabsTrigger value="7d" className="text-xs">
              7D
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-xs">
              30D
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.2}
            />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={50}
              tickFormatter={(value) => formatDateForTimeframe(value, timeFrame)}
              stroke="var(--muted-foreground)"
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              domain={["dataMin", "dataMax"]}
              stroke="var(--muted-foreground)"
              fontSize={11}
              width={45}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const items = payload as Array<{ payload?: { timestamp?: number } }>;
                    if (items?.[0]?.payload?.timestamp) {
                      return formatTooltipDate(items[0].payload.timestamp);
                    }
                    return "";
                  }}
                  indicator="dot"
                  sort="desc"
                />
              }
            />
            {outcomes.map((outcome, index) => {
              const color =
                chartConfig[`outcome_${outcome.id}`]?.color ||
                `var(--chart-${(index % 10) + 1})`;
              return (
                <Line
                  key={outcome.id}
                  type="monotone"
                  dataKey={`outcome_${outcome.id}`}
                  name={outcome.title}
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  style={
                    selectedOutcomeId === outcome.id
                      ? { filter: "url(#glow)" }
                      : undefined
                  }
                  dot={false}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: color,
                    fill: "var(--background)",
                  }}
                  strokeOpacity={
                    selectedOutcomeId === undefined || selectedOutcomeId === outcome.id
                      ? 1
                      : 0.3
                  }
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground text-sm">
          No price history available for this timeframe
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {outcomes.map((outcome, index) => {
            const color =
              chartConfig[`outcome_${outcome.id}`]?.color ||
              `var(--chart-${(index % 10) + 1})`;
            return (
              <div
                key={outcome.id}
                className={cn(
                  "flex items-center gap-2",
                  selectedOutcomeId === outcome.id && "font-medium"
                )}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: color,
                  }}
                />
                <span className="truncate max-w-[150px]">{outcome.title}</span>
                <span className="text-muted-foreground tabular-nums">
                  {(outcome.price * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
