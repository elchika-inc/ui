# Popover preview r2 実ブラウザ検証

- 実装 commit: `237b4e65749cdbc968e67f5656139fd2ffd67ecc`
- 検証 URL: `http://localhost:4332/preview/popover/`、`http://localhost:4332/preview/popover-dark/`、`/catalog/`、`/catalog-dark/`
- 実行環境: fresh build 後の Astro preview（port 4332）、Chrome

## light

- hydrated 後の content は1件、前後 sentinel は各1件。content は `body` 配下の Portal にあり、`role="dialog"`、`aria-labelledby`、`aria-describedby`、trigger `aria-expanded="true"` を持つ。
- `modal={false}` の実値は preview/background と body の `inert` / `aria-hidden` がいずれも未設定、overlay 0件、外側 pointer target は preview 本体だった。
- focus guard は6件あるが focus trap は無効だった。初期 focus は「通知を管理」。Escape は content 0件・triggerへの focus return・`aria-expanded="false"`、trigger click は再open、controlから Tab は次の sentinelへ移って閉じた。外側 click は content 0件・`aria-expanded="false"`・外側要素に focus だった。
- console error は0件だった。

## dark

- `html.dark=true` で、content1件、前後 sentinel各1件、Portal/`role="dialog"`/`aria-labelledby`/`aria-describedby`/`aria-expanded="true"` を確認した。
- review指摘後、固定実装SHAから fresh build し、`http://localhost:4334/preview/popover-dark/` で再実測した。属性対象は `body`、`section[data-slot="popover-preview"]`、および `body` 直下の `STYLE` 1件・`SCRIPT` 2件・`ASTRO-ISLAND` 1件・Portalの `DIV` 1件で、全て `inert` 属性なし（`hasAttribute=false` / 実値 `null`）かつ `aria-hidden=null` だった。
- overlay 0件、focus guard 6件、初期 focus は「通知を管理」、初期 `aria-expanded="true"`。Escape 後は content 0件・`aria-expanded="false"`・trigger「設定を開く」へfocus returnした。trigger clickで content 1件・`aria-expanded="true"`・control focusへ再openした。
- control「通知を管理」から Tab 後は content 0件・`aria-expanded="false"`・`data-sentinel="after"` の「次の操作要素」へfocus移動した。再度trigger click後は content 1件・`aria-expanded="true"`、外側の「前の操作要素」click後は content 0件・`aria-expanded="false"`・`data-sentinel="before"` へfocus移動した。
- この再実測の console error は0件だった。

## catalog

- light / dark とも Popover preview は1件、sentinel 0件、Portal content 0件、trigger `aria-expanded="false"`、console error 0件だった。

## r2画像

- `popover-preview-light-r2.jpg` と `popover-preview-dark-r2.jpg` は Chrome の screenshot `Uint8Array` を保存した JFIF JPEG のため、取得方法と拡張子 `.jpg` は一致する。
- 両画像は 1512 × 828、baseline、8-bit、3 components だった。旧 JPEG は履歴として残している。
