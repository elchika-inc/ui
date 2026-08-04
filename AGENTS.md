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
- standards_version: 2026-07-29 (rev.46)。
- branch_policy: `protected`（PR 必須で、直 push の bypass を設けない）。

## Key Commands

- dev: `npm run dev` → `http://localhost:4321/`。
- test: `node --test "scripts/*.test.mjs"`。
- check: `npm run lint` + `npm run typecheck`。
- deploy: `npm run build && npx wrangler deploy`。GitHub Actions は main push または手動実行で Workers Assets へ deploy する。

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
| `CONTRIBUTING.md` / `SECURITY.md` / `.github/ISSUE_TEMPLATE/config.yml` | 貢献規約と脆弱性報告の導線 |
| `AGENTS.md` / `CLAUDE.md` / `README.md` | エージェント契約と人間向け入口 |
| `DESIGN.md` | 各プロダクトが継承するハウススタイル（standards §12 の「既定の意図の置き場所」）。意図の正本は `src/styles/design-system/design-tokens.html` で、こちらはポインタと再検討トリガーのみ |

- Base UI を基底層に採用し、アクセシビリティの土台を共有する。
- Storybook は置かず、Astro の隔離プレビューで代替する。

## 重要な設計原則（What NOT to Do）

- `main` へ直接コミットしない。
- **PR は squash ではなく merge commit でマージする**。証跡（`.docs/reviews/`）は `verified_impl_sha` で検証時点の commit を固定し、その値は immutable（書き換えも削除も `check-evidence` が弾く）。squash は PR ブランチの commit を捨てるため、マージした瞬間に証跡の SHA が履歴から消えて祖先判定を通らなくなる（実際に PR #16 で発生し、`-s ours` の空マージで履歴を接続して復旧した）。
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
