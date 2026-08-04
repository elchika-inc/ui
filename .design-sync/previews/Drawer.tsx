import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="drawer-preview" className="flex max-w-xl flex-col gap-3 p-6">      <Drawer defaultOpen={mode === "isolated"}>
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
      </Drawer>    </section>
  );
}
