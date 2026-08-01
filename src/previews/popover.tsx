import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PopoverPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="popover-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <Popover defaultOpen={mode === "isolated"} modal={false}>
        <PopoverTrigger className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
          設定を開く
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>通知設定</PopoverTitle>
            <PopoverDescription>通知方法を確認して変更できます。</PopoverDescription>
          </PopoverHeader>
          <button
            type="button"
            className="w-fit rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            通知を管理
          </button>
        </PopoverContent>
      </Popover>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
