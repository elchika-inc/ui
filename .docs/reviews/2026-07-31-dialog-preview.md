# Dialog プレビュー実ブラウザ検証

検証した commit: `7a41a52f7da761c23b05672976733f04134a9c2e`

## 検証条件

- 配信: `npx serve dist -l 3012`
- ブラウザ: Chrome、1512 × 828
- forced theme: ブラウザの開発者プロトコルから一時的に `document.documentElement` の `dark` class を付け外しした
- theme 切替後は 250 ms、Close / Escape 後は 200 ms 待って状態を観測した
- network はページ本体とページが参照する HTTP subresource を対象とし、ブラウザ拡張自身のresourceは対象外とした

## route × theme × チェック項目

| route / theme | screenshot | console | network | DOM / a11y / 状態 | keyboard / focus | theme token | 崩れ |
|---|---|---|---|---|---|---|---|
| `/preview/dialog/` light | ✅ `dialog-preview-light.png` | ✅ error / warningなし | ✅ 失敗・4xx / 5xxなし | ✅ dialog、overlay、title、descriptionが存在し、`aria-labelledby` / `aria-describedby` の参照先テキストが一致 | ✅ 初期focusとTab後のfocusはcontent内。Close / Escape後はtriggerへ復帰 | ✅ body / content `oklch(1 0 0)`、文字 `oklch(0.145 0 0)` | ✅ 横scrollなし、content 384 × 161 px、overlay 1512 × 828 px |
| `/preview/dialog/` forced-dark | ✅ `dialog-preview-light-forced-dark.png` | ✅ error / warningなし | ✅ 同一読込済みsubresourceに失敗なし | ✅ dialog / overlayの構造を維持 | ✅ lightで確認したfocus順・終了操作を維持 | ✅ body `oklch(0.145 0 0)`、content `oklch(0.205 0 0)`、文字 `oklch(0.985 0 0)` | ✅ 横scrollなし、矩形はlightと同一 |
| `/preview/dialog-dark/` forced-light | ✅ `dialog-preview-dark-forced-light.png` | ✅ error / warningなし | ✅ 読込済みsubresourceに失敗なし | ✅ dialog / overlayの構造を維持 | ✅ 初期focusはcontent内 | ✅ body / content `oklch(1 0 0)`、文字 `oklch(0.145 0 0)` | ✅ 横scrollなし、矩形はdarkと同一 |
| `/preview/dialog-dark/` dark | ✅ `dialog-preview-dark.png` | ✅ error / warningなし | ✅ 失敗・4xx / 5xxなし | ✅ dialog、overlay、title、descriptionが存在し、背景側は `aria-hidden="true"` | ✅ 初期focusはcontent内 | ✅ body `oklch(0.145 0 0)`、content `oklch(0.205 0 0)`、文字 `oklch(0.985 0 0)` | ✅ 横scrollなし、content 384 × 161 px、overlay 1512 × 828 px |

## モーダル挙動の実測

- 初期表示ではClose icon buttonにfocusがあり、Tab後もfocusはdialog content内に留まった
- Tab後のfocus ringは `oklch(0.556 0 0) 0 0 0 3px` で、alpha合成されたstate ringではなかった
- Close icon clickとEscapeのいずれもdialogが閉じ、`aria-expanded="false"` の「ダイアログを開く」triggerへfocusが戻った
- overlayはviewport全体を覆い、`pointer-events: auto` だった
- 背景側のtriggerを含むAstro islandは、dialog表示中に `aria-hidden="true"` になった
- Base UI 1.6.0ではdialog contentに `aria-modal` が出力されなかった。受容済みの `RISK-009` に従い、focus trap、focus return、背景の `aria-hidden`、overlayによるpointer interceptionをモーダル性の根拠とした

## network 実測

- 両routeともDocument、CSS、Geist Variable font、Astro / React / Dialog / Button JavaScriptを取得した
- `/preview/dialog/`: Document / subresourceは成功応答、`Network.loadingFailed`なし
- `/preview/dialog-dark/`: Document 200、subresource 200または304、`Network.loadingFailed`なし

## 見た項目と見なかった項目

- 見た: selector実在、dialog role、title / description参照、初期focus、focus trap、focus ring、Close、Escape、focus return、背景の `aria-hidden`、overlayのpointer interception、console、network、theme token、横scroll、矩形、light / dark描画
- 見なかった: nested dialog、非modal mode、長文content、狭幅viewport、複数trigger。今回のパイロットは共有設定の単一modal previewを対象とした
- 静的な `dist` HTMLだけではportal後のdialog DOMを観測できないため、selector実在はhydration後のブラウザDOMで確認した
