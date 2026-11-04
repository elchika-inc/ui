---
verified_impl_sha: 8e89837ddb887f64f6926bf02b664890598c2139
---

# MCP 導入案内 — レビューと検証

- 日付: 2026-11-05
- 正本: standards `core/AI_FIRST.md` §2・§3。実装担当 `codex-agent-portability-20261105`。
- 通常レビュー: Codex CLI 0.155.0 / gpt-6-astra / high、実装と別文脈で1回。Claude 利用上限による代替。
- コマンド: `codex exec --ephemeral -s read-only -c 'approval_policy="never"' review --base d6aa645cf9d86841792f76df8bfc39cd80bbb11e`
- 対象: base `d6aa645cf9d86841792f76df8bfc39cd80bbb11e` / head `202926127c7bfcbb4813fb1bbcff8d6c8bb67c03`。exit 0、flag 0、optional 0。費用未取得。対象差分の読み取りと最終回答を確認。HEAD・作業ツリーの想定外変更なし。
- セキュリティレビュー: N/A。導入手順の表示追加で、アプリの認証・入力処理・公開範囲・外部通信コードを変えない。MCP の実機登録も行っていない。

## レビュアーの結果

指定差分を確認し、修正が必要な不具合は見つからなかった。 関連テスト12件と lint は成功（警告あり）した。 ビルド・ブラウザ・MCP実接続は今回未検証。

## 実装者による検証

- 変更前 docs-site 11件通過。追加テストは旧実装で Codex 設定定数不足を検出し RED（exit 1）。変更後12件通過。
- `npm run lint`: exit 0（既存警告213件・info3件）。`npm run typecheck`: exit 0、error/warning 0、hint 1。
- `node --test "scripts/*.test.mjs"`: exit 0、596件 passed、fail/skipped/cancelled 0。実ビルド HTML の導入案内も検査。
- `npm run build`: exit 0。build:lib を含む。`node scripts/check-standards.mjs`: exit 0。
- 手順の出典: https://ui.shadcn.com/docs/mcp （2026-11-05 閲覧）。

## ブラウザ検証

ビルド後 `python3 -m http.server 4362 --bind 127.0.0.1 --directory dist` で配信し、Playwright の独立 Chromium で `/` を開いた。1440×1000 と 390×1000、light / dark の双方で MCP 節を確認・撮影した。4条件ともページ幅と document.scrollWidth が一致。Claude の既存1行コードは領域内を横スクロールし、追加した Codex の3行は390pxでも全文が見える。画像は PR に直接添付する。

| route | light | dark | console | a11y tree | keyboard |
|---|---|---|---|---|---|
| `/` | PC・スマホの表示確認済み | PC・スマホの表示確認済み | build 配信は error/warning 0 | axe 4.14.0、既存 serious 2規則4箇所。追加した Codex 案内は検出なし | Tab で公式手順リンクへ到達。既存横スクロール領域は axe の指摘が残る |

axe のタグは wcag2a / wcag2aa / wcag21a / wcag21aa / wcag22aa。`label-content-name-mismatch` は既存テーマボタン1箇所、`scrollable-region-focusable` は既存の直接URL・namespace JSON・Claude MCP コードの3箇所。base `d6aa645cf9d86841792f76df8bfc39cd80bbb11e` を `git archive` で一時ディレクトリへ展開し、同じ依存で `npm run build:site`（exit 0）→ port 4363 で配信して同じブラウザ検査を行い、同じ要素で再現した。base の dark 初回検査にはテーマボタンの color-contrast も出ており、生の観測を [JSON](2026-11-05-agent-portability-browser.json) に残した。ページ全体の a11y を合格とは扱わない（RISK-017）。

開発サーバーでは既存の一覧リンクの Button に nativeButton 警告1件を観測した。同じ JSX が base にあり、今回変更していない。build 配信で警告0だったことと区別する。

MCP の実クライアント接続、main のマージ、本番反映は未実施。

## 証跡形式の修正と同一性

PR #113 では証跡初回追加時の verified_impl_sha を欠いたため、元ブランチを改変せず後継ブランチを base から作成した。通常レビュー対象 `202926127c7bfcbb4813fb1bbcff8d6c8bb67c03` と後継実装 `8e89837ddb887f64f6926bf02b664890598c2139` の README・テスト2ファイル・src2ファイルは byte 一致する。レビュー・テスト・ブラウザの対象実装を変えていないため、その結果を引き継ぎ、再レビューは行わない。検証 SHA は初回記録から上記の実装コミットへ固定する。旧 PR は差し替え履歴として残す。
