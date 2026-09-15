verified_impl_sha: ec2d883a0940f17d9b82aed14e022578de305871

# navigation-menu preview 実ブラウザ検証（overlay モーション統一 PR C）

## 成功基準と実行条件

正本は [委任仕様 §4 / §C](../../plans/2026-09-15-overlay-motion.md)。司令塔の追加裁定は PR 本文に記録する。

- 日付: 2026-09-16（JST）。Playwright 1.63.0 / headless Chromium 153.0.8010.12。
- viewport 1440×900、deviceScaleFactor 1、reducedMotion=no-preference。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 4406` で配信した。
- navigation 前に console error / pageerror の収集を開始し、HTTP 200、Astro hydration、`document.fonts.ready` を確認した。
- 初期表示で Popup が開いている場合は Popup に focus して Escape で閉じてから、「製品」trigger を hover する。
- open 操作前から MutationObserver で starting / ending / instant / activation-direction を収集し、open 安定後450msで computed style を測定した。
- close 操作は下表に記載する。16ms間隔で終了属性をポーリングし、終了 transition の後に Popup が表示から外れることを確認した。
- 生データは [browser-results.json](browser-results.json) の component=`navigation-menu` に記録した。画像は開いた状態を各テーマ1枚撮影した。

## 存在・実行の実測

| theme | route | HTTP | preview selector 件数 | console error | pageerror | favicon error | dark class | 横 overflow |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/navigation-menu/` | 200 | 1 | 0 | 0 | 0 | false | なし |
| dark | `/preview/navigation-menu-dark/` | 200 | 1 | 0 | 0 | 0 | true | なし |

`preview-selectors.json` の selector は `[data-slot="navigation-menu-content"]`、動作の実測対象は `[data-slot="navigation-menu-content"]`。

## 動作の実測

| theme | open transition-duration | open transition-timing-function | transition-property | starting 観測 | open 直後 data-instant | close 操作 | close duration | ending 標本数 | ending 初観測→非表示（ms） |
|---|---|---|---|---|---|---|---|---:|---:|
| light | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, transform, translate` | あり | なし（null） | popup focus → Escape | `0.12s` | 8 | 126.500 |
| dark | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity, transform, translate` | あり | なし（null） | popup focus → Escape | `0.12s` | 7 | 110.800 |

両テーマとも close の曲線は `cubic-bezier(0.16, 1, 0.3, 1)`。時間列は16msポーリングの観測差であり、CSSの宣言時間とは区別する。

両テーマとも `data-ending-style` を接続中に観測した後、測定した Popup は `isConnected=false` となり、同 selector の可視要素が0件になった。

### trigger 間移動

「製品」を表示した後、「ガイド」trigger の実測 bounding box の中央へ `page.mouse.move(..., {steps: 10})` でポインターを動かした。light / dark ともガイドの Content に `data-activation-direction="right"` が付き、Content が切り替わることを確認した。通常の `locator.hover()` の actionability 待ちは root の pointer interception で止まったため、実ポインターの移動を使った。DOMイベントの人工 dispatch やCSS/属性の改変は行っていない。

表示画像は製品 Content、close の測定は移動後のガイド Content を対象とした。starting / ending と方向別 translate の生標本は `directionSwitch.trace` を参照。Indicator は既存の常時表示を保持しており、表示条件の変更は行っていない。

## 証跡画像と判定範囲

- light: [2026-09-16-navigation-menu-preview-light.jpg](2026-09-16-navigation-menu-preview-light.jpg)（1440×900 / JPEG、SHA-256 `980e9e8d05f610d62f42f8229077d1671dcf8b4ed4c58b6cea53b1ab2f8c4071`）。
- dark: [2026-09-16-navigation-menu-preview-dark.jpg](2026-09-16-navigation-menu-preview-dark.jpg)（1440×900 / JPEG、SHA-256 `5c4d28d570b04b9933c20f6d92098e89ccb80cc5879e21920b8c1a57ebf7f976`）。

存在（HTTP / selector）、実行（静的ビルドの描画・操作）、動作（computed style / 属性遷移 / 非表示化）まで実測した。両画像を個別に目視し、対象 Popup の欠落・切断・表示崩れを認めなかった。全props組合せ、全キーボード操作、モーション以外の挙動の網羅検証は対象外。
