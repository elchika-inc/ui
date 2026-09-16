verified_impl_sha: 1aa1c88c2e2e6b7fa0c45208386620f87aa21942

<!-- review-cycle:start 2026-09-16-motion-primitives-0 -->
# 2026-09-16 自作 component 登録のレビュー

- Cycle ID: `2026-09-16-motion-primitives-0`
- 対象 HEAD: `1aa1c88c2e2e6b7fa0c45208386620f87aa21942`（ラウンド1は `edc7fad0f6152aedd5f299e41c143e22f3929335`）
- 総ラウンド数: 2
- 終了理由: ラウンド1の flag 1件を修正し、ラウンド2で全5レンズが flag 0
- INSPECTION_STATUS: flag 0、optional 4件（有効な応答の重複を統合した未修正の論点数）
- ACCEPTED_RISKS: なし（未解決の flag なし）
- 確定した偽陽性: なし
- rubric: `.docs/plans/2026-09-16-motion-primitives.md` §4 / §A

## 実施方法

以下を Fresh Eyes → Security → Core Logic → Tests → Domain の順に、各レンズ fresh context で逐次実行した。両ラウンドとも5レンズを実施し、全呼び出しの exit は0。ラウンド2の Domain は初回応答の境界マーカーが欠落したため、指定どおり1回だけ再取得した。有効な応答を手修正せず採用した。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は担当6ファイルの `git diff origin/main`、担当6ファイル全文、spec §2 / §A / §4。司令塔の裁定により spec 追加 commit `04542a5` をレビュー用 diff から除外した。`.ts-review-graph/graph.db` は存在せず、グラフによるコンテキスト取得は行っていない。

| ラウンド | Fresh Eyes | Security | Core Logic | Tests | Domain |
|---|---:|---:|---:|---:|---:|
| 1 | 0 | 0 | 1 | 0 | 0 |
| 2 | 0 | 0 | 0 | 0 | 0 |

数字は flag 件数。

## 修正と検証

R1 Core Logic の参照先 type 不一致を修正した。同名の registry item があっても hook/UI の type が異なれば登録を止める。既存 `completeBlockRegistryDependencies` を再利用し、registry・provenance・astro の書き込み前に照合する。修正 commit は `1aa1c88c2e2e6b7fa0c45208386620f87aa21942`。

再現ケースを追加した `node --test scripts/add-component.test.mjs` は修正前 exit 1（pass 92 / fail 1 / skip 0）、修正後 exit 0（pass 93 / fail 0 / skip 0）。同名・異type の2方向を検査し、拒否時の登録データと preview の不変も確認した。

最終実装で §4.1〜5 を再実行した。各コマンドは単独実行し、§4.4 / §4.5 の順序を守った。

| コマンド | exit | 結果 |
|---|---:|---|
| `node scripts/check-standards.mjs` | 0 | 248ファイル、arbitrary-value 0 / motion-literal 0 |
| `npm run lint` | 0 | 486ファイル、warning 201 / info 3 / error 0 |
| `node --test scripts/check-completeness.test.mjs` | 0 | pass 95 / fail 0 / skip 0 |
| `node --test scripts/add-component.test.mjs` | 0 | pass 93 / fail 0 / skip 0 |
| `npm run build:lib` | 0 | JS・型定義生成 |
| `npm run check:props` | 0 | props契約通過 |
| `node scripts/check-completeness.mjs` | 0 | 61 component / 28 block |
| `node scripts/check-preview-render.mjs` | 0 | selector宣言通過 |
| `npm run registry:build` | 0 | registry・index生成 |
| `node scripts/check-distribution.mjs` | 0 | 共有配布物が原本と一致 |

既存 test の削除行0、skip追加0。baseline 90件 / 87件の test 行をすべて保持した。全件テスト・typecheck・check:all は指定によりローカルでは実行せず PR CI で代替する。§4.6〜8 はこのPRのローカル検証対象外。

A.5 の一時 probe は修正後の実装でも再実行した。scaffold / resync / build:lib / completeness は exit 0、resync は「更新なし」、completeness は一時的に62 component / 28 block。上流キー混入時は exit 1 で `zz-probe: 自作 component は upstreamPathSha を持たない` を検出した。registry・provenance・barrel を復元し、一時4ファイルを削除、build:lib を再生成後に61 component / 28 blockを確認した。実体の存在・CLI実行・生成内容・拒否時の動作を検証した。

## optional の記録

有効な応答の未修正の論点は次の4件。終了条件には含めない。参照先typeの指摘は修正済み。

1. 空白のみの `--resync --modified` は component と block で扱いが異なる。§Aの「渡されたときだけ上書き」を維持した。
2. component実体の欠落時は専用文言ではなく Node の ENOENT で停止する。
3. `--original` を付けずに自作へ `--force` を使う誤用の origin ガードは今回の追加対象外。手順書の禁止を維持した。
4. 既存の全キーを `x` にする fixture は origin による早期検出になる。各キーの個別形式テストは維持されている。

