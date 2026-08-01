# Dropdown Menu 実ブラウザ検証

verified_impl_sha: 8457a94f60280d0e60e288258bb569f4f0572c6f

- 検証済み最終実装 commit: `8457a94f60280d0e60e288258bb569f4f0572c6f`

## 対象

- 初回実装 commit: `05637f546f73eba004e8ce731292a2b3360f90e3`
- 裁定 commit: `00ae542741c015bfe70f3b9d4b7c2268a3ce6a36`
- 配信 URL: `http://127.0.0.1:4326/preview/dropdown-menu/`、`http://127.0.0.1:4326/preview/dropdown-menu-dark/`
- 安定 selector: `[data-slot="dropdown-menu-content"]`
- 画像: `dropdown-menu-preview-light.jpg`、`dropdown-menu-preview-dark.jpg`（ともに JFIF JPEG）

## 裁定した非モーダル契約

Base UI Menu は Menu Button として非モーダルに動作する。したがって、background に `inert` は付与されず、focus trap もしない。これは dialog の挙動を流用しない正常契約である。開いた menu から Tab を押すと menu は閉じて after sentinel へ抜け、Shift+Tab を押すと閉じて trigger へ抜けることを確認した。

## light

- `defaultOpen` 後に sentinel は before/after とも1件、content は1件だった。
- trigger は `aria-haspopup="menu"`、`aria-expanded="true"`、矩形は `[24, 74, 96, 38]`、content は Portal 内で role `menu`、`tabindex="-1"`、矩形は `[24, 116, 171.16, 214]` となり、trigger 下端に anchor された。
- 初期 focus は menu。body 子要素の `inert` 実値はすべて `null` だった。
- Tab は content 0・`aria-expanded="false"` にして after sentinel へ移動し、再open後の Shift+Tab は content 0 にして trigger へ移動した。
- 再open後の Escape は content 0・trigger への focus return、trigger click は再openを確認した。
- ArrowDown は「新規作成」へ移動し、radio item からの `n` typeahead も「新規作成」へ移動した。
- checkbox は `aria-checked` が `true` から `false`、radio は「名前」`false`・「更新日時」`true` に変化した。表示 submenu は ArrowRight で開き、最初の「リスト」に focus した。
- console error は0件だった。

## dark

- `defaultOpen` 後に sentinel は before/after とも1件、content は1件だった。
- trigger は `aria-haspopup="menu"`、`aria-expanded="true"`、content は Portal 内の role `menu`、`tabindex="-1"`、初期 focus は menu だった。
- body 子要素の `inert` 実値はすべて `null` だった。
- Tab は after sentinel、Shift+Tab と Escape は trigger に戻り、各経路で content は0件になった。trigger click で再openした。
- ArrowDown、`n` typeahead、checkbox/radioの状態変更、ArrowRightによる submenu open（「リスト」へ focus）を確認した。
- console error は0件だった。

## catalog

`http://127.0.0.1:4326/catalog/` を hydration 後に確認した。Dropdown Menu preview は1件、before/after sentinel は各0件、Portal/content は各0件、trigger は `aria-expanded="false"` だった。console error は0件だった。

## 見た範囲

light/dark の isolated route で初期表示、Portal、ARIA、focus、キーボードとクリック操作、選択状態、submenu を確認した。catalog は閉状態のみを確認し、batch 末尾の全component横断走査は本証跡の対象外である。

## 最終レビューでの inset 契約再検証

Core Logicレビューで、`inset={false}`が`data-inset="false"`としてDOMへ残り、値を見ないTailwindの`data-inset:pl-7`が誤適用される欠陥を検出した。実装commit `8457a94f60280d0e60e288258bb569f4f0572c6f` で、`DropdownMenuLabel`、`DropdownMenuItem`、`DropdownMenuSubTrigger`、`DropdownMenuCheckboxItem`、`DropdownMenuRadioItem`の5件を、trueのときだけ空の`data-inset`属性を出す形へ修正した。

同commitをAstro devで`127.0.0.1:4341`へ配信し、製品ファイルを変更しないruntime probeから実componentをPortal内へmountした。5 wrapper × `undefined` / `false` / `true` × light / darkの30ケースを実測し、次で一致した。

| 値 | `data-inset` | computed `padding-left` |
|---|---|---:|
| `undefined` | 属性なし | `6px` |
| `false` | 属性なし | `6px` |
| `true` | 空属性あり | `28px` |

component由来のconsole exception / warningは0件だった。browser navigationが要求した`/favicon.ico`の404はcomponent実行経路外として分離記録した。probe後はChrome pageを閉じ、`npx astro dev stop`でdaemonを停止した。終了時は当該repoのAstro process 0、4341 LISTEN 0、HTTP接続はexit 7、HEADは同commit、worktreeはcleanだった。
