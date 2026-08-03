import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { directInstallCommand, namespaceInstallCommand } from "@/site/installation.mjs";
import { ThemeToggle, useSiteTheme } from "@/site/theme-toggle";

type NavigationCategory = {
  name: string;
  items: Array<{ name: string; title: string }>;
};

type ComponentDocumentationProps = {
  categories: NavigationCategory[];
  name: string;
  title: string;
};

function CommandBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export function ComponentDocumentation({ categories, name, title }: ComponentDocumentationProps) {
  const [theme, setTheme] = useSiteTheme();
  const previewRoute = `/preview/${name}${theme === "dark" ? "-dark" : ""}/`;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
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
            <nav aria-label="コンポーネント一覧">
              {categories.map((category) => (
                <SidebarGroup key={category.name}>
                  <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {category.items.map((item) => {
                        const current = item.name === name;
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

        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <a
              href="/"
              className="mr-auto rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              導入手順
            </a>
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
            <Button
              variant="ghost"
              size="icon"
              render={
                <a
                  href={`https://github.com/elchika-inc/ui/blob/main/src/components/ui/${name}.tsx`}
                />
              }
              aria-label={`${title} のソースをGitHubで開く`}
              title="GitHubでソースを見る"
            >
              <ExternalLinkIcon aria-hidden="true" />
            </Button>
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14">
            <header className="flex flex-col gap-3 border-b border-border pb-8">
              <p className="font-mono text-xs font-medium tracking-wider text-primary uppercase">
                Component
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight">{title}</h1>
              <p className="max-w-2xl text-muted-foreground">
                配布 component の実装と同じ isolated preview を表示します。
              </p>
            </header>

            <section aria-labelledby="preview-heading" className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 id="preview-heading" className="font-heading text-2xl font-semibold">
                    Preview
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">操作できる隔離プレビュー</p>
                </div>
                <a
                  href={previewRoute}
                  className="rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                >
                  別ページで開く
                </a>
              </div>
              <div
                data-component-preview={name}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <iframe
                  key={previewRoute}
                  src={previewRoute}
                  title={`${title} の隔離プレビュー`}
                  className="h-136 w-full bg-background"
                />
              </div>
            </section>

            <section aria-labelledby="install-heading" className="flex flex-col gap-5">
              <div>
                <h2 id="install-heading" className="font-heading text-2xl font-semibold">
                  Install
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  プロジェクトに合う経路を選べます。
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <article className="flex flex-col gap-3 rounded-xl border border-border p-5">
                  <h3 className="font-medium">直接 URL</h3>
                  <p className="text-sm text-muted-foreground">
                    設定を追加せず、この component を取得します。
                  </p>
                  <CommandBlock>{directInstallCommand(name)}</CommandBlock>
                </article>
                <article className="flex flex-col gap-3 rounded-xl border border-border p-5">
                  <h3 className="font-medium">@elchika 名前空間</h3>
                  <p className="text-sm text-muted-foreground">
                    components.json の registry 設定を使います。
                  </p>
                  <CommandBlock>{namespaceInstallCommand(name)}</CommandBlock>
                </article>
              </div>
            </section>

            <section
              aria-labelledby="props-heading"
              className="rounded-xl border border-dashed border-border p-6"
            >
              <h2 id="props-heading" className="font-heading text-2xl font-semibold">
                Props
              </h2>
              <p className="mt-2 text-muted-foreground">Props一覧は次段で追加します。</p>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
