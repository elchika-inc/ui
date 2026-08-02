import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "5月", desktop: 186, mobile: 80, tablet: 112, api: 62, automation: 42 },
  { month: "6月", desktop: 305, mobile: 200, tablet: 164, api: 98, automation: 71 },
  { month: "7月", desktop: 237, mobile: 120, tablet: 149, api: 85, automation: 63 },
  { month: "8月", desktop: 273, mobile: 190, tablet: 178, api: 114, automation: 92 },
];

const chartConfig = {
  desktop: {
    label: "デスクトップ",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "モバイル",
    color: "var(--chart-2)",
  },
  tablet: {
    label: "タブレット",
    color: "var(--chart-3)",
  },
  api: {
    label: "API",
    color: "var(--chart-4)",
  },
  automation: {
    label: "自動化",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const series = [
  { key: "desktop", dash: "var(--chart-dash-1)" },
  { key: "mobile", dash: "var(--chart-dash-2)" },
  { key: "tablet", dash: "var(--chart-dash-3)" },
  { key: "api", dash: "var(--chart-dash-4)" },
  { key: "automation", dash: "var(--chart-dash-5)" },
] as const;

export function ChartPreview(_props: PreviewProps) {
  return (
    <div data-slot="chart-preview" className="p-6">
      <ChartContainer
        id="利用者:2026"
        role="img"
        aria-label="月別利用者数"
        config={chartConfig}
        className="min-h-64 w-full"
      >
        <LineChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {series.map(({ key, dash }) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeDasharray={dash}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
