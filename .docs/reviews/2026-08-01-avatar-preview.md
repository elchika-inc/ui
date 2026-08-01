# Avatar プレビュー実ブラウザ検証

検証した commit: `c7d0ff6ed02ef1ebfbddfe7698e2a7cf338ac680`

配信は `npm run dev -- --host 127.0.0.1 --port 4323` で起動し、Chrome で Avatar の個別 route のみを確認した。catalog 横断確認はバッチ末尾で実施する。

## 実測結果

| route / theme | selector | hydrated 後の件数 | console error | DOM / 寸法 / 形状 | theme token | screenshot |
|---|---|---:|---:|---|---|---|
| `/preview/avatar/` / light | `[data-slot="avatar-preview"]` | 1 | 0 | Avatar 2件。`avatar-image` 1件（`naturalWidth: 150`）と `avatar-fallback` 1件（`UI`）を実 DOM で確認。32 × 32px と 40 × 40px、`border-radius: 1.67772e+07px` の円形 | `--background: oklch(1 0 0)`、`--muted: oklch(0.97 0 0)`、`--muted-foreground: oklch(0.54 0 0)` | `2026-08-01-avatar-preview-light.jpg` |
| `/preview/avatar-dark/` / dark | `[data-slot="avatar-preview"]` | 1 | 0 | Avatar 2件。`avatar-image` 1件（`naturalWidth: 150`）と `avatar-fallback` 1件（`UI`）を実 DOM で確認。32 × 32px と 40 × 40px、`border-radius: 1.67772e+07px` の円形 | `html.dark`、`--background: oklch(0.145 0 0)`、`--muted: oklch(0.269 0 0)`、`--muted-foreground: oklch(0.708 0 0)` | `2026-08-01-avatar-preview-dark.jpg` |

両 screenshot は Browser の screenshot 出力を magic bytes で確認した JPEG 実体である。catalog は開かず、バッチ末尾の横断確認へ残した。
