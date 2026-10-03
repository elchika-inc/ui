# classNameExpressions のリファクタリング計画

- 実装担当: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行）
- 作業ブランチ: `naoto24kawa/refactor-class-name-expressions`（base `d58e3e3`）
- 要件正本: standards `CODING.md`（origin/main）と `standards-refactor` スキルの段0〜5。対象範囲は、長い関数・深いネストの候補のうち、ユーザーが「残りの箇所ぜんぶ、PR を分けて」と指示した 2 つの 1 つ、`scripts/check-standards.mjs` の `classNameExpressions`（もう 1 つの `runAddComponent` は PR #108）。

## 変更と範囲

`classNameExpressions`（445 行の closure）を、振る舞いを変えずに CODING.md に沿って読みやすく書き直す。先に、既存テストが押さえていなかった分岐を mutation で洗い出し、公開面（`checkFile` / `checkFiles` の違反）で固定してコミットし、その後はテストファイルを変更しない。

対象外: 候補集合の組み立てと枝刈りのアルゴリズムの変更、`classNameExpressions` の外の関数（`createClassAnalysis`・`statefulRingFragmentViolations`・`checkFileWithAnalysis` など）、公開面（export 3 行・違反の rule・line・text）の変更、`biome.json` と `package.json` の変更。

## 実行者

既定は Codex worker への委任である。今回は着手時点で、Orca の codex worker が 5 本稼働していた（同時実行は 2 本までという運用ルールを超えている）。Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる（brain URISK-161）。そのため司令塔の Claude が Orca worktree で実行し、レビューは fresh context のレビュアー（Sonnet・読み取り専用）が行う。

## 手順

1. 段0: Key Commands の test と check のベースラインを取り、対象関数の長さとネストを測る。`classNameExpressions` の出力全体を、本体の CLI と同じ glob の全ソースに対して書き出すハーネスで、変更前の出力を保存する。
2. 段1: CODING.md の節ごとに、読みにくい箇所と直さない箇所を一覧にする。
3. 段2: mutation で分岐を 1 つずつ壊し、既存テストで検出できないものを洗い出す。公開面で区別できるものについて、壊すと違反の結果が変わる入力のテストを足す（期待値は今の実装の実測値から作る）。足したテストが狙った mutation で落ちることを確かめ、テストだけを 1 コミットにする。
4. 段3: 原則ごとに小さく書き直し、コミットごとに `node --test scripts/check-standards.test.mjs` とハーネスの出力比較を回す。helper の移動は、インデントを除いた非空行の多重集合が一致することでも確かめる。
5. 段4: test と check を再実行し、段2から HEAD までのテストファイル差分が空であることと、前後の実測を確認する。
6. `lens-review-cycle` の 5 レンズを最大 3 ラウンドで回す。
7. 段5: PR を作成し、CI の必須チェックを確認する。

## 成功基準（rubric）

- R1: 段0で、`node --test --test-concurrency=1 "scripts/*.test.mjs"`・`npm run lint`・`npm run typecheck` が worktree で exit 0。
- R2: 段2で、追加したテストそれぞれが、狙った mutation で結果を変える（落ちる）。足した後、mutation のうち公開面から観測できるものはすべて検出される。
- R3: 段2のコミットはテストファイルだけを変更している。
- R4: 段3の各コミットで `node --test scripts/check-standards.test.mjs` が exit 0 で、ハーネスの出力が変更前とバイト単位で一致する。
- R5: `git diff --exit-code --stat <段2のコミット>..HEAD -- '*.test.*' '*.spec.*' 'tests/' '__tests__/'` が exit 0 で出力が空（base 追随より前に実行する）。
- R6: `scripts/check-standards.mjs` の export の行が変更前と一致する。
- R7: 段4で、test・lint・typecheck・`node scripts/check-standards.mjs` が exit 0。関数の長さとネストを段0と同じ数え方で測り、前後を並べる。
- R8: レビューサイクルが flag 0 で終わる。
- R9: PR の必須チェック `Lint, typecheck, test & build` が成功する。
