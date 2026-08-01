import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function HoverCardPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="hover-card-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <HoverCard defaultOpen={mode === "isolated"}>
        <HoverCardTrigger
          href="#hover-card-preview"
          className="w-fit rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        >
          @elchika
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="font-medium">elchika-inc</p>
          <p className="mt-1 text-muted-foreground">
            共通UIコンポーネントを確認するための Hover Card プレビューです。
          </p>
        </HoverCardContent>
      </HoverCard>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
