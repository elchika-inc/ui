verified_impl_sha: d67c59d4b96e7c8b01a5d7d278707d906daf39d5

# separator ブランドトークン実ブラウザ証跡

- 検証日: 2026-08-03
- 環境: macOS / Chrome headless / viewport 1280×900 / devicePixelRatio 1
- 対象: 固定実装SHAからbuildしたisolated preview
- selector: `[data-slot="separator"]`

## 実測結果

| Theme | Route | Theme同期 | target background / color | Keyboard | Console / HTTP / network failure | 横overflow | JPEG |
|---|---|---|---|---|---|---|---|
| dark | `/preview/separator-dark/` | class / data-theme / color-scheme一致 | `rgb(56, 61, 72)` / `rgb(246, 246, 247)` | `BODY`、focus-visible=false、indicator=false | 0 / 0 / 0 | なし | `2026-08-03-separator-preview-dark.jpg` (1280×900, 13597 bytes) |
| light | `/preview/separator/` | class / data-theme / color-scheme一致 | `rgb(222, 224, 227)` / `rgb(26, 28, 33)` | `BODY`、focus-visible=false、indicator=false | 0 / 0 / 0 | なし | `2026-08-03-separator-preview-light.jpg` (1280×900, 13421 bytes) |

## 判定

- light / darkの両routeで対象selectorが可視であり、html class・data-theme・color-schemeが同期した。
- console error、runtime exception、HTTP error、network failureは観測範囲で0件、horizontal overflowもなかった。
- 画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg`拡張子とJPEG実体を対応させた。

## 見た範囲 / 見ていない範囲

- 見た範囲: isolated light/dark、hydration後DOM、computed background/color、到達可能なpointer setup、Tab後focus、theme同期、console/runtime/network、overflow、JPEG実体。
- 見ていない範囲: viewport 1280×900以外、previewから到達できない公開state、assistive technology固有の読み上げ。
