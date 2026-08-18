verified_impl_sha: d628bdaf590187d7ff574137ffa0ddd1f8eb20cf

# レビューサイクルの記録

完了したサイクルの学習を追記する。既存エントリは変更しない。

> `verified_impl_sha` は `.docs/reviews/` 配下の全 `.md` に必須（`scripts/check-evidence.mjs`）。
> 本ファイルはブラウザ検証の証跡ではなくサイクル記録だが、同じ制約下に入る。
> 値はサイクル完了時点の commit を指す。

<!-- review-cycle:start 2026-08-18-registry-blocks -->
## 2026-08-18 registry:block レーンの新設（Task 1〜5）

- **Cycle ID**: 2026-08-18-registry-blocks
- **対象 HEAD**: d628bdaf590187d7ff574137ffa0ddd1f8eb20cf
- **総ラウンド数**: 4
- **終了理由**: 全員 LGTM（未対応 flag 0 件）
- **レンズ別 flag 件数**: correctness 11 / silent-failure 6 / tests 7 / domain 6 / fresh-eyes 13 / Ambiguity - / Altitude -
- **確定した偽陽性**:
  - `[".docs/reviews/2026-08-17-login-01-preview.md"]` — 証跡の散文は immutability の対象外であり編集してよい — `reportHistoryProblems` だけを読んだ結論で、`evidencePathChangedAfterBaseline` を見落としている。実際に編集して exit 1 を 2 度観測した

### ラウンド別

| ラウンド | flag | 前ラウンドの修正に起因 |
|---|---|---|
| 1 | 13 | — |
| 2 | 17 | 6 |
| 3 | 10 | 8 |
| 4 | 3 | 3 |

**43 件中 17 件が「前ラウンドの修正が持ち込んだ新しい欠陥」だった。** 1 ラウンドで打ち切っていれば、
CI を赤にする typecheck エラー・repo 外への書き込み・折り返し import の取りこぼしはすべて PR に載っていた。

### 採らなかった optional

- **component レーンの同型の穴**（`registryDependencies` の無検査転記、item type の未検査）—
  既存 61 件への変更は委任のスコープ外。block のみに掛けた
- **block 名と component 名の衝突検査** — 現時点で衝突は無く YAGNI。Task 6 で 26 件足す時点で入れる
- **`check-evidence.mjs` の CLI エントリの smoke test** — 実体は `checkEvidenceInRepo` 側にあり
  88 件で固定済み。CLI は 10 行で新しい振る舞いを持たない（R3 レビュアーも同判断）
- **CI の `Dist registry check` が `button.json` 固定** — CI 設定の変更はスコープ外として申し送る
- **block item の `description` を上流の値にする** — 3 ラウンドで 5 名から挙がったため、
  繰り延べをやめて `block.` への分岐だけ採用した（上流文言の採用は registry item の生成規則の
  変更にあたるので Task 6 の入口で決める）
<!-- review-cycle:end 2026-08-18-registry-blocks -->
