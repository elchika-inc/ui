# Tests / Fresh Eyes 再レビューレポート

verified_impl_sha: 24fa01f3c65579ecce208b0395bcc5f3a5b5f0d0

## 対象

- scope: `191e529..24fa01f`
- 固定HEAD: `24fa01f3c65579ecce208b0395bcc5f3a5b5f0d0`
- 判定: **flag 1 / optional 0**
- 変更: なし
- 開始・終了ともHEAD、主要blob、worktree cleanを維持

## flag

### F1: 「49件の旧本文carry-forward」と「Task16再生成後の49件移行入力同値」が区別されず、migration検査が偽greenになる

確信度: 98%

[scripts/migrate-evidence-sha.mjs](/Users/nishikawa/projects/elchika-inc/ui/scripts/migrate-evidence-sha.mjs:54) は、現在のworking treeにある本文から旧parser値を再導出し、同じ現在本文の`verified_impl_sha`と比較する。[scripts/check-evidence.test.mjs](/Users/nishikawa/projects/elchika-inc/ui/scripts/check-evidence.test.mjs:129) も合成した単一本文だけを検査する。

そのため、同一commit内で本文と構造化欄を一緒に変更すると、移行前親commitから値が変わっていても検出できない。

実測結果:

- `node scripts/migrate-evidence-sha.mjs`: exit 0、「対象49、変更0」
- 親`433553d`の旧本文を旧parserで再計算し、現在の構造化欄と独立比較:
  - 一致: 48/49
  - 不一致: `.docs/reviews/2026-08-02-batch-overlay-catalog.md`
  - 親本文の旧parser値: `e22d241c8b64fc94a0b087081bc1b1ca10c407cf`
  - 現在値: `03f451135830675652a5c1df08d92c31cab5226c`

`03f451…`自体は最終再検証結果として正しい。問題は値ではなく、次の時系列を区別せず「49件すべて旧値と同値」と読める検査・報告になっている点である。

1. 親本文から48件をcarry-forward
2. Task16だけ最終`03f451…`検証結果へ全面再生成
3. そのworking treeを入力として49件を構造化欄へ移行
4. 49件の「移行入力時点」の旧parser値とは同値

修正後は、この時系列とTask16の意図的例外を恒常記録へ明記し、可能なら親本文比較と移行入力比較を別の検査結果として扱う必要がある。

## 重点項目の確認結果

- SHA parser:
  - 構造化欄の欠落、重複、40桁小文字SHA形式違反、存在しないcommitはhard failure。
  - component固有pathのcommit済み・未コミット変更もhard failure。
- `check:all`境界:
  - hard failureは非0終了で後続checkerを停止。
  - aggregate/shared surfaceの変更はadvisory。
  - 実リポジトリではstale 10件を表示しつつexit 0。文書化された境界と一致。
- completeness:
  - `src/previews/button.tsx`欠落、Light route欠落、Dark route欠落を個別に実行し、すべて期待どおり検出。
  - 実リポジトリでは42 componentが5経路すべてに存在。
- Task16:
  - 現在の`03f451…`からHEADまで、component・preview・catalog・registry対象pathの差分は0。
  - 42件、欠落0・余剰0、42/42可視、Context Menuの`BUTTON`・360.664×118、JPEGの寸法・hash、cleanup値は以前の最終実測値と一致。
  - JPEG実体:
    - Light: 1512×5833、458,033 bytes、SHA-256 `8688586b…f102e`
    - Dark: 1512×5833、462,815 bytes、SHA-256 `bd21bbf5…57c7`

## 実行結果

| コマンド | 結果 |
|---|---|
| `node --test scripts/*.test.mjs` | exit 0、88/88 pass |
| `npm run check:all` | exit 0、stale advisory 10件 |
| `node scripts/migrate-evidence-sha.mjs` | exit 0、対象49・変更0 |
| 親本文旧parser値と現在欄の49件独立比較 | 48一致・1不一致 |
| preview source/light/dark欠落の負テスト | 3パターンすべて検出 |
| `git diff --exit-code 03f451…24fa01f -- <製品対象path>` | exit 0 |
| JPEG `shasum`・`file`・`sips` | report記載値と一致 |

## 固定性確認

開始・終了とも以下を確認した。

- HEAD: `24fa01f3c65579ecce208b0395bcc5f3a5b5f0d0`
- worktree: clean
- Task16 report blob: `8bbccca4068fd38a77874f73756b10e84a23e055`
- checker blob: `8954d0d5005540ecaef84e5a043fe902636a1d9d`
- checker test blob: `dc1b841c6a0b08de90a25e292f4929eda813a027`
- migration blob: `a903dab9ace1c29369989ae9b02c2ec7afca4f67`
- preview manifest blob: `d19bd45901c3027940c3e547ed14985562967e82`
- previews blob: `fab7e6ec5e9a6773054c683e6094ef9f9edc3fcf`

## 未検証の残

- 今回はTests/Fresh Eyesのread-only再レビューであり、実ブラウザ操作は再実行していない。
- Task16のブラウザ値は既存の最終実測記録と、現在のJPEG・固定製品pathを照合した。
- flag修正後は固定された新HEADでcleanラウンドが必要。
