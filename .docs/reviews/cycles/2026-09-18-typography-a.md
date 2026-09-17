verified_impl_sha: 6ca8ee243e54ff2c215e4342e71f6932b8dc5eaa

<!-- review-cycle:start 2026-09-18-typography-a -->
# 組版トークン PR A のレビューサイクル

- **Cycle ID**: 2026-09-18-typography-a
- **対象 HEAD**: 6ca8ee243e54ff2c215e4342e71f6932b8dc5eaa
- **総ラウンド数**: 1
- **終了理由**: 全レンズ flag 0（LGTM、optionalは終了条件外）
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -
- **確定した偽陽性**: なし
- **INSPECTION_STATUS**: inspected。flag 0、optional 6件（レンズ間の重複を含む）。全内容は下記に原文で保存。

## 対象と実行条件

spec §5 の明示指定に従い5レンズを fresh context で1つずつ順に実行した。書き込みツールを渡さず、各コマンドの終了コードは0。入力は担当7ファイルの origin/main からのdiff・変更ファイル全文・spec §1 / §2 / §4 / §A。司令塔のleading件数とbadge溢れの裁定も併記した（badgeの追加裁定はSecurity以降）。先頭spec commit自体はレビュー対象に含めていない。Ambiguity / Altitudeは今回の明示構成に含めない。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

対象: `src/styles/global.css`、`scripts/theme-typography.test.mjs`、`src/site/documentation-shell.tsx`、`src/site/documentation-home.tsx`、`src/site/component-index.tsx`、`src/site/component-documentation.tsx`、`.docs/component-addition-procedure.md`。

`.ts-review-graph/graph.db` は存在せず、specが指定した入力を用いた。レビュー開始は実装commit前であり、全7ファイルの `git hash-object` が検証SHA時点と同一であることを終了時に確認した。Fresh Eyesの出力に冒頭の検査実況1行があり、最初の保存用検査が余分な前置きを理由に拒否したが、所見ブロックは1個で完全だったため、その本文を原文のまま保存した。再レビューを要する所見の欠落・破損はない。

## 結果と対応

初回からflagは0件で、修正ラウンドは不要。optionalは変更を求める明示要件ではないため採用せず、全内容を保存した。動的検証で判明したbadge 7件の溢れは、司令塔裁定によりPR本文のACCEPTED_RISKSへ記録し、B1 / B2の `leading-none` 追加と証跡確認で解消する。

ローカルの指定単体テストは214/214成功、fail / skip 0。新規6件の接続前RED（6失敗）と接続後GREENも確認済み。standards / lint / build:lib / check:props / completeness / preview render / registry:build / distribution / build:site は各exit 0。全件テスト・typecheck・check:allの代替はPR CIで確認する。共有面のブラウザ実測は [report](../2026-09-18-typography-a/report.md) に分離して保存し、静的レビューを動作検証の代わりにはしていない。

Domain原文の「全12種の組版トークン」は件数に誤記がある。実装とテストが突合する値は22件（text 12 / leading 6 / tracking 4）であり、ここでは実測値を用いる。所見原文は改変しない。

## レンズごとの所見原文

### fresh-eyes

LGTM／optional: 2件

global.css の直書き値（--text-*/--leading-*/--tracking-*、計22トークン）を tokens.css の :root と1件ずつ文字列突合し、theme-typography.test.mjs の正規表現ロジック（`@theme inline` を誤マッチしないこと、`--text-*: initial` 行が突合対象から正しく除外されること、`:root` ブロック抽出の境界）を検証し、site 側の再タグ付け10箇所（leading-6/7/8→normal/relaxed）・eyebrow2箇所（→text-3xs + tracking-label）・text-xs→text-2xs 3箇所・tracking-tight→tracking-heading 4箇所を diff と全文で1件ずつ確認しました。`grep -rEn "tracking-(tight|wider|widest)|leading-[0-9]|text-xs\b" src/site` は0件で、A.3 の完了条件を裏取りしました。`--font-heading--font-feature-settings` は Tailwind v4 の `--font-*` namespace が公式サポートする companion で、`@theme inline` のリテラル展開仕様とも整合します。手順書追加は9行で12行以内の制約を満たします。correctness・セキュリティ・明示要件に影響する問題は見つかりませんでした。

optional:
- `scripts/theme-typography.test.mjs` の「サイズ別行間」テストが `assert.deepEqual` で配列比較しており、global.css 側の宣言順序まで一致を要求しています。値が正しくても宣言順を入れ替えただけで fail するため、順序に依存しない比較（Map 比較や `Object.fromEntries` の deepEqual 等）にすると頑健性が上がります。
- 新規 `@theme { … }` ブロックのインデントが2スペースで、直前の `@theme inline { … }` や `:root { … }` の4スペースと揃っていません。spec A.1 のコードブロックをそのまま転記した結果であり実害はありませんが、統一すると読みやすくなります。

