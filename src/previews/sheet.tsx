import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SheetPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="sheet-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <Sheet defaultOpen={mode === "isolated"}>
        <SheetTrigger render={<Button variant="outline" />}>設定を開く</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>表示設定</SheetTitle>
            <SheetDescription>
              Sheet の見た目とモーダル操作を確認するためのプレビューです。
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>閉じる</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet modal={false}>
        <SheetTrigger render={<Button variant="outline" />}>詳細ペインを開く</SheetTrigger>
        <SheetContent modal={false} side="left" closeLabel="詳細ペインを閉じる">
          <SheetHeader>
            <SheetTitle>詳細ペイン</SheetTitle>
            <SheetDescription>
              非モーダルの Sheet です。背景は暗転せず、一覧側の操作を妨げません。
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
