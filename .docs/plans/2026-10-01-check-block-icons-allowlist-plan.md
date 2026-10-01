# check-block-icons の意図的な属性差分の許可リスト追加計画

- 実装担当: Codex（Dispatch `ctx_59d7029bbf8a`）
- 作業ブランチ: `naoto24kawa/check-block-icons-allowlist`（base `a2216e0`）
- 要件正本: 司令塔の委任仕様「check-block-icons に『上流から意図的に変えたアイコン属性』の許可リストを足す」。関連 Issue はなし。

## 変更と範囲

- 非 export の `INTENTIONAL_ICON_CHANGES` を生成 path ごとの Map として追加する。sidebar-07 の `duration-200` → `duration-base`（59a5d6d）、sidebar-11 の chevron 回転属性追加（issue #95、4e586dd）の 2 件を理由付きで記録する。
- `applyIntentionalIconChanges(expectedByTarget, changes = INTENTIONAL_ICON_CHANGES)` を export する。blocks / previews の全期待ファイルについて、path・icon・上流属性が一致した要素の属性を、存在する occurrences・orderedOccurrences・baselineOccurrences で置き換える。入力を変更せず、存在しないリストは追加しない。
- どのリストでも使われなかったエントリを、Map の挿入順・配列順で指定の stale 問題文として返す。属性の一致は既存の `sameAttributes` に揃える。
- 上流検査成功時だけ補正した期待値を CLI の block / preview 突合に渡し、許可リストの問題を `許可リスト: ` 付きで生成物の問題の先頭に加える。既存の問題文・stats・他の出力・終了コード判定は維持する。
- 指定の 5 テストを既存テストの末尾へ追加し、各テストは自前の Map を使う。手順書へ指定の段落とゲート表の 1 行を追加する。

変更対象は `scripts/check-block-icons.mjs`・`scripts/check-block-icons.test.mjs`・`.docs/component-addition-procedure.md`・本計画・`.docs/reviews/cycles/2026-10-01-check-block-icons-allowlist.md` の 5 ファイルだけ。

対象外: 既存テストと既存関数の振る舞い、sidebar-07 / sidebar-11 の生成物、provenance・standards 検査・設定・依存・AGENTS.md の変更、main への push、マージ・squash・rebase・force push。

## 実行者

司令塔が Orca で用意した worktree で Codex worker が実行する。レビューは `claude --safe-mode -p --model sonnet --tools '' --strict-mcp-config --no-session-persistence` に入力を渡し、fresh context のレビュアー 1 名が読み取り専用で行う。

## 手順

1. 対象テストとライブ CLI の修正前 baseline を測る。CLI 出力は `/tmp/cbi-allowlist-cli-before.txt` に保存する。
2. 指定の 5 テストを追加し、実装前に関数未実装の TypeError と既存 44 件の pass を確認する。
3. 許可リスト・補正関数・CLI を実装し、49 件の pass、ライブ CLI の正常化、許可リストの一時改変による stale 検知と復元を確認する。
4. 実装とテストを 1 コミット、手順書を 1 コミットにする。
5. `lens-review-cycle` の fresh-eyes → security → core-logic → tests → domain → ambiguity-hunter → altitude-checker を最大 2 ラウンド実施する。入力は 200,000 bytes 以下。レビュー記録は 2 つ目のコミットの SHA と応答原文を固定する。
6. 計画とレビュー記録を 3 つ目のコミットにし、全件テストを直列実行する。lint・typecheck・standards と変更範囲を個別に確認する。コミット済みレビュー記録は変更しない。
7. 作業ブランチを push して main 向け PR を作り、必須 CI の成功を確認する。マージはしない。

## 成功基準（rubric）

- R1: 修正前の `node --test scripts/check-block-icons.test.mjs` が exit 0、44/44 pass。`node scripts/check-block-icons.mjs > /tmp/cbi-allowlist-cli-before.txt 2>&1` が exit 1、block 18 件 / 期待 231 / 一致 226、指定の sidebar-07 / sidebar-11 の位置不一致 2 件。
- R2: 追加した指定の 5 テストだけが `TypeError: applyIntentionalIconChanges is not a function` で失敗し、既存 44 件は pass。失敗名を記録する。
- R3: 実装後の `node --test scripts/check-block-icons.test.mjs` が exit 0、既存の 44 件を削除せず 49/49 pass。
- R4: `node scripts/check-block-icons.mjs > /tmp/cbi-allowlist-cli-after.txt 2>&1` が exit 0、block 18 件 / 期待 231 箇所 / 一致 231 箇所、preview block 4 件 / 期待 4 箇所 / 一致 4 箇所。「検査に失敗」の行なし。件数や結果が違えば止めて司令塔に ask する。
- R5: sidebar-07 の許可エントリの上流属性を一時的に `className="no-such-class"` に変えると CLI が exit 1。指定の `許可リスト: src/blocks/sidebar-07/components/nav-main.tsx: 意図的な差分として許可した ChevronRightIcon className="no-such-class" が上流の期待に無い` と sidebar-07 の位置不一致を出す。復元後の diff で一時変更の残存がないことを確認する。
- R6: 3 コミット後に `node --test --test-concurrency=1 "scripts/*.test.mjs"`・`npm run lint`・`npm run typecheck`・`node scripts/check-standards.mjs` が各 exit 0。全件テストが失敗した場合はまず該当ファイルを単独実行する。
- R7: `git diff --stat a2216e0..HEAD` の変更が指定の 5 ファイルだけ。
- R8: レビューの確信度 80% 以上の flag が 0 で終了し、PR が open、必須チェック `Lint, typecheck, test & build` が成功する。最大 2 ラウンド後に flag が残れば追加修正せず、PR と worker_done に未達を明記する。

検証コマンドは pipe・`&&`・`|| true` を挟まず個別に実行し、exit code と静的確認・テスト実行・CLI 実行の区分を PR と完了報告に残す。指示と実態に矛盾があれば、影響範囲を止めて司令塔に ask する。
