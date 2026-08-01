# Separator プレビュー実ブラウザ検証

verified_impl_sha: a3ff56ccce6add652a07fb845a0df2d5852680d7

検証した commit: `a3ff56ccce6add652a07fb845a0df2d5852680d7`

## 検証条件

- 配信: `npx serve dist -l 3021 --no-clipboard`
- ブラウザ: Chrome
- selector: `[data-slot="separator"]`
- 操作: なし。初期描画された水平・垂直の Separator を確認した

## 検証結果

| route / theme | selector | console | DOM / 描画 | screenshot |
|---|---|---|---|---|
| `/catalog/` light | 2件 | error 0件 | `astro-island` 1件。scan 由来の `badge`、`button`、`dialog`、`input`、`separator`、`sonner`、`tabs` を全件描画し、各領域の幅・高さが 0 より大きいことを確認 | 対象外 |
| `/preview/separator/` light | 2件 | error 0件 | 水平は `data-orientation="horizontal"`、幅 464px・高さ 1px。垂直は `data-orientation="vertical"`、幅 1px・高さ 40px・`align-self: stretch` | `2026-08-01-separator-preview-light.jpg` |
| `/preview/separator-dark/` dark | 2件 | error 0件 | `html.dark` を確認。水平・垂直の orientation と寸法は light と一致 | `2026-08-01-separator-preview-dark.jpg` |

## テーマトークン

- light の背景色: `oklch(0.922 0 0)`
- dark の背景色: `oklch(1 0 0 / 0.1)`
- DOM 契約と寸法を維持したまま、テーマに応じて separator の色が変化した

## 見た項目と見なかった項目

- 見た: catalog の hydration と scan 由来全7件の描画、light / dark route、selector 件数、水平・垂直の orientation、computed size、テーマ色、console error
- 見なかった: ユーザー操作。Separator は操作を持たない静的 component のため対象外とした
