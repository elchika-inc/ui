# Task 8 バッチ4 catalog 横断動作検証レポート

verified_impl_sha: 970b8f5e8a2a4d9ea1d5a26a2387819e341a0be7

## 結論

- 判定: GREEN。Light/DarkのDOM横断検証を各3 fresh tab、buffer非依存のresource全数監査を各3 fresh tabで再実行し、rubric 1〜12に不一致を検出しなかった。
- `src/previews/*.tsx`から`preview-theme.ts`を除外して機械導出した期待61件と、両catalogのhydrated DOM集合が6/6で完全一致した。欠落、余剰、重複、不可視sectionは0件だった。
- バッチ4追加19件は両theme・全runで各1section、正の矩形、sentinel 0だった。
- Avatarは実画像1件と、`src`を省略した「画像未提供」fallback `UI` 1件が可視で、`avatar-missing.png` requestは0件だった。
- 全resource 171件/runの`responseStatus`は全件200で、HTTP 4xx/5xx、status 0、unknown status、browser error/warningは0件だった。

## 実行環境

- 検証日時: 2026-08-02 12:49〜13:06 JST
- branch: `feat/batch-final`
- 開始HEAD: `2282355fc3031925d14cc82e3e017dcef6597d45`
- 製品実装の固定SHA: `970b8f5e8a2a4d9ea1d5a26a2387819e341a0be7`
- 開始時worktree: clean
- OS: Darwin 25.3.0 arm64
- Node.js: v26.4.0
- npm: 11.17.0
- Browser: Google Chrome 150.0.7871.187
- viewport: 1440x900
- fresh build: `npm run build` exit 0、125 pages生成
- preview server: `npm run preview -- --host 127.0.0.1 --port 3016`
- port 3016: 起動前listenerなし、検証中のみ固定、cleanup後listenerなし

固定SHAから開始HEADまでに変更されたのは手順書、証跡checker、Avatar再検証証跡だけだった。`src`、`registry.json`、`provenance.json`、`preview-selectors.json`、`package.json`、`package-lock.json`、Astro/TypeScript/shadcn設定を`git diff --exit-code`で比較し、製品path差分0を確認した。

## 成功基準

正本は`/private/tmp/task8-catalog-rubric.md`を実行前に全文読了し、次を合格条件とした。

1. fresh full buildがexit 0で、期待preview集合が非空かつ61件である。
2. 各themeのactual name集合が期待集合と完全一致する。
3. root 1、SSR hydration残0、全sectionが正の矩形かつhiddenでない。
4. バッチ4 19件が各1sectionで正の矩形を持つ。
5. 全体とバッチ4section内のsentinelが0件である。
6. overlay contentとtoast rootが0件で、catalog用trigger/inline UIが可視である。
7. sidebar、direction、Avatarのcatalog契約が一致する。
8. theme class、背景/前景実色がCSS varsと一致し、4xx/5xx、loading failure、console error/warning、pageerrorが0件である。
9. full-page JPGの撮影context、raw magic、拡張子、寸法、目視内容が一致する。
10. cleanup後にbrowser tab 0、server停止、port解放を確認する。
11.恒常証跡が指定3件だけで、唯一のSHA fieldが製品固定SHAである。
12. evidence checkerと全checkerがexit 0で、tracked差分がない。

## 期待集合の機械導出

`fs.readdirSync("src/previews")`から`.tsx`だけを取得し、補助module `preview-theme.ts`を除外してbasenameをsortした。0件ならexit 1、61件以外でもexit 1とするguardを置いた。fresh build後にも再導出し、61件を確認した。

