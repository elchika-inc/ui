verified_impl_sha: d67c59d4b96e7c8b01a5d7d278707d906daf39d5

# slider ブランドトークン実ブラウザ証跡

- 検証日: 2026-08-03
- 環境: macOS / Chrome headless / viewport 1280×900 / devicePixelRatio 1
- 対象: 固定実装SHAからbuildしたisolated preview
- selector: `[data-slot="slider-preview"]`

## 実測結果

| Theme | Route | Theme同期 | target background / color | Keyboard | Console / HTTP / network failure | 横overflow | JPEG |
|---|---|---|---|---|---|---|---|
| dark | `/preview/slider-dark/` | class / data-theme / color-scheme一致 | `rgba(0, 0, 0, 0)` / `rgb(246, 246, 247)` | `INPUT`、focus-visible=true、indicator=true | React #418が1件 / 0 / 0 | なし | `2026-08-03-slider-preview-dark.jpg` (1280×900, 12162 bytes) |
| light | `/preview/slider/` | class / data-theme / color-scheme一致 | `rgba(0, 0, 0, 0)` / `rgb(26, 28, 33)` | `INPUT`、focus-visible=true、indicator=true | React #418が1件 / 0 / 0 | なし | `2026-08-03-slider-preview-light.jpg` (1280×900, 12139 bytes) |

## 判定

- light / darkの両routeで対象selectorが可視であり、html class・data-theme・color-schemeは同期した。
- 両routeのfresh loadでReact minified error #418（SSR出力とclient初回renderのtext hydration mismatch）を`Runtime.exceptionThrown`から1件ずつ検出した。HTTP error、network failure、horizontal overflowはなかった。
- 既存証跡SHA `cf2542b675ad78804c8af239b866b6c290e69bdb`を隔離worktreeへcheckoutし、そのcommitのlockfileで`npm ci`、site build、previewを行い、navigation前にRuntime listenerを登録してhydration後1.5秒まで観測した結果、同じ#418を再現した。したがってtoken移行前から存在したlatent defectとしてRISK-014で受容し、今回PRではsourceを変更しない。
- 旧証跡は全操作後にBrowserのerror-level console logを取得したとの記録だけで、navigation前listenerの記録がない。hydration時例外をcursorまたは取得時点の外で見逃した可能性があるため、旧証跡の「console error 0」は書き換えず、新証跡で検出漏れを訂正する。
- 画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg`拡張子とJPEG実体を対応させた。

## 見た範囲 / 見ていない範囲

- 見た範囲: isolated light/dark、hydration後DOM、computed background/color、Tab後focus、theme同期、navigation前からのconsole/runtime/network、overflow、JPEG実体、旧SHAでの再現。
- 見ていない範囲: hydration mismatchのroot causeと修正、viewport 1280×900以外、assistive technology固有の読み上げ。
