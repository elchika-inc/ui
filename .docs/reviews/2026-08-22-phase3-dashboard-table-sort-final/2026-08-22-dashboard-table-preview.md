# dashboard-table Target sort 動作検証

verified_impl_sha: 0f2350d0c643fa5f7dfebe91961175bb4360dcf0

## 判定

✅ PASS

Target comparator 修正後の isolated light/dark preview と catalog integration を実ブラウザで再検証した。数値昇順・降順、drawer/chart、selection、DnD非搭載、エラー監査はいずれも期待どおりだった。

## Target sort

| 項目 | 実測 | 判定 |
|---|---|---|
| ascending values | `2, 7, 9, 10, 12, 18, 19, 20, 25, 27, 29, 30` | ✅単調増加 |
| ascending IDs | `[5,9,11,3,12,1,7,6,8,4,2,10]` | ✅ |
| descending values | `30, 29, 27, 25, 20, 19, 18, 12, 10, 9, 7, 2` | ✅単調減少 |
| descending IDs | `[10,2,4,8,6,7,1,12,3,11,9,5]` | ✅ |
| reverse relation | descending IDs は ascending IDs の完全な逆順 | ✅ |
| 画面内同値Target | 0組 | ⚠️tie-breakはブラウザ未到達 |
| fixture tie-break | 4行の全24 permutationでascending `[1,2,3,4]`、descending `[4,3,2,1]` | ✅unit実測 |

preview は `dashboardData.slice(0, 12)` を使用する。全68行のsource dataには同値Targetがあるが、画面に渡される12行はすべて異なるため、同値tie-breakをブラウザで成功扱いしていない。

## Preview・操作結果

| ケース | 実測 | 判定 | Evidence |
|---|---|---|---|
| light table | 1232×585.5、12行 | ✅ | `evidence/2026-08-22-dashboard-table-light.jpg` |
| dark table | 1232×585.5、12行 | ✅ | `evidence/2026-08-22-dashboard-table-dark.jpg` |
| accessible Document button | `"<Document名> の詳細を開く"` からdrawer表示 | ✅ | light/dark JPEG、`evidence/case04-browser-results.json` |
| light chart | container/SVG 1504×192、polyline正寸法、stroke 4px、点5個 | ✅ | light JPEG |
| dark chart | container/SVG 1504×192、polyline正寸法、stroke 4px、点5個 | ✅ | dark JPEG |
| 部分選択 | header mixed/indeterminate、選択1件へ同期 | ✅ | `evidence/case04-browser-results.json` |
| DnD静的不在 | dependency/handler/affordance/draggable各0 | ✅ | `evidence/case06-dnd-static-scan.log` |
| pointer reorder | 操作前後のID配列一致 | ✅ | `evidence/case04-browser-results.json` |
| keyboard reorder | `Ctrl+ArrowDown/Up` 前後のID配列一致 | ✅ | `evidence/case04-browser-results.json` |
| catalog | item約410.7×467、内部table約374.7×585.5、代表3点が前面 | ✅ | `evidence/case03-catalog-dashboard-table-visible.jpg` |
| duplicate ID | light/dark/catalogで0 | ✅ | `evidence/case04-browser-results.json` |
| console/page/network | error・4xx/5xx・failure各0 | ✅ | `evidence/case04-browser-results.json` |
| event buffer | light/dark/catalogで`truncated=false` | ✅ | `evidence/case04-browser-results.json` |

## Fixture実行

実行コマンド:

`node --test scripts/dashboard-blocks.test.mjs`

実測:

- tests 18
- pass 18
- fail 0
- exit 0
- 同値 fixture rows 4
- permutations 24

詳細は `evidence/case05-target-order-unit.log` を参照。

## Workspace drift

検証開始時は上記固定 commitだった。cleanup時に他エージェントのregistry検査・plan変更でHEADが進んだが、dashboard-table runtime、preview、catalog、package、対象fixtureの内容差分は0だった。固定対象の同一性確認は `evidence/case04-browser-results.json` と `evidence/case07-server-cleanup.log` に記録した。

## Evidence

- `evidence/2026-08-22-dashboard-table-light.jpg`
- `evidence/2026-08-22-dashboard-table-dark.jpg`
- `evidence/case03-catalog-dashboard-table-visible.jpg`
- `evidence/case04-browser-results.json`
- `evidence/case05-target-order-unit.log`
- `evidence/case06-dnd-static-scan.log`
- `evidence/case07-server-cleanup.log`

## 未到達・未確認

- 同値 Target のブラウザ描画はpreviewデータに該当行がなく未到達。
- filter、pagination、Columns menu、review tabは今回の変更影響外として再実行していない。
- 件数は今回の観測値であり固定成功条件ではない。

## クリーンアップ

- browser tab 0、viewport reset済み。
- 対象Astro PID 72115を停止。
- port 4322にLISTEN残留なし。
- 無関係なport 4321 / PID 11102は維持。
- 実装・既存report/evidenceの変更なし。
