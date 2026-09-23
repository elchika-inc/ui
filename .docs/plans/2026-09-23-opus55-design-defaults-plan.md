# 生成時に寄りがちな既定の見た目の追記計画

- 実装担当: GPT-6（Codex）
- Dispatch ID: `ctx_3f3f7114881b`
- Task ID: `task_9c4cb1fafb22`
- 作業ブランチ: `naoto24kawa/opus55-design-defaults`
- 要件正本: 司令塔が承認済み裁定を含めて渡した同 Dispatch の委任仕様。

## 変更と範囲

`DESIGN.md` 冒頭の一覧と「再検討トリガー」の直前に、委任仕様の文面をそのまま追加する。外部の観測は別節に置き、既存の「避けるもの（design system として）」を保持する。等幅ラベルと pill 型ボタンは採用済みのため禁止一覧へ加えない。記事の内容と既存実装との整合は司令塔の調査・裁定済みで、再調査しない。

実装・トークン・他リポジトリの変更、main への直接 commit / push・マージ・deploy は対象外。文面の独自改稿をしない。矛盾を発見した場合は影響範囲を止め、司令塔へ `orca orchestration ask` で報告する。

規約により追加するファイルは、本計画（完了ゲートの rubric と PR テンプレートの実装計画）と `.docs/reviews/cycles/2026-09-23-opus55-design-defaults.md`（`lens-review-cycle` の記録）のみ。README の利用手順・構成は変わらず、CHANGELOG の追加・更新義務はない。

## 手順

1. 指定の一覧項目と節を挿入する。
2. fresh context のレビュアー 1 名へ差分と変更後の全文を渡し、Fresh Eyes / Security / Core Logic / Tests / Domain / Ambiguity Hunter / Altitude Checker を順に適用する。書き込みツールは渡さない。
3. 確信度 80% 以上の flag と optional を分離し、最大 2 ラウンドでレビューする。初回 flag 0 なら終了、flag が出た場合は修正または明示受容を記録して再レビューする。2 ラウンド後も残る flag は PR 本文で扱いを明示する。
4. 下記のコマンドを個別に実行し、出力と exit code を PR 本文へ記録する。依存がなければ先に `npm ci` を実行する。
5. 変更を commit / push して PR を作成し、required check を含む全 check の pass を確認する。PR 本文はヒアドキュメントでファイルへ書いて `--body-file` で渡す。
6. 最終差分と実測範囲を照合し、司令塔へ PR URL と R1〜R7 を報告する。

## 成功基準（rubric）

- R1: 最初の 3 本の `grep -c` の出力がそれぞれ `1`。
- R2: 既存「避けるもの」 < 新節 < 「再検討トリガー」の行番号順。
- R3: 新しい一覧項目の直後の行に再検討トリガーの一覧項目がある。
- R4: unit tests / lint / typecheck がそれぞれ exit 0。
- R5: 変更ファイルが `DESIGN.md` と上記の規約上必要な 2 ファイルに限定される。
- R6: PR 作成後、`gh pr checks` で required check を含む全 check が pass。
- R7: 文字列・順序・差分の検査と tests / lint / typecheck / CI の実行結果を報告し、デザイン生成結果への実効果は未測定と明記する。

```sh
grep -c -F '## 生成時に寄りがちな既定の見た目（避けるもの）' DESIGN.md
grep -c -F -- '- 生成エージェントが方向づけ無しに寄りやすい見た目' DESIGN.md
grep -c -F '**「01 / 02 / 03」のような番号付きのセクションラベル**' DESIGN.md
grep -n -F '## 避けるもの（design system として）' DESIGN.md
grep -n -F '## 生成時に寄りがちな既定の見た目（避けるもの）' DESIGN.md
grep -n -F '## 再検討トリガー' DESIGN.md
grep -n -F -- '- 生成エージェントが方向づけ無しに寄りやすい見た目' DESIGN.md
grep -n -F -- '- 再検討トリガー（正本にほぼ無い）' DESIGN.md
node --test "scripts/*.test.mjs"
npm run lint
npm run typecheck
git diff --name-only origin/main...HEAD
```

R6 は作成された実際の PR 番号を使い、`gh pr checks` と `gh pr checks --required` で全体と必須の両方を確認する。補助検証として、指定の挿入以外が byte 単位で不変であることと `git diff --check` を確認する。
