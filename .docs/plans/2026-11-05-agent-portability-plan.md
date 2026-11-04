# エージェント代替と依存境界の整合 — ui 実装計画

- 根拠: https://github.com/elchika-inc/ui/issues/112、2026-11-05 の横断調査と利用者の「推奨の方法で進めてほしい」。同日に提示した改善範囲の実装承認として扱う。追加の仕様変更が必要なら止める。
- 実装担当識別子: `codex-agent-portability-20261105`（全リポを同一セッションが実装）。
- 実行方法: このセッションで順次実装し、計画と成果物をそれぞれ別文脈で1回レビューする。
- 成功条件: README とトップページに Claude Code の初期化コマンドと Codex の TOML 設定を分けて表示する。公式 shadcn MCP 手順を参照し、他クライアントも案内する。
- 境界: 既存サイトの導入案内の改善。UI 部品・トークン・registry の変更、デプロイは対象外。

## 設計判断

既存 MCP_INIT_COMMAND は Claude 用として保持する。Codex 用 TOML 定数を追加し、トップページでは Claude Code と Codex をラベル付きで縦に案内する。公式 https://ui.shadcn.com/docs/mcp の Codex 設定に従い ~/.codex/config.toml への [mcp_servers.shadcn] と npx shadcn@latest mcp を示し、再起動するクライアントも区別する。他クライアントは同じ公式ページへ案内する。README と公開 HTML の両方で設定を読めることを確認する。

## 変更ファイル

- `README.md`
- `src/site/installation.mjs`
- `src/site/documentation-home.tsx`
- `scripts/docs-site.test.mjs`
- `scripts/catalog-build.test.mjs`

計画・レビュー記録は `.docs/plans/`・`.docs/reviews/` に置く。必要になった受容記録だけ `.docs/risk-registry.md` に追記する。

## 手順と検証

- [x] 計画を別文脈でレビューし、flag を修正・受容・誤検知で閉じる。
- [x] 既存ファイルと担当範囲だけを変更する。ドキュメントだけの置換には実装をなぞるテストを新設しない。
- [x] `node --test "scripts/*.test.mjs"、npm run lint、npm run typecheck、npm run build とトップページのブラウザ確認` を個別に実行し、exit code と実体を記録する。
- [x] 修正後の差分と正本・参照・境界を照合する。
- [x] 対象コミットを固定し、standards-review の組み込み・公式機能で別文脈レビューを1回行う。必要なセキュリティレビューも公式機能で実施し、未実施なら未完了として明記する。
- [ ] flag を閉じ、関係する検証だけを再実行して PR を作り、人へ報告する。

## 完了判定 rubric

- 優先担当を変えず、利用不能時の代替が standards の正本と矛盾しない。
- レビューの独立性・回数・人間の承認・成果物の検証条件を弱めない。
- 上記の検証を実測し、実機未適用・未検証の経路を成功扱いしない。
- 既存の未コミット変更や別 PR の担当範囲を巻き込まない。

## 関連作業

elchika-inc/standards#175、elchika-inc/agent-env#109、elchika-inc/templates#84、elchika-inc/agent-toolkit#171

既存の導入案内テストへ Codex の設定とクライアントの区別を加える。変更前の失敗（RED）と変更後の成功（GREEN）を測る。ビルド出力に両経路が存在することと、ブラウザのトップページで読み取れ、狭い画面で横にはみ出さないことを確認する。
