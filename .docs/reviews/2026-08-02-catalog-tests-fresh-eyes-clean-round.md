# Tests / Fresh Eyes clean round

verified_impl_sha: ca05ccb25f5cad98b19d832ac071d280526df385

## 結論

- scope: `191e529..ca05ccb`
- 固定HEAD: `ca05ccb25f5cad98b19d832ac071d280526df385`
- 判定: **flag 0 / optional 0**
- F1: 解消
- 変更: なし
- worktree: 開始・終了ともclean

## F1解消確認

[恒常記録](/Users/nishikawa/projects/elchika-inc/ui/.docs/reviews/2026-08-02-catalog-tests-fresh-eyes-review.md:23)では、次の時系列が明確に分離されている。

1. 親`433553d`の旧本文から48件をcarry-forward
2. Task16だけ`e22d241…`から最終再検証値`03f451…`へ意図的に再生成
3. そのworking treeを入力に49件を構造化欄へ移行
4. 移行入力時点では49件すべて旧parser値と同値

独立実測結果:

- 親本文比較: 49件中48件一致
- 意図的例外: Task16の`e22d241… → 03f451…`
- 現working tree入力比較: 50/50一致
  - 元の49件
  - 新規clean-round前レビュー記録1件
- `node scripts/migrate-evidence-sha.mjs`: exit 0、対象50・変更0

親commit間のcarry-forward比較と、Task16再生成後の移行入力比較が混同されなくなったため、F1は解消と判定する。

## 新しいhard境界

以下を実装・負テストの双方で確認した。

- 検証SHAがHEADの祖先でない場合をhard failure
- component固有pathへの未追跡追加をhard failure
- migration対象の祖先symlinkによるrepo外参照をhard failure
- reviews配下のsymlink証跡を黙って除外せずhard failure

関連箇所:

- HEAD祖先検査: `scripts/check-evidence.mjs:101-109`
- 未追跡検査: `scripts/check-evidence.mjs:119-127`
- migration境界: `scripts/migrate-evidence-sha.mjs:44-65`
- 負テスト: `scripts/check-evidence.test.mjs:137-266`

aggregate/shared surfaceの変更をadvisoryとする既存境界は維持され、実リポジトリではstale 10件を表示しながら`check:all`はexit 0だった。

## 実行結果

| 検証 | 結果 |
|---|---|
| `node --test scripts/check-evidence.test.mjs` | exit 0、21/21 pass |
| `node --test scripts/*.test.mjs` | exit 0、92/92 pass |
| `npm run check:all` | exit 0 |
| `node scripts/migrate-evidence-sha.mjs` | exit 0、対象50・変更0 |
| 親本文と現在欄の独立比較 | 48一致＋Task16意図的再生成1件 |
| 現本文旧parser値と構造化欄の比較 | 50/50一致 |
| `git diff --check 191e529..ca05ccb` | exit 0 |
| `git diff --exit-code 03f451…ca05ccb -- <製品対象path>` | exit 0 |

## 固定性確認

開始・終了でHEADと主要blobが完全一致した。

- HEAD: `ca05ccb25f5cad98b19d832ac071d280526df385`
- Task16 report: `8bbccca4068fd38a77874f73756b10e84a23e055`
- 前レビュー記録: `030eb210d8079d168596d9293671836f54d561c2`
- evidence checker: `d0757ac19a1aea2a007ce3d51d0cac013cb78bd5`
- evidence tests: `bbb9f1db7b6023877bb817c383dae2a8a3dc8af8`
- migration: `a622b4a0a5f8f35dc295b82a3694e4d21c6e0f0a`
- preview manifest: `d19bd45901c3027940c3e547ed14985562967e82`
- previews: `fab7e6ec5e9a6773054c683e6094ef9f9edc3fcf`
- `git status --porcelain=v1`: 出力なし

## 未検証の残

- Tests / Fresh Eyes clean roundのため、実ブラウザ操作は再実行していない。
- Task16製品対象pathは固定SHA`03f451…`以降無変更であることを確認した。
- Security専任レビューは別担当の最終ラウンドを正本とする。
