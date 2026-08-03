verified_impl_sha: d67c59d4b96e7c8b01a5d7d278707d906daf39d5

# progress ブランドトークン実ブラウザ証跡

- 検証日: 2026-08-03
- 環境: macOS / Chrome headless / viewport 1280×900 / devicePixelRatio 1
- 対象: 固定実装SHAからbuildしたisolated preview
- selector: `[data-slot="progress-preview"]`

## 実測結果

| Theme | Route | Theme同期 | target background / color | Keyboard | Console / HTTP / network failure | 横overflow | JPEG |
|---|---|---|---|---|---|---|---|
| dark | `/preview/progress-dark/` | class / data-theme / color-scheme一致 | `rgba(0, 0, 0, 0)` / `rgb(246, 246, 247)` | `BODY`、focus-visible=false、indicator=false | 0 / 0 / 0 | なし | `2026-08-03-progress-preview-dark.jpg` (1280×900, 19332 bytes) |
| light | `/preview/progress/` | class / data-theme / color-scheme一致 | `rgba(0, 0, 0, 0)` / `rgb(26, 28, 33)` | `BODY`、focus-visible=false、indicator=false | 0 / 0 / 0 | なし | `2026-08-03-progress-preview-light.jpg` (1280×900, 19057 bytes) |

## 判定

- light / darkの両routeで対象selectorが可視であり、html class・data-theme・color-schemeが同期した。
- console error、runtime exception、HTTP error、network failureは観測範囲で0件、horizontal overflowもなかった。
- 画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg`拡張子とJPEG実体を対応させた。

## 見た範囲 / 見ていない範囲

- 見た範囲: isolated light/dark、hydration後DOM、computed background/color、到達可能なpointer setup、Tab後focus、theme同期、console/runtime/network、overflow、JPEG実体。
- 見ていない範囲: viewport 1280×900以外、previewから到達できない公開state、assistive technology固有の読み上げ。
