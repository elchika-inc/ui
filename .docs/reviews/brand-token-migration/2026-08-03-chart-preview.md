verified_impl_sha: f022b7ceca51604d09cefe052981240cd4d37dd3

# Chart ブランドトークン実ブラウザ証跡

- 検証日時: 2026-08-03T09:59:16+0900
- 環境: macOS 26.3.1 / Node.js v26.4.0 / Chrome 150.0.7871.187
- viewport: 1512×982 CSS px / devicePixelRatio 2
- 対象: 固定HEADからbuildしたisolated preview

## 実測結果

| Theme | Route | 3秒後の5系列 dash | Theme同期 | Console / exception / loading failure | 横overflow | JPEG |
|---|---|---|---|---|---|---|
| light | `/preview/chart?mode=isolated` | `none` / `6px 3px` / `2px 3px` / `10px 4px 2px 4px` / `1px 4px` | `data-theme=light` / `color-scheme=light` | 0 / 0 / 0 | なし | `2026-08-03-chart-preview-light.jpg` |
| dark | `/preview/chart-dark?mode=isolated` | `none` / `6px 3px` / `2px 3px` / `10px 4px 2px 4px` / `1px 4px` | `.dark` / `data-theme=dark` / `color-scheme=dark` | 0 / 0 / 0 | なし | `2026-08-03-chart-preview-dark.jpg` |

fresh load直後と3秒後の両方で5 patternを維持した。dash schemaを使う5系列はReact fiber上でも `isAnimationActive: false` であり、Rechartsのpath-length dashに上書きされない。dash propなしの一般 `ChartLine` がRecharts既定animationを維持する経路はsource contractで確認したが、現previewからは未到達である。

## JPEG証跡

- light: JPEG JFIF、magic `ffd8ffe0`、3024×1964 px、186132 bytes、SHA-256 `038e5558310303a6cda2b5d4045a6795892c3831c399e53cf35fe078e8523401`
- dark: JPEG JFIF、magic `ffd8ffe0`、3024×1964 px、179841 bytes、SHA-256 `f69b58ecb4c763dbb89d08dc6e15c128507831171fe0df1d3d4eb6d164072e6b`
- 画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg` 拡張子とJPEG実体の一致を `file` / magic bytes / `sips` で確認した。

## 見た範囲 / 見ていない範囲

- 見た範囲: light/dark、5系列、5 dash pattern、theme同期、console、runtime exception、network loading failure、HTTP error、horizontal overflow、JPEG実体と目視。
- 見ていない範囲: 1512×982以外のviewport、tooltip/hover/keyboard、dash propなしの一般 `ChartLine` のbrowser animation。
- lightでブラウザ自動要求 `/favicon.ico` の404を1件観測した。正本の明示例外に従い、component実行経路外として分離した。他URLの失敗は除外していない。
