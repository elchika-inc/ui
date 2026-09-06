"use client";

import {
  AudioLinesIcon,
  BookOpenIcon,
  BotIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  MapIcon,
  PieChartIcon,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// サンプルデータ。
const data = {
  user: {
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
  },
  teams: [
    {
      name: "elchika",
      logo: <GalleryVerticalEndIcon />,
      plan: "エンタープライズ",
    },
    {
      name: "elchika ラボ",
      logo: <AudioLinesIcon />,
      plan: "スタートアップ",
    },
    {
      name: "elchika スタジオ",
      logo: <TerminalIcon />,
      plan: "無料",
    },
  ],
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
