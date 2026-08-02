import { HomeIcon, InboxIcon, PlusIcon, SettingsIcon } from "lucide-react";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

function SidebarStateStatus() {
  const { state, isMobile, openMobile } = useSidebar();

  return (
    <output
      data-slot="sidebar-state"
      data-state={state}
      data-mobile={isMobile ? "true" : "false"}
      data-mobile-open={openMobile ? "true" : "false"}
      className="text-sm text-muted-foreground"
    >
      {isMobile ? `モバイル: ${openMobile ? "開" : "閉"}` : `デスクトップ: ${state}`}
    </output>
  );
}

export function SidebarPreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="sidebar-preview"
      data-preview-mode={mode}
      className={catalog ? "h-80 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <TooltipProvider>
        <SidebarProvider defaultOpen className={catalog ? "min-h-80" : undefined}>
          <Sidebar
            id="sidebar-preview-props"
            data-preview-props="forwarded"
            className="sidebar-preview-props"
            style={{ touchAction: "manipulation" }}
            collapsible={catalog ? "none" : "icon"}
          >
            <SidebarHeader>
              <SidebarInput aria-label="サイドバーを検索" placeholder="検索" />
            </SidebarHeader>
            <SidebarSeparator />
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>ワークスペース</SidebarGroupLabel>
                <SidebarGroupAction aria-label="項目を追加">
                  <PlusIcon aria-hidden="true" />
                </SidebarGroupAction>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive tooltip="ホーム">
                        <HomeIcon aria-hidden="true" />
                        <span>ホーム</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="受信トレイ">
                        <InboxIcon aria-hidden="true" />
                        <span>受信トレイ</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>3</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="設定">
                        <SettingsIcon aria-hidden="true" />
                        <span>設定</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#profile">プロフィール</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <span className="px-2 text-xs text-sidebar-foreground">elchika-inc</span>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <header className="flex h-14 items-center gap-3 border-b px-4">
              <SidebarTrigger />
              <strong className="text-sm">共有 UI</strong>
              <SidebarStateStatus />
            </header>
            <div className="grid flex-1 place-items-center gap-2 p-6 text-center">
              <div>
                <h1 className="font-heading text-xl font-medium">サイドバープレビュー</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  ボタンまたは Ctrl+B / Meta+B で表示状態を切り替えます。
                </p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </section>
  );
}