以下に各レンズの本文を原文のまま保存する。

## R1 / fresh-eyes

LGTM／optional: resync 系の modified 上書き判定に軽微な非対称あり
optional: `resyncComponentHash`（scripts/add-component.mjs:1166）は `modified !== undefined` で上書き判定するが、`resyncBlockHashes`（同 :1066）は `if (modified)` の truthiness 判定。`--resync --modified "   "`（trim 後に空文字）を渡すと component 側だけ既存の `modified` を空文字で上書きしてしまう（block 側は無変更のまま）。`check-completeness` の `modified: /\S/` で最終的には検出されるが、元の記述はその時点で失われる。空白のみの `--modified` という意図的な入力が前提のため optional。
optional: `resyncComponentHash`（scripts/add-component.mjs:1163）は `readFileSync` 前に `existsSync` チェックが無く、`resyncBlockHashes`（:1056-1058）にある「来歴にある ${path} が存在しない」という明示的な throw を欠く。実体が無い場合は Node の生の ENOENT で落ちるが、fail-closed 自体は保たれる。

## R1 / security

LGTM／optional: `--force`（`--original` 併用なし）で既存の `elchika original` component を上書きする経路に origin ガードが無い（block レーンの `blockOverwriteTargets` と非対称）。`--resync` の `modified !== undefined` 判定は空白のみの `--modified` を trim 後の空文字列として書き込みうる（`resyncBlockHashes` は truthy 判定）。いずれも手順書が明示的に禁止する誤用や下流の fail-closed 検査で吸収され、本 PR の担当範囲・spec §A の要求外のため flag しない。

## R1 / core-logic

flag 1件

[ISSUE] scripts/add-component.mjs:1097-1102 / 確信度85%
問題: `scaffoldOriginalComponent` の registry dependency 解決が、`registryItemImports(source)` が返す `expectedType`（`@/components/ui/<x>` なら `registry:ui`、`@/hooks/<x>` なら `registry:hook`）を無視し、`registry.items.some((item) => item.name === dependency)` と名前一致だけで存在確認している。既存の block 側 `completeBlockRegistryDependencies`（同ファイル内で export 済み）は同じ場面で `candidates.find((candidate) => candidate.type === expectedType)` により type 一致まで確認しており、既存機構が使えるにもかかわらず自前の簡易チェックへ降りている（降りた理由は成果物に記載なし）。
再現条件: `registry.json` に `zz` という名前の `registry:ui` item のみが存在し、hook としての `zz` は未登録の状態で、自作 component が `import { useZz } from "@/hooks/zz"` を含む場合、`scaffoldOriginalComponent` は type 不一致のまま `registryDependencies: ["@elchika/zz"]` を記録する。`componentProblems`（check-completeness.mjs）は component の import 内容を検査しない（`blockSourceProblems` 相当の検査が component レーンに無い）ため、この不整合は `check-completeness` を含む既存ゲートを素通りし、配布物の利用者は hook を期待して `@elchika/zz`（ui item）を install することになる。
修正案: `registryItemImports(source)` の分解代入で `expectedType` も受け取り、`registry.items.some((item) => item.name === dependency && item.type === expectedType)` のように type も照合する。あるいは block 側と同じ `completeBlockRegistryDependencies(name, [], source, registry.items)` をそのまま呼び出して既存機構に寄せる。

---
optional（flagにはしない）:
- `resyncComponentHash`（`modified !== undefined` で更新）と `resyncBlockHashes`（`if (modified)` の truthy 判定で更新）とで `--modified` の空文字列（例: `--resync --modified "   "` をトリムした結果）に対する挙動が非対称。component 側だけ `modified: ""` を書き込みうるが、次回の `check-completeness` が `modified が無い` として検出するため自己修復的であり、意図的な空白入力という限定的な条件でしか発生しない。
- `resyncComponentHash` は対象の `.tsx` が存在しない場合、`resyncBlockHashes` のような専用メッセージ（`${name}: 来歴にある ${file.path} が存在しない`）を出さず生の ENOENT を投げる。副作用（`writeJson`）より前に失敗するため実害は無い。

## R1 / tests

LGTM

## R1 / domain

LGTM／optional: `--force`（`--original` なし）は component レーンで origin を検査しないため、同名の shadcn upstream item が存在する `elchika original` component に対して実行すると CLI 実行・provenance 上書き（`origin: "shadcn/ui registry"` への書き換え）が起こりうる。block レーンには `blockOverwriteTargets` に同種の origin ガードがあるが component レーンには対応が無い（scripts/add-component.mjs:1223-1238 の衝突検査は block 由来の3条件のみ）。§A.2 はこのガードを要求しておらず、手順書も「`--force` は使わない」と明記して運用でカバーする設計のため flag はしない。あわせて `scaffoldOriginalComponent` の registryDependency 検証は存在チェックのみで type 一致までは見ていない（`completeBlockRegistryDependencies` は type も検証）が、これも spec は存在チェックのみを要求しており optional。

