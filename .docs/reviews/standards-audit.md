# standards 準拠監査の checkpoint

standards `AUDIT.md`「エージェント PR 監査 checkpoint」の正本。走査範囲の起点を記録する。

last_verified_commit: e2bca7c82faff196ad6f607b7d57a9df145f9203
verified_impl_sha: e2bca7c82faff196ad6f607b7d57a9df145f9203

> `verified_impl_sha` は `.docs/reviews/` 配下の全 `.md` に必須（`scripts/check-evidence.mjs`）。
> 本ファイルはブラウザ検証の証跡ではなく監査記録だが、standards `AUDIT.md` が checkpoint の
> 置き場所を `.docs/reviews/standards-audit.md` と指定しているため同じ制約下に入る。
> 値は `last_verified_commit` と同じ「監査を実施した時点の commit」を指す。

## 2026-08-05 — 初回監査（フェーズ: progress）

standards 参照版: 2026-08-05 (rev.60)

本ファイルが存在しなかったため、AUDIT の fail-closed 規定に従い **root commit を含む全履歴を完全走査**した。

### エージェント作業の PR 経由

`git log --first-parent main` の 22 commit を走査した。**直 push は0件**。

| 種別 | 件数 | 備考 |
|---|---|---|
| merge commit（親2） | 18 | PR 経由 |
| squash merge（親1・件名末尾に `(#N)`） | 3 | #16 / #15 / #4。PR 経由だが下記の注意あり |
| root commit | 1 | Initial commit |

`branch_policy: protected` の宣言を実体で確認した。旧 branch-protection API は 404 を返すが、**ruleset 方式**（`enforcement: active` / main に `pull_request` ルール）で保護されている。宣言と実態は一致する。

**注意**: `AGENTS.md` は「PR は squash ではなく merge commit でマージする」と定めている（証跡の `verified_impl_sha` が PR ブランチの commit を指すため）。上記 squash 3件のうち #16 は `-s ours` の空マージで履歴を接続して復旧済みと `AGENTS.md` に記録がある。**#15 と #4 の復旧有無は未確認**。

### 検出系チェックの self-test

0件の結果を「準拠」と報告した項目について、fixture で検出できることを確認した。

| チェック | self-test | 本番結果 |
|---|---|---|
| ステータス色の極性 | `text-success` / `border-warning` を2件検出、`-foreground` / `bg-` は拾わない | 0件 |
| 生パレット直書き | fixture 1件を検出 | 0件 |
| 中立性（エージェント製品名） | `Codex` を検出、LLM API 名は誤検知しない | 修正後0件 |
| 文体の中立性 | 会話用語尾の fixture を検出 | 0件 |
| Biome | 実ファイルで違反を報告（空走していない） | exit 0 |
| tsc | 935 ファイルを検査（`--listFiles` で確認） | 0件 |

### 判定不能・未実施

- **検証証跡の実在**（PR 本文への画像添付）— 未実施。当リポジトリは `.docs/reviews/` にファイルとして証跡を持つ方式で、AUDIT が正本とする「PR 直接添付」と方式が異なる。どちらを正とするかは未裁定
- **受容リスクの anchor** — AUDIT が「機械検査せず人間レビューで確認する」と定める項目のため未実施
- **`check:all` の evidence checker が報告した証跡の陳腐化3件** — 共有面（`src/layouts/main.astro` / `src/previews` / `src/components/ui`）の変更に対して証跡が古い。実ブラウザでの再検証が必要なため本監査では解消していない

### 本監査で解消したギャップ

- `noUncheckedIndexedAccess` 未設定（MUST）→ 有効化。影響は `src/previews/pagination.tsx` の1箇所のみで、`components/ui` の62コンポーネントは無変更で通過した
- `standards_version` が rev.46（14 rev 遅れ）→ rev.60
- `AGENTS.md` の Architecture 表にアダプターファイル名が混入 → 削除
- README に Tech Stack / Architecture の見出しが無い → 追加（Architecture は Development 配下から昇格）
