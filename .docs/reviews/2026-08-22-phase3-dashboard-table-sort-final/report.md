# 動作検証レポート: dashboard-table Target sort 最終版

verified_impl_sha: 0f2350d0c643fa5f7dfebe91961175bb4360dcf0

## 総合判定

✅ PASS

Target comparator 修正後の dashboard-table を light、dark、catalog で実描画し、数値昇順・降順、drawer/chart、selection、DnD 非搭載、統合表示、エラー監査を確認した。

preview が使用する12行の Target はすべて異なるため、同値 Target の ID tie-break はブラウザ未到達である。この境界は隠さず、数値・非数値を含む4行の全24 permutation fixture を実行して、昇順 ID `[1,2,3,4]`、降順 ID `[4,3,2,1]` へ収束することを別証跡として確認した。

## 実行環境

- 検証日時: 2026-08-22 JST
- 対象 URL:
  - `http://127.0.0.1:4322/preview/dashboard-table/`
  - `http://127.0.0.1:4322/preview/dashboard-table-dark/`
  - `http://127.0.0.1:4322/catalog/`
- 起動コマンド: `npm run dev -- --host 127.0.0.1 --port 4321`
- 実際の割当: port 4322、PID 72115
- port 4321 は無関係な PID 11102 が使用していたため停止対象外
- OS: Darwin 25.3.0 arm64
- Node.js: v26.7.0
- npm: 11.19.0
- Browser: Chrome 151.0.0.0
- isolated viewport: 1536×1000
- catalog viewport: 1920×1000
- 実行可否: ✅実行した
- 件数は今回の観測値であり、将来の固定成功条件ではない

## Workspace drift の扱い

- 検証開始時 HEAD は上記固定 commit と一致した。
- cleanup 時点で、他エージェントの作業により HEAD は `bb68c2cf27b8105bc2c14f84d4e795570d8c6449` へ進んでいた。
- 差分は registry 検査 scripts と plan のみだった。
- dashboard-table runtime、preview route、catalog、package manifest、対象 unit fixture の内容差分は0だった。
- 対象 server が配信した dashboard-table 実装の同一性が保たれているため、固定 commit の evidence として有効と判定した。
- 開始 HEAD、cleanup HEAD、対象 scope の diff 結果は `evidence/case04-browser-results.json` と `evidence/case07-server-cleanup.log` に記録した。

## 成功基準

- light/dark の table が正寸法かつ可視である。
- Target sort が数値昇順・降順へ実際に行順を変更する。
- 同値 Target が画面データに存在すれば ID tie-break をブラウザ実測する。存在しなければ未到達を明記し、全24 permutation fixture との境界を記録する。
- accessible name 付き Document button から drawer を開ける。
- light/dark の chart container、SVG、polyline が正寸法で、strokeと5点が可視である。
- 1行選択時に header checkbox が mixed/indeterminate となり、選択件数が同期する。
- DnD dependency、handler、affordance、`draggable=true` がなく、pointer/keyboard 操作後も行順が不変である。
- catalog の dashboard-table item が正寸法かつ前面で可視である。
- duplicate DOM id、console error、page exception、HTTP 4xx/5xx、request failure が0である。
- event buffer が切り捨てられていない。
- screenshot が JPEG magic と目視確認を通る。
- 対象 server を停止し、実割当 port に LISTEN が残らない。

## テストケースと結果

