import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function DrawerPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="drawer-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <Drawer defaultOpen={mode === "isolated"}>
        <DrawerTrigger className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring">
          詳細を開く
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>詳細設定</DrawerTitle>
            <DrawerDescription>
              Drawer の見た目とモーダル操作を確認するためのプレビューです。
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring">
              閉じる
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
