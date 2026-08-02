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

registry はまだ公開していない。配信 URL はサブプロジェクト #3 でドメインを確定してから、このセクションに追記する。

貢献者がローカルで取り込みを確かめる場合は、このリポジトリで registry を生成してから配信する。

```bash
npm ci
npm run build
npx serve public -l 3011
```

別のプロジェクトから取り込む（`serve` が表示したポートに読み替える）。

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

取り込むと shadcn alias の `elchika-ui/tokens.css` と、HTML 正本から生成した `elchika-ui/design-system/tokens.css` が置かれる。**利用側に既存のトークン定義がある場合、registry はそれを上書きしない**（shadcn の仕様）。elchika の見た目を共有するには、自分の CSS から generated token、alias CSS の順に**最後に** import する。

```css
@import "./elchika-ui/design-system/tokens.css";
@import "./elchika-ui/tokens.css";
```

`src/styles/design-system/design-tokens.html` が Layer 0 / 1 token の正本で、`build-tokens.mjs` が `tokens.css` と将来利用する product hue reserve の `brands.css` を生成する。`global.css` は shadcn semantic alias だけを持ち、色値を再定義しない。token build は正本と生成物の byte 一致、consumer contrast sensor は alias を通った実利用配色を検査する。

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

## Contributing

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## License

MIT © [elchika-inc](https://github.com/elchika-inc)
