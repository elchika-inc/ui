verified_impl_sha: cca1df56a1d01b6e62fafc2931a21fc9aba16f3f

<!-- review-cycle:start 2026-10-02-refactor-run-add-component -->
# runAddComponent のリファクタリングのレビュー記録

- **Cycle ID**: 2026-10-02-refactor-run-add-component
- **対象 HEAD**: cca1df56a1d01b6e62fafc2931a21fc9aba16f3f
- **対象**: `scripts/add-component.mjs`（`runAddComponent` と、そこから切り出した非公開の関数）と `scripts/add-component.test.mjs`（追加テスト 4 件と helper 2 つ）。差分 `d58e3e3..cca1df5`。
- **総ラウンド数**: 1（同一ラウンドで、先頭行の形式が不正だった 3 レンズを 1 回取り直した）。
- **終了理由**: 全員 LGTM。
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity - / Altitude -。
- **確定した偽陽性**:
  - なし
- **ACCEPTED_RISKS**: なし。
- **optional**: 2 レンズ（fresh-eyes・tests）。扱いは下記「optional の扱い」。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行した。Orca の codex worker が 5 本稼働していて同時実行の上限 2 本を超えており、Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる〈brain URISK-161〉ため）。

## 実行方式

`lens-review-cycle` の 5 レンズ（コードのみが対象なので Ambiguity / Altitude は起動しない）を、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain の順に当てた。スキル既定の `Agent`（`subagent_type: Explore`、`model: sonnet`）で起動し、読み取り専用で作業し、ファイルと git の状態を変えるコマンドを実行しないよう指示した。対象 2 ファイルの fingerprint（`git hash-object`）と作業ツリーの状態は、レビューの前後で一致した。

入力は、対象 2 ファイルの絶対パスと読む範囲、差分と変更前の実装の取得コマンド、standards `CODING.md`（origin/main）の取得コマンド、設計上の事実（振る舞いを変えないこと、公開面、副作用の順序を入れ替えないこと、`--original` の順序を既存テストが固定していること、衝突判定の書き換えの同値性、mutation の結果、§5.2 のテストした条件と外した条件）。code-review-graph の最小コンテキスト（任意）は、全件テストを直列で流していたため使っていない。

最新の既存サイクル（2026-10-01-refactor-resolve-token）の偽陽性は 0 件なので引き継ぎは無く、空の FP レジストリで開始した。

## 再取得の記録

初回の応答では、security・core-logic・domain の 3 ブロックの本文の 1 行目が「LGTM。変更前にあった防御は…」のように `LGTM` の後に文が続いていた。スキルが有効とする先頭行（`LGTM` のみ、`LGTM／optional: …`、`flag N件`）に当たらないので、この 3 ブロックは返らなかったものとして扱い、3 レンズだけを新しい context で 1 回取り直した（指摘の格下げや棄却ではない）。再取得は 3 ブロックとも先頭行が `LGTM` で、結論は初回と同じだった。fresh-eyes と tests は初回の応答を採用した。

## optional の扱い

- fresh-eyes（`logAddSummary` と `resyncRecorded` は薄いが残してよい）: 指摘ではなく所見。残す。
- tests（同名の registry item に `type` が無い場合の専用テストが無い）: 段2のコミットより後はテストファイルを変更しない手順なので、足さない。変更前と同値であることは core-logic のコード比較で確認した。PR 本文の「外した条件と理由」に記録する。

## 採用応答原文

### fresh-eyes

LGTM／optional: `logAddSummary(log, entry, isBlock)` は、isBlock の分岐が 1 つあるだけの薄い層。ただ、`runAddComponent` の末尾を読みやすくしていて、ログの順序も変わっていないので、残してよい。`resyncRecorded` は `runAddComponent` から 1 回しか呼ばれないが、振り分けに名前が付いたぶん読みやすい。標準機能で足りるのに自前実装へ降りている箇所は無い。

### security

LGTM
差分を通して確認した内容は次のとおりです。
- `assertPathWithoutSymlinks` による生成先の検査は、変更前と同じ位置にあります。
- `readGeneratedSource` が読むパスは `target.files` の `targetPath` で、変更前と同じです。`ensureGenerated` の後に呼ぶ順序も変わっていません。
- 同名衝突の 3 根照合（provenance・registry・disk）は、CLI 実行より前に行います。重複 item を検出する分岐も残っています。
- `join(root, ...)` に渡す `name` は、変更前と同じ値です。
- `provenance[lane][name]` への書き込みは、変更前の `provenance.blocks[name]` と `provenance.components[name]` への代入と同じです。`Object.hasOwn` を使う resync 側の防御も変わっていません。

### core-logic

LGTM
差分を通して確認した内容は次のとおりです。
- 衝突判定は、既存 item がある場合に限り、変更前と変更後で同値です。
  - `isBlock` が真のとき、変更前は `type !== "registry:block"`、変更後は `false !== true` で、どちらも「block 以外」です。
  - `isBlock` が偽のとき、変更前は `type === "registry:block"`、変更後は `true !== false` で、どちらも「block」です。
  - 既存 item が無いときは、どちらも衝突なしです。
- `sameNameItem?.type` は、item が無いと `undefined` になります。そのとき `sameNameItemIsBlock` は `false` ですが、`sameNameItem !== undefined` が先に偽になるので影響しません。
- resync の判別順序は、blocks を先、components を後、どちらも無ければ throw の順で、変更前と同じです。渡す引数のキーも `root`・`name`・`modified`・`provenance`・`log` で同じです。
- `registryBefore` を `registry` に改名しましたが、同じオブジェクトです。`registry.items` を参照する時点も変わっていません。upsert と sort はその後に行い、`buildRegistryItem` は upsert より前に呼びます。
- 書き込みの順序は provenance.json、registry.json、ログの順で、変更前と同じです。
- ログの文言と順序も同じです。

### tests

LGTM／optional:
- 追加した 4 件は、ログの全体を完全一致で、戻り値のキーの順序と中身を厳密に確かめている。一時ディレクトリは `t.after` で片付けている。
- `sha256` は、test ファイル内で 1,000 行以内に何度も書かれている `createHash("sha256").update(...)` を 1 つにまとめた helper。この helper の定義は、使う側のテストと同じ末尾にあり、既存の箇所は置き換えていない。
- `assertNoLaneConflict` の type が undefined の場合（registry item に type が無い）は、専用のテストが見当たらなかった。既存の同名衝突テスト（1556・1583・1639 行付近）が押さえているのは、type が明示された場合だけのようだ。変更前と同値であることは上のコード比較で確認できているので、flag にはしない。

### domain

LGTM
差分を通して確認した内容は次のとおりです。
- `runAddComponent` の引数と既定値、戻り値の形（`{ skipped, entry, registryItem, reconciled }`）、エラー文は変更前と同じです。
- 新設した 5 関数は非公開（export なし）です。
- 衝突検出や台帳の欠損で例外を投げる fail-closed の挙動は維持されています。
- 長いコメントは、切り出した関数の上へ「なぜ」のコメントとして移っています。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。テスト・lint・typecheck の実測は PR 本文の「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-02-refactor-run-add-component -->
