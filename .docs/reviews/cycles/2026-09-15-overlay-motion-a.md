verified_impl_sha: 5b93bb1610a36500e9bd171fb745a83a3b1947ea

<!-- review-cycle:start 2026-09-15-overlay-motion-a -->
# overlay 開閉モーション PR A のレビュー記録

- 検証日: 2026-09-16。
- **Cycle ID**: 2026-09-15-overlay-motion-a
- **対象 HEAD**: 5b93bb1610a36500e9bd171fb745a83a3b1947ea
- **総ラウンド数**: 1
- **終了理由**: 全員 LGTM
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -
- **確定した偽陽性**: なし。
- **ACCEPTED_RISKS**: なし。flag の受容・risk-registry 追記は発生していない。
- **INSPECTION_STATUS**: 確信度80%以上のflag 0件、optional 0件。
- 修正・再レビュー: 初回からflag 0のため不要。実装SHAの変更なし。

## 起動経路と検証範囲

司令塔裁定に従い、各レンズを次のコマンドで順次起動した。各呼び出しはfresh contextで、前のレンズの応答を次の入力に混ぜていない。PR Aではworker-startを試しておらず、consumer_fencedの失敗は発生していない。

```bash
claude -p --safe-mode --model sonnet --tools Read,Glob,Grep --strict-mcp-config --permission-mode dontAsk --output-format json
```

入力はgit diff origin/main、担当4ファイル全文、spec §2 / §4 / §A。適用条件として陽性対照、spec追加、Drawer期待値、起動経路に関する司令塔裁定を付記した。Read / Glob / Grepのみを渡し、Bash / Write / Editは渡していない。safe-modeでカスタム設定・hook・MCP等を読み込まない。JSON結果のis_errorは全件false、permission_denialsは全件0。

.ts-review-graph/graph.dbは存在しないため最小コンテキスト取得は行わず、指定の入力でレビューを継続した。担当4部品とallowlistのclass置換を対象とし、文章仕様の再設計は対象外。flagはcorrectness・セキュリティ・明示要件だけ、optionalと分離し、確信度80%以上のみ報告する条件を付けた。

CLIではsonnetを明示指定した。下表のmodelUsageは応答JSONが報告した全モデル識別子の生値であり、すべての内部処理が単一モデルだったとは主張しない。

| レンズ | CLI exit | flag | optional | 応答のmodelUsage |
|---|---:|---:|---:|---|
| fresh-eyes | 0 | 0 | 0 | claude-haiku-4-5-20251001, claude-sonnet-5, claude-fable-5-1 |
| security | 0 | 0 | 0 | claude-haiku-4-5-20251001, claude-sonnet-5 |
| core-logic | 0 | 0 | 0 | claude-haiku-4-5-20251001, claude-sonnet-5, claude-fable-5-1 |
| tests | 0 | 0 | 0 | claude-haiku-4-5-20251001, claude-sonnet-5, claude-fable-5-1 |
| domain | 0 | 0 | 0 | claude-haiku-4-5-20251001, claude-sonnet-5, claude-fable-5-1 |

## R1の応答原文

レンズ別ブロックと付随する説明を改変せず残す。各ブロックの先頭行はLGTMで、flagは0件。

### fresh-eyes

3点とも確認できました。`duration-slow/slower/fast/base/instant/emphasis` utility と `--ease-entrance`（global.css）、`--motion-scale-lg`（design-system/tokens.css）は実在し、`MOTION_ARBITRARY_LITERAL` 正規表現は `transition:`/`animation:` プレフィックス限定のため drawer に残る `ease-[cubic-bezier(0.22,1,0.36,1)]` はマッチしません。4部品の置き換えとallowlist差分はすべて仕様§2/§A・司令塔裁定と一致しており、確信度80%以上のflagはありません。

<<<LENS_FINDINGS role="fresh-eyes">>>
LGTM
<<<END_LENS_FINDINGS>>>

### security

<<<LENS_FINDINGS role="security">>>
LGTM
<<<END_LENS_FINDINGS>>>

### core-logic

全token/utility名の実在を確認しました。担当4ファイルの生値写像、allowlist差分、DOM構造保持のいずれもcorrectness上の問題は見つかりませんでした。

<<<LENS_FINDINGS role="core-logic">>>
LGTM
<<<END_LENS_FINDINGS>>>

### tests

検証結果、司令塔裁定③の訂正値は実トークンと整合していることを確認しました。

- `--duration-slow: 260ms`（0.26s）= dialog/alert-dialog popup 期待値と一致
- `--duration-slower: 400ms`（0.4s）= drawer-content(drawer.tsx:153) の期待値と一致
- `--duration-emphasis: 500ms`（0.5s）= drawer-popup(drawer.tsx:122) の期待値（裁定③訂正後）と一致
- `--curve-entrance: cubic-bezier(0.16, 1, 0.3, 1)` = `ease-entrance` の期待値と一致

`scripts/check-standards.test.mjs` 内で alert-dialog.tsx / sheet.tsx を直接読むテストが2件あるが、いずれも今回変更していない箇所（AlertDialogAction の Close 経由確認、SheetOverlay の `bg-overlay` 使用確認）を対象にしており、影響なし。dialog.tsx / drawer.tsx への専用テストは無し。`preview-selectors.json` の selector（dialog/alert-dialog/drawer/sheet）は §A 表の実測対象 selector と一致し、drawer も `drawer-content` で仕様どおり。

4ファイルへの負の検査（animate-in系、duration-数値系、ease-in/out系）はいずれも机上確認で0件、allowlist削除は消えた生値と1:1で一致している。`drawer.tsx:122` の `ease-[cubic-bezier(0.22,1,0.36,1)]` 残置は司令塔裁定③で既知・記録対象とされており、flag対象外。

<<<LENS_FINDINGS role="tests">>>
LGTM
<<<END_LENS_FINDINGS>>>

### domain

duration-instant / base / slow / slower / emphasis の各utilityと --ease-entrance、--motion-scale-lg のいずれも実在を確認しました。担当4ファイルとallowlist差分に、確信度80%以上のcorrectness・セキュリティ・明示要件違反は見つかりませんでした。

<<<LENS_FINDINGS role="domain">>>
LGTM
<<<END_LENS_FINDINGS>>>

<!-- review-cycle:end 2026-09-15-overlay-motion-a -->
