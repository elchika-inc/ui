# Breadcrumb プレビュー実ブラウザ検証

検証した commit: `d9c1c949bc65ff776e791e911e45b1cc44fdcf47`

配信は `npm run dev -- --host 127.0.0.1 --port 4324` で起動し、Chrome で Breadcrumb の個別 route のみを確認した。catalog 横断確認はバッチ末尾で実施する。

## 実測結果

| route / theme | selector | hydrated 後の件数 | console error | DOM | theme token | screenshot |
|---|---|---:|---:|---|---|---|
| `/preview/breadcrumb/` / light | `[data-slot="breadcrumb-preview"]` | 1 | 0 | accessible name `パンくずリスト` の `nav` 1件、`ol` 1件・`li` 7件、link 2件（ホーム `/`、プロジェクト `/projects`）、`aria-current="page"` の設計システム、separator 3件、ellipsis 1件を hydrated DOM で確認 | `--background: oklch(1 0 0)`、`--foreground: oklch(0.145 0 0)`、`--muted-foreground: oklch(0.54 0 0)` | `2026-08-01-breadcrumb-preview-light.jpg` |
| `/preview/breadcrumb-dark/` / dark | `[data-slot="breadcrumb-preview"]` | 1 | 0 | accessible name `パンくずリスト` の `nav` 1件、`ol` 1件・`li` 7件、link 2件（ホーム `/`、プロジェクト `/projects`）、`aria-current="page"` の設計システム、separator 3件、ellipsis 1件を hydrated DOM で確認 | `html.dark`、`--background: oklch(0.145 0 0)`、`--foreground: oklch(0.985 0 0)`、`--muted-foreground: oklch(0.708 0 0)` | `2026-08-01-breadcrumb-preview-dark.jpg` |

両 screenshot は Browser の screenshot 出力を magic bytes で確認した JPEG 実体である。catalog は開かず、バッチ末尾の横断確認へ残した。
