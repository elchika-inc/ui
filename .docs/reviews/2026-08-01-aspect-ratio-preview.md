# Aspect Ratio プレビュー実ブラウザ検証

検証した commit: `22d5b4c463b7f46bf04c0872417040e4afbb357a`

配信は `npm run dev -- --host 127.0.0.1 --port 4322` で起動し、Chrome で個別 route だけを確認した。catalog 横断確認はバッチ末尾で実施する。

## 実測結果

| route / theme | selector | hydrated 後の件数 | console error | DOM 寸法 / 比率 | theme token | screenshot |
|---|---|---:|---:|---|---|---|
| `/preview/aspect-ratio/` / light | `[data-slot="aspect-ratio"]` | 1 | 0 | 464 × 261 px、1.7777777778 | `--muted: oklch(0.97 0 0)` | `2026-08-01-aspect-ratio-light.jpg` |
| `/preview/aspect-ratio-dark/` / dark | `[data-slot="aspect-ratio"]` | 1 | 0 | 464 × 261 px、1.7777777778 | `--muted: oklch(0.269 0 0)`、子要素 `--muted-foreground: oklch(0.708 0 0)` | `2026-08-01-aspect-ratio-dark.jpg` |

両 route で `16:9 プレビュー` の描画を確認した。light は `--muted: oklch(0.97 0 0)`、dark は `html.dark` と `--muted: oklch(0.269 0 0)` を実測し、テーマ別 route が独立していることを確認した。スクリーンショットはいずれも JPEG 実体（1512 × 828 px）である。
