# Label プレビュー実ブラウザ検証

検証した commit: `72230d25f239b8673629f242eae8f036b2e98c1d`

## 検証条件

- 配信: `npx serve dist -l 3021 --no-clipboard`
- ブラウザ: Chrome、1512 × 772 の full-page screenshot
- selector: `[data-slot="label"]`
- 操作: なし。初期描画された通常・無効状態の Label と関連 control を確認した

## 検証結果

| route / theme | selector | console | DOM / a11y / 状態 | screenshot |
|---|---|---|---|---|
| `/catalog/` light | 2件 | error 0件 | 単一 `astro-island` 内で scan 由来の `badge`、`button`、`dialog`、`input`、`label`、`separator`、`sonner`、`tabs` を全件描画し、各領域の幅・高さが 0 より大きいことを確認 | 対象外 |
| `/preview/label/` light | 2件 | error 0件 | 「メールアドレス」は `label-email` の有効な input、「無効な項目」は `label-disabled` の disabled input と関連。通常 opacity 1、無効 opacity 0.5、各 Label は 336 × 14px | `2026-08-01-label-preview-light.jpg` |
| `/preview/label-dark/` dark | 2件 | error 0件 | `html.dark` と body 背景 `oklch(0.145 0 0)` を確認。control 関連、disabled、opacity、寸法は light と一致 | `2026-08-01-label-preview-dark.jpg` |

## テーマ

- light の body 背景色: `oklch(1 0 0)`
- dark の body 背景色: `oklch(0.145 0 0)`
- Label の control 関連と状態表現を維持したまま、ページのテーマトークンが反転した

## 見た項目と見なかった項目

- 見た: catalog の hydration と scan 由来全8件の描画、light / dark route、selector 件数、可視テキスト、`htmlFor` と control `id` の関連、control の disabled、Label の opacity と矩形、console error
- 見なかった: label クリックによる focus 移動、input の値変更。今回は静的な関連付けと状態表示を対象とした