### security

LGTM

### core-logic

LGTM／optional: 1件

optional:
- `scripts/theme-typography.test.mjs:71-79`（「サイズ別行間は spec §1.1 の割り当てと一致する」テスト）: `declarations()` が返す `Map` を `[...Map].filter(...)` で配列化し、`lineHeights` から作った期待配列と `assert.deepEqual` で順序込み比較している。現状は global.css の `@theme` ブロック内の記述順が `lineHeights` の定義順（3xs→2xs→xs→sm→base→lg→xl→2xl→3xl→4xl→5xl→6xl）と一致しているため通るが、将来 `@theme` ブロック内でトークンの並びを変えるだけで、値自体は正しくてもこのテストが fail する。`Object.fromEntries` に変換してキーごとの値比較にする、または比較前に両者をソートすると順序非依存になる。correctness には影響しないため optional。

### tests

LGTM／optional: 3件

`scripts/theme-typography.test.mjs` を対象に、正規表現ロジックと `tokens.css` / global.css 実データを手動でトレースしました。`assertMatchesTokens` のキー集合比較・値比較は tokens.css の `:root`（12〜243行）全宣言と global.css の非 inline `@theme` ブロック全宣言を実際に照合した結果、完全一致することを確認しました。`--text-*: initial;` は `[\w-]+` に `*` がマッチせず正しく除外され、`@theme\s*\{` は `@theme inline {` にマッチしないため非 inline ブロックのみを正しく抽出できています。spec §A.2 の要求（tokens.css 突合、§1.1 行間表との一致、7xl/loose 不在、palt 検査、陽性対照1件以上、`test(` 4件以上）はすべて満たされています。correctness・セキュリティ・明示要件に影響する flag 相当の問題は見当たりません。

optional:
- `scripts/theme-typography.test.mjs:72` `assert.deepEqual(actual, expected)` は配列同士の比較で、global.css 内の記述順（Map挿入順）と `Object.entries(lineHeights)` の宣言順が一致することに依存しています。将来 global.css 側でトークンの並び順だけを変えても意味的には等価なのに失敗し、diff も分かりにくくなります。ソートしたペア配列や `Object.fromEntries` 同士の比較にすると順序非依存になります。
- `scripts/theme-typography.test.mjs:96-99`（2件目の陽性対照）は `assert.throws` の検証が `{ code: "ERR_ASSERTION" }` のみで、キー欠落による失敗であることを特定していません。無関係な理由で先行の `assert.equal(blocks.length, 1, ...)` 等が別の AssertionError を出しても「成功」してしまい、90〜93行目の陽性対照より検証が緩くなっています。`/text-3xs/` などメッセージ内容を条件に含めると意図した失敗経路であることを保証できます。
- `scripts/theme-typography.test.mjs:83-87` の palt 検査用正規表現は `globalCss` 全体に対して `assert.match` しており、spec §A.1 が想定する「`@theme inline` ブロック内」という文脈までは検査していません（`--font-heading:` の直後という隣接条件のみ）。同じ2行がブロック外に置かれても通ってしまいますが、現状のリスクは低いです。


### domain

LGTM

確認事項（flag無し理由の記録）:
- `src/styles/design-system/tokens.css`(76〜89行)の`:root`に`--leading-none: 1`を含む全12種の組版トークンが存在し、`global.css`の非inline `@theme`ブロックと値・表記(`0.02em`, `0.6875rem`等)まで完全一致することを確認した。`:lang(en)`ブロック(303〜310行)は別セレクタであり、`theme-typography.test.mjs`の`:root\s*\{([^}]+)\}`は最初の`:root`ブロックのみを正しく拾うため、`assertMatchesTokens`のキー集合完全一致は成立する。
- spec A.3が列挙する再タグ付け対象(`text-xs`→`text-2xs`/`text-3xs` 5箇所、`tracking-tight`→`tracking-heading` 4箇所、数値`leading-6/7/8`→`leading-normal`/`leading-relaxed` 司令塔裁定通り10箇所)は、site 4ファイルの全文で漏れなく対応しており、一覧に無い箇所への独断変更も見当たらない。
- badge等の`scrollHeight`溢れは司令塔裁定によりACCEPTED_RISKSとして受容済みのため、flag対象としていない。

<!-- review-cycle:end 2026-09-18-typography-a -->
