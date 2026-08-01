# Batch static 2 catalog 横断実ブラウザ検証

- batch final commit: `76193cb42b086adf313d7a608cc07abc23b04b8a`
- Browser: Chrome（Browser Plugin）
- 対象 route: `/catalog/`、`/catalog-dark/`
- scan正本: `src/previews/*.tsx`（実ファイル名を機械導出し、0件をhard failureにする）

## 今回のバッチ対象19件

aspect-ratio、avatar、breadcrumb、bubble、empty、kbd、marker、message、progress、spinner、table、checkbox、input-otp、native-select、radio-group、slider、switch、textarea、toggle。

## 成功基準

- `npm run build`を固定SHAのclean worktreeでfresh実行し、catalog light / darkを含むsiteとlibraryが生成される。
- `src/previews/*.tsx`から機械導出した期待component集合が0件でなく、各routeの`data-catalog-preview`集合と重複なく完全一致する。
- 各routeでURL / title / html themeが一致し、catalog rootが1件、hydrated `astro-island`が1件になる。
- scan由来の全previewがvisibleで、各bounding rectのwidth / heightが0より大きい。
- `preview-selectors.json`の各component用安定selectorが対応するcatalog section内に1件以上存在する。操作後にだけ現れるselectorはcatalog modeの隔離契約により例外として明示する。
- Dialogはcatalog modeでtriggerだけを表示し、dialog / overlayを初期表示しない。Sonner等の操作後DOMもcatalog横断の静的表示を壊さない。
- light / darkともconsole errorが0件になる。
- 固定SHAから実装pathに差分がない。

catalog横断破損の検出をバッチ末尾まで遅らせることは、各componentのlight / dark固有routeを追加直後に検証しつつ、集約画面の重複撮影を避けるため受容する。ここでscan全件を一括実測し、遅延した集約リスクを閉じる。

## 実行環境

- 検証日時: 2026-08-01 21:03:44 JST
- OS: macOS 26.3.1（Build 25D2128）
- Node.js: v26.4.0
- npm: 11.17.0
- Browser: Google Chrome 150.0.7871.187（Browser Plugin）
- 固定SHA: `76193cb42b086adf313d7a608cc07abc23b04b8a`
- server: `npm run preview -- --host 127.0.0.1 --port 4323`
- server URL: `http://127.0.0.1:4323/`（起動ログと事前のport空き確認済み）

## 実行結果

### buildと期待集合の機械導出

- clean worktreeかつ固定SHAで`npm run build`をfresh実行し、exit code 0。library / registry / siteを生成し、siteは63 pagesを生成した。
- 次の実行コマンドで期待集合を導出した。0件の場合は例外終了するため、空集合を合格にしない。

```bash
node -e 'const {readdirSync}=require("node:fs"); const names=readdirSync("src/previews").filter((name)=>name.endsWith(".tsx")).map((name)=>name.slice(0,-4)).sort(); if(names.length===0) throw new Error("preview scan returned zero items"); console.log(JSON.stringify({count:names.length,names},null,2));'
```

- scan結果（30件）: `alert, aspect-ratio, avatar, badge, breadcrumb, bubble, button, card, checkbox, dialog, empty, input, input-otp, kbd, label, marker, message, native-select, progress, radio-group, separator, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle`

### route別結果

| 項目 | Light | Dark | 判定 |
|---|---|---|---|
| URL | `http://127.0.0.1:4323/catalog/` | `http://127.0.0.1:4323/catalog-dark/` | PASS |
| title | `検証用カタログ — elchika-inc/ui` | `検証用カタログ Dark — elchika-inc/ui` | PASS |
| `html.className` | 空文字 | `dark` | PASS |
| `[data-slot="verification-catalog"]` | 1件 | 1件 | PASS |
| `astro-island` | 1件、hydrated、child 1件 | 1件、hydrated、child 1件 | PASS |
| `[data-catalog-preview]` | 30件、重複0、期待集合と完全一致 | 30件、重複0、期待集合と完全一致 | PASS |
| 全preview visible | 30/30 | 30/30 | PASS |
| bounding rect | 全件 width `410.6640625`、height `271`〜`588.25` | 全件 width `410.6640625`、height `271`〜`588.25` | PASS |
| Dialog初期状態 | trigger 1、content 0、overlay 0、role=dialog 0 | trigger 1、content 0、overlay 0、role=dialog 0 | PASS |
| Sonner初期状態 | action button 1、toast 0 | action button 1、toast 0 | PASS |
| console error | 0件 | 0件 | PASS |

