# 動作検証レポート: registry:block Phase 3 R3 修正後再検証

verified_impl_sha: 6441e12efe9e2ca6eaa5a456c93d4d9f0ff00e37

- 総合判定: **✅ PASS**
- 直前の不具合だった `dashboard-table` drawer chart は、light / dark とも正寸法・可視表示へ修正された。
- 直前のFAILレポートと同じ14ケースを、新規環境・新規evidenceで再実行した。

## 実行環境（再現性の前提）

- 検証日時: 2026-08-22 14:04–14:11 JST
- 対象コミット: 上記 `verified_impl_sha`
- OS: Darwin 25.3.0 / arm64
- Node.js: `v26.7.0`
- npm: `11.19.0`
- ブラウザ: Chrome `151.0.0.0`
- 通常 viewport: `1512 × 828`
- mobile viewport: `390 × 844`
- devicePixelRatio: `2`
- 起動コマンド: `npm run dev -- --host 127.0.0.1 --port 4321`
- 4321 は別worktreeの `serve dist` が使用中だったため停止せず、対象Astroが実際に割り当てた `http://127.0.0.1:4322` を使用した。
- 実行可否: ✅実行した
- 対象server PID 96861は検証後に停止し、port 4322のLISTEN残留は0。

## 成功基準（rubric・実行前に定義）

- accessible name付きDocument buttonからdrawerを開ける。
- light / darkでChartContainer・SVG・polylineのrectがすべて正。
- polylineのstrokeが可視で、スクリーンショット上でも線と5点を識別できる。
- Document / Target sortの実操作で順序が変わり、再操作で逆順になる。
- 部分選択時にheader checkboxがmixed / indeterminateとなり、表示選択件数と同期する。
- DnD依存・handler・affordance・`draggable=true`がなく、pointer / keyboard操作後も行順が変わらない。
- dashboard-01 light / dark、mobile sidebar、catalogが描画・操作できる。
- 安定描画後のduplicate DOM id、console error、page exception、HTTP 4xx/5xx、request failureが0。
- 通信監査のevent bufferが切り捨てられていない。
- 画像拡張子とmagic bytesが一致する。
- 件数は今回の観測値としてのみ記録し、将来の固定条件にしない。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | lightのaccessible Document buttonからdrawerを開く | コード・画面 | 0スイッチ状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | `/preview/dashboard-table/` で「Adaptive Communication Protocols の詳細を開く」をクリック |
| 2 | light chartの寸法・stroke・可視表示 | コード・画面 | 境界値・再実行 | High | ✅実測確認 | 2/2 | `evidence/case01-dashboard-table-light-chart.jpg`、`evidence/2026-08-22-dashboard-table-light.jpg` | drawer表示700ms後と追加1500ms後にrect・style・画面を確認 |
| 3 | dark chartの寸法・stroke・可視表示 | コード・画面 | テーマ同値分割 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-dark.jpg` | `/preview/dashboard-table-dark/` で同じdrawerを開く |
| 4 | Document sortの昇順・降順 | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | Document sort buttonを2回クリック |
| 5 | Target sortの昇順・降順 | コード・画面・型 | 状態遷移・数値境界 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | Target sort buttonを2回クリック |
| 6 | 1行選択時のheader mixed状態 | コード・画面 | 部分集合境界 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | 1行のcheckboxをクリック |
| 7 | DnD依存・handler・affordanceの不在 | コード・画面 | 否定条件監査 | High | ✅実測確認 | 1/1 | `evidence/case10-dnd-static-scan.log`、`evidence/case08-browser-results.json` | source scanとDOM属性数を確認 |
| 8 | pointer drag相当操作後の行順 | 画面 | 異常操作 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | 先頭行から4行目へpointer drag |
| 9 | keyboard reorder相当操作後の行順 | 画面 | キーボード異常操作 | High | ✅実測確認 | 1/1 | `evidence/case08-browser-results.json` | `Control+ArrowDown`、`Control+ArrowUp` |
| 10 | dashboard-01 light / dark表示 | コード・画面 | テーマ同値分割 | Medium | ✅実測確認 | 2/2 | `evidence/2026-08-22-dashboard-01-light.jpg`、`evidence/2026-08-22-dashboard-01-dark.jpg` | 各preview URLを開く |
| 11 | mobile sidebarの開閉 | コード・画面 | 1スイッチ状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case06-dashboard-01-mobile-sidebar-open.jpg` | 390×844でtriggerをクリックし、Escapeで閉じる |
| 12 | catalog内のdashboard-01 / dashboard-table | コード・画面 | 統合シナリオ | Medium | ✅実測確認 | 1/1 | `evidence/case07-catalog-dashboard-items.jpg` | `/catalog/` で対象2itemの実在とrectを確認 |
| 13 | 安定描画後のduplicate DOM id | 画面 | 再実行 | High | ✅実測確認（注記あり） | 2/2 | `evidence/case08-browser-results.json` | catalogをreloadし、各回5000ms後に全IDを集計 |
| 14 | HTTP・request failure・console・pageerror | 画面・通信 | 異常系監査 | High | ✅実測確認 | 5ページ | `evidence/case09-network-console-audit.json` | URLごとにCDP eventsを切り捨てなしで収集 |

## 主要実測値

### dashboard-table chart

light:

- ChartContainer: `1480 × 192`
- SVG: `1480 × 192`
- polyline: `326.400 × 88.568`
- stroke: `rgb(47, 95, 209)`
- stroke width: `4px`
- opacity: `1`
- circle: 5個、各約 `9.6 × 9.6`
- 追加1500ms後も同寸法。
- screenshot上で折れ線と5点を明瞭に確認。

