# 動作検証レポート: dashboard-table preview

verified_impl_sha: 10574aa56ef00aafcd9dcb6bd51ad188ac3e42fe

## 結論

上流 `data-table.tsx` の機能構成を参照し、既存 registry 部品と React state だけで書き直した `dashboard-table` を実 Chrome で検証した。ソート、フィルタ、列表示、行選択、tab、drawer、chart は動作し、npm 依存追加と DnD はない。

- light / dark の初期行: 各 12 件
- pageerror / console error / HTTP 4xx・5xx / request failure: 0 件
- isolated preview の重複 DOM ID: 0 件
- desktop body overflow: light / dark とも `clientWidth=1512`、`scrollWidth=1512`
- mobile body overflow: `clientWidth=390`、`scrollWidth=390`

## 実行環境

- 検証日時: 2026-08-22 10:09–10:15 JST
- 対象 URL: `http://127.0.0.1:4322`
- desktop viewport: 1512×828
- mobile viewport: 390×844
- 認証・検証データ: `src/blocks/dashboard-01/data.json` の先頭 12 件

## light / dark

| theme | selector | 初期行 | 重複 ID | 通信・実行時エラー |
|---|---:|---:|---:|---:|
| light | 1 | 12 | 0 | 0 |
| dark | 1 | 12 | 0 | 0 |

- light: `2026-08-22-dashboard-table-light.jpg`
- dark: `2026-08-22-dashboard-table-dark.jpg`

両画像を原寸で目視し、table、filter、tabs、column menu trigger の欠落、意図しない重なり、クリップ、theme 不一致がないことを確認した。

## 実操作

| 確認項目 | 実測結果 |
|---|---|
| ソート | Document header click で `aria-sort` が `descending` になり、先頭が `Adaptive Communication Protocols` から `Technical approach` へ変化 |
| フィルタ | `Cover page` 入力で 12 行から 1 行へ減少し、入力解除で 12 行へ復帰 |
| 列表示 | Type を off にして header 1 件から 0 件、on に戻して 1 件へ復帰 |
| 行選択 | Cover page checkbox が `aria-checked=true`、選択件数が 0 から 1 へ変化 |
| drawer | Cover page の document cell click で dialog 1 件、title 1 件、chart SVG 1 件、polyline 1 件 |
| tab | In review click で `aria-selected=true`、対象行は 4 件 |
| DnD | `[draggable="true"]` は 0 件 |

## mobile

390×844 で次を確認した。

- page: `clientWidth=390`、`scrollWidth=390`
- table container: `clientWidth=356`、`scrollWidth=896`
- table の横スクロールは container 内に閉じ、page 全体へ漏れない
- filter と Columns trigger: 各 1 件
- document cell click 後の drawer: dialog 1 件、chart SVG 1 件
- HTTP 4xx・5xx / request failure / Runtime exception / console error: 0 件

## origin 分岐 mutation

4 件とも仕込みを JSON から確認してから `node scripts/check-completeness.mjs` を実行し、検査後に復元した。

| mutation | 仕込み確認 | completeness |
|---|---|---|
| dashboard-table に `registryUrl` を追加 | URL を出力、確認 command exit 0 | `自作 block は registryUrl を持たない`、exit 1 |
| dashboard-table `files[0]` に `upstreamPathSha` を追加 | 40 桁の 0 を出力、確認 command exit 0 | `files[0] は自作 block なので upstreamPathSha を持たない`、exit 1 |
| dashboard-table origin を `unknown-source` に変更 | `unknown-source` を出力、確認 command exit 0 | `provenance の origin が未対応`、exit 1 |
| dashboard-01 から `registryUrl` を削除 | `Object.hasOwn(...)=false`、確認 command exit 0 | `provenance の registryUrl が無い`、exit 1 |

復元後の `provenance.json` SHA-256 は mutation 前と同じ `630a44c167c842c9aafd6cbec41467400fdcd8d7639b808a12ff6c73bc3b8d2d` で、completeness は 61 component / 28 block・exit 0 に復帰した。

## 依存ゼロと既知の差分

- `grep -rnE 'from "(@dnd-kit|@tanstack|zod)' src/blocks/`: hit 0、期待どおり exit 1
- `git diff --exit-code package.json package-lock.json`: exit 0
- `dashboard-table` の配布 item: `dependencies: []`
- registryDependencies: 既存の badge / button / chart / checkbox / drawer / dropdown-menu / input / table / tabs のみ
- DnD は設計 §3-6 の決定に従い非搭載。必要になった時点で `@dnd-kit` の採否を再判断する

## 未到達範囲

全列の全方向ソート、全行の一括選択組み合わせ、drawer の全データ行、実スクリーンリーダーによる読み上げは今回の必須範囲外として総当たりしていない。
