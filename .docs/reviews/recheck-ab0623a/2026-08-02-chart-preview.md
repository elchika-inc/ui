# Chart / Catalog 固定SHA動作検証レポート

verified_impl_sha: ab0623a80c20439574a74a1e8e9cf31e0571522f

## 結論

判定は **PASS**。

ChartとCatalogのLight / Darkを各3 fresh target、計12 targetで実ブラウザ検証した。

- Chartは全6 runで、安全値`data-chart="chart-利用者:2026"`がserializer適用後もDOM・CSSOMへ到達した。
- Chart内のstyleは全runで1要素、theme ruleは正確に2件だった。
- `--color-desktop` / `--color-mobile`がcomputed custom propertyへ到達し、desktop 4本・mobile 4本、計8本のBarすべてで実fillと正の矩形を確認した。
- Catalogは全6 runで期待集合61件と実集合が完全一致し、欠落・余剰・重複・不可視は0だった。
- batch4対象19件は全runで19/19表示された。
- Catalogを妨げる自動overlay・toast・sentinelは全runでDOM 0件だった。
- 全requestにresponseとloading終端があり、`Network.loadingFailed`、未終端、response欠落、page exceptionは0だった。
- Chart Light run 1だけChromeが暗黙に`/favicon.ico`を要求し404になった。正本の明示的な唯一の除外に一致するためPASSとした。除外対象以外の4xx / 5xxとconsole errorは全12 runで0だった。
- JPEG 4件はCDPからJPEGを直接取得し、拡張子、magic bytes、JFIF形式、寸法、SHA-256が一致した。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 検証日時 | 2026-08-02 16:42〜16:44 JST |
| OS | macOS 26.3.1、Build 25D2128、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187、headless raw CDP |
| server | build済み`dist`を`npx serve -l 3019 dist`で配信 |
| server port | 候補3019 / 3029 / 3039 / 3049の空きを実測し、3019へ固定 |
| CDP port | 候補9329 / 9429 / 9529 / 9629の空きを実測し、9329へ固定 |
| Chart viewport | 1280×900 CSS px |
| Catalog viewport | 1440×900 CSS px |
| 実行可否 | ✅実行した |

既存のbuild済み`dist`を使用し、製品コード・文書・Git履歴は変更していない。

## 成功基準（実行前rubric）

### Chart

1. `/preview/chart/`と`/preview/chart-dark/`をfresh targetで各3回実行する。
2. hydration後の`data-chart`が正確に`chart-利用者:2026`である。
3. Chart root内のhydrated styleが1要素で、CSSOM theme ruleが次の2件だけである。
   - `[data-chart="chart-利用者:2026"]`
   - `.dark [data-chart="chart-利用者:2026"]`
4. `--color-desktop`と`--color-mobile`がcomputed custom propertyへ到達する。
5. desktop 4本・mobile 4本のBarが対応するCSS変数を参照し、computed fillと正の矩形を持つ。
6. 危険payloadはunit testで確認済みのためブラウザへ再注入しない。
7. console / page exception / network failure / 未終端 / response欠落 / 4xx / 5xxが0である。ただし正本が明示するブラウザ暗黙`/favicon.ico` 404だけは除外し、証跡へ記録する。

### Catalog

1. `/catalog/`と`/catalog-dark/`をfresh targetで各3回実行する。
2. `src/previews/*.tsx`から機械導出した期待集合61件とhydrated実集合が完全一致する。
3. 各名前が1回だけ現れ、全sectionが正の矩形を持ち可視である。
4. batch4対象19件がすべて各1件、可視状態で存在する。
5. 自動overlay、toast、sentinelがCatalogを妨げない。
6. console / page exception / network failure / 未終端 / response欠落 / 除外外の4xx / 5xxが0である。
7. Light / Darkのfull-page JPEGをCDPから直接取得し、実体を検査する。

## Chart 3/3実測結果

| Theme | Run | page / theme | `data-chart` | style / CSSOM | custom properties | Bar | request / response / finished | error |
|---|---:|---|---|---|---|---|---|---|
| Light | 1 | `Chart` / class空 | 一致 | 1 style / 2 rules | desktop `oklch(55.6% 0 0)`、mobile `oklch(43.9% 0 0)` | 4+4、全fill有効・正の矩形 | 14 / 14 / 14 | 暗黙favicon 404を1件除外。他0 |
| Light | 2 | `Chart` / class空 | 一致 | 1 style / 2 rules | 同上 | 4+4、全fill有効・正の矩形 | 13 / 13 / 13 | 0 |
| Light | 3 | `Chart` / class空 | 一致 | 1 style / 2 rules | 同上 | 4+4、全fill有効・正の矩形 | 13 / 13 / 13 | 0 |
| Dark | 1 | `Chart Dark` / `dark` | 一致 | 1 style / 2 rules | desktop `oklch(87% 0 0)`、mobile `oklch(78% 0 0)` | 4+4、全fill有効・正の矩形 | 13 / 13 / 13 | 0 |
| Dark | 2 | `Chart Dark` / `dark` | 一致 | 1 style / 2 rules | 同上 | 4+4、全fill有効・正の矩形 | 13 / 13 / 13 | 0 |
| Dark | 3 | `Chart Dark` / `dark` | 一致 | 1 style / 2 rules | 同上 | 4+4、全fill有効・正の矩形 | 13 / 13 / 13 | 0 |