dark:

- ChartContainer: `1480 × 192`
- SVG: `1480 × 192`
- polyline: `326.400 × 88.568`
- stroke: `rgb(110, 147, 240)`
- stroke width: `4px`
- opacity: `1`
- circle: 5個
- screenshot上で折れ線と5点を明瞭に確認。

修正前に0×0だったRecharts内側wrapper自体は0×0のままだが、`relative`なChartContainerを基準に、SVGが`absolute inset-0 h-full w-full`で正寸法を確保している。

![light chart](evidence/2026-08-22-dashboard-table-light.jpg)

![dark chart](evidence/2026-08-22-dashboard-table-dark.jpg)

### sort

Document:

- 初期: `11,10,12,6,1,5,3,8,7,9,2,4`
- descending: `4,2,9,7,8,3,5,1,6,12,10,11`
- 再操作ascending: 初期順へ復帰
- `aria-sort`: `descending` → `ascending`

Target:

- ascending: `5,9,11,3,12,1,7,6,8,4,2,10`
- descending: `10,2,4,8,6,7,1,12,3,11,9,5`
- 完全な逆順であることを確認。

### mixed selection

- header `aria-checked="mixed"`
- `data-indeterminate=""`
- 表示: `12 件を表示・1 件を選択`
- root `data-selected-rows="1"`

### DnD非搭載

- `draggable=true`: 0
- sortable attribute: 0
- drag handle: 0
- grab affordance: 0
- `@dnd-kit` / `DndContext` / `SortableContext` / `useSortable` / `onDrag`: 0
- pointer drag前後の行ID順: 不変
- keyboard操作前後の行ID順: 不変

### dashboard-01 / mobile / catalog

dashboard-01 light / dark:

- root: 各1
- `Documents` heading: 各1
- section card: 各5
- chart root: 各1
- chart SVG: 各1
- data record count: 今回の観測値 `68`
- duplicate ID: 0

mobile:

- viewport: `390 × 844`
- open前の可視sidebar: 0
- open後: `292.5 × 844`
- open後dialog: 1
- close後dialog / 可視sidebar: 0
- duplicate ID: 0

catalog:

- catalog root: 1
- preview item: 今回の観測値 `89`
- dashboard-01 item: 1
- dashboard-table item: 1
- 各itemのrectは正。
- 5000ms安定後のduplicate ID確認は2/2で0。

### duplicate IDの過渡観測

catalog初回の3000ms時点で `base-ui-_r1R_52a_` が一時的に2件見えたが、追加1000ms後に解消した。reload後に5000ms待つ安定確認を2回実施し、2回とも重複0だった。過渡観測は隠さずJSONへ記録した。

### エラー・通信監査

ページ別にeventsを回収した。catalogは遷移と並行して48batchで逐次回収した。

| ページ | 今回のresponse観測値 | truncated | HTTP 4xx/5xx | request failure | page exception |
|---|---:|---|---:|---:|---:|
| dashboard-table light | 137 | false | 0 | 0 | 0 |
| dashboard-table dark | 137 | false | 0 | 0 | 0 |
| dashboard-01 light | 158 | false | 0 | 0 | 0 |
| dashboard-01 dark | 158 | false | 0 | 0 | 0 |
| catalog | 422 | false | 0 | 0 | 0 |

- 総response観測値: `1012`
- console error: 0
- 全ページ `truncated:false`

### evidence形式

- JPEG: 7
- PNG: 0
- 全7画像をmagic bytesで `JPEG image data, JFIF standard 1.01` と確認。
- evidence総数: 10

## 三方向導出のクロスチェック結果

- コード:
  - sort、selection、drawer、chart、DnD不在、mobile sidebarの状態遷移を列挙。
- 画面:
  - a11y treeからDocument button、sort buttons、checkbox、drawer、sidebar triggerを確認。
- 型:
  - `DashboardTableRow` の `target` / `limit` が文字列で、chart描画時に数値化されることを確認。
- 修正前の「要素は存在するが画面に見えない」乖離は解消。
- chartのDOM寸法・computed style・screenshotの3方向が一致した。
- 画面から入力できるがコードで扱っていない値: 必須ケース内ではなし。
- 型にあるがコードで扱っていないパラメータ: 対象範囲ではなし。

## 未到達分岐（網羅の穴・機械的な証拠）

- `target` / `limit` が非数値のchart fallback。
- 検索結果0件。
- `In review` tab。
- Columns menu。
- 全行選択・全解除。
- props dataの実行中差し替え。
- dashboard-01 chartの7日・30日・90日切替。
- network offline、resource timeout、JavaScript無効。

## 発見した不具合

- 今回の固定commitでは新規不具合なし。
- 修正対象だったdrawer chart不可視は再現しなかった。

## 未列挙・未検証の残（正直な限界）

- 上記未到達分岐は未検証。
- catalog hydration中の一時的duplicate IDについて、安定描画後への残留は再現しなかったが、過渡状態そのもののアクセシビリティ影響は未評価。
- 4321は無関係な既存serverが占有していたため、実測URLは4322。

## クリーンアップ

- 対象Astro server PID 96861を停止。
- port 4322のLISTEN残留なし。
- 検証データ作成なし。
- 外部送信・deploy・削除なし。
- 既存 `.docs/reviews/2026-08-22-phase3-r3-recheck/**` は変更していない。
- 新規保存先へevidence 10件のみ追加。
