import type { ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type SiteTheme, ThemeToggle, useSiteTheme } from "@/site/theme-toggle";

export type NavigationCategory = {
  name: string;
  items: Array<{ name: string; title: string }>;
};

type DocumentationShellProps = {
  categories: NavigationCategory[];
  children: ReactNode | ((theme: SiteTheme) => ReactNode);
  componentIndex?: boolean;
  currentName?: string;
  headerAction?: ReactNode;
  home?: boolean;
};

export function CommandBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export function DocumentationShell({
  categories,
  children,
  componentIndex = false,
  currentName,
  headerAction,
  home = false,
}: DocumentationShellProps) {
  const [theme, setTheme] = useSiteTheme();

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen data-docs-shell="true">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="gap-3 px-4 py-4">
            <a
              href="/"
              className="rounded-md font-heading text-base font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:outline-none"
            >
              elchika-inc/ui
            </a>
            <p className="text-xs leading-relaxed text-muted-foreground">共有 UI の導入と参照</p>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <nav aria-label="ドキュメントナビゲーション">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={home}
                        render={<a aria-current={home ? "page" : undefined} href="/" />}
                      >
                        <span>はじめに</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={componentIndex}
                        render={
                          <a
                            aria-current={componentIndex ? "page" : undefined}
                            href="/components/"
                          />
                        }
                      >
                        <span>コンポーネント一覧</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {categories.map((category) => (
                <SidebarGroup key={category.name}>
                  <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {category.items.map((item) => {
                        const current = item.name === currentName;
                        return (
                          <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                              isActive={current}
                              render={
                                <a
                                  aria-current={current ? "page" : undefined}
                                  href={`/components/${item.name}/`}
                                />
                              }
                            >
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </nav>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset id="main-content" tabIndex={-1}>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <a
              href="/"
              className="mr-auto rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              はじめに
            </a>
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
            {headerAction}
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14">
            {typeof children === "function" ? children(theme) : children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
