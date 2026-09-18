import { SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { type PreviewItem, previewItems } from "@/catalog/previews";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DocumentationShell, type NavigationCategory } from "@/site/documentation-shell";
import type { SiteTheme } from "@/site/theme-toggle";

type ComponentIndexProps = {
  blockNames: string[];
  categories: NavigationCategory[];
};

const previewsByName = new Map(previewItems.map((item) => [item.name, item]));
const normalizeSearch = (value: string) => value.toLowerCase().replace(/[\s-]/g, "");

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
                <p className="font-mono text-2xs text-muted-foreground">{name}</p>
                <p className="mt-1 font-heading text-lg font-semibold">隔離プレビューを開始</p>
                <p className="mt-2 text-sm leading-normal text-muted-foreground">
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
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [loadedBlocks, setLoadedBlocks] = useState<ReadonlySet<string>>(() => new Set());
  const scrollPositions = useRef(new Map<string, number>());
  const blocks = new Set(blockNames);
  const query = normalizeSearch(search);
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter(({ name, title }) =>
        [name, title, category.name, blocks.has(name) ? "block" : "component"].some((value) =>
          normalizeSearch(value).includes(query),
        ),
      ),
    }))
    .filter((category) => category.items.length > 0);
  const resultCount = filteredCategories.reduce(
    (count, category) => count + category.items.length,
    0,
  );

  const clearSearch = () => {
    setSearch("");
    searchInput.current?.focus();
  };

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
            <p className="font-mono text-3xs font-medium tracking-label text-primary uppercase">
              Component index
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-heading">
              コンポーネント一覧
            </h1>
            <p className="max-w-2xl leading-normal text-muted-foreground">
              配布する component と組み立て済みの block を、カテゴリごとに確認できます。
            </p>
          </header>

          <div className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInput}
                data-index-search
                type="search"
                aria-label="コンポーネントを絞り込む"
                placeholder="名前・表示名・カテゴリで絞り込む"
                className="[&::-webkit-search-cancel-button]:hidden"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    data-index-search-clear
                    aria-label="絞り込みを消す"
                    size="icon-sm"
                    onClick={clearSearch}
                  >
                    <XIcon aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <p
              data-index-search-status
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {resultCount} 件{resultCount === 0 ? "：該当するコンポーネントがありません" : ""}
            </p>
          </div>

          {resultCount === 0 && (
            <Empty data-index-search-empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>該当するコンポーネントがありません</EmptyTitle>
                <EmptyDescription>
                  名前・表示名・カテゴリを変えて絞り込んでください。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" onClick={clearSearch}>
                  絞り込みを消す
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {filteredCategories.map((category) => (
            <section key={category.name} className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <div>
                  <span
                    data-site-eyebrow
                    className="block font-mono text-3xs font-medium tracking-label text-highlight-text uppercase"
                  >
                    section
                  </span>
                  <h2 className="mt-3 font-heading text-2xl font-semibold">{category.name}</h2>
                </div>
                <p className="font-mono text-2xs text-muted-foreground">
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