| # | 動作パターン | 導出元 | リスク | 判定 | 再現率 | Evidence | 再現手順 |
|---|---|---|---|---|---|---|---|
| 1 | 固定実装と workspace drift の境界 | コード・環境 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json`, `evidence/case07-server-cleanup.log` | 開始時 HEAD を固定し、終了時 HEAD との差分を対象 runtime/fixture scope で検査 |
| 2 | light table の正寸法・可視性 | 画面 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-light.jpg`, `evidence/case04-browser-results.json` | light URL を開き、table rect、表示行、accessible name を採取 |
| 3 | dark table の正寸法・可視性 | 画面 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-dark.jpg`, `evidence/case04-browser-results.json` | dark URL を開き、table rectと表示行を採取 |
| 4 | Target 数値昇順・降順 | コード・画面 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | `Target で並べ替える` を2回操作し、各行のTarget値とIDを採取 |
| 5 | 同値 Target のID tie-break | コード・fixture | High | ✅fixture実測、ブラウザ未到達 | 1/1 | `evidence/case05-target-order-unit.log` | preview 12行の同値有無を確認後、`node --test scripts/dashboard-blocks.test.mjs` を実行 |
| 6 | accessible name 付き Document button からdrawerを開く | 画面 | High | ✅実測確認 | 2/2 | light/dark JPEG、`evidence/case04-browser-results.json` | `"<Document名> の詳細を開く"` をlight/darkでクリック |
| 7 | light chart の寸法・stroke・5点 | コード・画面 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-light.jpg`, `evidence/case04-browser-results.json` | drawer内 chart/SVG/polyline/circle のrectとcomputed styleを採取 |
| 8 | dark chart の寸法・stroke・5点 | コード・画面 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-dark.jpg`, `evidence/case04-browser-results.json` | dark drawerで同じgeometryとstyleを採取 |
| 9 | 1行選択とmixed/indeterminate・件数同期 | コード・画面 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | 先頭行checkboxを選択し、header属性と件数表示を比較 |
| 10 | DnD静的不在 | コード・DOM | High | ✅実測確認 | 1/1 | `evidence/case06-dnd-static-scan.log`, `evidence/case04-browser-results.json` | source/packageの語彙走査とDOM属性・cursorを検査 |
| 11 | pointer drag後の行順不変 | 画面 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | 先頭行から次行へpointer dragし、前後ID配列を比較 |
| 12 | keyboard reorder操作後の行順不変 | 画面 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | row checkboxにfocusし、`Ctrl+ArrowDown/Up` 後のID配列を比較 |
| 13 | catalog integration | 画面 | High | ✅実測確認 | 1/1 | `evidence/case03-catalog-dashboard-table-visible.jpg`, `evidence/case04-browser-results.json` | Settingsを閉じ、遮蔽sidebar所属triggerを通常操作後、カード3点を`elementFromPoint`で検査 |
| 14 | duplicate ID、console/page/network error、buffer truncation | 画面 | High | ✅実測確認 | 3/3 | `evidence/case04-browser-results.json` | light/dark/catalogでCDP eventを連続回収し、DOM IDと`dev.logs`も検査 |

## 主な実測値

- light/dark table: 1232×585.5、表示12行
- Target ascending:
  - 値: `2, 7, 9, 10, 12, 18, 19, 20, 25, 27, 29, 30`
  - ID: `[5,9,11,3,12,1,7,6,8,4,2,10]`
- Target descending:
  - 値: `30, 29, 27, 25, 20, 19, 18, 12, 10, 9, 7, 2`
  - ID: `[10,2,4,8,6,7,1,12,3,11,9,5]`
- descending ID列はascending ID列の完全な逆順
- 画面12行の同値 Target: 0組
- fixture:
  - 数値 `"10"` 2行、非数値 `"N/A"` 2行
  - 4行の全24 permutation
  - ascending ID: `[1,2,3,4]`
  - descending ID: `[4,3,2,1]`
- unit suite: tests 18、pass 18、fail 0、exit 0
- selection: `aria-checked="mixed"`、indeterminateあり、`12 件を表示・1 件を選択`
- DnD DOM: draggable 0、sortable属性 0、drag handle 0、grab cursor 0
- light chart:
  - container/SVG: 1504×192
  - polyline: 約326.4×8.3
  - stroke: `rgb(47, 95, 209)`、4px
  - 正寸法の点: 5
- dark chart:
  - container/SVG: 1504×192
  - polyline: 約326.4×88.6
  - stroke: `rgb(110, 147, 240)`、4px
  - 正寸法の点: 5
- catalog:
  - item: 約410.7×467
  - 内部 table: 約374.7×585.5
  - 左・中央・右の代表3点すべて前面
- response観測: light 137、dark 137、catalog 424
- HTTP 4xx/5xx 0
- request failure 0
- page exception 0
- console/log error 0
- light/dark/catalog の `truncated`: すべて false

これらの件数は今回の観測値であり、固定成功条件ではない。

## 三方向導出のクロスチェック

- コード:
  - 数値 Target 同士は数値比較し、同値ならID差を返す。
  - 数値と非数値では数値を先に配置する。
  - 非数値同士は文字列比較し、同値ならID差を返す。
- 画面:
  - preview は `dashboardData.slice(0, 12)` の12行を表示する。
  - 表示12行のTargetはすべて異なり、数値昇降順は到達可能、同値tie-breakは到達不能。
- fixture:
  - 数値同値2行と非数値同値2行を全24 permutationで検証する。
- コードにあるが画面から到達できない分岐:
  - 数値 Target 同値時のID tie-break。
  - 非数値 Target 同値時のID tie-break。
- 画面から入力できるがコードで検証していない値:
  - tableにTarget編集UIはなく該当なし。
- スキーマにあるがコードで扱っていないパラメータ:
  - 今回の対象範囲では検出なし。

## 未到達分岐

- 同値 Target のID tie-breakは固定previewデータに該当行がなくブラウザ未到達。
- 全68行のsource dataには同値Targetが存在するが、previewは先頭12行のみを渡すため画面には現れない。
- browser passとfixture passを混同せず、別証跡として記録した。

## 発見した不具合

- 製品不具合なし。
- 検証中、HTTP(S)接続前のCDP取得とcatalogのglobal index selectorが検証経路上で失敗した。実装変更は行わず、実URL接続後のCDP監査と、遮蔽要素所属triggerの座標クリックへ切り替えた。最終採用結果はevent truncationなしの再実行結果である。

## 未検証の残

- 同値 Target のブラウザ描画は固定previewデータでは未到達。
- filter、pagination、Columns menu、review tabは今回のsort修正に比例した再検証対象外。
- dashboard-table以外のcatalog itemの機能正当性は対象外。
- 最終承認は保存した画像・JSON・生ログによる人間レビューに委ねる。

## クリーンアップ

- 永続データ作成なし。
- browser tab 0。
- viewport reset済み。
- Astro PID 72115: stop exit 0。
- port 4322: 停止後LISTENなし。
- port 4321 / PID 11102: 無関係のため維持。
- evidence: 新規7ファイル。
- tracked/cached diff: 0。
- 既存report/evidenceと実装ファイル: 変更なし。
