import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "ui-scaffold";

import { Bell, ChevronRight } from "lucide-react";

export function Overview() {
  return (
    <div data-slot="item-preview" className="mx-auto max-w-xl p-6">
      <ItemGroup>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <Bell aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>通知設定</ItemTitle>
            <ItemDescription>更新情報をメールで受け取ります。</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              設定
            </Button>
          </ItemActions>
        </Item>
        <ItemSeparator />
        <Item render={<a href="#item-detail" />}>
          <ItemContent>
            <ItemTitle>プロフィールを確認</ItemTitle>
            <ItemDescription>公開情報と表示状態を確認します。</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRight aria-hidden="true" />
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  );
}
