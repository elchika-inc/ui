import { PreviewSentinel } from "@/catalog/preview-sentinel";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DropdownMenuPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <section data-slot="dropdown-menu-preview" className="flex max-w-xl flex-col gap-3 p-6">
      <PreviewSentinel mode={mode} position="before" />
      <DropdownMenu defaultOpen={mode === "isolated"}>
        <DropdownMenuTrigger className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring">
          操作を開く
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>ファイル</DropdownMenuLabel>
            <DropdownMenuItem label="new">新規作成</DropdownMenuItem>
            <DropdownMenuCheckboxItem defaultChecked>隠しファイルを表示</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup defaultValue="name">
            <DropdownMenuLabel>並び順</DropdownMenuLabel>
            <DropdownMenuRadioItem value="name">名前</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="date">更新日時</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>表示</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>リスト</DropdownMenuItem>
              <DropdownMenuItem>グリッド</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <PreviewSentinel mode={mode} position="after" />
    </section>
  );
}
