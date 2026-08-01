# Card プレビュー実ブラウザ検証

検証した commit: `63b9239b7996cdd319c14cc330d5a2cbff5ad82a`

## 検証条件

- 配信: `npx serve dist -l 3021 --no-clipboard`
- ブラウザ: Chrome、1512 × 772 の full-page screenshot
- selector: `[data-slot="card"]`
- 操作: なし。初期描画された default / small の Card と全構成 slot を確認した

## 検証結果

| route / theme | selector | console | DOM / 描画 | screenshot |
|---|---|---|---|---|
| `/catalog/` light | 2件 | error 0件 | 単一 `astro-island` 内で scan 由来の `badge`、`button`、`card`、`dialog`、`input`、`label`、`separator`、`sonner`、`tabs` を全件描画し、各領域の幅・高さが 0 より大きいことを確認 | 対象外 |
| `/preview/card/` light | 2件 | error 0件 | `data-size` は `default` / `sm`。Card は各 300 × 187px。Header / Title / Description / Content は各2件、Action / Footer は各1件 | `2026-08-01-card-preview-light.jpg` |
| `/preview/card-dark/` dark | 2件 | error 0件 | `html.dark` を確認。slot 件数、size、矩形は light と一致 | `2026-08-01-card-preview-dark.jpg` |

## テーマトークン

- light: Card 背景 `oklch(1 0 0)`、前景 `oklch(0.145 0 0)`
- dark: Card 背景 `oklch(0.205 0 0)`、前景 `oklch(0.985 0 0)`
- DOM 構成と寸法を維持したまま、Card の semantic token がテーマに応じて反転した

## 見た項目と見なかった項目

- 見た: catalog の hydration と scan 由来全9件の描画、light / dark route、selector 件数、全7 slot、default / sm、computed size、Card 背景・前景 token、console error
- 見なかった: ユーザー操作。Card は操作を持たない静的 component のため対象外とした
