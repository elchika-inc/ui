# 動作検証レポート: dashboard-table 最終版

verified_impl_sha: 7ccde67f72f6913da48065c1d160280e4ad410fd

## 総合判定

✅ PASS

対象コミットの dashboard-table を light、dark、catalog で実際に描画し、drawer、chart、sort、selection、DnD 非搭載、統合表示、エラー監査を確認した。実データに空・空白・非数値 metric は存在しなかったため、その分岐だけはブラウザ未到達として明示し、対象 fixture を含む unit test の実行結果を境界証跡とした。

## 実行環境（再現性の前提）

- 検証日時: 2026-08-22 17:37–17:51 JST
- 対象 URL:
  - `http://127.0.0.1:4322/preview/dashboard-table/`
  - `http://127.0.0.1:4322/preview/dashboard-table-dark/`
  - `http://127.0.0.1:4322/catalog/`
- 起動コマンド: `npm run dev -- --host 127.0.0.1 --port 4321`
- 実際の割当: `http://127.0.0.1:4322`、PID 56701
- requested port 4321 は無関係な PID 11102 が使用中だったため停止対象外とした
- OS: Darwin 25.3.0 arm64
- Node.js: v26.7.0
- npm: 11.19.0
- Browser: Chrome 151.0.0.0
- viewport:
  - isolated preview: 1536×1000
  - catalog 最終前面確認: 1920×1000
- 実行可否: ✅実行した
- 件数は今回の観測値であり、将来の固定成功条件ではない

## 成功基準（rubric・実行前に定義）

