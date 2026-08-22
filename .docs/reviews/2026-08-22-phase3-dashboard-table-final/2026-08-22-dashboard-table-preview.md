# dashboard-table preview 動作検証

verified_impl_sha: 7ccde67f72f6913da48065c1d160280e4ad410fd

## 判定

✅ PASS

dashboard metric の空値処理変更後の最終版を、isolated light/dark と catalog integration で再検証した。table、drawer、chart、sort、selection、DnD 非搭載、エラー監査はいずれも期待どおりだった。

## 対象

- component: `dashboard-table`
- light: `http://127.0.0.1:4322/preview/dashboard-table/`
- dark: `http://127.0.0.1:4322/preview/dashboard-table-dark/`
- integration: `http://127.0.0.1:4322/catalog/`
- browser: Chrome 151.0.0.0
- isolated viewport: 1536×1000
- catalog viewport: 1920×1000
- 件数は今回の観測値であり固定成功条件ではない

## 検証結果

| ケース | 期待 | 実測 | 判定 | Evidence |
|---|---|---|---|---|
| light table | 正寸法・可視 | 1232×585.5、12行を表示 | ✅ | `evidence/2026-08-22-dashboard-table-light.jpg`, `evidence/case04-browser-results.json` |
| dark table | 正寸法・可視 | 1232×585.5、12行を表示 | ✅ | `evidence/2026-08-22-dashboard-table-dark.jpg`, `evidence/case04-browser-results.json` |
| 詳細 drawer | accessible name 付き Document button から開く | light/dark とも `"<Document名> の詳細を開く"` から dialog を表示 | ✅ | light/dark JPEG、`evidence/case04-browser-results.json` |
| light chart | container/SVG/polyline が正寸法、stroke・5点が可視 | container/SVG 1504×192、polyline 約326.4×109.2、stroke 4px、点5個 | ✅ | `evidence/2026-08-22-dashboard-table-light.jpg` |
| dark chart | container/SVG/polyline が正寸法、stroke・5点が可視 | container/SVG 1504×192、polyline 約326.4×88.6、stroke 4px、点5個 | ✅ | `evidence/2026-08-22-dashboard-table-dark.jpg` |
| Document sort | 操作ごとに行順変更、再操作で逆順 | row ID 配列が昇順系・降順系へ交互に切替 | ✅ | `evidence/case04-browser-results.json` |
| Target numeric sort | 数値昇順・降順 | 昇順 2→30、降順 30→2、両方単調 | ✅ | `evidence/case04-browser-results.json` |
| metric 欠損 fallback | 実データにあれば browser 確認、なければ未到達明記 | 実データ68行に空・空白・非数値0行。fixture の空文字・空白・非数値を含む suite は18/18 pass | ✅境界記録 | `evidence/case05-unit-metric-fallback.log` |
| 部分選択 | header mixed/indeterminate、件数同期 | `aria-checked="mixed"`、indeterminateあり、選択1件 | ✅ | `evidence/case04-browser-results.json` |
| DnD 静的不在 | dependency/handler/affordance/draggable 0 | static scan 一致0、DOM各項目0 | ✅ | `evidence/case06-dnd-static-scan.log`, `evidence/case04-browser-results.json` |
| pointer reorder 不在 | drag相当操作後も順序不変 | 操作前後の row ID 配列一致 | ✅ | `evidence/case04-browser-results.json` |
| keyboard reorder 不在 | keyboard操作後も順序不変 | `Ctrl+ArrowDown/Up` 前後の row ID 配列一致 | ✅ | `evidence/case04-browser-results.json` |
| catalog integration | item正寸法・前面可視 | item約410.7×467、内部table約374.7×585.5、左・中央・右の代表点すべて前面 | ✅ | `evidence/case03-catalog-dashboard-table-visible.jpg` |
| 安定描画監査 | duplicate ID・console・page・network error 0、truncated=false | 全対象で0、light/dark/catalogすべて `truncated=false` | ✅ | `evidence/case04-browser-results.json` |

## 操作手順

1. `npm run dev -- --host 127.0.0.1 --port 4321` を実行する。
2. 起動ログに表示された実 URL を使用する。今回の実 URL は port 4322。
3. light/dark で Document 詳細 button をクリックし、drawer と chart geometry を採取する。
4. `Document で並べ替える` と `Target で並べ替える` を各2回操作し、各回の row ID 配列を比較する。
5. 1行の checkbox を選択し、header checkbox と件数表示を採取する。
6. row 間の pointer drag、focus 後の `Ctrl+ArrowDown` / `Ctrl+ArrowUp` を実行し、row ID 順が不変であることを確認する。
7. catalog で dashboard-table card へ移動する。別 preview の展開済み sidebar が重なる場合は対応する sidebar trigger を通常操作で閉じる。
8. card の左・中央・右で `elementFromPoint` が card 自身またはその子孫・祖先を返すことを確認する。
9. CDP event をナビゲーション中から連続回収し、HTTP status、loading failure、runtime exception、log error、buffer truncation を検査する。
10. `node --test scripts/dashboard-blocks.test.mjs` を実行する。
11. 対象 source と `package.json` を DnD 語彙で走査する。一致なしの `rg` exit 1 を期待値として判定する。
12. JPEG magic bytes と screenshot を確認し、対象 server を停止する。

## 境界と未確認事項

- 実データに欠損 metric がないため、空・空白・非数値 fallback はブラウザ未到達。fixture unit test の証跡と browser 証跡を混同していない。
- filter、pagination、Columns menu、review tab は今回の source変更に対する再検証 rubric 外。
- dashboard-table 以外の catalog item の機能は対象外。

## Evidence

- `evidence/2026-08-22-dashboard-table-light.jpg`
- `evidence/2026-08-22-dashboard-table-dark.jpg`
- `evidence/case03-catalog-dashboard-table-visible.jpg`
- `evidence/case04-browser-results.json`
- `evidence/case05-unit-metric-fallback.log`
- `evidence/case06-dnd-static-scan.log`
- `evidence/case07-server-cleanup.log`

## クリーンアップ

- 対象 Astro PID 56701 を停止。
- port 4322 に LISTEN 残留なし。
- port 4321 の無関係 PID 11102 は維持。
- browser tab 0、viewport reset 済み。
- 実装・既存 report/evidence の変更なし。
