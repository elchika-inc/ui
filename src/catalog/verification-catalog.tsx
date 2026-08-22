import { previewItems } from "@/catalog/previews";
import { cn } from "@/lib/utils";

export type CatalogTheme = "light" | "dark";

type VerificationCatalogProps = {
  // registry.json で type が registry:block の item 名（src/catalog/registry-kinds.ts）。
  // registry.json は client bundle へ載せない（550KB 超）ので、Astro 側で絞って渡す。
  blockNames: string[];
  theme?: CatalogTheme;
};

// block は SidebarProvider の fixed 配置や初期表示の dialog を持つ。catalog の同一 DOM に
// 並べると containing block が無く viewport に貼り付き、隣のカードや catalog 全体を覆う
// （本番 /catalog/ で sidebar-13 の dialog overlay がページ全体を覆った実害）。shadcn 本家の
// blocks 一覧と同じく、隔離プレビュー（/preview/<name>/）を iframe で埋め込んで DOM を分離する。
const previewRoute = (name: string, theme: CatalogTheme) =>
  `/preview/${name}${theme === "dark" ? "-dark" : ""}/`;

// 既知の制限: 隔離プレビューは dialog / popover を開いた状態で描画し、その focus trap が
// iframe 内の要素へ autofocus する。ブラウザはフォーカスされた iframe が見えるよう親ページを
// スクロールするため、遅延ロード時に catalog がジャンプすることがある（1440×900 で
// sidebar-13 の読み込み時に 2,362px を実測）。iframe 要素の inert / tabindex では iframe 内の
// focus() を止められず、親 window の blur / focusin でも frame 間の focus 移動は観測できない
// （いずれも Chromium で実測）ので、catalog 側では防げない。根本対処は preview 側で
// 埋め込み時の autofocus を抑止すること（本タスクのスコープ外）。
export function VerificationCatalog({ blockNames, theme = "light" }: VerificationCatalogProps) {
  const blocks = new Set(blockNames);

  return (
    <main
      data-slot="verification-catalog"
      className="min-h-svh bg-background px-6 py-12 text-foreground [&_[data-slot=bubble-preview]_.opacity-70]:opacity-100"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-primary">elchika-inc/ui</p>
          <h1 className="text-3xl font-semibold tracking-tight">カタログ</h1>
          <p className="max-w-3xl text-muted-foreground">
            静的な見た目を横断比較するため、component preview は同じページに直接描画し、block
            は隔離プレビューを iframe で埋め込みます。overlay
            はトリガーのみを表示し、開いた状態は隔離プレビューで検証します。
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {previewItems.map(({ name, title, Preview }) => {
            const kind = blocks.has(name) ? "block" : "component";

            return (
              <section
                key={name}
                data-catalog-preview={name}
                data-catalog-kind={kind}
                className={cn(
                  "min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
                  // block は 1 画面級のレイアウトなので行全体を使う。1 列幅（約 400px）だと
                  // iframe の viewport が sidebar の mobile 判定（768px 未満）に入り、
                  // sidebar が offcanvas に畳まれて横断比較の対象が消える。
                  kind === "block" && "md:col-span-2 xl:col-span-3",
                )}
              >
                <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="text-lg font-medium">{title}</h2>
                    <p className="text-sm text-muted-foreground">{name}</p>
                  </div>
                  {kind === "block" && (
                    <a
                      href={previewRoute(name, theme)}
                      className="rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      隔離プレビューを開く
                    </a>
                  )}
                </header>
                {kind === "block" ? (
                  <iframe
                    src={previewRoute(name, theme)}
                    title={`${title} の隔離プレビュー`}
                    loading="lazy"
                    // 固定高さ + iframe 内スクロール。sidebar-13 の settings dialog
                    //（max-h 500px）が切れずに収まる高さにしつつ、一覧性のため
                    // component ページ（h-136）より低く抑える。
                    className="block h-128 w-full bg-background"
                  />
                ) : (
                  <Preview mode="catalog" />
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
