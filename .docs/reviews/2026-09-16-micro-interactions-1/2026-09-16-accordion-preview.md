verified_impl_sha: cb79f3f3b733c08dea5afc9540e9c53c20537eb2

# accordion preview 実ブラウザ検証（状態遷移とマイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§B](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site` の静的成果物を `npx astro preview --host 127.0.0.1 --port 52771` で配信した。
- Playwright MCP から Chromium（channel chrome、153.0.8010.48）を `launch({ headless: true, channel: "chrome" })` で起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始した。指定 selector の visible、`document.fonts.ready`、Astro island の hydration 完了、700msを待って computed style と画像を取得した。
- selector: `[data-slot="accordion-preview"]`。computed style は担当要素の先頭を測った。

## 表示・エラーの実測

| theme | route | HTTP | selector 件数 | console error（favicon 除外） | favicon 404 | pageerror | dark class | reduced motion |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/accordion/` | 200 | 1 | 0 | 0 | 0 | false | false |
| dark | `/preview/accordion-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## computed style（生値）

| theme | transition-property | transition-duration | transition-timing-function |
|---|---|---|---|
| light | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |
| dark | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |

## 証跡画像と判定範囲

- light: [2026-09-16-accordion-preview-light.jpg](2026-09-16-accordion-preview-light.jpg)
- dark: [2026-09-16-accordion-preview-dark.jpg](2026-09-16-accordion-preview-dark.jpg)

画像は各 route で新規撮影した1440×900のJPEGで、既存証跡の複製ではない。存在（selector・画像）、実行（build・HTTP・console / pageerror）、動作（computed style）まで検証した。全 props 組合せ、他ブラウザ、全キーボード操作の網羅検証は含まない。
