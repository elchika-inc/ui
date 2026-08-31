verified_impl_sha: 5648110e8f45d3b32a257d1250d1fa044ddba5e1

# Bubble preview 実ブラウザ検証（interactive hover state 追補）

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npm run preview -- --host 127.0.0.1 --port 4382` で配信した。
- Chrome で light / dark の隔離 preview を開き、`[data-slot="bubble-content"][data-preview-state="interactive-default"]` を対象にした。
- 対象要素の中央へ実ブラウザの pointer を移動し、hover 前後の `background-color` と `color` を `getComputedStyle` で取得した。
- hover 後に対象要素が `:hover` と一致することを確認し、その pointer 位置を維持したままスクリーンショットを撮影した。

## 実測結果

| theme / route | DOM | hover 前 `background-color` | hover 前 `color` | hover 後 `background-color` | hover 後 `color` | `:hover` | console error |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| light / `/preview/bubble/` | `<button type="button">` | `rgb(47, 95, 209)` | `rgb(255, 255, 255)` | `rgb(30, 58, 143)` | `rgb(255, 255, 255)` | `true` | 0 |
| dark / `/preview/bubble-dark/` | `<button type="button">` | `rgb(110, 147, 240)` | `rgb(28, 31, 38)` | `rgb(143, 172, 245)` | `rgb(28, 31, 38)` | `true` | 0 |

両 theme とも bubble-content は interactive な `<button>` として DOM に出ており、実 pointer hover によって `background-color` が変化した。

本証跡はトップレベル、`brand-token-migration/`、`2026-08-06-naming-inc-removal/`、`brands-css-distribution/`、`font-mono-layer-fix/`、`font-unify-ibm-plex/` にある既存証跡を変更・置換せず、interactive hover state の到達性だけを追補する。

## 証跡画像

- light: `2026-08-31-bubble-preview-light.jpg` — 1716 × 1233 px / JPEG（magic bytes `FF D8 FF`）/ hover 中
- dark: `2026-08-31-bubble-preview-dark.jpg` — 1716 × 1233 px / JPEG（magic bytes `FF D8 FF`）/ hover 中
