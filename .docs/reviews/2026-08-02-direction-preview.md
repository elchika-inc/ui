# Direction 動作検証レポート

verified_impl_sha: ab020df2c02503413d54ae2ab8bbcae28e519d99

## 結論

- 判定: GREEN。Directionのcomponent固有C1〜C6をLight/Darkの実ブラウザで各3回確認し、不一致・flakyを検出しなかった。
- `DirectionProvider`は文字方向contextだけを供給し、consumer自身へ`dir`を付与しない。HTML/CSSの文字方向は利用側regionの`dir`が担い、hook解決値はconsumerの`data-direction`と可視テキストへ反映される契約を実DOMで確認した。
- catalog横断検証はcomponent固有検証へ重複させず、バッチ末尾Task 8で実施する。

## 実行環境

- 検証日時: 2026-08-02 12:04 JST
- branch: `feat/batch-final`
- 開始時HEAD: 上記固定SHAと一致
- 開始時worktree: clean
- fresh build: `npm run build:site` exit 0、direction light/darkを含む125 pages生成
- preview server: `npm run preview -- --port 3015`
- 起動ログURL: `http://localhost:3015/`
- server PID: 29915
- OS: Darwin 25.3.0 arm64
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- viewport: 1280x900

## 成功基準（実行前rubric）

1. C1: `/preview/direction`と`/preview/direction-dark`でhydration後の`[data-slot="direction-preview"]`が各1件。
2. C2: `[data-slot="direction-consumer"]`がちょうど2件で、`data-direction="ltr"`と`data-direction="rtl"`が各1件。
3. C3: 各consumerについて、利用側祖先regionの`dir`、region/consumerのcomputed CSS `direction`、hook由来`data-direction`が一致する。consumer自身の`dir`はnullで、最寄りの`[dir]`は利用側regionである。
4. C4: `hook 解決値: ltr` / `hook 解決値: rtl`が可視で、logical rowの開始/終了x位置がLTR/RTLで反転する。
5. C5: card background/foreground/borderとmuted background/foregroundの実computed colorが各themeのCSS custom propertyと一致し、Light/Dark切替が実色に現れる。
6. C6: 各themeでconsole error/warning、pageerror相当、HTTP 4xx/5xx、network loading failureが0件。
7. JPEG撮影直前にURL、title、root selector、theme、viewportを確認し、保存後に拡張子、返却bytes magic、寸法、目視内容が一致する。

## 実行方法と監視境界

- 事前到達確認: `curl`で`/preview/direction`と`/preview/direction-dark`がそれぞれHTTP 200であることを独立確認した。
- Browser APIは独立browser contextを作らないため、各theme/attemptで`browser.tabs.new()`を実行し、Light 3 fresh tabs、Dark 3 fresh tabsとして隔離した。各tabは採取後にcloseした。
- 各fresh tabで最初にrouteへ到達し、CDPの`Network` / `Runtime` / `Log` listenerを有効化してcursorを取得した後、reload→hydration→DOM/座標/theme token採取を行った。
- CDP capabilityはHTTP pageへの初回navigation後に取得する制約がある。従って監視0件の主張はlistener後のreload以降を対象とし、最初のnavigationは独立curl 200、実URL、title、root selector countで補完した。
- 監視: `Network.responseReceived`、`Network.loadingFailed`、`Runtime.exceptionThrown`、`Runtime.consoleAPICalled`、`Log.entryAdded`、tab dev logs。
- 対象は描画を持たないProviderと検証consumerであり、click/keyboard等の操作可能要素はない。主要操作はroute navigation、監視下reload、hydrated DOMとcomputed style/座標の読取である。

## C1〜C6 結果

| ケース | Light | Dark | 判定 | 実体 |
|---|---:|---:|---|---|
| C1 root hydration | 3/3 | 3/3 | ✅ | root selector count=1 |
| C2 consumer数/値 | 3/3 | 3/3 | ✅ | consumer count=2、ltr=1、rtl=1 |
| C3 context/HTML/CSS契約 | 3/3 | 3/3 | ✅ | consumer `dir=null`、最寄り`[dir]`=利用側region、region `dir`=computed direction=`data-direction`=hook値 |
| C4 hook text/論理配置 | 3/3 | 3/3 | ✅ | 可視text ltr/rtl、LTR startX<endX、RTL startX>endX |
| C5 theme token実色 | 3/3 | 3/3 | ✅ | 2 consumer×5色×各themeがCSS varsと数値一致 |
| C6 console/network | 3/3 | 3/3 | ✅ | 4xx/5xx=0、loadingFailed=0、exception=0、console/log/dev error/warning=0 |

## C2・C3の実測

両theme・全6回で次の組が再現した。

| consumer | consumer `dir` | 最寄り`[dir]` | region `dir` | region computed | consumer computed | `data-direction` | visible hook text |
|---|---|---|---|---|---|---|---|
| LTR | null | 利用側LTR region | `ltr` | `ltr` | `ltr` | `ltr` | `hook 解決値: ltr` |
| RTL | null | 利用側RTL region | `rtl` | `rtl` | `rtl` | `rtl` | `hook 解決値: rtl` |

この結果はREADMEの利用契約と一致する。Providerが供給するのはhook contextであり、HTML/CSS directionは利用側regionの`dir`が設定している。consumer自身へProvider由来の`dir`属性が追加されたとは判定していない。

## C4 座標

1280x900で両theme・全6回が同一値だった。

