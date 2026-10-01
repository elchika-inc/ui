# contrast の空白 α と theme 検査の修正計画

- 実装担当: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行）
- 作業ブランチ: `naoto24kawa/fix-contrast-alpha-theme`（base `df817ae`）
- 要件正本: Issue #99（α が空白だけの色が alpha 0 として通る）と Issue #100（Map でない theme 名で TypeError）。どちらも PR #98 のリファクタリング中に見つけ、現在の振る舞いを「現状:」のテストで固定してあった。

## 変更と範囲

- #99: `parseAlpha` で、trim 後に空の α を `alpha が空` として弾く。`parseAlpha` を共有する 4 経路（`parseColor` の oklch・rgb、`resolveScalar`、`resolveRgbAliasAlpha`）がすべて fail-closed になる。
- #100: `resolveToken` の theme 検査を、truthiness から「Map を指しているか」に変える。

対象外: 上記以外の振る舞いの変更、`parseAlpha` のその他の受け入れ範囲（16 進表記・指数表記など）の見直し、公開面（export・引数・戻り値の形）の変更、`biome.json` と `package.json` の変更。

## 実行者

既定は Codex worker への委任である。今回は着手時点で、別リポの codex worker 5 本が稼働していた（同時実行は 2 本までという運用ルールを超えている）。Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる（brain URISK-161）。そのため司令塔の Claude が Orca worktree で実行し、レビューは fresh context のレビュアー（Sonnet・読み取り専用）が行う。

## 手順

1. 修正前のベースラインとして、`node --test scripts/contrast.test.mjs` と、実データに対する `node scripts/contrast.mjs` の出力を取る。
2. Issue ごとに、期待する振る舞いのテストを書き、修正前の実装で失敗することを実測する（AI_FIRST §1 の 6）。失敗が assertion によるものか、読み込みエラーによるものかも確かめる。
3. 修正し、テストが緑になることを確かめて、Issue ごとに 1 コミットにする。
4. 全件テスト・lint・typecheck・check-standards を実行する。
5. `lens-review-cycle` の 5 レンズを最大 3 ラウンドで回す。
6. PR を作成し、CI の必須チェックを確認する。

## 成功基準（rubric）

- R1: 修正前、`node --test scripts/contrast.test.mjs` が exit 0。
- R2: Issue ごとに、追加したテストが修正前の実装で assertion（#100 はバグそのものの TypeError）によって失敗し、他のテストは通る。
- R3: 修正後、`node --test scripts/contrast.test.mjs` が exit 0 で、「現状:」で始まるテストが 0 件。
- R4: 実データに対する `node scripts/contrast.mjs` の出力が、修正前（`df817ae`）とバイト単位で一致する。
- R5: `node --test --test-concurrency=1 "scripts/*.test.mjs"`・`npm run lint`・`npm run typecheck`・`node scripts/check-standards.mjs` が worktree で exit 0。
- R6: レビューサイクルが flag 0 で終わる。
- R7: PR の必須チェック `Lint, typecheck, test & build` が成功する。
