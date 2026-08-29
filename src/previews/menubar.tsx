import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function MenubarPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="menubar-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <Menubar>
        <MenubarMenu defaultOpen={mode === "isolated"}>
          <MenubarTrigger>ファイル</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              新規作成
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              開く
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem defaultChecked>自動保存</MenubarCheckboxItem>
            <MenubarRadioGroup defaultValue="team">
              <MenubarRadioItem value="personal">個人用</MenubarRadioItem>
              <MenubarRadioItem value="team">チーム用</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>共有</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>リンクをコピー</MenubarItem>
                <MenubarItem>共同編集者を招待</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">削除</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>編集</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              元に戻す
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              やり直す
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