- light/dark の table が正寸法かつ画面上で可視である。
- accessible name 付き Document 詳細 button から drawer を開ける。
- light/dark の ChartContainer、SVG、polyline が正寸法で、stroke と5点が画面上で識別できる。
- Document sort と Target numeric sort が昇順・降順へ実際に行順を変更する。
- 実データに欠損 metric があれば fallback をブラウザ確認し、なければ未到達として fixture 検証との境界を明記する。
- 1行選択時に header checkbox が mixed/indeterminate となり、選択件数が同期する。
- DnD の依存・handler・affordance・`draggable=true` がなく、pointer/keyboard 操作後も行順が変わらない。
- catalog の dashboard-table item が正寸法で、代表点が前面にあり、画面上で可視である。
- 安定描画後の duplicate DOM id、console error、page exception、HTTP 4xx/5xx、request failure が0である。
- 採用した event 監査で buffer truncation がない。
- screenshot が実在し、画像 magic bytes と目視の両方を通る。
- 対象 server を停止し、実割当 port に LISTEN が残らない。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | light table の表示 | コード・画面 | 正常系 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | `/preview/dashboard-table/` を開き、`[data-slot="dashboard-table"]` の rect と表示行を採取 |
| 2 | dark table の表示 | コード・画面 | 状態分割 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | `/preview/dashboard-table-dark/` を開き、table rect と表示行を採取 |
| 3 | accessible name 付き詳細 button から drawer を開く | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | `evidence/2026-08-22-dashboard-table-light.jpg`, `evidence/2026-08-22-dashboard-table-dark.jpg` | `"<Document名> の詳細を開く"` button を light/dark でクリック |
| 4 | light detail chart の寸法・stroke・5点 | コード・画面 | 境界値 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-light.jpg`, `evidence/case04-browser-results.json` | drawer 内 `svg[aria-label="Target と limit の推移"]` と親・polyline・circle の rect/computed style を採取 |
| 5 | dark detail chart の寸法・stroke・5点 | コード・画面 | 状態分割 | High | ✅実測確認 | 1/1 | `evidence/2026-08-22-dashboard-table-dark.jpg`, `evidence/case04-browser-results.json` | dark drawer で同じ geometry と computed style を採取 |
| 6 | Document sort の昇順・降順 | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | `Document で並べ替える` を反復クリックし、各回の row ID 配列を比較 |
| 7 | Target numeric sort と欠損 fallback 境界 | コード・画面・fixture | 同値分割・境界値 | High | ✅実測確認、欠損分岐はブラウザ未到達 | 1/1 | `evidence/case04-browser-results.json`, `evidence/case05-unit-metric-fallback.log` | `Target で並べ替える` を反復クリック。実データ68行を確認し、空・空白・非数値0行。`node --test scripts/dashboard-blocks.test.mjs` で fixture を実行 |
| 8 | 1行選択と mixed/indeterminate・件数同期 | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | 先頭行 checkbox をクリックし、header の `aria-checked`、`data-indeterminate`、表示件数を採取 |
| 9 | DnD dependency・handler・affordance の静的不在 | コード | 不在検査 | High | ✅実測確認 | 1/1 | `evidence/case06-dnd-static-scan.log`, `evidence/case04-browser-results.json` | 対象 source/package を `rg` で走査し、DOM の draggable/sortable/drag handle/grab cursor を数える |
| 10 | pointer drag 相当操作後の行順不変 | 画面 | 異常系・状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | 先頭行中央から次行下部へ pointer drag を実行し、前後 row ID 配列を比較 |
| 11 | keyboard reorder 相当操作後の行順不変 | 画面 | 異常系・状態遷移 | High | ✅実測確認 | 1/1 | `evidence/case04-browser-results.json` | row checkbox に focus を置き、`Ctrl+ArrowDown`、`Ctrl+ArrowUp` 後の row ID 配列を比較 |
| 12 | catalog dashboard-table item の正寸法・前面可視 | 画面 | 統合・重なり | High | ✅実測確認 | 1/1 | `evidence/case03-catalog-dashboard-table-visible.jpg`, `evidence/case04-browser-results.json` | catalog を開き、別 preview の展開済み sidebar を対応 trigger で閉じ、1920×1000 でカード左・中央・右の `elementFromPoint` を検査 |
| 13 | duplicate DOM id 不在 | 画面 | 構造監査 | Medium | ✅実測確認 | 3/3 | `evidence/case04-browser-results.json` | light/dark/catalog の安定描画後に全 `[id]` を収集して重複を検査 |
| 14 | console/page/network error と event truncation | 画面 | 異常系・観測完全性 | High | ✅実測確認 | 3/3 | `evidence/case04-browser-results.json` | CDP の response/loadingFailed/exception/log をナビゲーション中から連続回収し、`dev.logs` も検査 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 主な実測値

- light/dark table: 1232×585.5、表示行12件
- light chart:
  - ChartContainer: 1504×192
  - SVG: 1504×192
  - polyline: 約326.4×109.2
  - stroke: `rgb(47, 95, 209)`、4px
  - 正寸法の点: 5
- dark chart:
  - ChartContainer: 1504×192
  - SVG: 1504×192
  - polyline: 約326.4×88.6
  - stroke: `rgb(110, 147, 240)`、4px
  - 正寸法の点: 5
- Target ascending: 2, 7, 9, 10, 12, 18, 19, 20, 25, 27, 29, 30
- Target descending: 30, 29, 27, 25, 20, 19, 18, 12, 10, 9, 7, 2
- 部分選択: `aria-checked="mixed"`、`data-indeterminate` あり、`12 件を表示・1 件を選択`
- DnD DOM観測: draggable 0、sortable属性 0、drag handle 0、grab cursor 0
- catalog:
  - item: 約410.7×467
  - 内部 table: 約374.7×585.5
  - 左・中央・右の代表3点すべて前面
- network response 観測:
  - light 137
  - dark 137
  - catalog 422
- HTTP 4xx/5xx 0、request failure 0、page exception 0、console/log error 0
- light/dark/catalog すべて `truncated=false`
- unit test: tests 18、pass 18、fail 0、exit 0

これらの件数は今回の観測値であり、将来の成功条件として固定しない。

## 三方向導出のクロスチェック結果

- コード:
  - `dashboardMetricNumber` は trim 後の空文字と非有限数を `null` とし、数値 bucket より後へ安定配置する。
  - sort、selection、drawer chart の状態分岐を確認した。
  - DnD dependency、handler、affordance は実装されていない。
- 画面:
  - Document 詳細 button、sort button、checkbox、drawer close button、chart accessible label を実 DOM で確認した。
  - pointer/keyboard 操作と catalog integration を実行した。
- スキーマ・fixture:
  - 実データ68行の target はすべて数値化可能で、空・空白・非数値 branch へ画面から到達しない。
  - fixture は空文字、空白、`N/A` 相当を含み、対象 test suite が18/18 pass した。
- コードにあるが画面から到達できない分岐:
  - 空・空白・非数値 metric の fallback。
- 画面から入力できるがコードで検証していない値:
  - 今回対象の table は metric を利用者が直接編集する入力UIを持たないため該当なし。
- スキーマにあるがコードで扱っていないパラメータ:
  - 今回確認範囲では検出なし。

## 未到達分岐（網羅の穴・機械的な証拠）

- `dashboardMetricNumber` の `normalized.length === 0` と非有限数分岐は、固定 preview データに該当行がなくブラウザ未到達。
- この境界は browser pass と混同せず、fixture unit test の pass を別証跡として記録した。
- 固定データ自体の実行中差し替え、pagination、filter、Columns menu、review tab の全状態遷移は今回の rubric 外で再実行していない。

## 発見した不具合

- なし。
- catalog 初期状態では別 preview の展開済み sidebar がカードに重なったが、対応する通常 UI の sidebar trigger を1回操作して解消した。1920×1000 の最終確認では dashboard-table カードの代表3点すべてが前面だった。

## 画像・証跡検査

- JPEG 3枚はいずれも JFIF magic `ff d8 ff e0 ... 4a 46 49 46`。
- light/dark 画像で折れ線と5点を目視識別した。
- catalog 画像で Dashboard Table 見出し、列ヘッダー、表示行を目視識別した。
- JSON parse exit 0。
- tracked diff と cached diff はともに0で、新規 evidence 以外の変更はない。

## 未列挙・未検証の残（正直な限界）

- 欠損 metric の browser branch は固定データに該当行がないため未到達。
- dashboard-table 以外の catalog item の機能正当性は対象外。
- dashboard-table の filter、pagination、Columns menu、review tab は今回再実行していない。
- 判定者と実行者が同一であるため、最終承認は screenshot と生ログを用いた人間レビューに委ねる。

## クリーンアップ

- 作成した永続データ: なし。
- browser tab: 0。
- viewport: reset 済み。
- Astro PID 56701: `astro dev stop` exit 0。
- 実割当 port 4322: 停止後 `lsof` exit 1、LISTEN なし。
- 無関係な port 4321 / PID 11102: 停止せず LISTEN 維持。
- evidence: 新規7ファイル。
- 既存 report/evidence と実装ファイル: 変更なし。
