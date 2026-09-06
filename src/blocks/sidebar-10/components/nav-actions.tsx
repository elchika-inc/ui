import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  ChartLineIcon,
  CopyIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  LinkIcon,
  MoreHorizontalIcon,
  Settings2Icon,
  StarIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = [
  [
    {
      label: "ページを編集",
      icon: <Settings2Icon />,
    },
    {
      label: "共有資料に変更",
      icon: <FileTextIcon />,
    },
  ],
  [
    {
      label: "リンクをコピー",
      icon: <LinkIcon />,
    },
    {
      label: "複製",
      icon: <CopyIcon />,
    },
    {
      label: "移動",
      icon: <CornerUpRightIcon />,
    },
    {
      label: "ゴミ箱に移動",
      icon: <Trash2Icon />,
    },
  ],
  [
    {
      label: "元に戻す",
      icon: <CornerUpLeftIcon />,
    },
    {
      label: "分析を表示",
      icon: <ChartLineIcon />,
    },
    {
      label: "変更履歴",
      icon: <GalleryVerticalEndIcon />,
    },
    {
      label: "削除済みページを表示",
      icon: <TrashIcon />,
    },
    {
      label: "通知",
      icon: <BellIcon />,
    },
  ],
  [
    {
      label: "読み込む",
      icon: <ArrowUpIcon />,
    },
    {
      label: "書き出す",
      icon: <ArrowDownIcon />,
    },
  ],
];
export function NavActions({ autoOpen = false }: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden font-medium text-muted-foreground md:inline-block">10月8日に編集</div>
      <Button aria-label="お気に入りに追加" variant="ghost" size="icon" className="h-7 w-7">
        <StarIcon />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="ページ操作を開く"
              variant="ghost"
              size="icon"
              className="h-7 w-7 data-open:bg-accent"
            />
          }
        >
          <MoreHorizontalIcon />
        </PopoverTrigger>
        <PopoverContent className="w-56 overflow-hidden rounded-lg p-0" align="end">
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group) => (
                <SidebarGroup
                  key={group.map((item) => item.label).join("/")}
                  className="border-b last:border-none"
                >
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item) => (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton>
                            {item.icon} <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
}
