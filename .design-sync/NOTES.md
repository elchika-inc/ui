# design-sync NOTES

このリポを claude.ai/design へ同期するときのリポ固有の勘所。再同期の前に必ず読むこと。

## ビルド入力

- `cssEntry` は **`dist/_astro/global.BHAheRO3.css`**（Astro がコンパイルした Tailwind の実 CSS）を指す。
  `src/styles/global.css` は `@import "tailwindcss"` を含む**未コンパイルのソース**で、これを指すと
  ユーティリティクラスが一切効かない空の `styles.css` が出来上がる（実際に一度そうなり、
  同期先プロジェクトへ中身 `@import "./_ds_bundle.css";` 一行だけの styles.css が上がった）。
- したがって converter の前に必ず `npm run build`（= `buildCmd`）を通し、`dist/` を最新化する。
- `--entry` は `./lib/index.js`（`tsup` + `tsc` が出すライブラリバレル）。`--node-modules` はリポ直下。
- converter が数える component は `.d.ts` の PascalCase 値 export で、**345 件**。
  `src/components/ui/*.tsx` の 62 ファイルは「親コンポーネント」の数であって component 数ではない。

## authored preview

- 移植元は `src/previews/*.tsx`（Astro の隔離プレビュー、62 件）。design-sync 形式への変換は
  ①`@/components/ui/*` の import を `ui-scaffold` へ統合 ②`@/catalog/preview-types` と
  `@/catalog/preview-sentinel`（フォーカス検証用のダミー要素）の import と JSX を除去
  ③`export function XPreview({ mode }: PreviewProps)` を `export function Overview()` にし、
  本文が `mode` を参照する場合は先頭に `const mode = "isolated";` を置く（overlay を開いた状態で
  描画するためのフラグなので isolated 固定が正しい）。
- **Tailwind クラスは既存プレビューの語彙に留める。** `_ds_bundle.css` は Astro が JIT で
  コンパイルした CSS なので、このリポのページで実際に使われたクラスしか含まれない。
  authored preview で新しいユーティリティクラスを発明すると、そのクラスだけ無効になる。
- overlay 系（Dialog 等）は `cfg.overrides.<Name>` に `{"cardMode": "single", "viewport": "WxH"}` を置く。
  置かないとカードの縦が間延びするか、開いた状態がセル外へ逃げる。
- `cfg.overrides` を変更したら **`package-build.mjs` のフルビルドが必要**。
  `lib/preview-rebuild.mjs` は `[CONFIG_STALE]` で止まる（grade key の打ち直しが要るため）。

## Known render warns（調査済み・再調査不要）

- `[TOKENS_MISSING]` 14 件はすべて正常。内訳は 2 種類:
  - `--accordion-panel-height` / `--collapsible-panel-height` / `--toast-swipe-movement-x` /
    `--toast-swipe-movement-y` / `--toast-index` / `--toast-height` 等 — Base UI が実行時に
    inline style で注入する変数。静的 CSS に無いのが正しい。
  - `--brand` / `--ring-alpha` — Tailwind の任意値クラス（`ring-(--brand)`、
    `ring-ring/(--ring-alpha)`）が生成したセレクタ。「利用側が定義したら使う」ブランドノブで、
    未定義が既定。実測: `_ds_bundle.css` 内で宣言 0 回・参照のみ。
- `[FONT_REMOTE]` — IBM Plex Sans / Sans JP / Mono は Google Fonts の remote `@import` で供給。
  headless chromium での実測では `document.fonts.check('16px "IBM Plex Sans JP"')` が `true`、
  `font-family` は `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif` に解決される。
  `IBM Plex Sans` 単体が `false` なのは欠落ではなく、第 1 候補の JP 版がラテングリフも供給して
  いて出番が無いだけ（遅延ロードの正常挙動）。

## floor card に留めた component（調査済み・再挑戦の前に読むこと）

- **ChartContainer** — preview 環境で recharts の `ResponsiveContainer` が寸法を 0 と判断し、
  children（SVG・凡例・軸）を一切描画しない。**リポ側のバグではない**: 本番ビルドを HTTP 経由で
  実測すると `svg.recharts-surface` が 1152×648 で存在し、`path.recharts-curve` 5 本・軸 14・
  グリッド 3 がすべて描画されている（`ChartLine` ラッパーも正常に機能している）。
  preview 環境では `[data-slot="chart"]` も `.recharts-responsive-container` も 1152×648 と
  正しい寸法を持つのに、その内側の `.recharts-wrapper` だけが 0×0 になる。ResizeObserver は
  環境に存在する。試して**効かなかった**対処は3つ:
  ①素のグリッドセル配置 ②`cfg.overrides` の `cardMode: "single"` + `viewport` 指定
  ③`initialDimension={{width, height}}` の明示。再挑戦するなら recharts 3.x の
  ResponsiveContainer の寸法検出ロジックから追うこと。バンドルには含まれるので
  design agent からは `.d.ts` と `.prompt.md` 付きで通常どおり利用できる。
