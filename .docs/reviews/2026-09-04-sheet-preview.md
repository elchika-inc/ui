verified_impl_sha: 167156318ecdf24302201975a5e1c4a8cd6eaf6e

# Sheet preview 実ブラウザ検証

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npx astro preview --host 127.0.0.1 --port 4399` で配信した。
- Playwright MCP で light / dark の隔離 preview を 1200 × 862 CSS px で開き、navigation 前から console error と pageerror を記録した。
- 初期 modal 状態を撮影した後、Escape で閉じて非モーダル trigger を操作し、content / overlay / accessible name / hit-test を実測した。
- light の初回 browser context では component と無関係な `/favicon.ico` の 404 が 1 件発生した。同じ build と preview server のまま再試行すると console error 0 件・pageerror 0 件となり、下表は再試行時の実測値を記録する。

## 実測結果

| theme / route | console error / pageerror | 初期 modal | 非モーダル | 背景 trigger の `elementFromPoint` |
| --- | ---: | --- | --- | --- |
| light / `/preview/sheet/` | 0 / 0 | content 1、overlay 1、右上 close の `.sr-only` は `閉じる` | content 1、overlay 0、右上 close の `.sr-only` は `詳細ペインを閉じる` | trigger 内かつ左 Sheet 外の `(544, 90)` で `BUTTON[data-slot="sheet-trigger"]`（`設定を開く`）自身を返した |
| dark / `/preview/sheet-dark/` | 0 / 0 | content 1、overlay 1、右上 close の `.sr-only` は `閉じる` | content 1、overlay 0、右上 close の `.sr-only` は `詳細ペインを閉じる` | trigger 内かつ左 Sheet 外の `(544, 90)` で `BUTTON[data-slot="sheet-trigger"]`（`設定を開く`）自身を返した |

Sheet の trigger は `left=24`、`top=74`、`width=528`、`height=32` だった。非モーダル Sheet 自体が trigger 左部と重なるため、Backdrop による遮蔽の有無を切り分けられる trigger 右端から 8 px 内側を hit-test 点にした。

## 証跡画像

- light: `2026-09-04-sheet-preview-light.jpg` — 1200 × 862 px / JPEG（magic bytes `FF D8 FF`）/ 初期 modal 表示
- dark: `2026-09-04-sheet-preview-dark.jpg` — 1200 × 862 px / JPEG（magic bytes `FF D8 FF`）/ 初期 modal 表示

## 判定

- 既定の modal Sheet は両 theme で content と overlay を各 1 件描画し、既定の accessible name は `閉じる` だった。
- Root と Content の両方へ `modal={false}` を渡した Sheet は overlay を描画せず、指定した `closeLabel` を accessible name に使った。
- 非モーダル表示中も overlay が背景 trigger を遮らないことを、`document.elementFromPoint` の返却要素で確認した。
