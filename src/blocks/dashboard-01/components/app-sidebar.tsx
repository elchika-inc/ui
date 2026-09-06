import {
  CameraIcon,
  ChartBarIcon,
  CircleHelpIcon,
  CommandIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
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
import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
  },
  navMain: [
    {
      title: "ダッシュボード",
      url: "#",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "ライフサイクル",
      url: "#",
      icon: <ListIcon />,
    },
    {
      title: "分析",
      url: "#",
      icon: <ChartBarIcon />,
    },
    {
      title: "プロジェクト",
      url: "#",
      icon: <FolderIcon />,
    },
    {
      title: "チーム",
      url: "#",
      icon: <UsersIcon />,
    },
  ],
  navClouds: [
    {
      title: "取り込み",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "進行中の提案",
          url: "#",
        },
        {
          title: "アーカイブ済み",
          url: "#",
        },
      ],
    },
    {
      title: "提案",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "進行中の提案",
          url: "#",
        },
        {
          title: "アーカイブ済み",
          url: "#",
        },
      ],
    },
    {
      title: "依頼文",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "進行中の提案",
          url: "#",
        },
        {
          title: "アーカイブ済み",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "設定",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "ヘルプ",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "検索",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "データ",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "レポート",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "文書アシスタント",
      url: "#",
      icon: <FileIcon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">elchika</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
