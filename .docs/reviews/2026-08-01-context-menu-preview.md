# Context Menu preview 実ブラウザ検証

- 検証済み最終実装 SHA: `8457a94f60280d0e60e288258bb569f4f0572c6f`
- 初回実装固定 SHA: `d37b6b4e95ecb59e591a390f9ea3bb00aa9063c1`
- fresh build: この SHA で `npm run build` を再実行後、空き確認済みの `127.0.0.1:4329` を `npm run preview -- --host 127.0.0.1 --port 4329` で配信した。
- 裁定事実: Context Menu は pointer 座標を anchor にするため、`defaultOpen` の位置検証は成立しない。preview は閉じた状態とし、実際の `contextmenu` event で開いた。
- setup schema: `preview-selectors.json` の `context-menu` は `{ selector: "[data-slot=\"context-menu-content\"]", setup: { action: "contextmenu", target: "[data-slot=\"context-menu-trigger\"]", position: "center" } }`。静的 checker は selector 宣言だけを検査し、setup 実行と DOM match は実ブラウザ検証の責務とする。

## 観測結果

| route / theme | 閉状態 | 実操作後の selector / 座標 | ARIA / focus / background | console |
| --- | --- | --- | --- | --- |
| `/preview/context-menu/` / light | sentinel before/after 各1、content 0 | trigger 中央 `(288, 133)` で contextmenu。content 1、rect `(283.23, 137, 166.06, 207.62)` で発火座標近傍 | content `role=menu`、Portal parent は `DIV`、初期 focus は content。body/html `inert=null`。Tab 後も focus は content に残った | error 0 |
| `/preview/context-menu-dark/` / dark | sentinel before/after 各1、content 0、`html.dark` | 同一中央操作後、content 1、rect `(281.77, 137, 164.50, 205.67)` | content `role=menu`、Portal parent は `DIV`、body `inert=null`、初期 focus は content | error 0 |
| `/catalog/` / catalog | Context Menu section の sentinel before/after 各0、content 0 | trigger は1件のみで overlay は閉じたまま | catalog section の静的描画を確認 | error 0 |

light の再 open で `ArrowDown` は「新規作成」へ移動した。表示文字列を維持したまま `label="new"` を指定し、`N` の typeahead でも同じ menuitem へ移動した。Escape は Chrome の `ESC` 入力で content 0、focus `BODY` を実測した。右クリックでは trigger が focus されず返す先がないため、閉じた content 内に focus が取り残されていない `BODY` が正しい結果である。

## dark 再 open のレビュー補完

レビュー指摘により、component 固有 path が最終実装 SHA `d37b6b4e95ecb59e591a390f9ea3bb00aa9063c1` から差分0であることを確認した。docs-only 後続 HEAD `b1bc9e693382a3e384e061f92c87fcaa63d0593d` を fresh build し、空き確認済み `127.0.0.1:4330` で dark route を再実測した。

trigger 中央 `(288, 133)` の初回 contextmenu 後に content 1を確認し、Escape の完了を hidden まで待機した結果は content 0 / focus `BODY` だった。同じ trigger で再 open 後、`ArrowDown` と `N` typeahead はともに `role=menuitem` の「新規作成」へ移動し、再度 Escape 後も content 0 / focus `BODY` だった。console error は0件である。右クリックは trigger を focus しないため、これは閉じた content に取り残されない正常な focus 終端である。

## JPEG

Browser `tab.screenshot({ fullPage: true })` の Uint8Array を変換せず保存した。light / dark とも JPEG/JFIF、`1512 × 828px`、magic bytes は `ffd8ffe0` であり、拡張子 `.jpg` と実体が一致する。

- `context-menu-preview-light.jpg`
- `context-menu-preview-dark.jpg`

見た範囲は固定 SHA のlight/dark hydration、実 contextmenu の座標 anchor、Portal、ARIA、sentinel、background inert、focus、ArrowDown、typeahead、Escape、catalog閉状態、console error、JPEG実体である。見ていない範囲は screen reader の読み上げ、RTL、高倍率、pointer以外の入力装置である。

## 最終レビューでの inset 契約再検証

Core Logicレビューで、`inset={false}`が`data-inset="false"`としてDOMへ残り、値を見ないTailwindの`data-inset:pl-7`が誤適用される欠陥を検出した。実装commit `8457a94f60280d0e60e288258bb569f4f0572c6f` で、`ContextMenuLabel`、`ContextMenuItem`、`ContextMenuSubTrigger`、`ContextMenuCheckboxItem`、`ContextMenuRadioItem`の5件を、trueのときだけ空の`data-inset`属性を出す形へ修正した。

同commitをAstro devで`127.0.0.1:4341`へ配信し、製品ファイルを変更しないruntime probeから実componentをPortal内へmountした。5 wrapper × `undefined` / `false` / `true` × light / darkの30ケースを実測し、次で一致した。

| 値 | `data-inset` | computed `padding-left` |
|---|---|---:|
| `undefined` | 属性なし | `6px` |
| `false` | 属性なし | `6px` |
| `true` | 空属性あり | `28px` |

component由来のconsole exception / warningは0件だった。browser navigationが要求した`/favicon.ico`の404はcomponent実行経路外として分離記録した。probe後はChrome pageを閉じ、`npx astro dev stop`でdaemonを停止した。終了時は当該repoのAstro process 0、4341 LISTEN 0、HTTP接続はexit 7、HEADは同commit、worktreeはcleanだった。
