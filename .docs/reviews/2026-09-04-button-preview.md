verified_impl_sha: 90deeee241ac1f7322fd22260f2559fd95a69f3e

# Button preview 実ブラウザ検証（loading state）

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npx astro preview --host 127.0.0.1 --port 4386` で配信した。`curl -sI http://127.0.0.1:4386/` は HTTP 200 を返した。
- Playwright MCP の console listener が navigation 前から有効な状態で、light / dark の隔離 preview をそれぞれ初回 navigation から観測した。
- 各 route で Button と loading Button の件数、`disabled` DOM property、子 Spinner、`data-loading`、computed `color` と `opacity` を取得した。
- console error 総数には既存の `http://127.0.0.1:4386/favicon.ico` の HTTP 404 が各初回 navigation で 1 件含まれた。既存証跡と同じ既知除外として分離し、app 由来の console error を判定した。

## 実測結果

| theme / route | console error 総数 | favicon.ico 404 除外後 | Button 件数 | `aria-busy="true"` 件数 | loading Button の `disabled` | 子 Spinner 件数 | Spinner / 親 Button の computed `color` | `<Button loading>` の computed `opacity` |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |
| light / `/preview/button/` | 1 | 0 | 11 | 2 | `保存中`: `true`、`読み込み中`: `true` | `保存中`: 1、`読み込み中`: 1 | `保存中`: `rgb(255, 255, 255)` / `rgb(255, 255, 255)`、`読み込み中`: `rgb(26, 28, 33)` / `rgb(26, 28, 33)` | `0.5` |
| dark / `/preview/button-dark/` | 1 | 0 | 11 | 2 | `保存中`: `true`、`読み込み中`: `true` | `保存中`: 1、`読み込み中`: 1 | `保存中`: `rgb(28, 31, 38)` / `rgb(28, 31, 38)`、`読み込み中`: `rgb(246, 246, 247)` / `rgb(246, 246, 247)` | `0.5` |

両 theme で 2 個の loading Button は `data-loading="true"` を持ち、それぞれ `[data-slot="spinner"][aria-hidden="true"]` を 1 個だけ children の前に描画した。Spinner と親 Button の computed `color` は全 4 組で一致し、`text-current` が親の文字色を継承している。`<Button loading>` の opacity は両 theme とも `0.5` で、既存の `disabled:opacity-50` が適用されている。

## 証跡画像

- light: `2026-09-04-button-preview-light.jpg` — 1440 × 900 px / JPEG（magic bytes `FF D8 FF`）
- dark: `2026-09-04-button-preview-dark.jpg` — 1440 × 900 px / JPEG（magic bytes `FF D8 FF`）
