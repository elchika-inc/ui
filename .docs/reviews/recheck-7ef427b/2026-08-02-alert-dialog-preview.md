# Alert Dialog プレビュー再検証

verified_impl_sha: 7ef427b9eada9244d2f266165979ea3aa7d67e30

## 結論

- 判定: GREEN。Light / Dark を各3 fresh tabで実行し、計6/6で修正後契約を確認した。
- `defaultOpen`のcontent / overlayが表示され、Action「削除する」で閉じ、trigger「削除を確認する」へfocusが戻った。
- 全runでHTTP 4xx/5xx、`Network.loadingFailed`、pageerror、console error/warningが0件だった。

## 実行環境

- 検証日時: 2026-08-02 13:43 JST
- branch: `feat/batch-final`
- URL: `http://127.0.0.1:3017/preview/alert-dialog/`、`http://127.0.0.1:3017/preview/alert-dialog-dark/`
- OS: macOS 26.3.1（Build 25D2128）
- Node.js: v26.4.0 / npm 11.17.0
- Browser: Google Chrome 150.0.7871.187
- viewport: 1280x900 CSS px
- 起動: ポート3017が空であることを確認後、fresh `npm run build`、`npm run preview -- --host 127.0.0.1 --port 3017`
- 開始状態: HEAD一致、worktree clean
- 実行可否: ✅実ブラウザで実行

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. hydration後、`[data-slot="alert-dialog-content"]`と`[data-slot="alert-dialog-overlay"]`が各1件で、roleが`alertdialog`、初期focusがcancelである。
3. Action「削除する」click後、content / overlayが各0件となり、focusが`[data-slot="alert-dialog-trigger"]`へ戻る。
4. 監視区間でHTTP 4xx/5xx、loading failure、pageerror、console / log / dev error・warningが0件である。
5. Light / Darkの表示証跡がJPEG実体である。

## テストケースと結果

| theme | fresh tab | 初期 content / overlay | role / 初期focus | Action後 content / overlay | Action後focus | HTTP応答 | エラー | 判定 |
|---|---:|---|---|---|---|---|---|---|
| Light | 1 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |
| Light | 2 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |
| Light | 3 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 1 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 2 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |
| Dark | 3 | 1 / 1 | `alertdialog` / `alert-dialog-cancel` | 0 / 0 | `alert-dialog-trigger` | 50件、4xx/5xx 0 | 全区分0 | ✅ |

再現率はLight 3/3、Dark 3/3。イベントバッファのtruncation / `hasMore`はいずれもfalseだった。`aria-modal`は実DOMで属性なしだったため、属性値を合格根拠にはしていない。modal契約はoverlay、`alertdialog` role、dialog内初期focus、閉鎖時focus returnの実体で判定した。

## 三方向導出と未到達分岐

- コード: `defaultOpen`、trigger、cancel、action、content / overlayを列挙した。
- 画面: a11y treeと実DOMからdialog、3ボタン、初期focusを列挙した。
- 型・スキーマ: React component props以外の入力スキーマはない。
- コードにあるが今回のAction経路から未到達: cancel、Escape、overlay外側click。既存個別検証の責務であり、今回の修正再検証ではAction閉鎖を優先した。
- 画面入力とコード検証、スキーマとコードの不一致は検出しなかった。

## JPEG証跡

| file | 内容 | 実体 | 寸法 | SHA-256 |
|---|---|---|---|---|
| `2026-08-02-alert-dialog-preview-light.jpg` | Light、dialog open | JPEG/JFIF、magic `ffd8ffe0` | 1280x900 | `7938c5d454dc7e8fa81885be9a15893376128688ffd481e2a019adffdb117c23` |
| `2026-08-02-alert-dialog-preview-dark.jpg` | Dark、dialog open | JPEG/JFIF、magic `ffd8ffe0` | 1280x900 | `008abb1f8e02805115f7187a077a86942e05e7f551f185ea1e9f82840cd57817` |

## 再現手順

1. `npm run build`
2. `npm run preview -- --host 127.0.0.1 --port 3017`
3. 各URLをthemeごとにfresh tabで3回開く。
4. content / overlay、role、activeElementを評価する。
5. role button / name「削除する」をclickし、content / overlayが0、activeElementがtriggerであることを評価する。
6. CDP network / runtime / log eventsとブラウザdev logsを確認する。

## クリーンアップ

- 作成データなし。各検証tabは閉じた。