期待集合は次のとおり。

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `attachment`, `avatar`, `badge`, `breadcrumb`, `bubble`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `direction`, `drawer`, `dropdown-menu`, `empty`, `field`, `hover-card`, `input`, `input-group`, `input-otp`, `item`, `kbd`, `label`, `marker`, `menubar`, `message`, `message-scroller`, `native-select`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`

バッチ4の19件は`alert-dialog`, `attachment`, `button-group`, `calendar`, `carousel`, `chart`, `field`, `input-group`, `item`, `menubar`, `message-scroller`, `pagination`, `sheet`, `toast`, `toggle-group`, `combobox`, `command`, `sidebar`, `direction`で、期待集合内の欠落0を機械確認した。

## 実行方法と監視境界

1. `lsof -nP -iTCP:3016 -sTCP:LISTEN`がexit 1であることを確認した。
2. `npm run build`をfresh実行し、生成後もworktree cleanを確認した。
3. 静的`dist`をport 3016でserveし、`curl`で`/catalog/`と`/catalog-dark/`を個別取得して各HTTP 200を確認した。
4. DOM横断検証は各theme/attemptで`browser.tabs.new()`を実行した。初回navigation後にcacheを無効化し、監視下reload、load、root可視、`astro-island[ssr]`消滅を待って全DOMを採取した。
5. CDP event bufferはcatalogの全イベントを一度に保持すると一部runで`truncated=true`となるため、そのデータを完全性の根拠にしなかった。
6. 通信判定は別の各3 fresh tabでcache無効reload後、CDP `Runtime.evaluate`から`PerformanceResourceTiming`全件の`responseStatus`を取得した。HTTP status 0をloading failure相当、400〜599をHTTP errorとして検査した。
7. console/page/resource errorはbrowser dev logsをerror/warn/warningで全件取得した。直接CDPで観測できた`Network.loadingFailed`、Runtime exception、console/log error/warningも全run 0で、非truncated run 2件でも0だった。
8. 各tabは採取後に`finally`でcloseした。画像はDOM横断runの各theme3回目に`tab.screenshot({ fullPage: true })`で取得した。

## 全run結果

| 系列 | theme | 再現率 | root / sections | 集合・可視・バッチ4 | sentinel / overlay | sidebar / direction / Avatar / theme | error |
|---|---|---:|---|---|---|---|---|
| DOM横断 | Light | 3/3 | 1 / 61 | 欠落0・余剰0・重複0・不可視0・19/19 | 0 / 全閉 | 全一致 | 観測値0 |
| DOM横断 | Dark | 3/3 | 1 / 61 | 欠落0・余剰0・重複0・不可視0・19/19 | 0 / 全閉 | 全一致 | 観測値0 |
| Resource全数 | Light | 3/3 | 1 / 61 | 171 resources、全件status 200 | - | 欠損画像URL 0 | status 0・4xx/5xx・dev error/warning 0 |
| Resource全数 | Dark | 3/3 | 1 / 61 | 171 resources、全件status 200 | - | 欠損画像URL 0 | status 0・4xx/5xx・dev error/warning 0 |

## バッチ4section

両theme・全6 DOM runで各1件、`display:block`、`visibility:visible`、hiddenなし、sentinel 0だった。1440px viewportで横幅は全件410.664px、代表runの高さは次のとおり。

| component | height(px) | component | height(px) |
|---|---:|---|---:|
| alert-dialog | 287 | attachment | 333.867 |
| button-group | 459 | calendar | 459 |
| carousel | 420 | chart | 420 |
| field | 459.75 | input-group | 343 |
| item | 312.5 | menubar | 475 |
| message-scroller | 571 | pagination | 351 |
| sheet | 324 | toast | 535 |
| toggle-group | 535 | combobox | 331 |
| command | 411 | sidebar | 403 |
| direction | 365 | - | - |

## overlayとinline UI

両theme・全runでalert-dialog、menubar、sheet、combobox、command dialogのcontentはDOM件数0・可視件数0、toast rootは0だった。

- alert-dialog trigger: 1/1可視
- menubar trigger: 2/2可視
- sheet trigger: 1/1可視
- combobox input: 1/1可視
- command inline root: 1/1可視、catalogではdialog trigger 0
- toast buttons: 4/4可視

## sidebar / direction / Avatar

- sidebar: `data-preview-mode="catalog"`。`collapsible="none"`分岐は`src/components/ui/sidebar.tsx`で簡易`data-slot="sidebar"`を返すため、`data-collapsible`と`data-mobile`が無い実DOMがnone相当である。mobile sidebar 0、mobile Sheet content 0で、preview/wrapper/sidebarの各矩形はsection内に収まった。
- direction: `data-preview-mode="catalog"`、consumer 2件。ltr/rtl各1件で、consumer `data-direction`、consumer computed direction、region `data-direction`、region `dir`、region computed directionが全て一致した。
- Avatar: preview root 1、Avatar 2、画像1、fallback 1。1つ目は可視32x32、`complete=true`、natural 150x150。2つ目は画像要素なし、`src=null`、fallback `UI`が可視で、`avatar-missing.png` resourceは0件だった。

## theme

| theme | `html.dark` | `--background` | root background | `--foreground` | root foreground |
|---|---|---|---|---|---|
| Light | false | `oklch(100% 0 0)` | `oklch(1 0 0)` | `oklch(14.5% 0 0)` | `oklch(0.145 0 0)` |
| Dark | true | `oklch(14.5% 0 0)` | `oklch(0.145 0 0)` | `oklch(98.5% 0 0)` | `oklch(0.985 0 0)` |

%表記を0〜1へ数値正規化して比較し、両theme・全runで一致した。

## 画像証跡

撮影直前にLightはURL=`http://127.0.0.1:3016/catalog/`、title=`検証用カタログ — elchika-inc/ui`、root=1、dark=false、sections=61、viewport=1440x900を確認した。Darkは`/catalog-dark/`、title=`検証用カタログ Dark — elchika-inc/ui`、dark=trueで、他は同値だった。

