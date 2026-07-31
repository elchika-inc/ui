## 関連 Issue / ゴール

<!-- Closes #N — ゴール・成功基準は Issue が正本（ここに再掲しない）
     Issue がない場合はここにゴールと成功基準（- [ ] 観測可能な条件）を直記する -->

## エージェント実装の来歴

- 実装計画: <!-- `.docs/plans/*-plan.md` の相対パス。人間のみの変更は N/A -->
- 実装担当識別子: <!-- 承認済み計画と同じ識別子。人間のみの変更は N/A -->

## 来歴の申告（当てはまるものをすべてチェック）

- [ ] 自作（他プロジェクトからのコピーではない）
- [ ] AI が生成した
- [ ] 他プロジェクトから移植した

移植を含む場合、出典 URL・commit SHA・ライセンス:

<!-- 例: https://github.com/shadcn-ui/ui @ 705ce5961080264830471ddd885c01b907706068 / MIT
     SHA は provenance.json の該当コンポーネントの upstreamPathSha をそのまま書く。
     受け取った内容そのものの錨は registryContentSha256 で、これも併記する。
     角括弧つきの穴埋め記法をここに書かないこと（未記入検査が誤検知するため） -->

## 変更内容

<!-- feat / fix / chore / refactor / docs のどれか + 1行説明 -->

## 検証手順

<!-- レビュアー（AI・将来の自分）がこの手順だけで同じ検証を再実行できる粒度で書く
     1. 準備: 起動コマンド・前提データ
     2. 操作: ステップ
     3. 期待: 観測可能な結果（成功基準のどれを確かめているかがわかるように） -->

## 検証証跡

<!-- UI を持つ変更は route × テーマ × チェック項目のマトリクスで記録する（AI_FIRST.md §2）
     UI がない変更（API / Worker / migration 等）は N/A と記入してよい
     合格基準: console = エラー・警告ゼロ / a11y tree = axe で critical/serious ゼロ（WCAG 2.2 AA）/ keyboard = キーボードのみで主要フロー完走 -->

| route | light | dark | console | a11y tree | keyboard |
|---|---|---|---|---|---|
| /  | | | | | |

<!-- スクリーンショットは PR に直接添付（GitHub 添付画像が証跡の正本 — TTL 付き URL のみは不可） -->

## チェックリスト

- [ ] `npm run lint` / `npm run typecheck` / `node --test "scripts/*.test.mjs"` をローカルで通した
- [ ] `node scripts/check-standards.mjs` が通る
- [ ] `npm run build` と `npm run build:lib` が通る
- [ ] 検証手順が関連 Issue（または本文）の成功基準をカバーしている
- [ ] エージェントによる変更の場合、実装計画と実装担当識別子を記入した
- [ ] D1 migration を含む場合: `migration-required` ラベルを付け、ローカル D1 で動作確認済み
- [ ] migration を含む場合: 本番適用前のスナップショット手順を把握している（ARCHITECTURE.md §1）
- [ ] 法務ページを更新した場合: `templates/README.md` の差し替えチェックリストを確認した
