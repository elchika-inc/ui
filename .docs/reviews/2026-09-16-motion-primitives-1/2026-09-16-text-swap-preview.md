verified_impl_sha: 20a920f0e326e2abd2907c29a2ec4b4efa73d877

# text-swap preview 実ブラウザ検証

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§B](../../plans/2026-09-16-motion-primitives.md)。
- `npm run build:site` は exit 0、286ページ。成果物を以下のコマンドで配信した。

```sh
npx astro preview --host ::1 --port 52881
```

- IPv4 loopback は listen 済みにもかかわらず接続が EADDRNOTAVAIL / ERR_ADDRESS_INVALID となったため、IPv6 loopback を使用した。対象コードは変更していない。
- Playwright MCP から新規起動した headless Chromium 153.0.8010.48、viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始。hydrate、document.fonts.ready、1100msを待ち、操作前から16ms間隔で対象要素の computed style と getAnimations を収集した。button をclickし、1250ms後のDOM・computed styleを記録して撮影した。
- transitionend の propertyName / elapsedTime も記録した。時刻は計測開始からの相対値であり、duration自体とは区別する。

## 表示・エラー

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror |
| --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/text-swap/` | 200 | 1 | 0 | 0 | 0 |
| dark | `/preview/text-swap-dark/` | 200 | 1 | 0 | 0 | 0 |

preview selector: `[data-slot="text-swap-preview"]`。両themeでdark classはrouteと一致、reduced-motionはfalse。

## computed style と getAnimations

| theme | 対象 | computed property | computed duration | computed easing | computed delay | transitionProperty | duration ms | easing | delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | text-swap-leaving | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `opacity` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| light | text-swap-leaving | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `translate` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| light | text-swap-value | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `opacity` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| light | text-swap-value | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `translate` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| dark | text-swap-leaving | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `opacity` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| dark | text-swap-leaving | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `translate` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| dark | text-swap-value | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `opacity` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| dark | text-swap-value | `opacity, translate` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | `0s` | `translate` | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |

すべて `CSSTransition` として取得した。

## 退場DOMと連続切替

| theme | 操作後の現在値 | 計測中のleaving最大件数 | transitionend | 最終leaving件数 |
| --- | --- | --- | --- | --- |
| light | 確認中 | 1 | opacity: 0.12s / 183.1ms, translate: 0.12s / 183.1ms | 0 |
| dark | 確認中 | 1 | opacity: 0.12s / 200.7ms, translate: 0.12s / 200.8ms | 0 |

退場要素はaria-hidden=true、現在要素の最終opacityは1。追加でlight routeを20ms間隔で5回切替え、通常・reduced-motionとも直前の値だけを最大1件保持し、最終切替の200ms後は0件になった。通常のcomputed durationは0.12s、reduceでは1e-05s。

## 証跡画像と判定範囲

- light: [2026-09-16-text-swap-preview-light.jpg](2026-09-16-text-swap-preview-light.jpg)
- dark: [2026-09-16-text-swap-preview-dark.jpg](2026-09-16-text-swap-preview-dark.jpg)

10 routeはそれぞれ新規撮影した1440×900のJPEGであり、既存画像の複製ではない。画像を目視し、本文・操作部品の欠落や切断がないことを確認した。

存在（selector・画像形式）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・指定状態の変化）を検証した。全propsの組合せ、Intl.Segmenter未搭載環境、全キーボード操作、他ブラウザの網羅検証は含まない。
