# resolveToken のリファクタリング計画

- 実装担当: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行）
- 作業ブランチ: `naoto24kawa/refactor-resolve-token`（base `5995da4`）
- 要件正本: standards `CODING.md`（origin/main）と `standards-refactor` スキルの段0〜5。対象範囲はユーザーが候補から選んだ `scripts/contrast.mjs` の `resolveToken`。

## 変更と範囲

`resolveToken` を、振る舞いを変えずに CODING.md に沿って読みやすく書き直す。先に現在の振る舞い（既知のバグを含む）をテストで固定してコミットし、その後はテストファイルを変更しない。

対象外: `resolveToken` 以外の関数の書き直し（同じファイルの `resolveScalar`・`parseAlpha` を含む）、見つけたバグの修正、公開面（export・引数・戻り値の形・problem の文言）の変更、`biome.json` と `package.json` の変更。

## 実行者

既定は Codex worker への委任である。今回は着手時点で、別リポの codex worker 2 本が稼働していた（同時実行は 2 本までという運用ルールに当たる）。Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる（brain URISK-161）。そのため司令塔の Claude が Orca worktree で実行し、レビューは fresh context のレビュアー（Sonnet・読み取り専用）が行う。

## 手順

1. 段0: Key Commands の test と check のベースラインを取り、対象関数の長さとネストを測る。
2. 段1: CODING.md の節ごとに、読みにくい箇所と直さない箇所を一覧にする。
3. 段2: テストの不足類型を足し、実装を壊すと落ちることを確かめ、元に戻して緑を確認してから、テストだけを 1 コミットにする。
4. 段3: 原則ごとに小さく書き直し、コミットごとに test を緑にする。
5. 段4: test と check を再実行し、段2から HEAD までのテストファイル差分が空であることと、前後の実測を確認する。
6. `lens-review-cycle` の 5 レンズを最大 3 ラウンドで回す。
7. 段5: PR を作成し、CI の必須チェックを確認する。

## 成功基準（rubric）

- R1: 段0で、`node --test --test-concurrency=1 "scripts/*.test.mjs"` と `npm run lint` が exit 0。`npm run typecheck` は main checkout でローカル OOM する既知の事象があるため、結果を記録したうえで、worktree での実行と CI の必須チェックで確認する。
- R2: 段2で追加したテストが、意図的に壊した実装で 1 件以上失敗し、元に戻すと全件成功する。追加したテスト 1 件ごとに、落とす mutation が少なくとも 1 つある。
- R3: 段2のコミットはテストファイルだけを変更している。
- R4: 段3の各コミットで `node --test scripts/contrast.test.mjs` が exit 0。
- R5: `git diff --exit-code --stat <段2のコミット>..HEAD -- '*.test.*' '*.spec.*' 'tests/' '__tests__/'` が exit 0 で出力が空（base 追随より前に実行する）。
- R6: `resolveToken(themes, theme, name, seen = new Set())` のシグネチャ、それ以外の export、problem の文言が変わっていない。`node scripts/contrast.mjs` の出力が、変更前（`5995da4`）とバイト単位で一致する。
- R7: 段4で、test・lint・typecheck が exit 0。関数の長さとネストを段0と同じ数え方で測り、前後を並べる。
- R8: レビューサイクルが flag 0 で終わる。
- R9: PR の必須チェック `Lint, typecheck, test & build` が成功する。
