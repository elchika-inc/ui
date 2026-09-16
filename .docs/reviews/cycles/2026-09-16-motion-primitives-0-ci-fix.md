verified_impl_sha: 029304680b7bc950797d1b043cc8efbcfcbc57a0

<!-- review-cycle:start 2026-09-16-motion-primitives-0-ci-fix -->
# 2026-09-16 自作 component 登録の CI fixture 補完レビュー

- Cycle ID: `2026-09-16-motion-primitives-0-ci-fix`
- 対象 HEAD: `029304680b7bc950797d1b043cc8efbcfcbc57a0`
- 対象: `scripts/check-cli-smoke.test.mjs` の button fixture に origin を補完する1行
- 総ラウンド数: 1
- 終了理由: 許可された Fresh Eyes・Tests の両レンズで初回から flag 0
- INSPECTION_STATUS: flag 0、optional 0
- ACCEPTED_RISKS: なし
- 確定した偽陽性: なし
- rubric: `.docs/plans/2026-09-16-motion-primitives.md` §4 / §A と以下の司令塔裁定

## CI 失敗と裁定

初回 PR CI `35072396638`（head `683a5a174cacd86c68d2f77367e4d7073d2be0f8`）は全件514テスト中 pass 513 / fail 1 / skip 0 で失敗した。既存 CLI smoke fixture の button に origin がなく、`button: provenance の origin が無い` を検出した。lint・typecheck は成功したが、全件テスト後の検証ステップは未実行であり、CI 成功とは扱わない。

司令塔は「spec の書き漏れ（check-cli-smoke の fixture）を司令塔の裁定でスコープ追加」として、既存 button fixture への `origin: "shadcn/ui registry"` の1行追加を許可した。同ファイル単独の RED/GREEN、§4.1〜5 の再実行、追加レビューを Fresh Eyes・Tests の2レンズへ縮めることも許可された。spec と既存レビュー記録は編集していない。

`node --test scripts/check-cli-smoke.test.mjs` は修正前 exit 1（pass 6 / fail 1 / skip 0）、修正後 exit 0（pass 7 / fail 0 / skip 0）。既存 assertion・テスト定義を維持した。

## 実施方法

Fresh Eyes → Tests の順に、各レンズ fresh context で次のコマンドを逐次実行した。両呼び出しとも exit 0、再取得なし。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は `683a5a1` からの対象1ファイルの diff、同ファイル全文、spec §2 / §A / §4、司令塔の追加裁定。本体の5レンズ・2ラウンドの記録は `2026-09-16-motion-primitives-0.md` に保持した。

## base 追随後の検証

再 fetch で origin/main が `bf715fff9af9614ea41b244a5b9b129dd1b6f569` に進んでいたため、rebase を使わず merge commit `ad0d03d733e0d758375b430c5c5cff3a0b0affa7` で取り込んだ。取り込み差分は DESIGN.md とアイコン既定のレビュー記録の2ファイルだけで、追加レビュー対象ファイルの SHA-256 はレビュー時と同一（`566aa687aea548e7c17dcd104a37474635a24afcf1899a5bbda7e355f66060c2`）。

merge 後に §4.1〜5 を単独コマンドで再実行し、§4.4 / §4.5 の指定順序も守った。

| コマンド | exit | 実測 |
|---|---:|---|
| `node scripts/check-standards.mjs` | 0 | 248ファイル、arbitrary-value 0 / motion-literal 0 |
| `npm run lint` | 0 | 486ファイル、error 0 / warning 201 / info 3 |
| `node --test scripts/check-completeness.test.mjs` | 0 | pass 95 / fail 0 / skip 0 |
| `node --test scripts/add-component.test.mjs` | 0 | pass 93 / fail 0 / skip 0 |
| `npm run build:lib` | 0 | JS・型定義生成 |
| `npm run check:props` | 0 | props 契約通過 |
| `node scripts/check-completeness.mjs` | 0 | 61 component / 28 block |
| `node scripts/check-preview-render.mjs` | 0 | preview selector 宣言 OK |
| `npm run registry:build` | 0 | registry・index生成 |
| `node scripts/check-distribution.mjs` | 0 | 共有配布物5種が原本と一致 |

全件テスト・typecheck・check:all は指定によりローカル未実行で、PR CI で代替する。§4.6〜8 はこのPRのローカル対象外。最終 head の CI 結果は PR 本文に記録する。

## R1 / fresh-eyes

LGTM

## R1 / tests

LGTM

<!-- review-cycle:end 2026-09-16-motion-primitives-0-ci-fix -->
