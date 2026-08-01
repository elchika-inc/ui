# Spinner preview 実ブラウザ検証

verified_impl_sha: 77f8e164bbaf00a75caf03fd861ae6a33a8e8a1f

- implementation commit: `77f8e164bbaf00a75caf03fd861ae6a33a8e8a1f`
- 対象 route: `http://localhost:4331/preview/spinner/`（light）と `http://localhost:4331/preview/spinner-dark/`（dark）
- 実測対象は Spinner 固有 route のみであり、catalog はバッチ末尾の横断確認まで開かない。

## 結果

- 両 theme で `[data-slot="spinner-preview"]` は hydrated 後に1件、`svg[data-slot="spinner"]` は5件存在した。
- SVG の全件で `role="status"` と `animation-name: spin`、`animation-duration: 1s`、`animation-iteration-count: infinite` を確認した。
- 単独表示は既定の `aria-label="Loading"` を保持した。ラベル併用の Spinner は `aria-hidden="true"` かつ `aria-label` なしで、隣接テキスト「データを同期しています」に意味を委ねた。size 例は小・標準・大の個別 `aria-label` を持つ。
- size は両 theme で 16px / 24px / 32px を確認した。
- light は `--primary: oklch(0.205 0 0)`、dark は `--primary: oklch(0.922 0 0)` で、Spinner の computed `color` が各 token と一致した。
- console の error / warning は light / dark ともに0件だった。

## 証跡

- `2026-08-01-spinner-preview-light.jpg`: JPEG / JFIF、1512 × 828px、magic bytes `ffd8ff`
- `2026-08-01-spinner-preview-dark.jpg`: JPEG / JFIF、1512 × 772px、magic bytes `ffd8ff`
