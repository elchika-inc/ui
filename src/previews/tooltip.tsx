import { useState } from "react";

import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TooltipPreview({ mode = "isolated" }: PreviewProps) {
  const [backgroundClicks, setBackgroundClicks] = useState(0);

  return (
    <section data-slot="tooltip-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <TooltipProvider>
        <Tooltip defaultOpen={mode === "isolated"}>
          <TooltipTrigger className="w-fit rounded-md border border-border px-3 py-2 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
            詳細を見る
          </TooltipTrigger>
          <TooltipContent>共通 UI の補足情報です</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button
        type="button"
        data-slot="tooltip-background-action"
        className="w-fit rounded-md border border-border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() => setBackgroundClicks((count) => count + 1)}
      >
        背景操作: {backgroundClicks}
      </button>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
