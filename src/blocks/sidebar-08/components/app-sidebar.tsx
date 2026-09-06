"use client";

import {
  BookOpenIcon,
  BotIcon,
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  PieChartIcon,
  SendIcon,
  Settings2Icon,
  TerminalIcon,
  TerminalSquareIcon,
} from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
  },
  navMain: [
    {
      title: "作業スペース",
      url: "#",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: "履歴",
          url: "#",
        },
        {
          title: "お気に入り",
          url: "#",
        },
        {
          title: "設定",
          url: "#",
        },
      ],
    },
    {
      title: "テンプレート",
      url: "#",
      icon: <BotIcon />,
      items: [
        {
          title: "標準",
          url: "#",
        },
        {
          title: "調査用",
          url: "#",
        },
        {
          title: "分析用",
          url: "#",
        },
      ],
    },
    {
      title: "ドキュメント",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        {
          title: "はじめに",
          url: "#",
        },
        {
          title: "導入",
          url: "#",
        },
        {
          title: "チュートリアル",
          url: "#",
        },
        {
          title: "変更履歴",
          url: "#",
        },
      ],
    },
    {
      title: "設定",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "全般",
          url: "#",
        },
        {
          title: "チーム",
          url: "#",
        },
        {
          title: "請求",
          url: "#",
        },
        {
          title: "上限",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "サポート",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "フィードバック",
      url: "#",
      icon: <SendIcon />,
    },
  ],
  projects: [
    {
      name: "デザイン",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "営業・マーケティング",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "出張",
      url: "#",
      icon: <MapIcon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">elchika</span>
                <span className="truncate text-xs">エンタープライズ</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
