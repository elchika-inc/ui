import type * as React from "react";
import { AppSidebar } from "@/blocks/dashboard-01/components/app-sidebar";
import { ChartAreaInteractive } from "@/blocks/dashboard-01/components/chart-area-interactive";
import { SectionCards } from "@/blocks/dashboard-01/components/section-cards";
import { SiteHeader } from "@/blocks/dashboard-01/components/site-header";
import dashboardData from "@/blocks/dashboard-01/data.json";
import type { PreviewProps } from "@/catalog/preview-types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardZeroOnePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="dashboard-01-preview"
      data-preview-mode={mode}
      data-record-count={dashboardData.length}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <SidebarProvider
          className={catalog ? "min-h-96" : undefined}
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <SectionCards />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </section>
  );
}
