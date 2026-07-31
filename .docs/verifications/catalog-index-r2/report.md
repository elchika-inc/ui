# 動作検証レポート: catalog index `/`

## 実行環境

- 対象SHA: `dabfe38678db2ddd9f2f9ebbae78cd3c26835f5b`
- 実行日時: 2026-08-01 07:21〜07:31 JST
- URL: `http://127.0.0.1:3193/`
- OS: Darwin 25.3.0 arm64
- Node.js 26.4.0 / npm 11.17.0 / Google Chrome 150.0.7871.187
- 実行可否: ✅実ブラウザ検証完了

## 手順

```bash
npm run build
npx serve dist -l 3193
CATALOG_BASE_URL=http://127.0.0.1:3193 \
  node .docs/verifications/catalog-index-r2/evidence/case00-browser-runner.mjs
```

Chrome CDPで1280×900表示、DOM・Accessibility tree・console・networkを採取した。forced-darkは`document.documentElement.classList.add("dark")`を実行した。最後にサーバーを停止した。

## 結果

| 項目 | 判定 | 実測結果 |
|---|---|---|
| build | ✅ | `npm run build` exit 0 |
| preview scan | ✅ | badge/button/dialog/input/sonner/tabsの6件 |
| light構造 | ✅ | main 1、navigation 2、h1 1、h2 2、h3 6、link 14 |
| forced-dark構造 | ✅ | lightと同数。`html.dark`適用を確認 |
| navigation名 | ✅ | 「横断カタログ」2リンク、「隔離プレビュー」12リンク |
| 全リンクHTTP | ✅ | light/forced-dark各14件すべて200、HTML本文あり、error bodyなし |
| console/network | ✅ | 両モードともpage console error 0、例外0、loading failure 0、4xx/5xx 0 |
| 横スクロール | ✅ | document/body/mainすべて1280px、overflowなし |
| theme token | ✅ | light背景/前景=`oklch(1 0 0)`/`oklch(0.145 0 0)`、darkでは反転 |
| focus | ✅ | 両モードでTabにより14リンクへ順番に到達。`:focus-visible=true`、3px ringあり |
| スクリーンショット | ✅ | light/darkおよびfocus状態を各1280×900 PNGで保存 |
| cleanup | ✅ | 3193 listenerなし、停止後curl exit 7。一時Chrome profile削除済み |
| source保全 | ✅ | 検証前からの3ファイル以外にtracked差分増加なし |

最終検証ゲートは35/35合格、不具合0件。

## 三方向クロスチェック

- コード: `import.meta.glob("../previews/*.tsx")`とindexのmapから6 preview・12個別リンクを導出。
- 画面: DOM/Accessibility treeでnavigation 2、link 14、見出し階層を実測。
- スキーマ: 静的indexのため対象となるOpenAPI・入力スキーマなし。
- コードのみ・画面のみ・スキーマのみの不一致は確認されなかった。

## 誤検知の自己修復

初回のerror-body検出が通常のAstroランタイム文字列`astro:hydration-error`を誤検知した。URISK-046を適用し、script/styleを除いた可視本文とtitleによる判定へ修正して再実行し、exit 0を確認した。対象実装の不具合やflakyではない。

## 未到達・未確認

- manifestの不正path、Preview exportなし・複数の例外分岐は、source変更禁止のため未実行。
- 1280×900以外のviewport、Chrome以外のブラウザ、各リンク先の詳細操作は対象外。
- Chrome process stderrには外部通信を遮断した結果のSSL handshake failureがあるが、page console/networkの対象URLにはエラーなし。
