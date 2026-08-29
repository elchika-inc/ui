import { useRef, useState } from "react";

import { type PreviewItem, previewItems } from "@/catalog/previews";
import { Button } from "@/components/ui/button";
import { DocumentationShell, type NavigationCategory } from "@/site/documentation-shell";
import type { SiteTheme } from "@/site/theme-toggle";

type ComponentIndexProps = {
  blockNames: string[];
  categories: NavigationCategory[];
};

const previewsByName = new Map(previewItems.map((item) => [item.name, item]));

type ComponentIndexCardProps = {
  item: PreviewItem;
  kind: "block" | "component";
  loaded: boolean;
  onPreviewIntent: () => void;
  onPreviewLoad: () => void;
  onPreviewLoaded: () => void;
  theme: SiteTheme;
};

function ComponentIndexCard({
  item: { name, title, Preview },
  kind,
  loaded,
  onPreviewIntent,
  onPreviewLoad,
  onPreviewLoaded,
  theme,
}: ComponentIndexCardProps) {
  const previewRoute = `/preview/${name}${theme === "dark" ? "-dark" : ""}/`;

  return (
    <article
      data-component-index-item={name}
      data-component-index-kind={kind}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-primary focus-within:ring-3 focus-within:ring-ring focus-within:outline-none"
    >
      <div className="relative h-64 shrink-0 overflow-hidden border-b border-border bg-muted">
        {kind === "component" ? (
          <div aria-hidden="true" className="pointer-events-none h-full overflow-hidden" inert>
            <Preview mode="catalog" />
          </div>
        ) : loaded ? (
          <div className="grid h-full place-items-center overflow-hidden">
            <div className="h-44 w-72 overflow-hidden">
              <iframe
                key={previewRoute}
                src={previewRoute}
                title={`${title} の隔離プレビュー`}
                onLoad={onPreviewLoaded}
                style={{
                  width: 1280,
                  height: 800,
                  transform: "scale(0.22)",
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="flex max-w-xs flex-col items-center gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{name}</p>
                <p className="mt-1 font-heading text-lg font-semibold">隔離プレビューを開始</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  focus trap を一覧ページから分離した状態で読み込みます。
                </p>
              </div>
              <Button
                type="button"
                className="relative z-20"
                onPointerDown={onPreviewIntent}
                onClick={onPreviewLoad}
              >
                <span className="sr-only">{title} の</span>プレビューを読み込む
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-24 shrink-0 flex-col justify-center px-5">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="font-mono text-sm text-muted-foreground">{name}</p>
      </div>

      <a
        href={`/components/${name}/`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none"
      >
        <span className="sr-only">{title} のドキュメントを開く</span>
      </a>
    </article>
  );
}

export function ComponentIndex({ categories, blockNames }: ComponentIndexProps) {
  const [loadedBlocks, setLoadedBlocks] = useState<ReadonlySet<string>>(() => new Set());
  const scrollPositions = useRef(new Map<string, number>());
  const blocks = new Set(blockNames);

  const captureScrollPosition = (name: string) => {
    scrollPositions.current.set(name, window.scrollY);
  };

  const loadBlock = (name: string) => {
    if (!scrollPositions.current.has(name)) captureScrollPosition(name);
    setLoadedBlocks((current) => new Set(current).add(name));
  };

  const restoreScrollAfterLoad = (name: string) => {
    const scrollY = scrollPositions.current.get(name);
    if (scrollY === undefined) return;

    // iframe 内の hydration と autofocus は load 後も数フレーム続くため、
    // 短い有界区間だけ明示操作前の位置を維持する。
    let remainingFrames = 24;
    const restore = () => {
      if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
      remainingFrames -= 1;
      if (remainingFrames > 0) {
        requestAnimationFrame(restore);
      } else {
        scrollPositions.current.delete(name);
      }
    };
    requestAnimationFrame(restore);
  };

  return (
    <DocumentationShell categories={categories} componentIndex>
      {(theme) => (
        <>
          <header className="flex flex-col gap-3 border-b border-border pb-8">
            <p className="font-mono text-xs font-medium tracking-wider text-primary uppercase">
              Component index
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">
              コンポーネント一覧
            </h1>
            <p className="max-w-2xl leading-7 text-muted-foreground">
              配布する component と組み立て済みの block を、カテゴリごとに確認できます。
            </p>
          </header>

          {categories.map((category) => (
            <section key={category.name} className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <h2 className="font-heading text-2xl font-semibold">{category.name}</h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {category.items.length} items
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {category.items.map(({ name }) => {
                  const item = previewsByName.get(name);
                  if (!item) throw new Error(`preview が見つかりません: ${name}`);
                  const kind = blocks.has(name) ? "block" : "component";
                  return (
                    <ComponentIndexCard
                      key={name}
                      item={item}
                      kind={kind}
                      loaded={loadedBlocks.has(name)}
                      onPreviewIntent={() => captureScrollPosition(name)}
                      onPreviewLoad={() => loadBlock(name)}
                      onPreviewLoaded={() => restoreScrollAfterLoad(name)}
                      theme={theme}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </DocumentationShell>
  );
}
