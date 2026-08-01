# バッチ3 対話・オーバーレイ群 最終レビュー

verified_impl_sha: 05c5f80257e19ad5a7fa7c3b5caa70de94b4f5b5

## 結論

- base: `191e529`
- 最終実装SHA: `03f451135830675652a5c1df08d92c31cab5226c`
- 最終ゲート対象HEAD: `05c5f80257e19ad5a7fa7c3b5caa70de94b4f5b5`
- 最終判定: **flag 0**
- `ACCEPTED_RISKS`: なし
- mainへのmerge: 実施しない

指定12 component、isolated/catalog preview、全PascalCase exportのProps型、registry・来歴・selector・Light/Dark routeを追加した。レビューで検出した実装、証跡、検査器のflagはすべて修正し、固定HEADでclean roundを通過した。

## レビューサイクル

| round | 観点 | flag | 結果 |
|---|---|---:|---|
| R1 | Security | 0 | clean |
| R1 | Core Logic | 2 | menuの`inset=false`属性残留を修正 |
| R1 | Tests | 1 | repository由来Astro processのcleanup偽greenを修正 |
| R2 | Core Logic / Tests | 0 | clean |
| R1 | Frontend Domain | 3 | Context Menu keyboard起動、Navigation Menu link ring、Select item ringを修正 |
| R1 | Fresh Eyes | 0 | clean |
| R2 | Frontend Domain / Fresh Eyes | 0 | clean |
| R1 | Ambiguity / Altitude | 7 | 計画件数、README重複、集約証跡、SHA parser、手順のhard/advisory境界を修正 |
| R2 | Ambiguity / Core | 0 | clean、optional 1 |
| R2 | Tests / Fresh Eyes | 1 | 親本文carry-forwardとTask16再生成後の移行入力同値を分離して記録 |
| R2 | Security / Altitude | 2 | 未追跡componentとrepo外symlinkをfail-closed化、非祖先SHAも追加でhard化 |
| R3 | Tests / Fresh Eyes | 0 | clean、optional 0 |
| R3 | Security / Altitude | 0 | clean、optional 0 |
| R3 | Ambiguity / Core | 0 | clean、optional 0 |

主要な修正commit:

- `8457a94`: menuの`inset=false`を属性なしへ正規化
- `09b17f0`: inset再検証とAstro server cleanup訂正
- `c6b61d5`: 対話componentのkeyboard focus補強
- `03f4511`: Context Menu keyboard起動を実`contextmenu`経路へ接続
- `433553d`: keyboard focus修正のLight/Dark実ブラウザ証跡
- `24fa01f`: 構造化`verified_impl_sha`、Task16 catalog再取得、手順・README・計画の整合修正
- `52eb768`: 未追跡path、非祖先SHA、repo外祖先symlink、nested symlinkをfail-closed化
- `ca05ccb`: 証跡移行の親比較と再生成後入力比較を分離して記録
- `05c5f80`: clean round証跡

## 証跡SHA移行の時系列

親`433553d`の旧本文49件との比較では48件をそのままcarry-forwardし、Task16だけを最終実装`03f451…`で再検証して`e22d241…`から意図的に更新した。そのworking treeを入力として49件を構造化欄へ移行し、入力時点の旧parser値と全件一致を確認した。後続レビュー文書を含む現在の入力でもmigration dry-runは変更0である。

これにより、「親本文から全件無変更」と「再生成後の移行入力と全件同値」を混同しない。

## 最終ゲート

最終ゲート対象HEAD `05c5f80257e19ad5a7fa7c3b5caa70de94b4f5b5` でfresh実行した。

| gate | 結果 |
|---|---|
| `npm run format` | exit 0、変更なし |
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0、0 errors |
| Props contract単独`tsc` | exit 0 |
| `node --test scripts/*.test.mjs` | exit 0、92/92 pass |
| `npm run build` | exit 0、87 pages |
| `npm run build:lib` | exit 0 |
| `npm run check:pre` | exit 0、4 checkerを実行 |
| `npm run check:all` | exit 0、5 checkerを実行 |
| `git diff --check` | exit 0 |

`check:all`はshared/aggregate surfaceに対する既存10件のstale advisoryを表示した。component固有pathのhard failureは0で、Task16 catalogの具体的観測は最終実装SHAで再取得済みである。

## base比較

- `src/components/ui`への追加はaccordion、collapsible、scroll-area、resizable、context-menu、dropdown-menu、drawer、hover-card、navigation-menu、popover、select、tooltipの12件だけ。
- npm dependency追加は`react-resizable-panels@^4.12.2`だけ。
- 既存dependencies / devDependenciesの変更・削除は0。
- 最終実装`03f451…`以降、component、preview、Light/Dark route、catalog、registry、provenance、selector、barrel、型契約、dependencyの対象path差分は0。
- repository由来Astro processは0。
- 最終ゲート後のworktreeはclean。

## ブラウザ証跡

各componentは実装commitを固定してからLight/Darkのisolated routeを実ブラウザで検証し、新規証跡commitを作成した。Portal群では実DOMのopen/close、keyboard、focus、background inertまたは非modal性、focus return、component固有slot、consoleを実測した。

Task16は最終実装`03f451…`でcatalog Light/Darkを再検証し、期待集合42件との完全一致、42/42可視、hydration完了、今回12件のsentinel 0、Portal 8件の閉状態、Context Menu triggerの`BUTTON`、console error/warning 0、JPEG実体・寸法・hash、cleanupを確認した。

## optional

- Hover Card preview内のプロフィールlinkはデモ用fragmentの到達先を持たない。component契約・主要操作・明示要件へ影響しないためoptionalとして保持する。
- 通常追加時の新規証跡作成と、後続レビュー修正時の既存証跡追補の運用境界は将来の手順改善候補とする。今回の証跡内容・hard gate・明示要件へ影響しない。

## 見ていない次元

- screen readerによる読み上げ全文、RTL、OS・ブラウザの組み合わせを変えた互換性は未実測。
- clean roundではブラウザ操作を再実行せず、最終実装以降の製品対象path差分0、既存の実ブラウザ証跡、Task16 JPEG実体を照合した。
