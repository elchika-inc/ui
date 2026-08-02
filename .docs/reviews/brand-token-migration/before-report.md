# ブランドトークン移行前 baseline

verified_impl_sha: 2aa3a121226dc33aaafafe5464d6978d9337958f

## 検証条件

- 検証 URL:
  - `http://127.0.0.1:4313/preview/select-dark/`
  - `http://127.0.0.1:4313/preview/input-dark/`
  - `http://127.0.0.1:4313/catalog/`
  - `http://127.0.0.1:4313/catalog-dark/`
- viewport: 1512 × 828 CSS px
- catalog screenshot: light / dark とも `scrollX = 0`、`scrollY = 0`
- console error / warning: 4 URL ともなし

## computed style

### Select trigger

- route: `/preview/select-dark/`
- state: `aria-expanded="true"`、選択値 `Relaxed（ゆったり）`
- `background-color`: `oklch(1 0 0 / 0.15)`
- `color`: `oklch(0.985 0 0)`
- border: `1px solid oklch(1 0 0 / 0.15)`
- placeholder state: 選択済みであり placeholder ではない

### Input

- route: `/preview/input-dark/`
- active `background-color`: `oklab(1 0 0 / 0.045)`
- disabled `background-color`: `oklab(1 0 0 / 0.12)`
- active `color`: `oklch(0.985 0 0)`
- active border: `1px solid oklch(1 0 0 / 0.15)`
- placeholder state: active / disabled / error の3件とも値が入り、placeholder 属性なし

### Textarea / NativeSelect

- route: `/catalog-dark/`
- active Textarea `background-color`: `oklab(1 0 0 / 0.045)`
- active NativeSelect `background-color`: `oklab(1 0 0 / 0.045)`
- disabled Textarea / NativeSelect `background-color`: `oklab(1 0 0 / 0.12)`
- active border: `1px solid oklch(1 0 0 / 0.15)`
- placeholder state: 検査した active / disabled control に placeholder 属性なし

## 移行前の差

dark Select trigger は intrinsic alpha 15% の `--input` をそのまま背景に使う。Input、Textarea、NativeSelect の active state は同じ token に utility `/30` を掛け、computed alpha が 4.5% になる。Select は他 form control より背景が濃いことを実ブラウザで確認した。

## 画像

- `before-select-dark.jpg`
- `before-input-dark.jpg`
- `before-catalog-light.jpg`
- `before-catalog-dark.jpg`

画像は Chrome DevTools Protocol `Page.captureScreenshot` の `format: jpeg` で取得し、拡張子 `.jpg` と JPEG 実体を一致させた。
