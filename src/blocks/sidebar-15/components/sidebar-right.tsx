import { PlusIcon } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Calendars } from "./calendars";
import { DatePicker } from "./date-picker";
import { NavUser } from "./nav-user";

// サンプルデータ。
const data = {
  user: {
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
  },
  calendars: [
    {
      name: "自分のカレンダー",
      items: ["個人", "仕事", "家族"],
    },
    {
      name: "お気に入り",
      items: ["祝日", "誕生日"],
    },
    {
      name: "その他",
      items: ["出張", "リマインダー", "締め切り"],
    },
  ],
};

export function SidebarRight({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh border-l lg:flex" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.calendars} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>カレンダーを追加</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
