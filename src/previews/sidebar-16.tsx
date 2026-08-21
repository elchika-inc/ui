import { AppSidebar } from "@/blocks/sidebar-16/components/app-sidebar";
import { SiteHeader } from "@/blocks/sidebar-16/components/site-header";
import type { PreviewProps } from "@/catalog/preview-types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function SidebarOneSixPreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="sidebar-16-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <div className="[--header-height:calc(--spacing(14))]">
          <SidebarProvider className="flex flex-col">
            <SiteHeader />
            <div className="flex flex-1">
              <AppSidebar />
              <SidebarInset>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50" />
                    <div className="aspect-video rounded-xl bg-muted/50" />
                    <div className="aspect-video rounded-xl bg-muted/50" />
                  </div>
                  <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </TooltipProvider>
    </section>
  );
}
