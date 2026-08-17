# ui

## Project Overview

elchika-inc の共有 UI コンポーネント。Base UI + Tailwind CSS v4。shadcn registry で配布する。

当リポジトリは4リポジトリ体制の**デザインシステムの正本**にあたる。

| リポジトリ | 持つもの | 当リポジトリとの関係 |
|---|---|---|
| [standards](https://github.com/elchika-inc/standards) | ルール | 読んで従う。**このリポジトリからは変更しない**（read-only） |
| [templates](https://github.com/elchika-inc/templates) | コピーして使う実体（共通契約・biome.json・legal/ 等） | UI とトークンは持たない（rev.55 で当リポジトリへ移管済み） |
| **ui**（このリポジトリ） | コンポーネント実体・トークン3ファイル・ハウススタイルの意図 | registry で配布する |
| [agent-toolkit](https://github.com/elchika-inc/agent-toolkit) | エージェントの道具（skills / plugins / hooks） | 直接の依存なし |

## Tech Stack

- スタック: Astro 7 + React 19 の静的サイト。パッケージマネージャは npm。配布は shadcn registry（npm publish しない）。
- Astro 7 / React 19 / TypeScript / Base UI (@base-ui/react) / Tailwind CSS v4 / Biome。パッケージマネージャは npm。
- standards_version: 2026-08-17 (rev.75)。
- branch_policy: `protected`（PR 必須で、直 push の bypass を設けない）。
- merge_policy: `auto-on-green`（owner `elchika-inc` の既定。DOCS_OPS §5）。**ただし前提条件が未充足の間、エージェントはマージ操作を行わず human 承認へ落とす。** 当リポジトリは `package-lock.json` という「正しさが base の内容に依存する成果物」を持つため、DOCS_OPS §5 は required status check と、strict 設定または merge queue の有効化を MUST としている。2026-08-17 の実測では branch ruleset（id=20105508、enforcement=active）の rule が `pull_request` のみで `required_status_checks` を持たず、`allow_auto_merge` も false であり、この MUST を満たしていない。PR CI の check `Lint, typecheck, test & build` を required へ加え、strict 設定（Require branches to be up to date before merging）または merge queue を有効化し、`allow_auto_merge` を有効にした時点で `auto-on-green` が実効となる。それまでは PR CI が全て green であっても human 承認を要する（この MUST は required status check の有無に依存しない）。

## Key Commands

- dev: `npm run dev` → `http://localhost:4321/`。
- test: `node --test "scripts/*.test.mjs"`。
- check: `npm run lint` + `npm run typecheck`。
- deploy: `npm run build && npx wrangler deploy`。GitHub Actions は main push または手動実行で、型検査 → ユニットテスト → build の順に通してから Workers Assets へ deploy する（DOCS_OPS §6 のジョブ構成）。

## Architecture

| ファイル | 責務 |
|---|---|
| `scripts/fetch-third-party-licenses.mjs` | 上流ライセンスの取得 |
| `scripts/record-provenance.mjs` | コンポーネント来歴の記録 |
| `scripts/check-standards.mjs` | standards `DESIGN.md` §3（色トークン）・§5（arbitrary value / focus ring）違反の機械検知。当リポジトリの `DESIGN.md` ではない |
| `scripts/check-distribution.mjs` | registry item への法務ファイル同梱検査 |
| `scripts/contrast.mjs` | トークンのコントラストを oklch から実計算する |
| `provenance.json` | コンポーネント単位の来歴（機械可読） |
| `.shadcn-cli-version` | scaffold を実行した CLI の exact version。来歴の正本 |
| `components.json` | shadcn の設定 |
| `src/components/ui/*.tsx` | 部品本体 |
| `src/index.ts` | ライブラリのバレル |
| `types/dts-contract.ts` | ビルド出力の props 契約を型で検査する（grep で代替できない） |
| `src/styles/global.css` | トークン |
| `src/previews/*.tsx` | 隔離プレビューの中身 |
| `src/pages/preview/*.astro` | 隔離プレビューのルート（light / dark で別ページ） |
| `src/pages/components/[name].astro` | 公開 component ページの静的生成ルート |
| `src/site/` | 公開サイトの導入情報・テーマ切替・Sidebar shell |
| `registry.json` | registry の定義 |
| `tsup.config.ts` | ライブラリビルド（出力先 `lib/`） |
| `biome.json` | lint / format |
| `.docs/PROJECT_GOAL.md` / `.docs/risk-registry.md` / `.docs/actions/` / `.docs/plans/` | 作業ドキュメント（DOCS_OPS §1・§3 の MUST） |
| `.docs/reviews/` | 実ブラウザ検証の証跡と DoneCriteria の通し記録 |
| `.docs/component-addition-procedure.md` | component を1件ずつ追加する手順の正本（継続的な要求事項を持つため DOCS_OPS §1 に従いこの表へ載せる） |
| `CONTRIBUTING.md` / `SECURITY.md` / `.github/ISSUE_TEMPLATE/config.yml` | 貢献規約と脆弱性報告の導線 |
| `AGENTS.md` / `README.md` | エージェント契約と人間向け入口（エージェント別アダプターは共通契約に混在させない — DOCS_OPS §2） |
| `DESIGN.md` | 各プロダクトが継承するハウススタイル（standards §12 の「既定の意図の置き場所」）。意図の正本は `src/styles/design-system/design-tokens.html` で、こちらはポインタと再検討トリガーのみ |

- Base UI を基底層に採用し、アクセシビリティの土台を共有する。
- Storybook は置かず、Astro の隔離プレビューで代替する。

## 重要な設計原則（What NOT to Do）

- `main` へ直接コミットしない。
- **名乗りに `inc.` を付けない（法人化までの暫定措置）。** elchika は法人化しておらず、会社であると誤認されるおそれのある文字を名称に用いることは会社法 7 条が禁じている。当リポジトリは registry で配布する正本なので、ここに入った表記は `public/r/*.json` を経由して全利用者へ配られる（2026-08-06 に 186 箇所を除去した）。**ブランド上の忌避ではなく、将来的には `inc.` を名乗る意向がある**（2026-08-06 確認）— 登記が完了したら禁止は解除されるので、この行を恒久ルールとして扱わない。復帰させるときは以下 2 点が同じ落とし穴になる。**`tokens.css` / `brands.css` のヘッダは `design-tokens.html` ではなく `build-tokens.mjs` のテンプレートリテラルが持つ** — 正本が `design-tokens.html` なのは「トークンの値」についてで、生成ファイルのヘッダ文言は生成側にある。HTML だけ直しても再生成で元に戻る。
- **共有トークン（`src/styles/global.css` / `src/styles/design-system/tokens.css`）を変えたら共有面の証跡を撮り直す。** `check-evidence` は内容ベースなので、コメント 1 行の変更でも既存証跡を stale と判定する（意味的な差分を判定できるゲートは、それ自体がバグりうるので安全側に倒してある）。撮り直しは 14 subject × light/dark = 28 枚で、`.docs/reviews/<新規>/report.md` に `verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha` を付けて同時追加する。**`verified_impl_sha` はトークン変更コミットより後でなければならない**（`strictAncestor` 判定のため、トークン変更コミット自身を指すと通らない）。
- **PR は squash ではなく merge commit でマージする**。証跡（`.docs/reviews/`）は `verified_impl_sha` で検証時点の commit を固定し、その値は immutable（書き換えも削除も `check-evidence` が弾く）。squash は PR ブランチの commit を捨てるため、マージした瞬間に証跡の SHA が履歴から消えて祖先判定を通らなくなる（実際に PR #16 で発生し、`-s ours` の空マージで履歴を接続して復旧した）。
- **エージェントがマージ操作を実行する場合は、その直前に DOCS_OPS §5「エージェントのマージ記録」が定める verdict コメントを `gh pr comment` で残す**（`merge_policy` の値を問わず MUST。残せなければマージせず human 承認へ落とす）。上記のとおり当リポジトリは `auto-on-green` の前提条件が未充足なので、現時点で使える版は人間の承認を根拠に代行する `agent-merge-verdict/human-v1` に限られる。
- コミットメッセージ・PR 本文・ドキュメント・コード内コメントは日本語（技術用語と識別子は原語のまま）。
- 生の色指定と値系 arbitrary value を使わない。
- フォーカスリングに透明度合成を使わない。
- `private: true` を外して npm publish しない。
- 外部から移植したコードは `provenance.json` に来歴を記録する。

## エージェント連携

- dev-data-safety: local。
- routes:
  - `/` — 利用者向け導入手順と component 索引。
  - `/components/button/` — Button の公開 component ページ。
  - `/catalog/` — 横断検証カタログ（既存証跡の対象）。
  - `/preview/button/` — Button の隔離プレビュー（light）。
  - `/preview/button-dark/` — Button の隔離プレビュー（dark）。
