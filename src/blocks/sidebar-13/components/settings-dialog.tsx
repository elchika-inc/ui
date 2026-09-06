"use client";

import {
  BellIcon,
  CheckIcon,
  GlobeIcon,
  HomeIcon,
  KeyboardIcon,
  LinkIcon,
  LockIcon,
  MenuIcon,
  MessageCircleIcon,
  PaintbrushIcon,
  SettingsIcon,
  VideoIcon,
} from "lucide-react";
import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const data = {
  nav: [
    {
      name: "通知",
      icon: <BellIcon />,
    },
    {
      name: "ナビゲーション",
      icon: <MenuIcon />,
    },
    {
      name: "ホーム",
      icon: <HomeIcon />,
    },
    {
      name: "外観",
      icon: <PaintbrushIcon />,
    },
    {
      name: "メッセージ・メディア",
      icon: <MessageCircleIcon />,
    },
    {
      name: "言語・地域",
      icon: <GlobeIcon />,
    },
    {
      name: "アクセシビリティ",
      icon: <KeyboardIcon />,
    },
    {
      name: "既読にする",
      icon: <CheckIcon />,
    },
    {
      name: "音声・動画",
      icon: <VideoIcon />,
    },
    {
      name: "連携アカウント",
      icon: <LinkIcon />,
    },
    {
      name: "プライバシー・公開範囲",
      icon: <LockIcon />,
    },
    {
      name: "詳細設定",
      icon: <SettingsIcon />,
    },
  ],
};

export function SettingsDialog() {
  const [open, setOpen] = React.useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>設定を開く</DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-125 md:max-w-175 lg:max-w-200">
        <DialogTitle className="sr-only">設定</DialogTitle>
        <DialogDescription className="sr-only">表示や通知などを設定します。</DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === "メッセージ・メディア"}
                          render={<a href="/" />}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-120 flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/">設定</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>メッセージ・メディア</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {Array.from({ length: 10 }, (_, index) => `settings-placeholder-${index + 1}`).map(
                (placeholderId) => (
                  <div
                    key={placeholderId}
                    className="aspect-video max-w-3xl rounded-xl bg-muted/50"
                  />
                ),
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
