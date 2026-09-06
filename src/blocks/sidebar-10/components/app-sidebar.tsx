"use client";

import {
  AudioLinesIcon,
  BlocksIcon,
  CalendarIcon,
  HomeIcon,
  InboxIcon,
  MessageCircleQuestionIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import type * as React from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavFavorites } from "./nav-favorites";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavWorkspaces } from "./nav-workspaces";
import { TeamSwitcher } from "./team-switcher";

// サンプルデータ。
const data = {
  teams: [
    {
      name: "elchika",
      logo: <TerminalIcon />,
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
      title: "検索",
      url: "#",
      icon: <SearchIcon />,
    },
    {
      title: "AI に相談",
      url: "#",
      icon: <SparklesIcon />,
    },
    {
      title: "ホーム",
      url: "#",
      icon: <HomeIcon />,
      isActive: true,
    },
    {
      title: "受信箱",
      url: "#",
      icon: <InboxIcon />,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "カレンダー",
      url: "#",
      icon: <CalendarIcon />,
    },
    {
      title: "設定",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "テンプレート",
      url: "#",
      icon: <BlocksIcon />,
    },
    {
      title: "ゴミ箱",
      url: "#",
      icon: <Trash2Icon />,
    },
    {
      title: "ヘルプ",
      url: "#",
      icon: <MessageCircleQuestionIcon />,
    },
  ],
  favorites: [
    {
      name: "プロジェクト・タスク管理",
      url: "#",
      emoji: "📊",
    },
    {
      name: "家庭のレシピ・献立",
      url: "#",
      emoji: "🍳",
    },
    {
      name: "運動記録・トレーニング",
      url: "#",
      emoji: "💪",
    },
    {
      name: "読書メモ・書籍リスト",
      url: "#",
      emoji: "📚",
    },
    {
      name: "環境にやさしい園芸・植物の手入れ",
      url: "#",
      emoji: "🌱",
    },
    {
      name: "語学学習の進捗・教材",
      url: "#",
      emoji: "🗣️",
    },
    {
      name: "住まいの改修案・予算",
      url: "#",
      emoji: "🏠",
    },
    {
      name: "資産管理・投資記録",
      url: "#",
      emoji: "💰",
    },
    {
      name: "映画・番組リストと感想",
      url: "#",
      emoji: "🎬",
    },
    {
      name: "毎日の習慣・目標",
      url: "#",
      emoji: "✅",
    },
  ],
  workspaces: [
    {
      name: "日々の暮らし",
      emoji: "🏠",
      pages: [
        {
          name: "日記・振り返り",
          url: "#",
          emoji: "📔",
        },
        {
          name: "健康記録",
          url: "#",
          emoji: "🍏",
        },
        {
          name: "成長記録・学習目標",
          url: "#",
          emoji: "🌟",
        },
      ],
    },
    {
      name: "仕事のスキルアップ",
      emoji: "💼",
      pages: [
        {
          name: "キャリアの目標・達成記録",
          url: "#",
          emoji: "🎯",
        },
        {
          name: "スキル習得・研修記録",
          url: "#",
          emoji: "🧠",
        },
        {
          name: "交流先・イベント",
          url: "#",
          emoji: "🤝",
        },
      ],
    },
    {
      name: "創作活動",
      emoji: "🎨",
      pages: [
        {
          name: "執筆アイデア・物語の構成",
          url: "#",
          emoji: "✍️",
        },
        {
          name: "アート・デザインの作品集",
          url: "#",
          emoji: "🖼️",
        },
        {
          name: "作曲・練習記録",
          url: "#",
          emoji: "🎵",
        },
      ],
    },
    {
      name: "暮らしの管理",
      emoji: "🏡",
      pages: [
        {
          name: "家計・支出管理",
          url: "#",
          emoji: "💰",
        },
        {
          name: "住まいの手入れ・作業予定",
          url: "#",
          emoji: "🔧",
        },
        {
          name: "家族の予定・行事",
          url: "#",
          emoji: "📅",
        },
      ],
    },
    {
      name: "旅行・冒険",
      emoji: "🧳",
      pages: [
        {
          name: "旅行の計画・日程",
          url: "#",
          emoji: "🗺️",
        },
        {
          name: "行きたい場所・旅のアイデア",
          url: "#",
          emoji: "🌎",
        },
        {
          name: "旅行記・写真",
          url: "#",
          emoji: "📸",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
