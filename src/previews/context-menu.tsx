import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function ContextMenuPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="context-menu-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <ContextMenu>
        <ContextMenuTrigger className="rounded-lg border border-dashed border-border bg-muted px-6 py-12 text-center text-sm text-muted-foreground">
          ここを右クリック
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>ファイル</ContextMenuLabel>
            <ContextMenuItem>新規作成</ContextMenuItem>
            <ContextMenuCheckboxItem defaultChecked>隠しファイルを表示</ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup defaultValue="name">
            <ContextMenuLabel>並び順</ContextMenuLabel>
            <ContextMenuRadioItem value="name">名前</ContextMenuRadioItem>
            <ContextMenuRadioItem value="date">更新日時</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>表示</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>リスト</ContextMenuItem>
              <ContextMenuItem>グリッド</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
