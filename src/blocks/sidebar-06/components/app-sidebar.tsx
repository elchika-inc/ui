"use client";

import { GalleryVerticalEndIcon } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { SidebarOptInForm } from "./sidebar-opt-in-form";

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
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1">
          <SidebarOptInForm />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
