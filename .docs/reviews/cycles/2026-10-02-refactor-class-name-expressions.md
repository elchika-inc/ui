verified_impl_sha: c2bbfbb4d1882210491db9c3ab19b55980a921d5

<!-- review-cycle:start 2026-10-02-refactor-class-name-expressions -->
# classNameExpressions のリファクタリングのレビュー記録

- **Cycle ID**: 2026-10-02-refactor-class-name-expressions
- **対象 HEAD**: c2bbfbb4d1882210491db9c3ab19b55980a921d5
- **対象**: `scripts/check-standards.mjs`（`classNameExpressions` と、そこから分けた module 最上位の helper・`createCandidateResolver`・`candidateFragments`）と `scripts/check-standards.test.mjs`（追加テスト 14 件）。差分 `d58e3e3..c2bbfbb`。
- **総ラウンド数**: 1。
- **終了理由**: 全員 LGTM。
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity - / Altitude -。
- **確定した偽陽性**:
  - なし
- **ACCEPTED_RISKS**: なし。
- **optional**: 2 レンズ（fresh-eyes・domain）。どちらも「直さなくてよい」という所見で、扱いは下記。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行した。Orca の codex worker が 5 本稼働していて同時実行の上限 2 本を超えており、Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる〈brain URISK-161〉ため）。

## 実行方式

`lens-review-cycle` の 5 レンズ（コードのみが対象なので Ambiguity / Altitude は起動しない）を、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain の順に当てた。スキル既定の `Agent`（`subagent_type: Explore`、`model: sonnet`）で起動し、読み取り専用で作業し、ファイルと git の状態を変えるコマンドを実行しないよう指示した。対象 2 ファイルの fingerprint（`git hash-object`）と作業ツリーの状態（未追跡の計画ファイルを除く）は、レビューの前後で一致した。

入力は、対象 2 ファイルの絶対パスと読む範囲、差分（移動を移動として見る `--color-moved` の指定を含む）と変更前の実装の取得コマンド、standards `CODING.md`（origin/main）の取得コマンド、設計上の事実（振る舞いを変えないこと、公開面、純粋な移動であることの確認方法、記号の番号付けの寿命、実データでの等価性の確認、mutation の結果と観測できない 1 種類、直さなかった箇所、§5.2 のテストした条件と外した条件）。先頭行の形式（`LGTM` だけ、`LGTM／optional: …`、`flag N件`）を明示した。code-review-graph の最小コンテキスト（任意）は、全件テストを直列で流していたため使っていない。

最新の既存サイクル（2026-10-02-refactor-run-add-component）の偽陽性は 0 件なので引き継ぎは無く、空の FP レジストリで開始した。

## optional の扱い

- fresh-eyes（`createCandidateResolver` が 267 行の closure のまま）: レビュアー自身が「分け直す必要はない」としている。中の helper が checker と記号の番号付けを共有しており、さらに分けるとそれらを全関数へ引き回すことになるため、残す。
- domain（module 最上位の const arrow と function 宣言の混在）: 移した helper は中身を変えないために const arrow のまま移した。ファイル内に既にある混在と同程度なので、揃えない。

## 採用応答原文

### fresh-eyes

LGTM／optional: createCandidateResolver は 267 行の closure のままで、中に 15 個ほどの小さな関数と構文ごとの振り分け表が入っている。事実7の理由（checker と記号の番号付けを共有）は妥当で、分け直す必要はない。
確認した内容: 移した 13 個の helper と candidateFragments、createCandidateResolver、classNameExpressions を、変更前の classNameExpressions と読み比べた。名前の重複はなく、入口は guard、resolver の生成、走査だけになっている。

### security

LGTM
解けない式は変更前と同じく、最後に [nodeCandidate(expression)] へ落ちる。recursion の guard（resolving）と、解決できない場合に undefined を返して次の handler へ進む流れも同じ。取りこぼしが増える変更は見つからなかった。

### core-logic

LGTM
- module 最上位へ移した 13 個の helper は、checker・symbolKeys・nextSymbolKey・sourceFile・prefix を参照していない。参照するのは引数と ts と、同じく最上位にある別の helper だけである。literalIdentity の getSourceFile も引数の式から取っている。
- createCandidateResolver の中の呼び出しは、最上位の同名関数を指す。名前が重複する定義はない。
- 最上位の const arrow は、呼び出し時にはすべて初期化済みなので TDZ の問題は起きない。
- 記号の番号付けは classNameExpressions の呼び出しごとに作られ、変更前と同じ寿命である。
- candidateFragments は変更前の expressionFragments と offset・key・重複排除が同一で、sourceFile と prefix は引数で渡されている。
- 走査では、guard、className 属性の判定、value の取り出し、forEachChild の順序が同一である。

### tests

LGTM
追加した 14 件は、事実8の列挙どおり、jsx、条件の同一性、枝刈り、parameter の既定値、入れ子の関数の return、各演算子の候補、別 file の行を固定している。標準の観点で、事実8の列挙にもなく関わる類型の漏れは見つからなかった。

### domain

LGTM／optional: 最上位の const arrow と function 宣言の混在（helper は const arrow、createCandidateResolver・candidateFragments・classNameExpressions は function 宣言）は、同じファイル内に既にある混在と同程度で、分けた意図（小さな純粋 helper は arrow、まとまりを持つものは function）も読み取れる。揃えるかは任意。
公開面（export 3 行とその戻り値）は変わっていない。fail-closed も維持されている。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。テスト・lint・typecheck と、実データでの出力比較の実測は PR 本文の「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-02-refactor-class-name-expressions -->
