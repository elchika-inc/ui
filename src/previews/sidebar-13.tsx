import { SettingsDialog } from "@/blocks/sidebar-13/components/settings-dialog";
import type { PreviewProps } from "@/catalog/preview-types";
import { TooltipProvider } from "@/components/ui/tooltip";

export function SidebarOneThreePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="sidebar-13-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <div className="flex h-svh items-center justify-center">
          <SettingsDialog />
        </div>
      </TooltipProvider>
    </section>
  );
}
