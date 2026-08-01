# Alert プレビュー実ブラウザ検証

verified_impl_sha: d00b1644144a338446751141fb7d258a54ce7d1a

検証した commit: `d00b1644144a338446751141fb7d258a54ce7d1a`

## 検証条件

- 配信: `npx serve dist -l 3021 --no-clipboard`
- ブラウザ: Chrome、1512 × 772 の full-page screenshot
- selector: `[data-slot="alert"]`
- 操作: なし。初期描画された default / destructive の Alert を確認した

## 検証結果

| route / theme | selector | console | DOM / a11y / variant | screenshot |
|---|---|---|---|---|
| `/catalog/` light | 2件 | error 0件 | 単一 `astro-island` 内で scan 由来の `alert`、`badge`、`button`、`card`、`dialog`、`input`、`label`、`separator`、`skeleton`、`sonner`、`tabs` を全件描画し、各領域の幅・高さが 0 より大きいことを確認 | 対象外 |
| `/preview/alert/` light | 2件 | error 0件 | `role="alert"` 2件、Title / Description 各2件、Action 1件。default / destructive とも 528 × 60px | `2026-08-01-alert-preview-light.jpg` |
| `/preview/alert-dark/` dark | 2件 | error 0件 | `html.dark` を確認。role、slot 件数、矩形は light と一致 | `2026-08-01-alert-preview-dark.jpg` |

## テーマトークン

- light: default 前景 `oklch(0.145 0 0)`、destructive 前景 `oklch(0.505 0.213 27.518)`、border `oklch(0.922 0 0)`
- dark: default 前景 `oklch(0.985 0 0)`、destructive 前景 `oklch(0.704 0.191 22.216)`、border `oklch(1 0 0 / 0.1)`
- DOM・role・寸法を維持したまま、default / destructive の semantic token がテーマに応じて変化した

## 見た項目と見なかった項目

- 見た: catalog の hydration と scan 由来全11件の描画、light / dark route、selector 件数、`role="alert"`、Title / Description / Action、default / destructive の computed color・border・矩形、console error
- 見なかった: AlertAction の操作。今回は静的な slot 配置と状態表示を対象とした