| path | bytes | magic | 形式 | 寸法 | SHA-256 |
|---|---:|---|---|---:|---|
| `.docs/reviews/2026-08-02-batch-final-catalog-light.jpg` | 684013 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` | JPEG/JFIF 1.01 | 1440x9269 | `c4c19cc607b1f22f45e2ddc5822ed1be2c280e195b549f90c76860c580018c30` |
| `.docs/reviews/2026-08-02-batch-final-catalog-dark.jpg` | 694818 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` | JPEG/JFIF 1.01 | 1440x9269 | `643f5b33687e609777d7b720980c980dc4a4cd6a071068dd13180995a802a566` |

返却raw bytes、`.jpg`拡張子、`file`判定、`sips`寸法が一致した。両画像を表示し、61sectionの全景、Light/Dark theme、Avatarの画像と`UI` fallbackを目視確認した。

## 三方向導出のクロスチェック

- コード: `import.meta.glob("../previews/*.tsx", { eager: true })`とmanifestがpreviewを名前順に列挙し、catalogは全itemへ`mode="catalog"`を渡す。
- 画面: hydrated DOMの全61 name、矩形、表示状態、各高リスクcomponentの状態を全runで取得した。
- 型/契約: `PreviewMode`は`isolated | catalog`。sentinel、overlay defaultOpen、sidebar、direction、commandはmode分岐を持ち、実DOMはcatalog側の契約と一致した。
- コードにあるがcatalogから到達できない分岐: isolated専用sentinel、overlay defaultOpen、command dialog trigger、sidebar collapse操作、外部画像読み込み失敗。
- 画面から入力できるがコードで未検証の値: catalog横断ではtriggerを操作せず閉状態を検査した。開状態・操作は隔離preview証跡の責務である。
- schemaにあるがコードで扱わないparameter: OpenAPI等は対象外。preview file集合とDOM集合を正本として比較した。

## 検証ハーネスと未実測範囲

- 空HTTP page前のraw CDP取得、event limit 2000、文字列からのhelper生成、DOM変更API、page事前script注入、Playwright sandbox内Performance APIは接続制約で利用できなかった。いずれも製品判定前または不完全データとして破棄し、tabをcloseした。
- CDP event bufferの`truncated=true`を隠さず、通信完全性の正本をCDP `Runtime.evaluate`によるResource Timing全数取得へ変更した。
- 初回navigationはCDP listener前のため、独立`curl` HTTP 200、初回URL/title/root countで補完した。
- overlayを開く操作、toast生成、sidebar操作、各componentのisolated契約はcatalog横断では未実行で、個別preview証跡の責務である。

## クリーンアップ

- 全fresh tabを`finally`でcloseし、Browser finalize直前の残tabは0だった。
- preview serverを停止し、port 3016のlistenerがないことを確認した。
- 検証HEADは開始HEADから不変である。

## 最終checkerと差分

- `node scripts/check-evidence.mjs`: exit 0、`証跡形式 OK`。既存shared staleはadvisoryとして報告された。
- `npm run check:all`: exit 0。standards、completeness、distribution、preview render、evidenceの全checkerが通過した。
- tracked差分は0で、未追跡は本MarkdownとLight/Dark JPGの指定3件だけだった。
