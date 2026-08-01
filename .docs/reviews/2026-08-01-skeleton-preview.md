# Skeleton プレビュー実ブラウザ検証

verified_impl_sha: 7b5ff20923105794ec15f216ab0538d9577c7b83

検証した commit: `7b5ff20923105794ec15f216ab0538d9577c7b83`

## 検証条件

- 配信: `npx serve dist -l 3021 --no-clipboard`
- ブラウザ: Chrome、1512 × 772 の full-page screenshot
- selector: `[data-slot="skeleton"]`
- 操作: なし。初期描画された avatar・テキスト行の Skeleton を確認した

## 検証結果

| route / theme | selector | console | DOM / a11y / animation | screenshot |
|---|---|---|---|---|
| `/catalog/` light | 4件 | error 0件 | 単一 `astro-island` 内で scan 由来の `badge`、`button`、`card`、`dialog`、`input`、`label`、`separator`、`skeleton`、`sonner`、`tabs` を全件描画し、各領域の幅・高さが 0 より大きいことを確認 | 対象外 |
| `/preview/skeleton/` light | 4件 | error 0件 | 親は `aria-busy="true"`・名前「読み込み中」、全 Skeleton は `aria-hidden="true"`。全件 `animation-name: pulse`・2秒。寸法は 48 × 48、204 × 16、272 × 16、136 × 16px | `2026-08-01-skeleton-preview-light.jpg` |
| `/preview/skeleton-dark/` dark | 4件 | error 0件 | `html.dark` を確認。a11y 状態、animation、寸法は light と一致 | `2026-08-01-skeleton-preview-dark.jpg` |

## テーマトークン

- light の Skeleton 背景色: `oklch(0.97 0 0)`
- dark の Skeleton 背景色: `oklch(0.269 0 0)`
- DOM・animation・寸法を維持したまま、`muted` token がテーマに応じて変化した

## 見た項目と見なかった項目

- 見た: catalog の hydration と scan 由来全10件の描画、light / dark route、selector 件数、`aria-busy`、読み込み中の名前、`aria-hidden`、computed size、animation 名・時間、背景 token、console error
- 見なかった: animation の全フレームと reduced motion。今回は animation 適用の実体と静的描画を対象とした
