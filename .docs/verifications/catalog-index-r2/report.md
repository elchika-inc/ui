# 動作検証レポート: catalog index `/`

## 実行環境

- 対象SHA: `6b3e8046b8a422f87379c56bf2cbe5f10d394a6f`
- 日時: 2026-08-01 07:45〜07:47 JST
- URL: `http://127.0.0.1:3193/`
- Darwin 25.3.0 arm64 / Node.js 26.4.0 / npm 11.17.0 / Chrome 150.0.7871.187
- 実行可否: ✅実Chrome検証完了

## 再現手順

```bash
npm run build
npx serve dist -l 3193
CATALOG_BASE_URL=http://127.0.0.1:3193 \
  node .docs/verifications/catalog-index-r2/evidence/case00-browser-runner.mjs
```

## 結果

| 項目 | 判定 | 実測 |
|---|---|---|
| build | ✅実測確認 | exit 0 |
| preview scan | ✅実測確認 | badge/button/dialog/input/sonner/tabsの6件 |
| light/forced-dark構造 | ✅実測確認 | 各main 1、navigation 2、h1 1、h2 2、h3 6、link 14 |
| navigation名 | ✅実測確認 | 横断カタログ2リンク、隔離プレビュー12リンク |
| 全リンクHTTP | ✅実測確認 | 両モード各14件すべて200、HTMLあり、error bodyなし |
| page console/network | ✅実測確認 | console error・例外・loading failure・4xx/5xxすべて0 |
| 全response origin | ✅実測確認 | 両モード各18件を全記録。全件`http://127.0.0.1:3193`、outsideOrigin 0 |
| 横スクロール | ✅実測確認 | viewport/document/body/mainすべて1280px、overflowなし |
| theme | ✅実測確認 | light背景/前景=`oklch(1 0 0)`/`oklch(0.145 0 0)`、forced-darkで反転 |
| focus | ✅実測確認 | 両モードでTabにより14リンクへ順次到達、`:focus-visible=true`、3px ringあり |
| スクリーンショット | ✅実測確認 | light/dark/focusを各1280×900 PNGで保存 |

最終summaryは37/37合格、不具合0件。

## クロスチェック・限界

- コードのglob/map、実DOM、Accessibility treeで6 preview・14リンクが一致。静的indexのため対象スキーマなし。
- manifestの不正path、Preview exportなし・複数の例外分岐はsource変更禁止のため未到達。
- 1280×900以外、Chrome以外、リンク先の詳細操作は未確認。
- error-body判定は通常のAstro runtime文字列を除外し、可視本文/titleで判定する修正版を使用。
- Chromeの外部名前解決はhost-resolver ruleで遮断。CDPで観測したpage responseに外部originなし。

## クリーンアップ

- 3193 listener停止済み、停止後curl exit 7。
- 一時Chrome profile削除済み。
- 検証前からの`check-evidence` 2ファイルとevidence runner以外にsource差分増加なし。
