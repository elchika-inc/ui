import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="sheet-preview" className="flex max-w-xl flex-col gap-3 p-6">      <Sheet defaultOpen={mode === "isolated"}>
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
      </Sheet>    </section>
  );
}
