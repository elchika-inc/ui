# Popover preview 実ブラウザ検証

- 実装 commit: `74e0f662780f70bb25f936f7d718f7271db2433f`
- 検証 URL: `http://localhost:4332/preview/popover/`、`/preview/popover-dark/`
- 実行環境: fresh build 後の Astro preview、Chrome

## light / dark 共通

- hydrated 後の `[data-slot="popover-content"]` は各 1 件、前後 sentinel は各 1 件だった。
- content は Portal 下にあり、`role="dialog"`、`aria-labelledby` と `aria-describedby` を持つ。trigger の `aria-expanded` は初期表示で `true`。
- `modal={false}` のため、preview/background と body の `inert` / `aria-hidden` はいずれも未設定、overlay は 0 件、外側の pointer target は preview 本体だった。
- Base UI の focus guard 要素は 6 件あるが focus trap は無効である。Escape で content は 0 件になり trigger へ focus が戻る。再 open でき、content 内の「通知を管理」から Tab を押すと次の sentinel へ移り content は閉じる。
- 外側の「前の操作要素」を click すると content は 0 件、trigger は `aria-expanded="false"`、focus は外側要素になった。
- console error は light / dark / catalog light / catalog dark の全てで 0 件だった。

## catalog

- light / dark とも Popover preview は 1 件、sentinel 0 件、Portal content 0 件、trigger `aria-expanded="false"` だった。

## 画像

- `popover-preview-light.jpg`: JFIF JPEG、1512 × 828、baseline、8-bit、3 components。
- `popover-preview-dark.jpg`: JFIF JPEG、1512 × 828、baseline、8-bit、3 components。