### DOM / CSSOM

全runでDOM属性は次の値だった。

```text
data-chart="chart-利用者:2026"
```

CSSOM selectorは次の2件だけだった。

```text
[data-chart="chart-利用者:2026"]
.dark [data-chart="chart-利用者:2026"]
```

各ruleの宣言は次の内容へ正常にparseされた。

```css
--color-desktop: var(--chart-1);
--color-mobile: var(--chart-2);
```

利用者由来の安全値に日本語とコロンが含まれていても、quoted selectorとしてCSSOMへ到達し、描画が成立した。明示指示に従い、unit testで拒否確認済みの危険payloadはブラウザへ再注入していない。

### Barの実fill

全runでdesktop 4本の`fill`属性は`var(--color-desktop)`、mobile 4本は`var(--color-mobile)`だった。

| Theme | desktop computed fill | mobile computed fill | 矩形 |
|---|---|---|---|
| Light | `oklch(0.556 0 0)` | `oklch(0.439 0 0)` | 8本すべてwidth約120、height正 |
| Dark | `oklch(0.87 0 0)` | `oklch(0.78 0 0)` | 8本すべてwidth約120、height正 |

取得時点のheight範囲はLightが約153.68〜595.70、Darkが約153.53〜585.88で、blank、透明、0寸法のBarはなかった。

## Catalog期待集合と3/3実測結果

期待集合61件:

```text
accordion, alert, alert-dialog, aspect-ratio, attachment, avatar, badge,
breadcrumb, bubble, button, button-group, calendar, card, carousel, chart,
checkbox, collapsible, combobox, command, context-menu, dialog, direction,
drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp,
item, kbd, label, marker, menubar, message, message-scroller, native-select,
navigation-menu, pagination, popover, progress, radio-group, resizable,
scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
spinner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip
```

batch4対象19件:

```text
alert-dialog, attachment, button-group, calendar, carousel, chart, combobox,
command, direction, field, input-group, item, menubar, message-scroller,
pagination, sheet, sidebar, toast, toggle-group
```

| Theme | Run | section | 集合差分 | 不可視 | batch4 | 阻害要素 | request / response / finished | error |
|---|---:|---:|---|---:|---:|---|---|---|
| Light | 1 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 173 / 173 / 173 | 0 |
| Light | 2 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 172 / 172 / 172 | 0 |
| Light | 3 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 172 / 172 / 172 | 0 |
| Dark | 1 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 172 / 172 / 172 | 0 |
| Dark | 2 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 172 / 172 / 172 | 0 |
| Dark | 3 | 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 | 172 / 172 / 172 | 0 |

全sectionで`width > 0`、`height > 0`、`display != none`、`visibility != hidden`、`hidden=false`を確認した。

次のselectorは全6 runでtotal / visibleとも0だった。

```text
[data-slot="alert-dialog-content"]
[data-slot="sheet-content"]
[data-slot="menubar-content"]
[data-slot="combobox-content"]
[data-slot="dialog-content"]
[data-slot="toast"]
[data-sonner-toast]
[data-sentinel]
```

Light / Darkともfull-page画像を開いて確認し、3列の61sectionが末尾Tooltipまで描画され、blank、途中描画、自動overlay遮蔽がないことを確認した。

## Network / consoleの実測

raw CDPでnavigation前に`Page`、`Runtime`、`Network`、`Log`をenableし、次のeventを逐次記録した。

```text
Network.requestWillBeSent
Network.responseReceived
Network.loadingFinished
Network.loadingFailed
Runtime.consoleAPICalled
Runtime.exceptionThrown
Log.entryAdded
```

全12 runで次を確認した。

- request数とresponse数が一致。
- request数と`loadingFinished`数が一致。
- `Network.loadingFailed`: 0。
- 未終端request: 0。
- response欠落: 0。
- page exception: 0。
- loopback外へのHTTP(S) request: 0。
- Catalogのdata URL画像は自己完結resourceとしてrequest / response / finishedへ含まれ、外部送信ではない。

### favicon除外

Chart Light run 1のみ、Chromeが次を暗黙要求した。

```text
page: http://127.0.0.1:3019/preview/chart/
request: http://127.0.0.1:3019/favicon.ico
response status: 404
console: Failed to load resource: the server responded with a status of 404 (Not Found)
```