hydrationは`astro-island`の`ssr`属性が消え、client componentの子要素が1件存在することまで確認した。全previewのvisible判定は`hidden=false`、`display != none`、`visibility != hidden`、`opacity != 0`、`offsetParent != null`、width / heightがともに0より大きい、の全条件で判定した。

### stable selectorとcatalog mode隔離

実ブラウザ内で`preview-selectors.json`を読み、期待集合の各sectionへselectorをscopeして件数を取得した。Light / Darkは同一結果だった。

- selectorが初期DOMに存在: `alert:2, aspect-ratio:1, avatar:1, badge:5, breadcrumb:1, bubble:1, button:7, card:2, checkbox:1, empty:1, input:3, input-otp:1, kbd:1, label:2, marker:1, message:1, native-select:1, progress:1, radio-group:1, separator:2, skeleton:4, slider:1, spinner:1, switch:1, table:1, tabs:1, textarea:1, toggle:1`
- `dialog`: selector `[data-slot="dialog-content"]`は0件。`DialogPreview`の実装契約どおりcatalog modeではtriggerのみで、content / overlay / body scroll lockは初期化されない。
- `sonner`: selector `[data-sonner-toast]`は0件。catalog modeでは通知を発火しておらず、action buttonのみ表示される。

`dialog`と`sonner`は「操作後にだけ現れるselector」として、両テーマで不足集合が厳密にこの2件のみであることをassertした。その他28件は対応section内で1件以上を実測した。

## JPEG evidence

| theme | path | method / format | size | bytes | magic |
|---|---|---|---|---:|---|
| Light | `2026-08-01-batch-static-2-catalog-light.jpg` | Browser Pluginの`fullPage` screenshot出力を無変換保存 / JPEG JFIF 1.01 | 1512×4755 | 372793 | `ffd8ffe0` |
| Dark | `2026-08-01-batch-static-2-catalog-dark.jpg` | Browser Pluginの`fullPage` screenshot出力を無変換保存 / JPEG JFIF 1.01 | 1512×4755 | 375979 | `ffd8ffe0` |

`test -s`、`file`、`sips -g pixelWidth -g pixelHeight`、`xxd -l 4 -p`で、空でないこと、JPEG / JFIF、寸法、magicを独立確認した。目視でも両画像にAlertからToggleまでの30 cardが全て含まれ、Light / Dark themeが反映され、Dialog overlayとtoastが初期表示されていないことを確認した。

## 再現手順

1. `git rev-parse HEAD`が固定SHA、`git status --short`が空であることを確認する。
2. `npm run build`を実行し、exit code 0を確認する。
3. 上記のNode.jsコマンドで`src/previews/*.tsx`から期待集合を導出し、0件でないことを確認する。
4. port 4323が空いていることを確認し、`npm run preview -- --host 127.0.0.1 --port 4323`を起動する。
5. Browserで`/catalog/`と`/catalog-dark/`を別tabで開き、route別結果の各条件をDOMから評価する。期待集合は手書きせず、手順3の導出値を使う。
6. `preview-selectors.json`を読み、各componentのsection内へselectorをscopeして件数を評価する。`dialog`と`sonner`だけは上記の隔離契約を評価する。
7. 各tabのconsole errorが0件であることを確認し、full-page JPEGを保存する。
8. JPEGを上記4コマンドで検査し、serverを停止してport listenerが消えたことを確認する。

## スコープと限界

- 見た範囲: catalog集約routeのLight / Dark、全30 previewの存在・可視性・矩形、stable selector、hydration、Dialog / Sonnerの初期隔離、console error、full-page視覚証跡。
- 見ていない範囲: catalog上での各componentの個別interaction、Dialogのopen後、Sonnerの通知発火後。これらは各component固有routeの検証対象であり、本検証はbatch末尾の静的集約破損検出を対象とする。
- 実装変更は行わない。固定SHAから指定実装pathへの差分が0であることをコミット前後に確認する。
