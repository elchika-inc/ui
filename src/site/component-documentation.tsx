import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommandBlock,
  DocumentationShell,
  type NavigationCategory,
} from "@/site/documentation-shell";
import { directInstallCommand, namespaceInstallCommand } from "@/site/installation.mjs";

type ComponentDocumentationProps = {
  categories: NavigationCategory[];
  name: string;
  title: string;
};

export function ComponentDocumentation({ categories, name, title }: ComponentDocumentationProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);

  return (
    <DocumentationShell
      categories={categories}
      currentName={name}
      headerAction={
        <Button
          variant="ghost"
          size="icon"
          render={
            <a href={`https://github.com/elchika-inc/ui/blob/main/src/components/ui/${name}.tsx`} />
          }
          aria-label={`${title} のソースをGitHubで開く`}
          title="GitHubでソースを見る"
        >
          <ExternalLinkIcon aria-hidden="true" />
        </Button>
      }
    >
      {(theme) => {
        const previewRoute = `/preview/${name}${theme === "dark" ? "-dark" : ""}/`;

        return (
          <>
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
                {previewLoaded ? (
                  <iframe
                    key={previewRoute}
                    src={previewRoute}
                    title={`${title} の隔離プレビュー`}
                    className="h-136 w-full bg-background"
                  />
                ) : (
                  <div className="grid min-h-72 place-items-center p-8 text-center">
                    <div className="flex max-w-md flex-col items-center gap-4">
                      <div>
                        <h3 className="font-heading text-lg font-semibold">隔離プレビューを開始</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Dialog などの focus trap をこのページから分離した状態で読み込みます。
                        </p>
                      </div>
                      <Button type="button" onClick={() => setPreviewLoaded(true)}>
                        プレビューを読み込む
                      </Button>
                    </div>
                  </div>
                )}
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
          </>
        );
      }}
    </DocumentationShell>
  );
}
