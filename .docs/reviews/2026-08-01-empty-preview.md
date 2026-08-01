# Empty プレビュー実ブラウザ検証

verified_impl_sha: 6dcd78c9e140458a8b6f2296f50ab6493aff8467

検証した実装 commit: `6dcd78c9e140458a8b6f2296f50ab6493aff8467`

## 検証条件

- 配信: `npx serve dist -l 3036 --no-clipboard`
- ブラウザ: Chrome、full-page screenshot
- selector: `[data-slot="empty-preview"]`
- 操作: なし。静的な Empty の初期描画を確認した
- catalog は開かず、バッチ末尾の横断確認へ残した

## 検証結果

| route / theme | selector / console | slot / a11y / action | 寸法・token | screenshot |
| --- | --- | --- | --- | --- |
| `/preview/empty/` light | selector 1件、console error 0件 | `empty`、header、icon media、title、description、content、actionを各1件。Title は `h3`、Description は `p`、Inbox SVG 1件、action は有効な `button` | Empty は 528 × 219.5px、radius 14px。background `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`、media muted `oklch(0.97 0 0)`、border `oklch(0.922 0 0)` | `2026-08-01-empty-preview-light.jpg` |
| `/preview/empty-dark/` dark | selector 1件、console error 0件 | light と同じ全slot、heading、description、media、actionを確認 | light と同寸法・radius。background `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`、media muted `oklch(0.269 0 0)`、border `oklch(1 0 0 / 0.1)` | `2026-08-01-empty-preview-dark.jpg` |

## screenshot 実体と後始末

- 両方とも JPEG JFIF（先頭 bytes: `ffd8ffe000104a4649460001`）で、拡張子と画像実体が一致する。
- 検証後に Browser tab を finalize し、`serve` を停止した。

## 見た項目と見なかった項目

- 見た: 固有 light / dark route、hydration 後のselector、全slot、heading、description、media、action、寸法、semantic token、console error、JPEG screenshot。
- 見なかった: catalog 横断確認。Task 6 の範囲外であり、バッチ末尾に実施する。