| direction | 「開始」x | 「終了」x | 判定 |
|---|---:|---:|---|
| LTR | 57px | 267px | 開始が左、終了が右 |
| RTL | 587px | 377px | 開始が右、終了が左 |

## C5 theme token実色

CSS custom propertyのL値は%表記、computed colorのL値は0〜1表記になるため、OKLCHを`l/c/h/alpha`へ数値正規化して比較した。全6回、各2 consumer、各5項目が一致した。

| theme | 対象 | CSS var | computed color |
|---|---|---|---|
| Light | card background | `--card: oklch(100% 0 0)` | `oklch(1 0 0)` |
| Light | card foreground | `--card-foreground: oklch(14.5% 0 0)` | `oklch(0.145 0 0)` |
| Light | card border | `--border: oklch(92.2% 0 0)` | `oklch(0.922 0 0)` |
| Light | muted background | `--muted: oklch(97% 0 0)` | `oklch(0.97 0 0)` |
| Light | muted foreground | `--muted-foreground: oklch(54% 0 0)` | `oklch(0.54 0 0)` |
| Dark | card background | `--card: oklch(20.5% 0 0)` | `oklch(0.205 0 0)` |
| Dark | card foreground | `--card-foreground: oklch(98.5% 0 0)` | `oklch(0.985 0 0)` |
| Dark | card border | `--border: oklch(100% 0 0/.1)` | `oklch(1 0 0 / 0.1)` |
| Dark | muted background | `--muted: oklch(26.9% 0 0)` | `oklch(0.269 0 0)` |
| Dark | muted foreground | `--muted-foreground: oklch(70.8% 0 0)` | `oklch(0.708 0 0)` |

Lightでは`html.dark=false`、Darkでは`html.dark=true`を各3/3で確認し、上表のcard/muted実色も別値へ切り替わった。

## C6 console/network

各themeの3 fresh tabsに加え、各themeの撮影専用fresh tabでも同じ監視を行った。

| theme | monitored responses/通常tab | HTTP 4xx/5xx | loadingFailed | Runtime exception/pageerror相当 | console error/warning | Log error/warning | dev error/warning |
|---|---:|---:|---:|---:|---:|---:|---:|
| Light | 各12 | 0 | 0 | 0 | 0 | 0 | 0 |
| Dark | 各12 | 0 | 0 | 0 | 0 | 0 | 0 |

event batchは`hasMore=false`、`truncated=false`だった。

## 画像証跡

撮影APIは`tab.screenshot({fullPage:false})`。format引数を持たないAPIのため、API名や拡張子から形式を推測せず、返却されたraw bytesの先頭4 bytesを正本にした。

- Light: 撮影直前にURL=`http://localhost:3015/preview/direction`、title=`Direction`、root=1、consumer=2、dark=false、1280x900を確認。返却18301 bytes、magic=`ff d8 ff e0`でJFIF JPEG。保存後`file`と`sips`で1280x900、`view_image`でLight Direction画面を確認。
- Dark: 撮影直前にURL=`http://localhost:3015/preview/direction-dark`、title=`Direction Dark`、root=1、consumer=2、dark=true、1280x900を確認。返却18461 bytes、magic=`ff d8 ff e0`でJFIF JPEG。保存後`file`と`sips`で1280x900、`view_image`でDark Direction画面を確認。
- `.jpg`拡張子、返却bytesのJPEG magic、`file`判定`JPEG image data, JFIF standard 1.01`が一致する。

| path | SHA-256 |
|---|---|
| `.docs/reviews/2026-08-02-direction-preview-light.jpg` | `c482d195e33a6c1fcb7231a874e732e17d471ca3f97ccdea036e47792a5bae40` |
| `.docs/reviews/2026-08-02-direction-preview-dark.jpg` | `9a466d9bb84be4d85b0117c192cdc1af6ed1056cf03e531243c87d3e927bb813` |

## 三方向導出のクロスチェック

- コード: `DirectionProvider`と`useDirection`はBase UIから再exportされ、previewはproviderごとにLTR/RTL consumerを置く。
- 画面: root 1、region 2、consumer 2、logical row 2、開始/終了各2をhydrated DOM/a11y snapshotから確認した。
- 型/契約: `DirectionProviderProps`を公開し、READMEはProviderがcontextだけを設定してHTML/CSS方向を変えないと規定する。実DOMではconsumer `dir=null`、利用側region `dir=ltr/rtl`、computed directionとhook値一致として確認した。
- コードにあるが画面から到達できない分岐: providerのdirection省略時の既定値、providerの動的切替、nested provider上書きは当該previewに導線なし。
- 画面から設定できるがコードで未検証の値: 操作入力は存在しない。
- schemaにあるがコードで扱わないparameter: OpenAPI等の外部schemaは対象外。公開Propsのうちpreviewは`direction="ltr"/"rtl"`だけを使用する。

## 未確認の残

- provider direction省略時、動的direction変更、nested provider、CSS `direction`だけを使う利用形態は未実行。
- 初回browser navigationより前のCDP監視は接続仕様上未実施。初回到達性は独立curl、URL/title/root countで補完した。
- catalog light/dark横断は計画どおりバッチ末尾Task 8で実施する。

## クリーンアップ

- 各fresh tabをcloseし、Browser session終了時の残tabは0。
- viewport overrideをresetした。
- preview server停止とport 3015解放、終了時HEAD一致、tracked差分なし、指定した証跡3ファイルだけが未追跡であることを最終ゲートで確認した。