## R2 / fresh-eyes

LGTM／optional: `resyncComponentHash`（scripts/add-component.mjs:1145）は `modified !== undefined` で上書き判定するため、`--resync --modified " "`（空白のみ）を渡すと `entry.modified` が空文字列で保存されうる（兄弟関数 `resyncBlockHashes` は truthy 判定なのでこのケースでは更新しない、という非対称）。空文字は `check-completeness` の `modified: /\S/` で後続検出されるため fail-closed ではあるが、意図的な空白入力という極端なケースであり、修正は必須ではない。

## R2 / security

LGTM／optional: --resync --modified の空白引数がコンポーネント経路とブロック経路で扱いが異なる

optional: `resyncComponentHash`（scripts/add-component.mjs:1161）は `if (modified !== undefined) entry.modified = modified;` であるのに対し、`resyncBlockHashes`（同:1066）は `if (modified) entry.modified = modified;` である。`parseArgs` は `--resync` 指定時に `--modified` の trim 済み値が空文字列でも通すため（`!resync && !modified?.trim()` のガードは resync 時にスキップされる）、`node scripts/add-component.mjs <name> --resync --modified " "` を自作 component に対して実行すると `modified` が空文字列で上書きされ、「上流から何を変えたかの唯一の記録」を消してしまう。block 側は falsy 判定のため同じ入力でも記録を保持する。両者を `if (modified)` に揃えることを推奨する。git で復元可能、check-completeness の `modified が無い` 検査で下流検出される自己起因の縮退入力であり、ローカル信頼境界内の CLI 誤操作にとどまるため flag ではなく optional とする。

## R2 / core-logic

LGTM

## R2 / tests

LGTM

## R2 / domain

LGTM／optional: --resync の component/block 経路間の挙動差異と若干のUX不整合のみ
- `resyncComponentHash`（add-component.mjs:1161）は `if (modified !== undefined)` で上書き判定するが、`resyncBlockHashes`（:1066）は `if (modified)` で判定している。`parseArgs` は `modified?.trim()` を返すため、`--resync --modified " "` は空文字 `""` を通し、component 側では `modified: ""` として書き込まれてしまう（block 側はスキップされ既存値を保つ）。後続の `check-completeness` が `modified が無い` として検出するため fail-closed ではあるが、2つの resync 経路の挙動を揃えたほうがよい。
- `resyncComponentHash`（:1158）はファイル存在チェック（`existsSync`）を経ずに `readFileSync` するため、対象ファイルが無い場合に `resyncBlockHashes`（:1056）が出す `${name}: 来歴にある ${file.path} が存在しない` のような分かりやすいエラーではなく、生の ENOENT が出る。UX/一貫性のみの問題。
- 既存テスト「来歴の全キーが x なら形式違反を検出する」（check-completeness.test.mjs:294）は、origin 追加後は `origin が未対応: x` で早期リターンし、以前検証していた各キーの形式チェックを通らなくなっている。個別キーの形式検査は他のテストでカバー済みであり、block 側の同種テストも既存挙動のままなので影響は軽微。

## R2 Domain 初回の形式不正応答（判定には不採用）

LGTM／optional: `resyncComponentHash`（scripts/add-component.mjs:1145-1167）が block 版と細部で非対称。

- `modified` の上書き条件が `resyncBlockHashes`（1066行目、truthy 判定）と異なり、`resyncComponentHash`（1161行目）は `modified !== undefined` を条件にしている。`--resync --modified " "` のように空白のみを渡すと parseArgs の trim で `""` になり、component 側だけ既存の `modified` を空文字で上書きできてしまう（`check-completeness` の `modified: /\S/` が下流で検知するため correctness までは至らない）。手順書「`--modified` を省略すると既存の説明を保つ」の趣旨に対し、block と component で「空白のみ渡した場合」の挙動が異なる点は仕様として明記する価値がある。
- 実体ファイルが存在しない場合、block 版（1056-1058行目）は `${name}: 来歴にある ${path} が存在しない` という専用エラーを出すが、component 版は `readFileSync` の生の ENOENT がそのまま漏れる。UXのみの差分。
- CONTRIBUTING.md:39 の追記「自作 component は `--original` で記録する。」は、直前の文が `record-provenance.mjs` の説明のため、どのコマンドのオプションか一読でやや分かりにくい（spec の文言どおりではある）。

いずれも correctness・セキュリティ・明示要件には影響しないため flag とはしない。

<!-- review-cycle:end 2026-09-16-motion-primitives-0 -->
