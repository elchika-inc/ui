import dashboardData from "@/blocks/dashboard-01/data.json";
import { DashboardTable } from "@/blocks/dashboard-table/components/dashboard-table";
import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";

const previewData = dashboardData.slice(0, 12);

export function DashboardTablePreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section
      data-slot="dashboard-table-preview"
      data-preview-mode={mode}
      data-record-count={previewData.length}
      className={
        mode === "catalog"
          ? "h-96 overflow-auto rounded-lg border border-border bg-background p-4"
          : "mx-auto min-h-svh max-w-7xl bg-background p-4 text-foreground sm:p-6"
      }
    >
      <PreviewSentinel mode={mode} position="before" />
      <DashboardTable data={previewData} />
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
