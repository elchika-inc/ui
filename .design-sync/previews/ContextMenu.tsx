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
} from "ui-scaffold";

import type { KeyboardEvent } from "react";


function handleContextMenuKey(event: KeyboardEvent<HTMLDivElement>) {
  const isContextMenuKey = event.key === "ContextMenu";
  const isShiftF10 = event.shiftKey && event.key === "F10";
  if (!isContextMenuKey && !isShiftF10) return;

  event.preventDefault();
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="context-menu-preview" className="flex max-w-xl flex-col gap-3 p-6">      <ContextMenu>
        <ContextMenuTrigger
          render={<button type="button" />}
          onKeyDown={handleContextMenuKey}
          className="rounded-lg border border-dashed border-border bg-muted px-6 py-12 text-center text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          ここを右クリック
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>ファイル</ContextMenuLabel>
            <ContextMenuItem label="new">新規作成</ContextMenuItem>
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
      </ContextMenu>    </section>
  );
}
