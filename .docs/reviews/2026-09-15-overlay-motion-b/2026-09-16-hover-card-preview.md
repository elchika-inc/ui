verified_impl_sha: 57d2af4df3e4dc51173e9cb14f951c0edd0fb3b8

# hover-card preview 実ブラウザ検証（overlay モーション統一 PR B）

## 成功基準と手順

正本は [委任仕様 §4 / §B](../../plans/2026-09-15-overlay-motion.md)。実装 commit を固定してから実施した。

- 日付: 2026-09-16（JST）。Playwright 1.63.0 / headless Chromium 153.0.8010.12 / viewport 1440×900 / deviceScaleFactor 1 / reducedMotion=no-preference。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4396` で配信した。
- navigation 前に console error / pageerror listener を登録し、対象 selector の表示、Astro hydration、document.fonts.ready を待った。
- `preview-selectors.json` の `[data-slot="hover-card-content"]` を使用した。初期 open をいったん閉じ、trigger hover で開き、pointer を (1400, 850) へ移して閉じる。
- open 直後の属性は MutationObserver、open の computed style は表示後450msで測定した。close は16ms間隔の属性ポーリングで data-ending-style を観測してから DOM の消失を確認した。
- 表示中に light / dark の JPEG を個別撮影した。生の属性・時刻列は [browser-results.json](browser-results.json) の当該 component / theme を参照。

## 存在・実行・動作の実測

| theme | route | HTTP | selector 件数 | console error | pageerror | favicon error | dark class | 横 overflow |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/hover-card/` | 200 | 1 | 0 | 0 | 0 | false | なし |
| dark | `/preview/hover-card-dark/` | 200 | 1 | 0 | 0 | 0 | true | なし |

| theme | open transition-duration | open transition-timing-function | transition-property | close transition-duration | ending 観測数 | ending 初観測→削除（ms） | starting 観測 | open直後 data-instant |
|---|---|---|---|---|---:|---:|---|---|
| light | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | `0.12s` | 8 | 127.300 | あり | なし（hasAttribute=false / getAttribute=null） |
| dark | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | `0.12s` | 8 | 127.800 | あり | なし（hasAttribute=false / getAttribute=null） |

close の曲線も両テーマで `cubic-bezier(0.16, 1, 0.3, 1)`。全ケースで data-ending-style の観測後に要素が消えた。表の時間は16msポーリングによる観測間隔であり、CSSの宣言時間とは区別する。

`data-starting-style` は両テーマで MutationObserver により観測した。挿入直後に Base UI が一時的に `transition-property: none` を設定するフレームは生データに保持し、安定した open の computed style と区別した。

## data-instant の分岐

通常の開く操作の直後に両テーマとも data-instant が付かなかったため、§B に従い `data-instant:transition-none` を付けた。

## 証跡画像

- light: [2026-09-16-hover-card-preview-light.jpg](2026-09-16-hover-card-preview-light.jpg)（1440×900 / JPEG）。
- dark: [2026-09-16-hover-card-preview-dark.jpg](2026-09-16-hover-card-preview-dark.jpg)（1440×900 / JPEG）。

## 判定と限界

存在（HTTP / selector）、実行（static build の描画・操作）、動作（computed style / 属性遷移 / DOM消失）を実測し、§4.5 の期待値と一致した。画像6枚を個別に目視し、対象popupの欠落・切断・表示崩れがないことを確認した。モーション以外の全 props 組合せ、全キーボード操作、複数 trigger 間の tooltip 移動は今回の動作検証の対象外。
