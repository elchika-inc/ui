# バッチ4 最終群 最終レビュー

verified_impl_sha: 0869e7814b30199387df5f135b19b037530b6d70

## 結論

- base: `e47382a78f0fb8d1726061a383b69c21d0f2ba61`
- 最終実装SHA: `0869e7814b30199387df5f135b19b037530b6d70`
- 最終判定: **非受容flag 0**
- `ACCEPTED_RISKS`: `RISK-011`、`RISK-012`
- mainへのmerge: 実施しない

指定19 component、isolated/catalog preview、全PascalCase exportのProps型、registry・来歴・selector・Light/Dark routeを追加した。レビューで検出した実装、証跡、検査器のflagはすべて修正し、固定SHAで3席のclean roundを通過した。

## レビューサイクル

主要な修正commit:

- `34f3122`: 最終ゲートの偽greenを追加で防止
- `617c07c`: 検証契約の残る迂回経路を閉鎖
- `fec0091`: 検証ゲートの履歴・字句scope境界を修正
- `0a3a499`: 検証ゲートの残存bypassを閉鎖
- `fd95001`: checkerを実bindingと証跡file型へ整合
- `9313934`: 条件式とimport解決の境界を修正
- `a574ad6`: 値制約とmodule解決を強化
- `f651d22`: 完全な抽象実行を行わない限界を`RISK-012`として明示受容
- `3272c29`: comment内の規約例を除外し、JS/TS module graphを拡張
- `a65e1b4`: template tailのcomment-like textを保持し、解析対象とCLI報告対象を統一
- `8542567`: Node 22で実装元のChart serializerを検証し、CI失敗ログを常時表示
- `cf6ae6c`: 配布`.d.ts`の内部`@/` aliasをTypeScript ASTで相対`.js` pathへ書き換え
- `5738693`: 配布型buildの削除・書込み境界をrepo内へ固定し、部分writeを防止
- `0869e78`: カタログの公開表示3箇所から「検証用」を除去
- `0b57ea1`: 公開文言変更後のLight/Darkカタログ横断証跡と再取得手順を追加
- `dd9a4a7`: 要求viewportとページ内実測viewportの記録を分離

`3272c29`のroundでは、TypeScript scannerがtemplate interpolation後のtail内にある`//` / `/*`を実commentと誤認するflagと、JS系sourceをmodule graphへ載せてもCLI報告対象から外すflagを検出した。`a65e1b4`でparser確定後のtoken境界からcomment rangeを収集し、単一の`SOURCE_GLOB`を解析・報告へ共有した。旧SHAでは対象testがRED、新SHAではGREENとなり、実CLIがMJS内の違反をexit 1で報告することを確認した。

最終clean roundはCore Logic、Security、証跡・検証契約の3席で実施した。各席が開始・終了のHEADを`a65e1b4eac0d299b392b1553b03a6c700cb4699d`へ固定し、worktree cleanを確認した。全席の結果は`flag=0 optional=0`だった。

PRの初回CIでは、Node 22.12.0がtestからの`.ts`直接importを`ERR_UNKNOWN_FILE_EXTENSION`で拒否した。ローカルNode 26では通っていたため、実装元`chart-style.ts`をTypeScript APIでES2022 ESMへtranspileし、Error diagnosticsをfail-closedに検査してからdata URL importする経路へ変更した。あわせてUnit tests stepはtestのexit codeを保存し、出力を常に表示してから元の成否を返すよう修正した。

CI修正後はCore Logic、Security、証跡・検証契約の3席で再度clean roundを実施した。各席が開始・終了のHEADを`854256797834433a14013869b70d6c85e876468b`へ固定し、worktree cleanを確認した。全席の結果は`flag=0 optional=0`だった。Node 22.12.0/Linuxで対象test 2件と全testを実行し、失敗ログの表示と元exit codeの保持、0件空走guardも負のprobeで確認した。

次のCI run `30744927162`ではUnit testsが成功した一方、Props contractがTS2307を17件報告した。`tsc`が生成`.d.ts`内の`@/components/ui/*`を保持し、利用側にrepo固有paths設定がないことが原因だった。Task 10にもProps contractの実行が欠けていたため、`build:lib`をclean、bundle、declaration生成、TypeScript ASTによるmodule specifier書換えの順へ変更し、`check:props`をCIとローカルの単一入口にした。書換え対象はimport、export、import type、external module referenceだけで、外部package specifierと通常文字列は保持する。

実際のdesign-sync reader `design-sync/lib/dts.mjs`を固定commit `656021e2fb804aa60b6f75b3ea29ffcfcf26bd85`から一時取得し、ts-morph 28.0.0で生成65 declarationを読み込ませた。内部依存を持つ代表10 exportはすべて公開型、非空body、期待するimported propsへ到達し、`: any;`は0だった。

Security roundでは、clean対象が呼出元CWDに依存すること、lib root symlinkでrepo外を書き換え得ること、script symlink経由のdirect-runがno-opになることをflagし、後半parse失敗時の部分writeをoptionalとした。`5738693`でscript実体相対の固定lib、root symlink拒否と書込み直前containment、全件検証後write、realpathによるdirect-run判定へ修正した。固定SHA `0869e78`のroundでSecurityは`flag=0 optional=0`、lib-build testは9/9だった。

カタログ公開文言変更後、Correctness roundは旧集約証跡との不一致をflagした。Light/Dark各3 fresh tabで再取得し、61件の集合一致、不可視・sentinel・overlay・active toast・console error / warning・resource failureが0、各171 resourceが全200であることを確認した。証跡整合性roundでは要求viewport 1440x900を実測値としていた誤記をflagし、採用6 runの`innerWidth / innerHeight` 1512x772と分離した。修正後HEAD `dd9a4a7`のclean roundは`flag=0 optional=0`だった。CorrectnessとSecurityも固定HEAD `0b57ea1`で`flag=0 optional=0`を確認しており、後続差分は証跡のviewport 1行だけである。

