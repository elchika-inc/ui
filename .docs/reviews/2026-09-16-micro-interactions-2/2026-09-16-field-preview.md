verified_impl_sha: 1e4ab738edc86a2a46f168769ed75e3f07e51b35

# field preview 実ブラウザ検証（マイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§C](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 52872` で配信した。
- Playwright MCP から Chromium 153.0.8010.48 を `browserType().launch({ headless: true, channel: "chrome" })` で新規起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始し、`goto` の `domcontentloaded` 直後に Field を測定した。他の操作は hydration 完了、`document.fonts.ready`、200ms を待って行った。
- 操作前に `setInterval(sample, 16)` を開始し、対象の存在、starting / ending 属性、computed style、`getAnimations()` の種別とプロパティ・名前、`effect.getTiming()` の duration / easing を取得した。操作後400msまで採取した。
- 時刻はポーリング開始からの相対値で、click の準備時間を含むため duration そのものとは区別する。
- preview selector: `[data-slot="field-preview"]`。

## 表示・エラー

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror | dark class | reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/field/` | 200 | 1 | 0 | 0 | 0 | false | false |
| dark | `/preview/field-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## invalid shake

読込直後の `[data-slot="field"][data-invalid="true"]` を測定した。

| theme | animation-name | animation-duration | computed animation-timing-function | 読込直後 translate | 終了後 translate |
| --- | --- | --- | --- | --- | --- |
| light | `shake` | `0.32s` | `cubic-bezier(0.2, 0, 0, 1)` | `-2.08797px` | `none` |
| dark | `shake` | `0.32s` | `cubic-bezier(0.2, 0, 0, 1)` | `-3.26876px` | `none` |

| theme | 種別 | animationName | effect duration（ms） | effect easing |
| --- | --- | --- | --- | --- |
| light | CSSAnimation | shake | 320 | linear |
| dark | CSSAnimation | shake | 320 | linear |

司令塔裁定（2026-09-16）: `effect.getTiming().easing = linear` は effect 全体、computed `animation-timing-function = cubic-bezier(0.2, 0, 0, 1)` は keyframe 間の easing であり、この生値を併記して合格とする。追加の light 読込で `getKeyframes()` の5点すべてが同じ standard easing、offset `0 / 0.25 / 0.5 / 0.75 / 1`、translate `0px / -4px / 4px / -4px / 0px` であることも実測した。spec 自体は変更しない。

## 証跡画像と判定範囲

- light: [2026-09-16-field-preview-light.jpg](2026-09-16-field-preview-light.jpg)
- dark: [2026-09-16-field-preview-dark.jpg](2026-09-16-field-preview-dark.jpg)

画像は各 route で新規撮影した1440×900の JPEG（magic bytes `FF D8 FF`）であり、既存画像の複製ではない。目視で本文・操作部品の欠落や切断を認めなかった。

存在（selector・画像形式）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・指定の属性遷移）まで検証した。全 props の組合せ、全キーボード操作、reduced-motion の網羅検証は含まない。
