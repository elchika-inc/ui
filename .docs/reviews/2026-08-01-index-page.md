# トップページ実ブラウザ再検証

検証した commit: `dabfe38678db2ddd9f2f9ebbae78cd3c26835f5b`

## 検証条件

- 配信: `npx serve dist -l 3193`
- ブラウザ: Google Chrome 150.0.7871.187、1280 × 900
- 対象 route: `/` の light と、`html.dark` を付与した forced-dark
- 詳細な再現手順と生データ: `../verifications/catalog-index-r2/report.md`

## 実測結果

| theme | screenshot | scan 由来preview | 構造 | link検証 | console / network | focus | layout / token |
|---|---|---|---|---|---|---|---|
| light | `2026-08-01-index-page-light.png` | `badge`、`button`、`dialog`、`input`、`sonner`、`tabs` | main 1、navigation 2、h1 1、h2 2、h3 6、link 14 | 14件すべてHTTP 200、HTML本文あり、error bodyなし | console error 0、例外0、loading failure 0、4xx / 5xx 0 | Tabで14リンクへ順に到達、`:focus-visible=true`、3px ring | 横overflowなし、背景`oklch(1 0 0)`、前景`oklch(0.145 0 0)` |
| forced-dark | `2026-08-01-index-page-dark.png` | lightと一致 | lightと同じ構造、`html.dark` | 14件すべてHTTP 200、HTML本文あり、error bodyなし | console error 0、例外0、loading failure 0、4xx / 5xx 0 | lightと同じ14リンクへ到達 | 横overflowなし、背景/前景tokenの反転を確認 |

「横断カタログ」navigationにはcatalogのlight/darkリンクが2件、「隔離プレビュー」navigationにはscan由来6 previewのlight/darkリンクが12件存在した。DOMとAccessibility treeの両方でnavigation 2件、link 14件を確認した。

初回のerror-body検出は通常のAstroランタイム文字列`astro:hydration-error`を誤検知したため、script/styleを除いた可視本文とtitleを検査するよう検証器を修正し、全リンクを再実行して合格した。実装側の不具合ではない。

## 見た項目と見なかった項目

- 見た: preview scan名、catalog/個別routeリンク、見出しとnavigation、Accessibility tree、全リンクHTTP/body、console、network、focus、横overflow、light/dark token、スクリーンショット
- 見なかった: manifest例外分岐、1280 × 900以外のviewport、Chrome以外のブラウザ、各リンク先の詳細interaction
