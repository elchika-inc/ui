import { GalleryVerticalEndIcon, MinusIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchForm } from "./search-form";

// サンプルデータ。
const data = {
  navMain: [
    {
      title: "導入",
      url: "#",
      items: [
        {
          title: "インストール",
          url: "#",
        },
        {
          title: "プロジェクト構成",
          url: "#",
        },
      ],
    },
    {
      title: "アプリケーションの構築",
      url: "#",
      items: [
        {
          title: "ページの移動",
          url: "#",
        },
        {
          title: "データ取得",
          url: "#",
          isActive: true,
        },
        {
          title: "画面の描画",
          url: "#",
        },
        {
          title: "データの一時保存",
          url: "#",
        },
        {
          title: "見た目の調整",
          url: "#",
        },
        {
          title: "最適化",
          url: "#",
        },
        {
          title: "設定",
          url: "#",
        },
        {
          title: "テスト",
          url: "#",
        },
        {
          title: "認証",
          url: "#",
        },
        {
          title: "公開",
          url: "#",
        },
        {
          title: "更新",
          url: "#",
        },
        {
          title: "使用例",
          url: "#",
        },
      ],
    },
    {
      title: "機能ガイド",
      url: "#",
      items: [
        {
          title: "画面部品",
          url: "#",
        },
        {
          title: "ファイルの規約",
          url: "#",
        },
        {
          title: "機能",
          url: "#",
        },
        {
          title: "アプリケーションの設定",
          url: "#",
        },
        {
          title: "コマンド操作",
          url: "#",
        },
        {
          title: "実行環境",
          url: "#",
        },
      ],
    },
    {
      title: "全体構成",
      url: "#",
      items: [
        {
          title: "アクセシビリティ",
          url: "#",
        },
        {
          title: "変更の即時反映",
          url: "#",
        },
        {
          title: "アプリケーションの変換",
          url: "#",
        },
        {
          title: "対応ブラウザー",
          url: "#",
        },
        {
          title: "高速ビルド",
          url: "#",
        },
      ],
    },
    {
      title: "コミュニティ",
      url: "#",
      items: [
        {
          title: "参加ガイド",
          url: "#",
        },
      ],
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">ドキュメント</span>
                <span className="">v1.0.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <SidebarMenuItem key={item.title}>
                <Collapsible defaultOpen={index === 1} className="group/collapsible">
                  <SidebarMenuButton render={<CollapsibleTrigger />}>
                    {item.title}{" "}
                    <PlusIcon className="ml-auto group-aria-expanded/menu-button:hidden" />
                    <MinusIcon className="ml-auto hidden group-aria-expanded/menu-button:block" />
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              isActive={item.isActive}
                              render={<a href={item.url} />}
                            >
                              {item.title}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </Collapsible>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
