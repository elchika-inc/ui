# registry:block Phase 3 レビューサイクル

verified_impl_sha: 63f0264402efabdfe26312117273db7bd6564aa5

## 対象

- 実装範囲: dashboard-01、dashboard-table、block 内 `registry:file`、自作 block 来歴、導入手順
- dashboard-01: 上流 page と data-table を配布せず、実体9 fileを配布
- dashboard-table: 既存部品だけで自作し、DnD は非搭載
- npm dependency: `package.json` / `package-lock.json` の差分0
- 最終実装 SHA: `63f0264402efabdfe26312117273db7bd6564aa5`
- 最終 tree: `e7d088f420da9fda6449aa5768700153fb9e525b`
- レビュー上限: 5 round
- 終了判定: Round 5 内の修正波 v6 で全7レンズの confidence 80%以上の flag 0

## Round 1

Security、Core Logic、Tests、Domain、Ambiguity、Fresh Eyes、Altitude の7観点で実施した。

主な flag:

- `~/` target のローカル CLI 生成先解釈が実測挙動と不一致
- 未検証 dependency metadata を CLI へ渡す副作用境界
- 自作 dashboard-table を上流 icon 監査へ含める404
- 移植 origin の必須キーと自作 origin の禁止キーが不完全
- dropped file 全件、dropped path prefix、block `--force` 所有境界の false-green
- dashboard-01 の navigation URL、UTC date、期間表示
- dashboard-table の accessible control、mixed selection、data prop と state の同期
- 設計の10 file表記、target / targetPath、Task 9参照範囲、DnD 合格述語の矛盾

対応:

- CLI 4.16.0 の target 解決を実測 fixtureへ固定し、移設元不在と危険 pathを fail-closed 化
- CLI 入力を検証済み local metadataへ pinし、依存・file・来歴を同一入力へ束縛
- origin 別の icon / provenance 分岐、dropped 全件照合、所有済み fileだけの `--force` を実装
- dashboard-table の操作を accessible name付き Document buttonへ移し、selection / state同期を修正
- 設計・計画・READMEを裁定済みの実体へ同期

## Round 2

主な flag:

- `src/` 始まり target の二重化
- provenance metadata 取得失敗時の半端な副作用
- chart の期間境界、非数値 metric、selection state
- symlink を介した source / target / dropped / obsolete path
- import済み item 以外への `--force`
- README の名前空間前提、sort、DnD、依存説明

対応:

- leading `src/`、`~/`、通常 targetを別規則として fixture化
- provenance metadata を CLI 副作用前に取得
- symlink leaf / ancestor と repo外解決を拒否
- chart 期間を inclusive にし、dashboard-table の total ordering、mixed state、DnD 不在を検査
- 固定観測件数を完全性述語へ置換

既知 false-positive:

- FP-001〜FP-004 は一時 registryへ理由を記録し、同一根因の再指摘から除外した

## Round 3

主な flag:

- local registry graph の dangling dependency
- block所有 `registry:file` と共有 target の衝突
- 非 literal dynamic import と import抽出の抜け
- provenance `files[]` の重複
- Target comparator の非推移的な順序
- chart data配線、drawer chart の0×0 SVG
- checkbox / drawer / sort / DnD 不在の検査不足

対応:

- registry item全体の一意な依存 graphと fail-closedな import解析を追加
- source / 配布 target / ローカル CLI生成先を別概念として衝突検査
- comparatorを数値 / 非数値 bucketの total orderingへ修正
- chart配線と dashboard-table JSXを AST で検査
- 0×0 chartの FAIL証跡を保存後、ChartContainer基準の描画へ修正しPASS証跡を保存

実ブラウザ再検証:

- dashboard-01 light / dark / mobile / catalog
- dashboard-table sort / mixed selection / drawer chart
- DnD dependency / handler / affordance / pointer / keyboard reorderの不在
- console error、HTTP 4xx / 5xx、request failure 0

## Round 4

主な flag:

