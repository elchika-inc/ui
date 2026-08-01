import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@/components/ui/scroll-area";

const entries = [
  "スクロール操作を確認するための最初の項目です。",
  "キーボードで移動したときも、現在位置を見失わないようにします。",
  "縦方向と横方向の両方で overflow が発生します。",
  "カスタム scrollbar はネイティブのスクロール位置に追従します。",
  "各操作要素は Tab 順で到達できます。",
  "十分な本文量を用意して、縦方向の移動を実測可能にします。",
  "横幅は狭い画面でも内容を切り捨てずに確認できます。",
  "この行も縦スクロールの検証用に配置しています。",
] as const;

export function ScrollAreaPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="scroll-area-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <ScrollArea className="h-52 w-full max-w-lg">
        <ScrollAreaViewport aria-label="操作記録" className="focus-visible:ring-offset-2">
          <ScrollAreaContent className="min-h-144 p-4">
            <div className="flex min-w-160 flex-col gap-3">
              {entries.map((entry, index) => (
                <button
                  key={entry}
                  type="button"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-card-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  {index + 1}. {entry}
                </button>
              ))}
            </div>
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaScrollbar orientation="horizontal">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner />
      </ScrollArea>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
