# Select preview 実ブラウザ検証

- 実装 commit: `d27504d03214707f523ea800a11b3fe417d87866`
- 検証 URL: `http://127.0.0.1:4335/preview/select/`、`http://127.0.0.1:4335/preview/select-dark/`、`http://127.0.0.1:4335/catalog/`、`http://127.0.0.1:4335/catalog-dark/`
- 実行環境: 固定実装 commit の `npm run build` 後に `astro preview` を明示 port 4335 で起動し、Chrome で検証した。

## Base UI 既定値と実効契約

- preview は `modal` を指定せず、配布 component が素通しする Base UI `Select.Root` の既定値 `modal: true` を検証した。
- 名称から dialog 相当の挙動を推測せず実測した。実効契約は、open 中に `body` を `overflow: hidden` にし、透明な InternalBackdrop で背景 pointer を遮蔽する一方、背景要素自身には `inert` / `aria-hidden` を付けず、keyboard focus は trap しない listbox だった。

## light

- hydration 後は前後 sentinel 各1件、Portal content 1件、`role="listbox"` 1件だった。trigger は `role="combobox"`、`aria-expanded="true"`、`aria-controls` を持つ。content は Astro island の外にある `body` 直下 Portal `div` 内で、外側 Popup の `role="presentation"`、`aria-modal=null`、矩形は 177.5 × 128px、背景は `oklch(1 0 0)`、文字色は `oklch(0.145 0 0)` だった。
- 初期 focus は選択中の `Relaxed（ゆったり）` item。open 中の `body` は `style="overflow: hidden;"` だった。背景対象の `body`、`section[data-slot="select-preview"]`、`body` 直下の `STYLE`、`SCRIPT` 2件、`ASTRO-ISLAND`、Portal `DIV` は全て `inert` 属性なし、`aria-hidden=null`、computed `pointer-events: auto` だった。これらの背景要素より前面には `data-base-ui-inert=""` / `role="presentation"` の透明な InternalBackdrop が1件あり、computed は `position: fixed`、`inset: 0px`、`pointer-events: auto`、`background-color: rgba(0, 0, 0, 0)`、rect は `(0, 0, 1512, 828)` だった。`clip-path` は trigger rect `(24, 106, 177.648 × 32)` だけを切り抜いていた。after sentinel rect `(24, 182, 528 × 38)` の中央 `(288, 201)` で `document.elementFromPoint` は InternalBackdrop を返した。同座標への実 click は after sentinel に到達せず、Select を閉じて focus を trigger へ戻した。focus guard は0件で、keyboard focus trap はなかった。
- 実キー `c` の typeahead で highlight が `Relaxed（ゆったり）` から `Compact（コンパクト）` へ移り、確定前の output は `選択値: Relaxed（ゆったり）` のままだった。この移動時に scroll up / down button が各1件 DOM に現れ、wrapper の両 scroll slot を実体で確認した。
- `Compact（コンパクト）` で Enter を押すと close し、trigger と output は `Compact（コンパクト）` へ更新され、focus は trigger へ戻った。再open 後の ArrowDown は `Relaxed（ゆったり）` へ highlight を移し、確定前の output は `Compact（コンパクト）` のままだった。
- End は disabled の `Automatic（自動・準備中）` を highlight したが、Enter 後も `aria-selected="false"`、popup open、output `選択値: Compact（コンパクト）` のままで、disabled item は選択されなかった。
- disabled item から Tab を押すと `aria-expanded="false"`、`body` の scroll lock 解除、focus は after sentinel へ移った。close 後も content は DOM に1件残ったが、`data-closed=true`、矩形 0 × 0px、focus 非残留だった。after sentinel から Shift+Tab は trigger、閉じた trigger から Tab は after sentinel へ移り、残置 content へ再侵入しなかった。
- trigger 再open 後の Escape は close し、focus を trigger へ戻し、選択値を維持した。light の console error は0件だった。

## dark

- `html.dark=true`。hydration 後は前後 sentinel 各1件、Portal content 1件、listbox 1件で、trigger / Portal / ARIA は light と同じだった。content 矩形は 177.5 × 128px、背景は `oklch(0.205 0 0)`、文字色は `oklch(0.985 0 0)` だった。
- open 中の `body` は `overflow: hidden` で、light と同じ背景対象は全て `inert` 属性なし、`aria-hidden=null`、computed `pointer-events: auto` だった。その前面の透明な InternalBackdrop は1件で、`data-base-ui-inert=""` / `role="presentation"`、computed `position: fixed` / `inset: 0px` / `pointer-events: auto` / `background-color: rgba(0, 0, 0, 0)`、rect `(0, 0, 1512, 828)`、trigger cutout の `clip-path` も light と同値だった。after sentinel 中央 `(288, 201)` の `document.elementFromPoint` は InternalBackdrop を返し、同座標への実 click は after sentinel に到達せず、Select を閉じて focus を trigger へ戻した。focus guard は0件、初期 focus は選択中 itemで、keyboard focus trap はなかった。
- 実キー `c` は `Compact（コンパクト）` を highlight し、scroll up / down button は各1件になった。Enter で close、trigger focus return、trigger / output の値更新を確認した。再open 後の ArrowDown は `Relaxed（ゆったり）` へ移動した。
- End で highlight した disabled item に Enter を押しても `aria-selected="false"`、popup open、選択値不変だった。続く Tab は after sentinel へ移って close した。残置 content は `data-closed=true`、矩形 0 × 0pxで、Shift+Tab は trigger、閉じた trigger から Tab は after sentinel へ戻り、再侵入しなかった。
- trigger 再open 後の Escape は close し、focus を trigger へ戻し、選択値を維持した。dark の console error は0件だった。

## catalog

- light / dark とも Select preview は1件、hydrated island あり、before / after sentinel 各0件、Portal content 0件、listbox 0件、trigger `aria-expanded="false"` だった。
- catalog light / dark の console error は0件だった。

## 画像

- `.docs/reviews/select-preview-light.jpg` と `.docs/reviews/select-preview-dark.jpg` は open Select を Chrome DevTools Protocol の `Page.captureScreenshot`（`format: jpeg`）で取得し、返却された base64 を byte 列へ復号して保存した JFIF JPEG であり、取得方法と拡張子 `.jpg` は一致する。
- 両画像は device scale 2 の 3024 × 1656px（CSS viewport は 1512 × 828px）、baseline、8-bit、3 components で、magic bytes は `FF D8 FF E0 00 10 4A 46 49 46 00 01` だった。

## 見た範囲 / 見ていない範囲

- 見た範囲は isolated light / dark の defaultOpen、Portal / ARIA、semantic token、scroll lock、背景属性、InternalBackdrop の属性・rect・pointer-events・trigger cutout・`elementFromPoint`・背景座標の実 click、focus、typeahead、ArrowDown、disabled、Enter、Tab、Escape、close 後の残置 DOM と Tab 順、および catalog light / dark の閉状態である。
- touch 操作、mobile viewport、multiple select、form submit、readOnly / required / invalid、scroll button の hover 連続スクロール速度は見ていない。
