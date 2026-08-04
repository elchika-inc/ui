# ui

> elchika-inc の共有 UI コンポーネントライブラリ

[![CI](https://github.com/elchika-inc/ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/elchika-inc/ui/actions/workflows/ci.yml)
[![standards](https://img.shields.io/badge/standards-2026--07--29_(rev.46)-blue)](https://github.com/elchika-inc/standards/blob/main/CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Base UI と Tailwind CSS v4 で作った UI コンポーネント集。elchika-inc の各プロダクトが同じ見た目と操作性を共有するための正本。npm publish はせず shadcn の custom registry で配布し、利用側はソースをコピーして所有する。

## Features

- Base UI ベースのアクセシブルなコンポーネント
- HTML 正本から生成・検査するデザインシステム v1.8 と shadcn alias を同梱（light / dark 対応）
- shadcn CLI でコピー取得できる registry 配布

## Getting Started

### Prerequisites

- Node.js 22.12.0+

### Installation

```bash
git clone https://github.com/elchika-inc/ui.git
cd ui
npm ci
```

### Quick Start

```bash
# 開発サーバを起動
npm run dev
# → http://localhost:4321/ でアクセス（Astro dev の既定ポート）
```

## 利用方法

registry とドキュメントサイトの配信正本は `https://ui.elchika.dev`。現時点では Phase B の deployment・DNS・公開到達が未実施のため未公開であり、次のコマンドは公開後に利用する。component は次の3経路で取り込める。

### 直接 URL

```bash
npx shadcn@latest add https://ui.elchika.dev/r/button.json
```

### @elchika 名前空間

利用側の `components.json` に registry を追加する。

```json
{
  "registries": {
    "@elchika": "https://ui.elchika.dev/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @elchika/button
```

### shadcn MCP

shadcn CLI 同梱の MCP を初期化する。生成された `.mcp.json` を有効にするため、初期化後に Claude を再起動する。MCP server の自前実装は不要で、`components.json` の `registries` が探索対象になる。

```bash
npx shadcn@latest mcp init --client claude
```

### 貢献者向けローカル確認

```bash
npm ci
npm run build
npx serve public -l 3011
```

別のプロジェクトから取り込む場合は、`serve` が表示した port に読み替える。

```bash
npx shadcn@latest add --overwrite http://127.0.0.1:3011/r/button.json
```

`sonner` は `next-themes` の `ThemeProvider` を前提とする。

`Toaster`（sonner ベース）と `ToastToaster`（Base UI Toast ベース）は別系統。どちらか一方を使う。

`DirectionProvider` は Base UI の文字方向 context だけを設定し、HTML / CSS の文字方向は変更しない。RTL にする領域では、利用側が `dir="rtl"` または CSS の `direction: rtl` も設定する。

### Tooltip のアクセシビリティ

`TooltipContent` は `role="tooltip"` を固定する。利用側は content に一意な `id` を付け、同じ値を trigger の `aria-describedby` に渡す。

`TooltipContent` では `render` と `role` を指定できない。Base UI の `render` 要素が通常 props を後勝ちで上書きして固定 role を迂回する経路を、型と実行時の両方で閉じるためである。

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const tooltipId = "save-button-help";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger aria-describedby={tooltipId} aria-label="変更を保存する">
      保存
    </TooltipTrigger>
    <TooltipContent id={tooltipId}>変更内容を保存します</TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

操作に必須の情報は tooltip だけに置かず、trigger の表示テキストや `aria-label` などでも同等の情報を提供する。上流 Base UI が ARIA tooltip pattern を実装した場合は、二重指定を避けるためこの正規化を再評価する。

## トークンの適用

取り込むと shadcn alias の `elchika-ui/tokens.css` と、HTML 正本から生成した `elchika-ui/design-system/tokens.css` が置かれる。elchika の見た目を共有するには、利用側 CSS の import 群へ alias CSS だけを追加し、shadcn が生成した `:root` / `.dark` の色 alias 定義を削除して `tokens.css` に一本化する。alias CSS が generated token を `layer(design-system)` 付きの相対 import で読み込むため、generated token を直接 import しない。

```css
@import "./elchika-ui/tokens.css";
```

削除が必要なのは、CSS の `@import` は通常 rule より前にしか置けず、shadcn の `overwriteCssVars: false` が既存 alias を残すため、併存させると後続の利用側 `:root` / `.dark` が配布 alias に必ず勝つからである。独自変数を同じ block に置いている場合は保持し、shadcn が生成した色 alias declaration だけを削除する。別 component を `shadcn add` すると registry の `cssVars` から alias block が再追記されるため、**add のたびに色 alias を再削除**して import 一本へ戻す。

dark theme では同じ root element に `class="dark" data-theme="dark"` を設定し、light theme では両方を外して `data-theme="light"` にする。`.dark` は Tailwind dark variant と `color-scheme`、`data-theme="dark"` は generated token を切り替えるため、片方だけを変更しない。

`src/styles/design-system/design-tokens.html` が Layer 0 / 1 token の正本で、`build-tokens.mjs` が `tokens.css` と product hue reserve の `brands.css`（registry で配布され、`data-brand` 属性でプロダクト色を選ぶ）を生成する。`global.css` は shadcn semantic alias だけを持ち、色値を再定義しない。token build は正本と生成物の byte 一致、consumer contrast sensor は alias を通った実利用配色を検査する。

`src/styles/design-system/` は外部正本の byte 一致を優先するため Biome の対象外とし、repo lint は自分たちのコードだけへ適用する。`build-tokens.mjs` は取り込み時 SHA-256 `c9fe52008ca7df9af277f57a2b892d3e41741d9c6e842cf33afd43841fb6b5d7` を基点に、`--check` の exact artifact comparison だけを承認済み差分として追加している。

## Development

### Commands

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバ起動 |
| `npm run lint` | lint |
| `npm run typecheck` | 型チェック |
| `node --test "scripts/*.test.mjs"` | テスト実行 |
| `npm run build` | registry と Astro サイトのビルド |
| `npm run build:lib` | ライブラリビルド |
| `npm run check:all` | component の全 checker を順次実行 |

### Architecture

```
src/
  components/ui/   # 部品本体（registry で配布する正本）
  previews/        # 隔離プレビューの中身
  pages/           # Astro のルート（カタログとプレビュー）
  styles/          # generated design-system token と shadcn semantic alias
    design-system/ # HTML 正本・generator・Layer 0 / 1 生成物
  index.ts         # ライブラリのバレル
scripts/           # 来歴記録・standards 適合検知・配布物検査
types/             # ビルド出力の props 契約を検査する型テスト
public/r/          # shadcn build の出力（registry の配信物）
```

本番公開の初期設定は [Phase B: ui.elchika.dev 公開手順](.docs/actions/manual-subproject-3-domain.md) を参照する。

## Contributing

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## License

MIT © [elchika-inc](https://github.com/elchika-inc)
