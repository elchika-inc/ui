verified_impl_sha: 41e6b9b17734a752825e14c9af97e69b76c51bc3

# alert ブランドトークン実ブラウザ証跡

- 検証日時: 2026-08-03（browser run取得: 2026-08-02T23:33:57.217Z）
- 環境: macOS / Chrome 150.0.7871.187 / viewport 1512×828 / devicePixelRatio 2
- 対象: 固定実装SHAからbuildしたisolated preview

## 実測結果

| Theme | Route | Theme同期 | pointer後 background / color | Keyboard | Console | 横overflow | JPEG |
|---|---|---|---|---|---:|---|---|
| dark | `/preview/alert-dark/` | class/data-theme一致 | `rgb(28, 31, 38)` / `rgb(246, 246, 247)` | visible focusable controlなし | 0 | なし | `alert-preview-dark.jpg` (1512×828, 72180 bytes) |
| light | `/preview/alert/` | class/data-theme一致 | `rgb(255, 255, 255)` / `rgb(26, 28, 33)` | visible focusable controlなし | 0 | なし | `alert-preview-light.jpg` (1512×828, 73408 bytes) |

## 判定

- destructive text はalphaなしで、browser算出contrastは light 6.1338:1 / dark 5.9377:1だった。
- forced theme切替は同じevaluate内で `.dark` と `data-theme` を同期し、両routeで一致を確認した。
- console error、runtime exception、request failureは観測範囲で0件、horizontal overflowもなかった。
- 画像はChrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で直接取得し、`.jpg` 拡張子とJPEG magic bytes `ffd8ff` の一致を確認した。

## 見た範囲 / 見ていない範囲

- 見た範囲: isolated light/dark、visible DOM、computed color/background/border/opacity、利用可能なpointer/keyboard state、theme同期、console、overflow、JPEG実体。
- 見ていない範囲: viewport 1512×828以外、previewから到達できない公開state、assistive technology固有の読み上げ。
