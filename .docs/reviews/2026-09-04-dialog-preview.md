verified_impl_sha: 167156318ecdf24302201975a5e1c4a8cd6eaf6e

# Dialog preview 実ブラウザ検証

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npx astro preview --host 127.0.0.1 --port 4399` で配信した。
- Playwright MCP で light / dark の隔離 preview を 1200 × 862 CSS px で開き、navigation 前から console error と pageerror を記録した。
- 初期 modal 状態を撮影した後、Escape で閉じて非モーダル trigger を操作し、content / overlay / accessible name / footer 表示文言 / hit-test を実測した。

## 実測結果

| theme / route | console error / pageerror | 初期 modal | 非モーダル | 背景 trigger の `elementFromPoint` |
| --- | ---: | --- | --- | --- |
| light / `/preview/dialog/` | 0 / 0 | content 1、overlay 1、右上 close の `.sr-only` は `閉じる`、footer close は `閉じる` | content 1、overlay 0、右上 close の `.sr-only` は `補足を閉じる`、footer close は `補足を閉じる` | trigger 中央 `(90.79296875, 40)` で `BUTTON[data-slot="dialog-trigger"]`（`ダイアログを開く`）自身を返した |
| dark / `/preview/dialog-dark/` | 0 / 0 | content 1、overlay 1、右上 close の `.sr-only` は `閉じる`、footer close は `閉じる` | content 1、overlay 0、右上 close の `.sr-only` は `補足を閉じる`、footer close は `補足を閉じる` | trigger 中央 `(90.79296875, 40)` で `BUTTON[data-slot="dialog-trigger"]`（`ダイアログを開く`）自身を返した |

## 証跡画像

- light: `2026-09-04-dialog-preview-light.jpg` — 1200 × 862 px / JPEG（magic bytes `FF D8 FF`）/ 初期 modal 表示
- dark: `2026-09-04-dialog-preview-dark.jpg` — 1200 × 862 px / JPEG（magic bytes `FF D8 FF`）/ 初期 modal 表示

## 判定

- 既定の modal Dialog は両 theme で content と overlay を各 1 件描画し、右上と footer の既定ラベルは `閉じる` だった。
- Root と Content の両方へ `modal={false}` を渡した Dialog は overlay を描画せず、右上と footer の両方で指定した `closeLabel` を使った。
- 非モーダル表示中も背景 trigger が `document.elementFromPoint` の返却要素となり、overlay に遮られていないことを確認した。
