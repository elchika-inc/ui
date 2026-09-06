"use client";

import {
  ArchiveXIcon,
  FileIcon,
  InboxIcon,
  SendIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { NavUser } from "./nav-user";

// サンプルデータ。
const data = {
  user: {
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
  },
  navMain: [
    {
      title: "受信箱",
      url: "#",
      icon: <InboxIcon />,
      isActive: true,
    },
    {
      title: "下書き",
      url: "#",
      icon: <FileIcon />,
      isActive: false,
    },
    {
      title: "送信済み",
      url: "#",
      icon: <SendIcon />,
      isActive: false,
    },
    {
      title: "迷惑メール",
      url: "#",
      icon: <ArchiveXIcon />,
      isActive: false,
    },
    {
      title: "ゴミ箱",
      url: "#",
      icon: <Trash2Icon />,
      isActive: false,
    },
  ],
  mails: [
    {
      name: "鈴木 健太",
      email: "kenta.suzuki@example.com",
      subject: "明日の会議",
      date: "9:34",
      teaser: "明日10時の会議についての案内。各プロジェクトの進捗を持ち寄って共有。",
    },
    {
      name: "高橋 さくら",
      email: "sakura.takahashi@example.com",
      subject: "返信：プロジェクトの進捗",
      date: "昨日",
      teaser: "進捗の共有を確認。次の進め方について打ち合わせの日程を調整。",
    },
    {
      name: "田中 大輔",
      email: "daisuke.tanaka@example.com",
      subject: "週末の予定",
      date: "2日前",
      teaser: "週末のチーム交流会を計画中。ハイキングや海辺での散策など、希望を募集。",
    },
    {
      name: "伊藤 結衣",
      email: "yui.ito@example.com",
      subject: "返信：予算について",
      date: "2日前",
      teaser: "共有された予算を確認。一部の調整について短い打ち合わせを希望。",
    },
    {
      name: "渡辺 翔",
      email: "sho.watanabe@example.com",
      subject: "大切なお知らせ",
      date: "1週間前",
      teaser: "今週金曜15時から全体会議。今後の活動についてのお知らせを共有。",
    },
    {
      name: "山本 葵",
      email: "aoi.yamamoto@example.com",
      subject: "返信：提案へのフィードバック",
      date: "1週間前",
      teaser: "提案内容を確認。フィードバックの詳細を共有する打ち合わせを調整。",
    },
    {
      name: "中村 陽菜",
      email: "hina.nakamura@example.com",
      subject: "新しいプロジェクトの案",
      date: "1週間前",
      teaser: "新しいプロジェクトの案を整理。期待できる効果と実現方法について今週中に相談。",
    },
    {
      name: "小林 蓮",
      email: "ren.kobayashi@example.com",
      subject: "休暇の予定",
      date: "1週間前",
      teaser: "来月は2週間の休暇を予定。担当プロジェクトの進捗を整理してから引き継ぎ。",
    },
    {
      name: "加藤 美月",
      email: "mitsuki.kato@example.com",
      subject: "返信：勉強会への参加登録",
      date: "1週間前",
      teaser: "次回の技術勉強会への参加登録が完了。追加で必要な情報があれば連絡を希望。",
    },
    {
      name: "吉田 陸",
      email: "riku.yoshida@example.com",
      subject: "チームの食事会",
      date: "1週間前",
      teaser: "プロジェクトの達成を祝うチームの食事会を計画中。来週金曜の夜の予定と希望を募集。",
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 表示上のアクティブ項目を示すため state を使用する。
  // 実運用では URL/router と同期する。
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const [mails, setMails] = React.useState(data.mails);
  const { setOpen } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-(--sidebar-icon-column-width)! border-r [--sidebar-icon-column-width:calc(var(--sidebar-width-icon)+1px)]"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="md:h-8 md:p-0" render={<a href="/" />}>
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
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        const mail = data.mails.sort(() => Math.random() - 0.5);
                        setMails(mail.slice(0, Math.max(5, Math.floor(Math.random() * 10) + 1)));
                        setOpen(true);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">{activeItem?.title}</div>
            <Label className="flex items-center gap-2 text-sm">
              <span>未読</span>
              <Switch className="shadow-none" />
            </Label>
          </div>
          <SidebarInput aria-label="検索" placeholder="検索語を入力" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {mails.map((mail) => (
                <a
                  href="/"
                  key={mail.email}
                  className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <div className="flex w-full items-center gap-2">
                    <span>{mail.name}</span> <span className="ml-auto text-xs">{mail.date}</span>
                  </div>
                  <span className="font-medium">{mail.subject}</span>
                  <span className="line-clamp-2 w-65 text-xs whitespace-break-spaces">
                    {mail.teaser}
                  </span>
                </a>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