このrunもrequest / response / finishedは14 / 14 / 14で、`loadingFailed=0`、未終端0、response欠落0だった。

切り分け結果:

- `dist/favicon.ico`は存在しない。
- `dist/favicon.svg`は存在する。
- Chart Light / DarkのHTML headにはfaviconを参照するlinkがない。
- 他11 runでは`/favicon.ico` requestは発生しなかった。
- 正本は「ブラウザが自動で試行する`/favicon.ico`だけを除外し、証跡へ明記する」と規定している。

この1件だけを明示除外した。他URLを推測で除外していない。除外後は全runで4xx / 5xx、console error / warningとも0だった。

## JPEG証跡

Chrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得し、次の指定でJPEG bytesを直接取得した。

```text
Page.captureScreenshot
format: jpeg
quality: 90
captureBeyondViewport: true
```

PNG変換や拡張子だけの変更は行っていない。全4画像を実際に開いて描画内容も確認した。

| 画像 | bytes | 寸法 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-chart-preview-light.jpg` | 25,148 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `98ba636509ffe2b2cf93a16e0083a330885959b145a1c938acfd3302bf45e27d` |
| `2026-08-02-chart-preview-dark.jpg` | 25,329 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `a641de0f7954d253f2ad868352679a56a9a3b1def4ed8b74fb9ec82a97bf0cca` |
| `2026-08-02-batch-final-catalog-light.jpg` | 871,028 | 1440×9313 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `9a6c4c8bbcd7ab2011f0ea3200dda73fe3d0d1941370527671f2bc28d275ac24` |
| `2026-08-02-batch-final-catalog-dark.jpg` | 879,256 | 1440×9313 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `e695af449abec4834fdb574c4093483d966aa64563945e8d73bbc19f4de24245` |

`file`、`xxd -l 16`、`sips`、`stat`、`shasum -a 256`を独立実行し、表の値と実体が一致した。

## 三方向導出のクロスチェック結果

- コード:
  - `ChartContainer`のID生成、`ChartStyle`のquoted selector、2 series × 4 dataを確認した。
  - `src/previews/*.tsx`のbasenameからCatalog期待集合を機械導出した。
  - Catalog modeで対象Previewを列挙する経路を確認した。
- 画面:
  - hydrated DOM、CSSOM、computed custom properties、Barのfill・矩形を確認した。
  - Catalogの名前集合、重複、矩形、visibility、batch4、阻害selectorを確認した。
- 型:
  - `ChartConfig`のcolor経路、Chartの公開id、CatalogのPreview mode契約に対応する実DOMを確認した。
  - 外部schemaは存在しない。

クロスチェック上、コードにあるが今回の指定画面から到達不能な必須分岐、画面入力に対する未検証バリデーション、schemaとコードの不一致は検出しなかった。

## 未到達分岐・未検証の残

明示的に未実行とした範囲:

- 危険なChart ID / color payloadのブラウザ再注入。unit testで拒否確認済みのため、依頼どおり実行していない。
- Chart tooltip hover、legend操作、resize後の再描画、animation中間frame。
- Catalog内で各triggerを意図的に開いた後のoverlay操作。
- mobile Catalog、Safari / Firefox、スクリーンリーダー読み上げ、pixel baseline比較。
- 外部送信、削除、課金、永続データ変更を伴う操作。

これらは今回の成功rubric外であり、PASSへ昇格していない。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
git status --short
lsof -nP -iTCP:3019 -sTCP:LISTEN
lsof -nP -iTCP:9329 -sTCP:LISTEN
npx serve -l 3019 dist
```

1. Chromeを専用一時profile、`--headless=new`、`--remote-debugging-port=9329`で起動する。
2. raw CDPでfresh targetを作成し、navigation前にPage / Runtime / Network / Logをenableする。
3. Chart Light / Darkを各3 targetで開き、hydration、DOM、CSSOM、computed style、Bar、全network終端を取得する。
4. Catalog Light / Darkを各3 targetで開き、期待集合、実集合、visibility、batch4、阻害selector、全network終端を取得する。
5. 各themeの3回目からCDPでJPEGを直接保存する。
6. `file`、`xxd`、`sips`、`stat`、`shasum`で画像実体を検査する。
7. 全target、Chrome、serveを停止し、port、curl、Git状態を確認する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- 全CDP targetとheadless Chromeを停止した。
- debug port 9329はLISTENなし。
- serveを停止し、port 3019はLISTENなし。
- 停止後の`curl http://127.0.0.1:3019/`はexit 7。
- 終了HEADは開始時と同一。
- tracked差分0、cached差分0。
- 未追跡ファイルは本検証で新規作成したJPEG 4件だけ。
- 既存証跡は上書きしていない。
