import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  { month: "5月", desktop: 186, mobile: 80 },
  { month: "6月", desktop: 305, mobile: 200 },
  { month: "7月", desktop: 237, mobile: 120 },
  { month: "8月", desktop: 273, mobile: 190 },
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
} satisfies ChartConfig;

export function ChartPreview(_props: PreviewProps) {
  return (
    <div data-slot="chart-preview" className="p-6">
      <ChartContainer
        role="img"
        aria-label="月別利用者数"
        config={chartConfig}
        className="min-h-64 w-full"
      >
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
