# check-block-icons のバグ 3 件の修正計画

- 実装担当: Codex（Dispatch `ctx_157abc0fe1a6`）
- 作業ブランチ: `naoto24kawa/fix-check-block-icons-bugs`（base `926a740`）
- 要件正本: Issue #103（複数 page の期待値の混在）・#104（不足報告の期待数）・#105（placeholder 残存時の一致数）。PR #102 で固定した「現状:」テスト 3 件を置き換える。

## 変更と範囲

- #103: `content` の型にかかわらず `registry:page` を数え、2 件以上なら対応付け不能の問題を dropped file の問題の後、ファイルごとの問題の前に出す。page の preview 期待値（baseline・ordered を含む）は作らず、全ファイルの lucide 欠損と既存の stats は維持する。page が 1 件の場合は変更しない。
- #104: 順序なし比較の不足報告の期待数に、同じアイコンの baseline 数を足す。実測数・stats・その他の問題文は維持する。
- #105: 順序なし比較でも、候補の placeholder 合計が 1 以上なら一致数を 0 にする。problems は維持する。

変更対象は `scripts/check-block-icons.mjs`・`scripts/check-block-icons.test.mjs`・本計画・`.docs/reviews/cycles/2026-10-01-fix-check-block-icons-bugs.md` の 4 ファイルだけ。テストは指定の 3 件と直前のコメントだけを置き換え、他のテストは変更しない。

対象外: 上記以外の関数・問題文・CLI 入口の変更、sidebar-07 / sidebar-11 の既存 CLI エラー、生成物・設定・依存の変更、main への push、マージ・squash・rebase・force push。

## 実行者

司令塔が Orca で用意した worktree で Codex worker が実行する。レビューは `claude --safe-mode -p --model sonnet --tools '' --strict-mcp-config --no-session-persistence` に入力を渡し、fresh context のレビュアー 1 名が読み取り専用で行う。

## 手順

1. 対象テストとライブ CLI の修正前 baseline、「現状:」3 件を測る。CLI 出力は `/tmp/fix-cbi-cli-before.txt` に保存する。
2. #103 → #104 → #105 の順に指定のテストへ置き換え、実装変更前に assertion の失敗と他テストの pass を確かめる。
3. 各 Issue を修正し、対象テストの全件 pass 後、テストと実装を Issue ごとに 1 コミットにする。コミット本文に `Closes #<番号>` を入れる。
4. 全件テストを直列実行し、lint・typecheck・check-standards を個別に実行する。CLI 出力を再取得し baseline と `cmp` で比べる。差があれば推測せず司令塔に ask する。
5. `lens-review-cycle` の fresh-eyes → security → core-logic → tests → domain を最大 2 ラウンド実施する。入力は 200,000 bytes 以下。記録はレビュー対象 SHA と応答原文を固定し、コミット後は変更しない。
6. 作業ブランチを push して main 向け PR を作り、必須 CI の成功を確認する。マージはしない。

## 成功基準（rubric）

- R1: 修正前に `node --test scripts/check-block-icons.test.mjs` が exit 0、43/43 pass。
- R2: 修正前の `node scripts/check-block-icons.mjs > /tmp/fix-cbi-cli-before.txt 2>&1` を記録する。既知 baseline は sidebar-07 / sidebar-11 の 2 件、exit 1。
- R3: #103 の 2 テスト、#104・#105 の各 1 テストだけが修正前に `ERR_ASSERTION` で失敗する。各修正後に対象テストが exit 0、全件 pass。
- R4: `grep -c '現状:' scripts/check-block-icons.test.mjs` の件数が修正前 3、修正後 0（後者は grep の仕様で exit 1）。
- R5: `node --test --test-concurrency=1 "scripts/*.test.mjs"`・`npm run lint`・`npm run typecheck`・`node scripts/check-standards.mjs` が各 exit 0。指定の置換以外のテストは 1 件も変更・削除しない。
- R6: `node scripts/check-block-icons.mjs > /tmp/fix-cbi-cli-after.txt 2>&1` を取得し、`cmp /tmp/fix-cbi-cli-before.txt /tmp/fix-cbi-cli-after.txt` が exit 0。
- R7: `git diff --stat 926a740..HEAD` の変更が指定の 4 ファイルだけ。
- R8: レビューの確信度 80% 以上の flag が 0 で終了し、PR が open、必須チェック `Lint, typecheck, test & build` が成功する。最大 2 ラウンド後に flag が残れば追加修正せず、PR と worker_done に未達を明記する。

検証コマンドは pipe・`&&`・`|| true` を挟まず個別に実行し、exit code と静的確認・テスト実行・CLI 実行の区分を PR と完了報告に残す。
