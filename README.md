# ui

> elchika-inc の共有 UI コンポーネントライブラリ

[![CI](https://github.com/elchika-inc/ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/elchika-inc/ui/actions/workflows/ci.yml)
[![standards](https://img.shields.io/badge/standards-2026--07--29_(rev.46)-blue)](https://github.com/elchika-inc/standards/blob/main/CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Base UI と Tailwind CSS v4 で作った UI コンポーネント集。elchika-inc の各プロダクトが同じ見た目と操作性を共有するための正本。npm publish はせず shadcn の custom registry で配布し、利用側はソースをコピーして所有する。

## Features

- Base UI ベースのアクセシブルなコンポーネント
- standards のデザイントークンを同梱（light / dark 対応）
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

## トークンの適用

取り込むと `elchika-ui/tokens.css` が置かれる。**利用側に既存のトークン定義がある場合、registry はそれを上書きしない**（shadcn の仕様）。elchika の見た目を共有するには、自分の CSS から**最後に** import する。

```css
@import "./elchika-ui/tokens.css";
```

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
  styles/          # standards のデザイントークン
  index.ts         # ライブラリのバレル
scripts/           # 来歴記録・standards 適合検知・配布物検査
types/             # ビルド出力の props 契約を検査する型テスト
public/r/          # shadcn build の出力（registry の配信物）
```

## Contributing

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。または直接：

1. Fork する
2. feature ブランチを切る (`git checkout -b feat/your-feature`)
3. 変更をコミットする (`git commit -m 'feat: add your feature'`)
4. ブランチを push する (`git push origin feat/your-feature`)
5. Pull Request を作成する

## License

MIT © [elchika-inc](https://github.com/elchika-inc)
