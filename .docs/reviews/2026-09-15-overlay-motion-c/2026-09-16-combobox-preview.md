verified_impl_sha: ec2d883a0940f17d9b82aed14e022578de305871

# combobox preview 実ブラウザ検証（overlay モーション統一 PR C）

## 成功基準と実行条件

正本は [委任仕様 §4 / §C](../../plans/2026-09-15-overlay-motion.md)。司令塔の追加裁定は PR 本文に記録する。

- 日付: 2026-09-16（JST）。Playwright 1.63.0 / headless Chromium 153.0.8010.12。
- viewport 1440×900、deviceScaleFactor 1、reducedMotion=no-preference。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4406` で配信した。
- navigation 前に console error / pageerror の収集を開始し、HTTP 200、Astro hydration、`document.fonts.ready` を確認した。
- 初期表示で Popup が開いている場合は Popup に focus して Escape で閉じてから、`button[data-slot="input-group-button"][aria-label="選択肢を開く"]` をクリックする。
- open 操作前から MutationObserver で starting / ending / instant / activation-direction を収集し、open 安定後450msで computed style を測定した。
- close 操作は下表に記載する。16ms間隔で終了属性をポーリングし、終了 transition の後に Popup が表示から外れることを確認した。
- 生データは [browser-results.json](browser-results.json) の component=`combobox` に記録した。画像は開いた状態を各テーマ1枚撮影した。

## 存在・実行の実測

| theme | route | HTTP | preview selector 件数 | console error | pageerror | favicon error | dark class | 横 overflow |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/combobox/` | 200 | 1 | 0 | 0 | 0 | false | なし |
| dark | `/preview/combobox-dark/` | 200 | 1 | 0 | 0 | 0 | true | なし |

`preview-selectors.json` の selector は `[data-slot="combobox-preview"]`、動作の実測対象は `[data-slot="combobox-content"]`。

## 動作の実測

| theme | open transition-duration | open transition-timing-function | transition-property | starting 観測 | open 直後 data-instant | close 操作 | close duration | ending 標本数 | ending 初観測→非表示（ms） |
|---|---|---|---|---|---|---|---|---:|---:|
| light | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | あり | なし（null） | trigger click | `0.12s` | 10 | 158.100 |
| dark | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, scale` | あり | なし（null） | trigger click | `0.12s` | 9 | 149.200 |

両テーマとも close の曲線は `cubic-bezier(0.16, 1, 0.3, 1)`。時間列は16msポーリングの観測差であり、CSSの宣言時間とは区別する。

両テーマとも `data-ending-style` を接続中に観測した後、測定した Popup は `isConnected=false` となり、同 selector の可視要素が0件になった。

通常の開く操作で両テーマとも `data-instant` が付かなかったため、共通テンプレの `data-instant:transition-none` を保持した。

## 証跡画像と判定範囲

- light: [2026-09-16-combobox-preview-light.jpg](2026-09-16-combobox-preview-light.jpg)（1440×900 / JPEG、SHA-256 `9d3524d2e41566acff0338caad548761bf1f165958e2ca11928d7f69cdbdbe44`）。
- dark: [2026-09-16-combobox-preview-dark.jpg](2026-09-16-combobox-preview-dark.jpg)（1440×900 / JPEG、SHA-256 `0f7b61b1ea650873039b708db9b2f6c15ba0146a64d24c062cc97308b9792e61`）。

存在（HTTP / selector）、実行（静的ビルドの描画・操作）、動作（computed style / 属性遷移 / 非表示化）まで実測した。両画像を個別に目視し、対象 Popup の欠落・切断・表示崩れを認めなかった。全props組合せ、全キーボード操作、モーション以外の挙動の網羅検証は対象外。
