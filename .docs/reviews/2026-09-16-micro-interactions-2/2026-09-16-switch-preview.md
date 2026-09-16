verified_impl_sha: 1e4ab738edc86a2a46f168769ed75e3f07e51b35

# switch preview 実ブラウザ検証（マイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§C](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 52872` で配信した。
- Playwright MCP から Chromium 153.0.8010.48 を `browserType().launch({ headless: true, channel: "chrome" })` で新規起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始し、`goto` の `domcontentloaded` 直後に Field を測定した。他の操作は hydration 完了、`document.fonts.ready`、200ms を待って行った。
- 操作前に `setInterval(sample, 16)` を開始し、対象の存在、starting / ending 属性、computed style、`getAnimations()` の種別とプロパティ・名前、`effect.getTiming()` の duration / easing を取得した。操作後400msまで採取した。
- 時刻はポーリング開始からの相対値で、click の準備時間を含むため duration そのものとは区別する。
- preview selector: `[data-slot="switch-preview"]`。

## 表示・エラー

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror | dark class | reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/switch/` | 200 | 1 | 0 | 1 | 0 | false | false |
| dark | `/preview/switch-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## 状態色の computed style

| theme | transition-property | transition-duration | transition-timing-function |
| --- | --- | --- | --- |
| light | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |
| dark | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |

`all` を含まず、4プロパティすべて fast / standard に一致した。

## Thumb の移動

先頭の `[data-slot="switch"]` を click した。実測対象は `[data-slot="switch-thumb"]`。

| theme | computed property | duration | easing | translate 変化 |
| --- | --- | --- | --- | --- |
| light | `transform, translate, scale, rotate` | `0.18s` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | `0px` → `calc(100% - 2px)` |
| dark | `transform, translate, scale, rotate` | `0.18s` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | `0px` → `calc(100% - 2px)` |

## getAnimations の実測

| theme | 操作 | 種別 | transitionProperty | duration（ms） | easing |
| --- | --- | --- | --- | --- | --- |
| light | click | CSSTransition | translate | 180 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |
| dark | click | CSSTransition | translate | 180 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |

## 証跡画像と判定範囲

- light: [2026-09-16-switch-preview-light.jpg](2026-09-16-switch-preview-light.jpg)
- dark: [2026-09-16-switch-preview-dark.jpg](2026-09-16-switch-preview-dark.jpg)

画像は各 route で新規撮影した1440×900の JPEG（magic bytes `FF D8 FF`）であり、既存画像の複製ではない。目視で本文・操作部品の欠落や切断を認めなかった。

存在（selector・画像形式）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・指定の属性遷移）まで検証した。全 props の組合せ、全キーボード操作、reduced-motion の網羅検証は含まない。