- **Toaster** — `[data-sonner-toaster]` 自体が DOM に生成されない。preview がバンドル境界を
  またいで `sonner` の `toast()` を呼ぶため、DS バンドル内の Toaster とは別インスタンスの
  sonner を操作することになるのが原因と見られる。`Toast`（DS 独自実装のほう）は
  トリガー群を示す preview で採点済み。

**検証時の落とし穴（2回踏んだ）**: 本番ビルドの確認を `file://` で開くと `/_astro/...` の
絶対パス CSS が読めず、`display: block` / `aspect-ratio: auto` になって「レイアウトが壊れている」
という偽の結論に至る。必ず HTTP 経由（`python3 -m http.server --directory dist` 等）で確認すること。
また SVG の有無を `querySelector('svg.recharts-surface')` で判定すると偽陰性になった実績があるので、
`querySelectorAll('svg')` で数えて裏を取ること。

## 見送った改善

- **グループ分け**: 345 件すべてが `general` グループに入る。per-component doc が 0 件で
  カテゴリ情報が無いため。`cfg.docsDir` にカテゴリ stub を置けば分類できるが、
  `<Name>.prompt.md` は「doc があればその内容、無ければ `.d.ts` から合成」という規則なので、
  中身の無い stub を置くと **prompt.md から API 情報が消える恐れ**がある。
  次回やるなら、まず 1 件で stub を置いてビルドし、prompt.md が合成にフォールバックするか
  実測してから 345 件へ展開すること。カテゴリ体系そのものは `conventions.md` に記載済み。

## Re-sync risks（次回の監視対象）

- **`cssEntry` のハッシュ付きファイル名**: `dist/_astro/global.<hash>.css` の `<hash>` は
  CSS の内容が変われば変わる。トークンやユーティリティを触った後の再同期では
  `npm run build` 後に `ls dist/_astro/*.css` で実ファイル名を確認し、config と本 NOTES の
  「ビルド入力」節を同じ実ファイル名へ更新すること。
  更新を忘れると converter が `[NO_DIST]` 系ではなく「CSS が見つからない」で静かに劣化する。
- **claude.ai/design 側からの Google Fonts 到達性は未検証**。ローカルの headless chromium では
  読めているが、同期先のレンダリング環境で `fonts.googleapis.com` がブロックされると
  全デザインがフォールバックフォントになる。アップロード後に DS ペインで実際の字形を確認し、
  駄目なら `cfg.extraFonts` で IBM Plex（OFL）の woff2 を同梱する方針へ切り替える。
  2026-08-31 に同期先のデザインカードの日本語テキストを DevTools の Computed で確認したところ、
  `font-family` は `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`
  で、ui のフォントチェーンですらなかった。これは Google Fonts の到達性の問題ではなく、ui の CSS
  自体が同期先へ届いていない状態を示す。原因は `cssEntry` のハッシュずれで、config が
  `dist/_astro/global.Cs8Ft9hd.css` を指す一方、実体は別のハッシュへ変わっており、直前の項目で警告
  していた失敗が実際に起きていた。config は build 後の実体へ直し、**2026-09-01 に修正後の
  `cssEntry` で再同期を実施した**。converter のスクリプトはこのリポジトリの持ち物ではなく
  design-sync スキルの同梱物で、`.ds-sync/` へステージしてから走らせる（`lib/*.mjs` が
  リポジトリに無いのは正常であって、再同期を妨げる理由にはならない）。
  同期の実測: 共有ファイル 8 件（`styles.css` と 209,845 bytes の `_ds_bundle.css` を含む）と、
  component / `_preview` の 1442 件、計 1450 ファイルを転送し、リモートの `list_files` とローカルの
  `upload-manifest.json` を突合して**欠落 0 件**を確認した。manifest 外に残る
  `_ds_manifest.json` / `_adherence.oxlintrc.json` / `_ds_sync.json` はアプリ生成物とアンカーで、
  削除対象ではない。

  Google Fonts の到達性そのものは依然として未検証である。CSS が届いていない状態では判定できない
  ため、修正した `cssEntry` で再同期した後、同じ日本語テキストの computed `font-family` を改めて
  確認すること。`document.fonts.check()` だけを根拠にしてはならない。閲覧者のローカルに IBM Plex
  がインストールされていると `true` を返すため、computed `font-family` と、実際に `@font-face`
  としてロードされたファミリー一覧（`[...document.fonts].filter(f => f.status === "loaded")`）の両方を
  確認すること。
- **`.gitignore` の `.design-sync/previews/`**: 過去の同期が誤って除外していた。authored preview は
  durable set（コミット対象）なので、除外が復活していないか確認すること。
- **`lucide-react` のアイコン**: 一部の preview が import している。`cfg.extraEntries` へ
  lucide-react を足すのは避けること（数千の PascalCase export が component として discover され、
  345 件の構成が壊れる）。
