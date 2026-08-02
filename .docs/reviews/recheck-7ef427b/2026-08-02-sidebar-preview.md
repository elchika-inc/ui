# Sidebar プレビュー再検証

verified_impl_sha: 7ef427b9eada9244d2f266165979ea3aa7d67e30

## 結論

- 判定: GREEN。Light / Darkを各3 fresh tabで実行し、計6/6でdesktopとmobile双方のprops forward、mobile Escape閉鎖、focus returnを確認した。
- 実DOM `#sidebar-preview-props`は全状態で`data-preview-props="forwarded"`、class `sidebar-preview-props`、computed `touch-action: manipulation`だった。
- mobileでは実sidebarが`data-mobile="true"`となり、Escape後にSheet contentが0件、triggerへfocusが戻った。

## 実行環境

- 検証日時: 2026-08-02 13:43 JST
- branch: `feat/batch-final`
- URL: `http://127.0.0.1:3017/preview/sidebar/`、`http://127.0.0.1:3017/preview/sidebar-dark/`
- OS: macOS 26.3.1（Build 25D2128）
- Node.js: v26.4.0 / npm 11.17.0
- Browser: Google Chrome 150.0.7871.187
- viewport: desktop 1280x900、mobile 390x844 CSS px
- 起動: ポート3017が空であることを確認後、fresh `npm run build`、`npm run preview -- --host 127.0.0.1 --port 3017`
- 開始状態: HEAD一致、worktree clean
- 実行可否: ✅実ブラウザで実行

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. desktopの実DOM `#sidebar-preview-props`に指定id、data属性、class、computed touch-actionがforwardされる。
3. mobile viewportへ切り替え、triggerで開いた実sidebarにも同じpropsがforwardされ、`data-mobile="true"`である。
4. mobileでEscape 1回により閉じ、Sheet contentが0件、triggerへfocusが戻る。
5. 全HTTP resourceが200で、loading failure、pageerror、console / log / dev error・warningが0件である。

## テストケースと結果

| theme | fresh tab | desktop props | mobile props / data-mobile | Escape後 content / focus | HTTP resource | エラー | 判定 |
|---|---:|---|---|---|---|---|---|
| Light | 1 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |
| Light | 2 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |
| Light | 3 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |
| Dark | 1 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |
| Dark | 2 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |
| Dark | 3 | id / data / class / touch一致 | 全一致 / `true` | 0 / `sidebar-trigger` | 68件、全件200 | 全区分0 | ✅ |

再現率はLight 3/3、Dark 3/3。desktop実sidebarの`data-mobile`は`false`、状態は`expanded`だった。mobile open stateは`mobile=true / open=true`、Escape後は`open=false`だった。

### ネットワーク証跡の完全性

desktop→mobileで2回reloadする主操作runでは、直接CDP event streamが各run 139 response、4xx/5xx 0、loading failure / pageerror / console / log / dev error・warning 0を返したが、イベントバッファの`truncated=true`も観測した。このstream単独では完全性の根拠にしていない。

そこでbuffer非依存の補助runを各theme 3 fresh tabで追加し、mobile reloadからopen / Escapeまでを実行した後、Resource Timing entryごとにCDP `Runtime.evaluate`でstatusを取得した。各runはHTTP resource 68件、全件status 200、dev error/warning 0だった。主操作のDOM実測と補助runのresource全数を組み合わせて判定した。

## 三方向導出と未到達分岐

- コード: desktop/mobile分岐、props spread、trigger、mobile Sheet、Escape経路を列挙した。
- 画面: desktopとmobileの実DOM、open state、trigger focusを確認した。
- 型: `React.ComponentProps<"div">`由来のid / data / className / styleを実DOMと突き合わせた。
- 修正契約の未到達分岐なし。今回未実行の既存機能はdesktop collapse、keyboard shortcut、rail、menu tooltip、cookie persistence。
- コード・画面・型の不一致は検出しなかった。

## JPEG証跡

| file | 内容 | 実体 | 寸法 | SHA-256 |
|---|---|---|---|---|
| `2026-08-02-sidebar-preview-light.jpg` | Light、mobile open | JPEG/JFIF、magic `ffd8ffe0` | 390x844 | `0da93acc2a484f130a33f1eed009842cb923ee0f24eb358ba12ab38655abdd74` |
| `2026-08-02-sidebar-preview-dark.jpg` | Dark、mobile open | JPEG/JFIF、magic `ffd8ffe0` | 390x844 | `62361b7cfbb86ee78850129b967dad008528289d913c325585f4064a6db30c92` |

## 再現手順

1. `npm run build`
2. `npm run preview -- --host 127.0.0.1 --port 3017`
3. 各URLをthemeごとにfresh tabで3回開く。
4. desktop 1280x900で`#sidebar-preview-props`の属性、class、computed `touch-action`、stateを評価する。
5. viewportを390x844へ変更してreloadし、triggerをclickする。
6. mobile実sidebarの同じpropsと`data-mobile`を評価し、Escape後にcontent 0件とtrigger focusを評価する。
7. 別fresh tabでResource Timing entryの全HTTP statusを評価する。

## クリーンアップ

- 作成データなし。各検証tabは閉じ、viewportをdefaultへresetする。