- add と completeness で import正規化規則が分岐
- 非 literal dynamic importとexternal dependencyのchecked-in manifest突合不足
- chartの未来日混入と `AreaChart.data` 配線の弱い構文検査
- 正しい同名宣言を別scopeへ置くと壊れた実装をmaskできる false-green
- planのnpm dependency集合とleading `src/`規則の不足

対応:

- import解析を `scripts/import-analysis.mjs` へ集約
- external importを最終 `dependencies` へ突合し、local registry依存閉包と分離
- UTC reference dateの上限、unsorted fixture、AST所有scopeを固定
- decoy mutationを加え、対象component subtree内のexactな宣言・JSXだけを検査
- 計画を「残存file由来 + local閉包 + 共有必須」の和集合へ同期

## Round 5

上限ラウンドのため、R6は作らず、各修正後の commit / treeを固定したR5内の修正波として全7レンズを再実行した。

主な flagと対応:

- chart検査の同名decoy maskを、関数所有scopeのAST検査へ修正
- dashboard-01の `dependencies` / `registryDependencies` をsemantic exact setで固定
- 共有 registry file / npm dependency policyを一元化
- 上流架空社名を `Acme Inc.` へ戻し、provenance hash / modifiedを同期
- catalogだけ固定 sidebarを無効化し、isolated offcanvasを維持
- stale / 空 item JSONを通すname-only checkerを、manifestと全 `files[].content` の実体一致へ強化
- Target同値を一意なIDでtie-breakし、4行全24 permutationで昇順と完全反転の降順を固定
- 外部URL / 他namespaceのregistry dependencyを保持し、local graph検査から除外
- 退役 item JSONを限定削除し、未知JSONは保持してcheckerで拒否
- sort修正後のlight / dark / catalog証跡を撮り直し、画面未到達の同値Targetとunit fixtureを分離
- `index.json` / `registry.json` 欠落false-greenを、全itemとhelperの共通期待集合・各helper削除mutationで修正

最終修正波 v6:

- target: `63f0264402efabdfe26312117273db7bd6564aa5`
- tree: `e7d088f420da9fda6449aa5768700153fb9e525b`
- Security: flag 0
- Core Logic: flag 0
- Tests: flag 0
- Domain: flag 0
- Fresh Eyes: flag 0
- Ambiguity Hunter: flag 0
- Altitude Checker: flag 0
- helper JSON 完全集合: baseline exit 0、`index.json`削除 exit 1、`registry.json`削除 exit 1
- 実registry checker: exit 0
- package manifest / lockfile差分: 0

## 非採用 optional

- `checkRegistryBuild(root)` exportを `root !== process.cwd()` で再利用する契約: 現行CLIは `root === process.cwd()` であり、別cwd再利用は今回の公開契約外
- main由来の `check-block-icons.mjs` format debt: Phase 3の対象fileはtargeted Biomeで適合し、correctness差分ではないため本PRでは変更しない
- READMEの `React state` 説明の圧縮: 現在の機能差分説明として誤りではなく、optionalな文面簡略化は行わない

## 明示した境界

- npm依存は追加しない。上流 data-table 専用6依存はpin済みCLI入力と最終itemの両方から除外する
- local依存閉包は当リポジトリの `registry.json` を正本とし、外部URL / 他namespaceは値を保持したままgraph対象外にする
- dashboard-01のsource path、配布 target、ローカルCLI生成先は別概念として扱う
- droppedはtypeを問わず「配布しない上流file」を表し、理由をprovenance.modifiedへ記録する
- `dashboard-table` は origin `elchika original` の自作品で、上流 icon監査対象外、DnD非搭載
- 外部 scratchpadはcoordinator所有の一時fileとして対象外
- 既存のshared stale evidence advisoryは形式・immutability検査を通過した履歴であり、今回証跡の不合格ではない

## ACCEPTED_RISKS

なし。confidence 80%以上のflagはすべて修正し、Round 5修正波 v6で残存0を確認した。
