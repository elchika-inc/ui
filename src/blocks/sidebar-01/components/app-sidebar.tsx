import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchForm } from "./search-form";
import { VersionSwitcher } from "./version-switcher";

// サンプルデータ。
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"] satisfies [string, ...string[]],
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
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={item.isActive} render={<a href={item.url} />}>
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