## ACCEPTED_RISKS

### RISK-011

Calendarの上流由来レイアウトが80実行行を超える。リポジトリに当該上限はなく、上流slot対応を分割して保守差分を増やす方が総複雑さを高めるため、`.docs/risk-registry.md`の記録どおり受容する。

### RISK-012

standards checkerのclassName候補解析は、union computed key、helper引数置換、literal/equalityの完全な意味正規化、mutation-aware alias、独立分岐の候補爆発まで扱う完全なinterprocedural abstract interpreterにはしない。既定3ラウンドを超えたレビューで指摘がこの5境界へ収束し、補助checkerに独自言語解析器を持つライフサイクル総複雑さが61 componentの便益を超えるため受容する。

`RISK-012`外で検出したcomment token化とCLI集計境界は受容せず修正した。したがって、同riskのimpactにある「単一literal / 同一行の規定違反、arbitrary value、boolean data-insetには影響しない」という境界と最終実装は整合する。

## 最終ゲート

配布型安全修正SHA `5738693c3135a25dd3779d527deb5bf2ad515776`をNode 22.23.2/Linuxのfresh cloneで実行した。そこから最終実装SHA `0869e7814b30199387df5f135b19b037530b6d70`までの製品差分はcatalog表示文字列3行だけで、最終SHAはNode 26/macOSの全gateと固定SHA一時cloneのbrowser buildで別途検証した。

| gate | 結果 |
|---|---|
| `npm run format` | exit 0、変更なし |
| `npm run lint` | exit 0、今回の変更による新規warningなし |
| `npm run typecheck` | exit 0、0 errors / 0 warnings / 0 hints |
| `node --test scripts/check-standards.test.mjs` | exit 0、全test pass |
| 最終SHA `node --test scripts/*.test.mjs` | exit 0、172 test pass |
| Node 22.12.0/Linux `node --test scripts/chart-style.test.mjs` | exit 0、対象test pass |
| 安全修正SHA・Node 22.23.2/Linux `node --test scripts/*.test.mjs` | exit 0、172 test pass |
| 最終SHA・固定SHA一時clone `npm run build` | exit 0、125 pages |
| 安全修正SHA・Node 22.23.2/Linux `npm run build:lib` | exit 0、declaration 65件・内部alias残存0 |
| 最終SHA `npm run check:props` | exit 0 |
| `npm run check:all` | exit 0、5 checkerを実行 |
| 安全修正SHA・Node 22.23.2/Linux `npm audit --omit=dev --audit-level=high` | exit 0、production vulnerability 0 |
| `git diff --check` | exit 0 |

`check:all`はshared/aggregate surfaceに対する既存55件のstale advisoryを表示した。component固有pathのhard failureは0である。standards CLIはJS/TS 8拡張子それぞれの違反行と終了失敗を実体probeで確認し、8拡張子のcomment-only fixtureは違反0、template tailの`https://`後にある2つのarbitrary valueは保持して検出した。

## ブラウザ証跡

各componentは実装commitを固定してからLight/Darkのisolated routeを実ブラウザで検証し、新規証跡commitを作成した。最終レビュー修正は`ab0623a80c20439574a74a1e8e9cf31e0571522f`で固定し、ChartとcatalogのLight/Darkを再検証して`.docs/reviews/recheck-ab0623a/2026-08-02-chart-preview.md`へ記録し、`968b497`で証跡をコミットした。

公開表示変更は`0869e78`へ固定してから、Light/Dark各3 fresh tabでカタログ横断走査を再実行した。新規証跡は`.docs/reviews/recheck-0869e78/`へ旧証跡を上書きせず保存した。titleはLight=`カタログ — elchika-inc/ui`、Dark=`カタログ Dark — elchika-inc/ui`、両h1=`カタログ`、旧文言0件だった。JPEGはBrowser Pluginのraw PNGをquality 90でJPEGへ変換し、JFIF magic、1512x9313、bytes、SHA-256を検査した。

component固有実装、preview、個別route、registry、provenanceは`0869e78`で差分0だったため、component固有証跡61件は再取得していない。集約証跡はadvisoryだがcatalog / index自身の表示内容が変わった場合は再取得する契約を`.docs/component-addition-procedure.md`へ明記した。

## optional

- Carouselのeffect cleanupは`reInit` listenerを解除しない。
- 証跡の一部にローカル絶対pathとprocess IDが記録される。
- READMEの`shadcn@latest`表記とdependency version rangeは再現性改善の余地がある。
- `cmdk`はBase UIと並行してRadix依存を推移的に導入する。
- component追加手順のprops forwarding検査はmechanism寄りであり、将来の手順改善候補である。
- Carouselのvertical arrow icon semanticsは改善余地がある。
- full dev dependency auditでは低severityの`esbuild` advisoryが残るが、production dependency auditには影響しない。
- 証跡画像のhash主張は全項目が自動検証されるわけではない。
- Chart tooltipの認知的複雑性、Sidebarの冗長dependency、registry hook自動化は将来の保守改善候補である。

いずれもcorrectness、security、明示要件へ影響しないためflagへ含めない。

## 見ていない次元

- screen readerによる読み上げ全文、RTL、OS・ブラウザの組み合わせを変えた互換性は未実測。
- 最終証跡clean roundではブラウザ操作を再実行せず、採用済み6 run、保存JPEG、固定SHA、後続差分のscopeを照合した。
