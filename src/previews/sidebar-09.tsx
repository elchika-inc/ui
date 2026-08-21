import { AppSidebar } from "@/blocks/sidebar-09/components/app-sidebar";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function SidebarZeroNinePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="sidebar-09-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "350px",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">All Inboxes</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Inbox</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {Array.from({ length: 24 }, (_, index) => `sidebar-09-placeholder-${index + 1}`).map(
                (placeholderId) => (
                  <div
                    key={placeholderId}
                    className="aspect-video h-12 w-full rounded-lg bg-muted/50"
                  />
                ),
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </section>
  );
}
