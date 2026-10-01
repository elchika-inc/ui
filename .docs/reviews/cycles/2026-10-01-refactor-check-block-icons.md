verified_impl_sha: 1b1dcebae0431247f9ec264c79de7b99e83ef202

<!-- review-cycle:start 2026-10-01-refactor-check-block-icons -->
# check-block-icons のリファクタリングのレビュー記録

- **Cycle ID**: 2026-10-01-refactor-check-block-icons
- **対象 HEAD**: 1b1dcebae0431247f9ec264c79de7b99e83ef202
- **対象**: `scripts/check-block-icons.mjs`（`inspectUpstreamBlocks`・`inspectGeneratedIcons` と、そこから切り出した非公開の関数）と `scripts/check-block-icons.test.mjs`（追加テスト 25 件）。差分 `61f127f..1b1dceb`。
- **総ラウンド数**: 1。
- **終了理由**: 全員 LGTM。
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity - / Altitude -。
- **確定した偽陽性**:
  - なし
- **ACCEPTED_RISKS**: なし。
- **optional**: 3 レンズ（fresh-eyes・tests・domain）。扱いは下記「optional の扱い」。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Claude Opus 5.5（Claude Code の司令塔セッションが Orca worktree で実行した。Orca の codex worker が 2 本稼働していて同時実行の上限に達しており、Claude worker は新規 worktree でフォルダ信頼ダイアログに止まる〈brain URISK-161〉ため）。

## 実行方式

`lens-review-cycle` の 5 レンズ（コードのみが対象なので Ambiguity / Altitude は起動しない）を、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain の順に当てた。スキル既定の `Agent`（`subagent_type: Explore`、`model: sonnet`）で起動し、読み取り専用で作業し、ファイルと git の状態を変えるコマンドを実行しないよう指示した。対象 2 ファイルの fingerprint（`git hash-object`）と作業ツリーの状態は、レビューの前後で一致した。

入力は、対象 2 ファイルの絶対パス、差分と変更前の実装の取得コマンド、standards `CODING.md`（origin/main）の取得コマンド、設計上の事実（振る舞いを変えないこと、公開面、「現状:」テストが固定している既知のバグ 3 件、残した挙動とその理由、直さなかった箇所、実データでの等価性の確認、mutation の結果、§5.2 のテストした条件と外した条件）。code-review-graph の最小コンテキスト（任意）は、全件テストを直列で流していたため使っていない。

最新の既存サイクル（2026-10-01-fix-contrast-alpha-theme）の偽陽性は 0 件なので引き継ぎは無く、空の FP レジストリで開始した。

## optional の扱い

- tests の 1・2 点目（同じファイルの中で lucide 欠損と対応付け失敗が混在するときの問題の順序）: 追加テスト「path が文字列でない上流ファイルは、<block>:unknown.tsx の名前で問題にし、生成物へ対応付けない」が、同じファイルの #1（対応付け失敗）と #2（lucide 欠損）の問題を `deepEqual` で文書順に固定している。逆の並びは固定していないが、どちらも同じ反復で処理しているので、テストは足さない。
- tests の 3 点目（「現状:」テストに Issue 番号）: このバグ 3 件はまだ Issue にしていないので、番号を書けない。Issue にするかどうかは PR 本文で判断を仰ぐ。
- domain（付け直しの挙動にコメント）: 挙動は「現状:」テストが固定しており、消すとテストが落ちる。コメントは足さない。
- fresh-eyes: 指摘ではなく所見。

## 採用応答原文

### fresh-eyes

LGTM／optional: 新設した関数は責務ごとに分かれていて、読みやすくなっている。標準機能で足りるのに自前実装へ降りている箇所は見当たらない。

### security

LGTM
（変更前後でどこにも新しい入力経路・ファイル参照・出力経路は増えていない。上流 path は prefix 照合を通ったものだけを生成物 path にしており、不正な prefix は問題として報告される。この仕組みは変更前と同じ。）

### core-logic

LGTM
（変更前後を突き合わせて等価と確認した。確認の内容は次のとおり。）
- 問題の順序は同じ。dropped の対応付け失敗を先に出し、その後はファイルごとに文書順で、lucide 欠損と対応付け失敗が交互に並ぶ。iconPlaceholders が先に集めてから反復しても、ファイル内で他の problem と混ざらないので順序は変わらない。
- カウンタは同じ。placeholderCount と missingLucideCount は placeholderIcons から導いている。uniqueIconCount は dropped の placeholder も含む（変更前も同じ）。blocksWithPlaceholders は placeholderIcons.length > 0 で、変更前の blockPlaceholderCount > 0 と同値。
- baseline と ordered の付け直しの条件は同じ。content が文字列のすべてのファイルで、そのファイルの生成物 path の期待ファイルがあれば付け直す。後のファイルが上書きする挙動も残っている。blocks と previews の両方を引いていたのを対象の Map だけにしても、キーは交わらず、undefined のキーでは何も引けないので結果は同じ。
- firstMismatchIndex は、変更前の `Array.from(...).find(...)` と等価。条件は !isSame の否定形で、期待と実測のどちらかが欠ければ不一致になり、両方が空なら undefined になる。
- compareInOrder の一致数は、IconPlaceholder が残るときに 0 になる。compareIgnoringOrder の splice の順序と件数、「不足」の実測数の算出も同じ。
- import 欠落の問題は、比較の問題より前に並ぶ。compareExpectedFile が import 確認ループを先に回してから比較するため、変更前と順序が一致する。
- 順序付きの比較で actual の `{...item}` コピーを省いたが、この経路では splice しないので影響しない。

### tests

LGTM／optional: 次の 3 点は任意。
- 「dropped な component に lucide 欠損と対応付け失敗が混在し、問題が文書順に交互に並ぶ」ことを 1 つの入力で固定した専用テストは、テスト名からは確認できなかった。問題の順序は今回のリファクタリングの主要なリスクなので、1 件あると堅い。複数の problem を持つ入力で、配列全体を `deepEqual` で比べる形がよい。
- 同じファイルの中で、lucide 欠損の placeholder が先、対応付けに失敗する placeholder が後（またはその逆）になる入力を 1 件加えると、iconPlaceholders に分けたことによる順序の退行を確実に押さえられる。
- 「現状:」の 3 件の名前は、既知のバグを固定していることが分かって良い。修正 PR の際に期待値を変える対象として、テスト内のコメントに Issue 番号があるとさらに追いやすい。

### domain

LGTM／optional: 対象 2 関数の export と引数の形は不変。problem の文言は、変更前と文字列を突き合わせて一致を確認した（「アイコン位置 #N が一致しない（期待 … / 実測 …）」「JSX 使用が不足している（期待 N / 実測 M）」「IconPlaceholder が残っている（N 箇所）」など）。fail-closed の挙動（path や prefix が不正な入力、生成物が無い入力を問題にする）も維持されている。helper は function 宣言で、使う側より前に置かれており、ファイル内の書き方とも揃っている。任意の指摘は 1 点。collectUpstreamFile の「アイコンを持たないファイルでも baseline と ordered を付け直す」挙動は、①のバグ固定のために残したものなので、コメントで「現状の挙動を保つ」と一言入れておくと、後から消されにくい。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。テスト・lint・typecheck と、実データでの出力比較の実測は PR 本文の「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-01-refactor-check-block-icons -->
