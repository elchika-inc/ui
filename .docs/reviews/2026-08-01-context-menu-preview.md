# Context Menu preview 実ブラウザ検証

- 実装固定 SHA: `d37b6b4e95ecb59e591a390f9ea3bb00aa9063c1`
- fresh build: この SHA で `npm run build` を再実行後、空き確認済みの `127.0.0.1:4329` を `npm run preview -- --host 127.0.0.1 --port 4329` で配信した。
- 裁定事実: Context Menu は pointer 座標を anchor にするため、`defaultOpen` の位置検証は成立しない。preview は閉じた状態とし、実際の `contextmenu` event で開いた。
- setup schema: `preview-selectors.json` の `context-menu` は `{ selector: "[data-slot=\"context-menu-content\"]", setup: { action: "contextmenu", target: "[data-slot=\"context-menu-trigger\"]", position: "center" } }`。静的 checker は selector 宣言だけを検査し、setup 実行と DOM match は実ブラウザ検証の責務とする。

## 観測結果

| route / theme | 閉状態 | 実操作後の selector / 座標 | ARIA / focus / background | console |
| --- | --- | --- | --- | --- |
| `/preview/context-menu/` / light | sentinel before/after 各1、content 0 | trigger 中央 `(288, 133)` で contextmenu。content 1、rect `(283.23, 137, 166.06, 207.62)` で発火座標近傍 | content `role=menu`、Portal parent は `DIV`、初期 focus は content。body/html `inert=null`。Tab 後も focus は content に残った | error 0 |
| `/preview/context-menu-dark/` / dark | sentinel before/after 各1、content 0、`html.dark` | 同一中央操作後、content 1、rect `(281.77, 137, 164.50, 205.67)` | content `role=menu`、Portal parent は `DIV`、body `inert=null`、初期 focus は content | error 0 |
| `/catalog/` / catalog | Context Menu section の sentinel before/after 各0、content 0 | trigger は1件のみで overlay は閉じたまま | catalog section の静的描画を確認 | error 0 |

light の再 open で `ArrowDown` は「新規作成」へ移動した。表示文字列を維持したまま `label="new"` を指定し、`N` の typeahead でも同じ menuitem へ移動した。Escape は Chrome の `ESC` 入力で content 0、focus `BODY` を実測したため、Context Menu では trigger へ return しない実値を記録する。

## JPEG

Browser `tab.screenshot({ fullPage: true })` の Uint8Array を変換せず保存した。light / dark とも JPEG/JFIF、`1512 × 828px`、magic bytes は `ffd8ffe0` であり、拡張子 `.jpg` と実体が一致する。

- `context-menu-preview-light.jpg`
- `context-menu-preview-dark.jpg`

見た範囲は固定 SHA のlight/dark hydration、実 contextmenu の座標 anchor、Portal、ARIA、sentinel、background inert、focus、ArrowDown、typeahead、Escape、catalog閉状態、console error、JPEG実体である。見ていない範囲は screen reader の読み上げ、RTL、高倍率、pointer以外の入力装置である。
