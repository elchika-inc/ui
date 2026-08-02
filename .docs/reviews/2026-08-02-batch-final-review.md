# バッチ4 最終群 最終レビュー

verified_impl_sha: a65e1b4eac0d299b392b1553b03a6c700cb4699d

## 結論

- base: `e47382a78f0fb8d1726061a383b69c21d0f2ba61`
- 最終実装SHA: `a65e1b4eac0d299b392b1553b03a6c700cb4699d`
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

`3272c29`のroundでは、TypeScript scannerがtemplate interpolation後のtail内にある`//` / `/*`を実commentと誤認するflagと、JS系sourceをmodule graphへ載せてもCLI報告対象から外すflagを検出した。`a65e1b4`でparser確定後のtoken境界からcomment rangeを収集し、単一の`SOURCE_GLOB`を解析・報告へ共有した。旧SHAでは対象testがRED、新SHAではGREENとなり、実CLIがMJS内の違反をexit 1で報告することを確認した。

最終clean roundはCore Logic、Security、証跡・検証契約の3席で実施した。各席が開始・終了のHEADを`a65e1b4eac0d299b392b1553b03a6c700cb4699d`へ固定し、worktree cleanを確認した。全席の結果は`flag=0 optional=0`だった。

## ACCEPTED_RISKS

### RISK-011

Calendarの上流由来レイアウトが80実行行を超える。リポジトリに当該上限はなく、上流slot対応を分割して保守差分を増やす方が総複雑さを高めるため、`.docs/risk-registry.md`の記録どおり受容する。

### RISK-012

standards checkerのclassName候補解析は、union computed key、helper引数置換、literal/equalityの完全な意味正規化、mutation-aware alias、独立分岐の候補爆発まで扱う完全なinterprocedural abstract interpreterにはしない。既定3ラウンドを超えたレビューで指摘がこの5境界へ収束し、補助checkerに独自言語解析器を持つライフサイクル総複雑さが61 componentの便益を超えるため受容する。

`RISK-012`外で検出したcomment token化とCLI集計境界は受容せず修正した。したがって、同riskのimpactにある「単一literal / 同一行の規定違反、arbitrary value、boolean data-insetには影響しない」という境界と最終実装は整合する。

## 最終ゲート

最終実装SHA `a65e1b4eac0d299b392b1553b03a6c700cb4699d` でfresh実行した。

| gate | 結果 |
|---|---|
| `npm run format` | exit 0、変更なし |
| `npm run lint` | exit 0、今回の変更による新規warningなし |
| `npm run typecheck` | exit 0、0 errors / 0 warnings / 0 hints |
| `node --test scripts/check-standards.test.mjs` | exit 0、全test pass |
| `node --test scripts/*.test.mjs` | exit 0、全test pass |
| `npm run build` | exit 0 |
| `npm run build:lib` | exit 0 |
| `npm run check:all` | exit 0、5 checkerを実行 |
| `git diff --check` | exit 0 |

`check:all`はshared/aggregate surfaceに対する既存55件のstale advisoryを表示した。component固有pathのhard failureは0である。standards CLIはJS/TS 8拡張子それぞれの違反行と終了失敗を実体probeで確認し、8拡張子のcomment-only fixtureは違反0、template tailの`https://`後にある2つのarbitrary valueは保持して検出した。

## ブラウザ証跡

各componentは実装commitを固定してからLight/Darkのisolated routeを実ブラウザで検証し、新規証跡commitを作成した。最終レビュー修正は`ab0623a80c20439574a74a1e8e9cf31e0571522f`で固定し、ChartとcatalogのLight/Darkを再検証して`.docs/reviews/recheck-ab0623a/2026-08-02-chart-preview.md`へ記録し、`968b497`で証跡をコミットした。

`968b497`以降の変更はchecker、checker test、risk registry、レビュー文書に限定され、component・preview・route・catalogの製品pathは変更していない。このため最終clean roundではブラウザ操作を再実行せず、既存の固定SHA証跡とevidence gateを照合した。

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
- 最終clean roundでは製品pathのブラウザ操作を再実行せず、固定SHA証跡と後続差分のscopeを照合した。
