# Dialog プレビュー catalog mode 回帰検証

verified_impl_sha: ad97ea4e5cf30e66c3edad3ba50f4fdc4e4f7249

検証した commit: `ad97ea4e5cf30e66c3edad3ba50f4fdc4e4f7249`

## 検証条件

- 配信: `npx serve dist -l 3192`
- ブラウザ: Chrome、1512 × 828
- 対象 route: `/preview/dialog/`、`/preview/dialog-dark/`
- `src/previews/dialog.tsx` へ catalog mode を追加した後も、mode 未指定の個別 route が従来どおり isolated 表示になることを再検証した
- animation の補間完了後に focus ring と矩形を観測した

## route × theme の実測

| route | screenshot | 初期状態 | DOM / a11y | focus | theme / layout | console |
|---|---|---|---|---|---|---|
| `/preview/dialog/` | `2026-08-01-dialog-catalog-regression-light.jpg` | dialog と overlay が表示され、trigger は `aria-expanded="true"` | title は「共有設定」、description の参照先テキストが一致し、背景 island は `aria-hidden="true"` | 初期 focus は dialog 内の Close button | body / content は `oklch(1 0 0)`、文字は `oklch(0.145 0 0)`、content 384 × 161 px、overlay 1512 × 828 px、横 overflow なし | error / warning なし |
| `/preview/dialog-dark/` | `2026-08-01-dialog-catalog-regression-dark.jpg` | dialog と overlay が表示され、trigger は `aria-expanded="true"` | title と description が存在し、背景 island は `aria-hidden="true"` | 初期 focus は dialog 内の Close button | body は `oklch(0.145 0 0)`、content は `oklch(0.205 0 0)`、文字は `oklch(0.985 0 0)`、補間後の矩形は light と一致、横 overflow なし | error / warning なし |

両 route とも overlay は viewport 全体を覆い、`pointer-events: auto` だった。Base UI 1.6.0 の生成 DOM では dialog content に `aria-modal` は無く、focus trap、focus return、背景の `aria-hidden`、overlay の pointer interception をモーダル性の根拠とした。

## interaction の実測

- light route の初期 Close icon から Tab を押すと footer の Close button へ移り、focus は dialog 内に留まった
- focus ring の補間完了後は `oklch(0.556 0 0) 0 0 0 3px` だった
- Escape で dialog が閉じ、`aria-expanded="false"` の trigger へ focus が戻った
- trigger click で再度開き、Close icon click で閉じた後も trigger へ focus が戻った
- catalog mode では Dialog を閉じて trigger だけを表示する一方、mode 未指定の個別 route では従来どおり初期 open になる

## 見た項目と見なかった項目

- 見た: light / dark の初期 open、dialog / overlay、title / description、初期 focus、Tab による focus trap、focus ring、Escape、Close icon、focus return、背景 `aria-hidden`、overlay pointer interception、theme token、矩形、横 overflow、console error / warning、JPEG screenshot の保存
- 見なかった: forced theme、network、nested dialog、非modal mode、長文 content、狭幅 viewport。今回の再検証は catalog mode 追加後に個別 route の isolated 契約が維持されることを対象とした
