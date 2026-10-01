verified_impl_sha: 848c6d3718bb81dac1694ce2624c2407550eb5c8

<!-- review-cycle:start 2026-10-01-refactor-resolve-token -->
# resolveToken のリファクタリングのレビュー記録

- **Cycle ID**: 2026-10-01-refactor-resolve-token
- **対象 HEAD**: 848c6d3718bb81dac1694ce2624c2407550eb5c8
- **対象**: `scripts/contrast.mjs`（`resolveToken` と新設の `resolveRgbAliasAlpha`）と `scripts/contrast.test.mjs`（追加テスト 17 件）。差分 `5995da4..848c6d3`。
- **総ラウンド数**: 1。
- **終了理由**: 全員 LGTM。
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity - / Altitude -。
- **確定した偽陽性**:
  - なし
- **ACCEPTED_RISKS**: なし。
- **optional**: 0 件。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行した。codex worker が同時実行の上限 2 本に達しており、Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる〈brain URISK-161〉ため）。

## 実行方式

`lens-review-cycle` の 5 レンズ（コードのみが対象なので Ambiguity / Altitude は起動しない）を、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain の順に当てた。オーケストレータが Claude Code なので、スキル既定の `Agent`（`subagent_type: Explore`、`model: sonnet`）で起動した。読み取り専用で作業し、ファイルと git の状態を変えるコマンドを実行しないようプロンプトで指示した。対象 2 ファイルの fingerprint（`git hash-object`）と作業ツリーの状態は、レビューの前後で一致した。

入力は、対象 2 ファイルの絶対パス、差分の取得コマンド、standards `CODING.md`（origin/main）の取得コマンド、設計上の事実（振る舞いを変えないこと、公開面、「現状:」テストは既知のバグの固定であること、残した try/catch と `new Set()` の理由、直さなかった箇所、§5.2 のテストした条件と外した条件）。code-review-graph の最小コンテキスト（任意）は、同時に全件テストを直列で流していたため負荷を避けて使っていない。

最新の既存サイクル（2026-09-23-opus55-design-defaults）の偽陽性は 0 件なので引き継ぎは無く、空の FP レジストリで開始した。

## 採用応答原文

### fresh-eyes

LGTM

### security

LGTM

### core-logic

LGTM
変更前後の振る舞いは、全入力で等価だと確認した（`git diff 5995da4..HEAD` と変更前の resolveToken を突き合わせた）。

- `if (rgbAlias[2])` と `!rawAlpha` は、反転して早期 return に変えただけで同じ判定になる。空文字は正規表現上そもそも捕捉されない。空白だけの α（`" "`）は `[^)]+` が捕捉して truthy になり、変更前と同じく `parseAlpha(" ")` が 0 を返す。
- 順序は変更前と同じ。base を先に解いて problem があれば返し、その後で α を解く。
- `resolveScalar` の戻り値は `{value}` か `{problem}` のどちらかで、そのまま返しても変更前と同じ。problem 文言も同じ。
- `base.alpha * alpha.value` は変更前の `base.alpha * alpha` と同じ。
- 色側の seen を渡さない `new Set()` も変更前のまま。

### tests

LGTM
追加した 17 件は、リファクタリングで壊れうる分岐（α なし／数値／百分率／境界／範囲外／数値でない／var 参照の成功・欠落・循環・範囲外／base の problem／乗算／seen／`--` の有無／theme 不正）をすべて押さえている。

関連する類型の漏れは見つからなかった。

### domain

LGTM
- 公開面は変わっていない。`resolveToken` の 4 引数と既定値、戻り値の形は同じで、`resolveRgbAliasAlpha` は新たに export していない。
- problem 文言は変更前と同一。`resolvePaint` と `evaluateCase` は `resolveToken` の戻り値の `.problem` を見ており、その形も変わっていない。
- fail-closed は維持されている。α 側の problem も base 側の problem も、黙って通さず返している。
- `resolveRgbAliasAlpha` は `resolveScalar` の直後に置いた module 内の const アロー関数で、隣の `resolveScalar` と書き方が揃っている。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。テストと lint の実測（段0〜段4）は PR 本文の「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-01-refactor-resolve-token -->
