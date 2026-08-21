import { AppSidebar } from "@/blocks/sidebar-12/components/app-sidebar";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function SidebarOneTwoPreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="sidebar-12-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>October 2024</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="grid auto-rows-min gap-4 md:grid-cols-5">
                {Array.from(
                  { length: 20 },
                  (_, index) => `sidebar-12-placeholder-${index + 1}`,
                ).map((placeholderId) => (
                  <div key={placeholderId} className="aspect-square rounded-xl bg-muted/50" />
                ))}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </section>
  );
}
