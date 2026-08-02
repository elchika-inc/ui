# Sheet プレビュー再検証

verified_impl_sha: 7ef427b9eada9244d2f266165979ea3aa7d67e30

## 結論

- 判定: GREEN。Light / Darkを各3 fresh tabで実行し、計6/6でoverlay token、footer Close、Escape、focus returnを確認した。
- overlayのcomputed backgroundは両theme・全runでsemantic `--overlay`の解決値`oklch(0 0 0 / 0.1)`と一致した。
- 全runでHTTP 4xx/5xx、`Network.loadingFailed`、pageerror、console error/warningが0件だった。

## 実行環境

- 検証日時: 2026-08-02 13:43 JST
- branch: `feat/batch-final`
- URL: `http://127.0.0.1:3017/preview/sheet/`、`http://127.0.0.1:3017/preview/sheet-dark/`
- OS: macOS 26.3.1（Build 25D2128）
- Node.js: v26.4.0 / npm 11.17.0
- Browser: Google Chrome 150.0.7871.187
- viewport: 1280x900 CSS px
- 起動: ポート3017が空であることを確認後、fresh `npm run build`、`npm run preview -- --host 127.0.0.1 --port 3017`
- 開始状態: HEAD一致、worktree clean
- 実行可否: ✅実ブラウザで実行

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. `defaultOpen`でcontent / overlayが各1件である。
3. overlayのcomputed `background-color`が同一DOM上のsemantic `--overlay`解決値と一致する。
4. footer内Closeで閉じ、triggerへfocusが戻る。triggerで再度開き、Escapeで閉じ、triggerへfocusが戻る。
5. 監視区間のHTTP 4xx/5xx、loading failure、pageerror、console / log / dev error・warningが0件である。

## テストケースと結果

| theme | fresh tab | overlay actual / semantic | footer Close後focus | Escape後focus | HTTP応答 | エラー | 判定 |
|---|---:|---|---|---|---|---|---|
| Light | 1 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |
| Light | 2 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |
| Light | 3 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 1 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 2 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 3 | `oklch(0 0 0 / 0.1)` / 同値 | `sheet-trigger` | `sheet-trigger` | 54件、4xx/5xx 0 | 全区分0 | ✅ |

再現率はLight 3/3、Dark 3/3。CSS token生値は両themeとも`oklch(0% 0 0/.1)`だった。イベントバッファのtruncation / `hasMore`はいずれもfalseだった。

当初`[data-slot="sheet-close"]`だけではfooterと右上の2件に一致し、対象が曖昧だった。この試行は製品判定から除外し、コード上の構造に沿って`[data-slot="sheet-footer"] [data-slot="sheet-close"]`へ限定して各theme 3回を新規実行した。

## 三方向導出と未到達分岐

- コード: defaultOpen、overlay、footer Close、右上Close、trigger、Escape経路を列挙した。
- 画面: 実DOM / a11y treeでdialog、overlay、同名Close 2件、triggerを確認した。
- 型・CSS: `--overlay` semantic tokenと`bg-overlay`適用を突き合わせた。
- コードにあるが今回未到達: 右上Close、overlay pointer dismiss、sideのright以外。今回の修正対象であるfooter CloseとEscapeを優先した。
- 画面入力とコード検証、tokenと実装の不一致は検出しなかった。

## JPEG証跡

| file | 内容 | 実体 | 寸法 | SHA-256 |
|---|---|---|---|---|
| `2026-08-02-sheet-preview-light.jpg` | Light、Sheet open | JPEG/JFIF、magic `ffd8ffe0` | 1280x900 | `a43249bce066904a771a32822a8c3d77476066ef5943a7db34e75801a1f863da` |
| `2026-08-02-sheet-preview-dark.jpg` | Dark、Sheet open | JPEG/JFIF、magic `ffd8ffe0` | 1280x900 | `23a76fae7c3626610f31cacd4dcea78a13df053a6e87365d661b6f69d491a9b0` |

## 再現手順

1. `npm run build`
2. `npm run preview -- --host 127.0.0.1 --port 3017`
3. 各URLをthemeごとにfresh tabで3回開く。
4. overlay自身のcomputed backgroundと、`--overlay`をbackgroundへ適用したprobeのcomputed値を比較する。
5. footer内Closeをclickしてcontent消失とtrigger focusを確認する。
6. triggerをclickして再度開き、contentへEscapeを送ってcontent消失とtrigger focusを確認する。
7. CDP network / runtime / log eventsとブラウザdev logsを確認する。

## クリーンアップ

- 作成データなし。各検証tabは閉じた。
