# Sidebar 動作検証レポート

verified_impl_sha: b3272d855c011cf881e3f1197184c3b998545662

## 結論

- 判定: **GREEN**。今回の全成功基準を実ブラウザで確認し、実装上の不一致は検出しなかった。
- 旧版で再現した「Dark / mobile / Home に keyboard focus / Escape 1回では閉じない」は、新版では Light 3/3、Dark 3/3 の計6/6で解消した。
- 修正原因対応: mobileでも各メニューを `TooltipTrigger` で包んでいたためSheetのEscape dismissと競合していた。新版はTooltipをdesktopかつcollapsed時だけ構築し、mobile Sheetのdismiss経路を維持する。
- Light/Dark JPEGは専用fresh tabで撮影直前のURL・title・selector・theme・viewportを照合し、保存直後にJPEG magic・1280x900・目視を確認した。別コンポーネントのtabずれはない。

## 実行環境

- 検証日時: 2026-08-02 11:31-11:39 JST
- 対象: `http://localhost:3013/preview/sidebar`、`http://localhost:3013/preview/sidebar-dark`
- サーバー: `astro preview --port 3013`、PID 72033
- OS: Darwin 25.3.0 arm64
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- desktop viewport: 1280x900
- mobile viewport: 390x844
- branch: `feat/batch-final`
- 開始時HEAD: 上記固定SHAと一致
- 開始時・終了時worktree: clean
- 実行可否: ✅実行した

## 成功基準（実行前rubric）

1. 各テーマを別のfresh tabで3回実行し、hydration後にdesktopは`expanded / mobile=false`、mobileは`open=false / mobile=true`となる。
2. desktopはtrigger click、Ctrl+B、Meta+Bがそれぞれcollapsed/expandedを往復し、click時に`sidebar_state=false/true; path=/; max-age≈604800`が保存される。
3. trigger、検索input、group action、Homeをkeyboardでfocusした際、semantic `sidebar-ring`の不透明3px ringが出る。
4. desktop collapsed時にkeyboard focusしたHomeだけに、可視の`role=tooltip`「ホーム」が出る。
5. mobile Sheetは`role=dialog`、タイトル「サイドバー」、説明「モバイル用のサイドバーを表示します。」、メニュー内容を持ち、Tab focusがSheet内を循環する。
6. mobileでHomeへkeyboard focus後、Escape **1回**で閉じ、dialogが消え、triggerへfocusが戻る。Light/Dark各3回すべて成功する。
7. mobile初期autofocusは検索inputで、同inputからEscape 1回でも閉じ、triggerへfocusが戻る。Ctrl+B / Meta+Bも開閉する。
8. Light/Darkのsemantic tokenと実色がテーマどおりで、desktop expanded/collapsedの幅変更にoverflowがない。
9. CDP listener設定後のreloadから全操作まで、各fresh tabで4xx/5xx、`Network.loadingFailed`、`Runtime.exceptionThrown`（pageerror相当）、console error/warning、Log error/warning、dev error/warningが0件である。
10. JPEGは正しいURL・title・hydration selector・theme・viewportを撮影直前に満たし、保存後にJFIF magicと1280x900、目視内容が一致する。

## 入力契約と監視制約

- 起動済みpreviewを使用し、独立した`curl`でLight/Dark両URLのHTTP 200を確認した。
- Browser APIは隔離browser contextを作れないため、テーマ・反復ごとに`browser.tabs.new()`でfresh tabを作り、完了後にcookie削除とtab closeを行った。
- CDP capabilityはHTTPページへ一度navigationしたtabでしか取得できない。そのため「初回navigationより前のlistener設定」は不可能である。監視0件の主張は、初回navigationを含まず、listener有効化後のcookie削除→reload→hydration→全操作の区間だけを対象とする。初回到達性は別の`curl` HTTP 200と、tab上のURL/title/hydration selector count=1で確認した。
- CDP監視メソッド: `Network.responseReceived`、`Network.loadingFailed`、`Runtime.exceptionThrown`、`Runtime.consoleAPICalled`、`Log.entryAdded`。これにtabのdev logsを加えた。
- `sidebar_state`は全ケース前後で削除し、最終`Network.getCookies`は空配列だった。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | Light初回到達・hydration | 画面/コード | happy path | High | ✅実測確認 | 3/3 | URL=`/preview/sidebar`、title=`Sidebar`、preview count=1、HTTP 200 | fresh tab→goto→CDP有効化→cookie削除→reload→`[data-slot=sidebar-preview]` visible |
| 2 | Dark初回到達・hydration | 画面/コード | happy path | High | ✅実測確認 | 3/3 | URL=`/preview/sidebar-dark`、title=`Sidebar`、preview count=1、HTTP 200 | 上記のDark URL |
| 3 | desktop初期状態 | コード/画面 | 状態遷移 | High | ✅実測確認 | Light 3/3、Dark 3/3 | 1280x900、`state=expanded`、`mobile=false`、`mobileOpen=false` | state outputのdata属性を取得 |
| 4 | desktop trigger click往復 | コード/画面 | 0-switch | High | ✅実測確認 | Light 3/3、Dark 3/3 | `expanded→collapsed→expanded` | triggerをclick→state取得→再click→state取得 |
| 5 | desktop Ctrl+B往復 | コード/画面 | 0-switch | High | ✅実測確認 | Light 3/3、Dark 3/3 | `expanded→collapsed→expanded` | trigger locatorから`Control+b`を2回press |
| 6 | desktop Meta+B往復 | コード/画面 | 0-switch | High | ✅実測確認 | Light 3/3、Dark 3/3 | `expanded→collapsed→expanded` | trigger locatorから`Meta+b`を2回press |
| 7 | desktop cookie false/true | コード/型 | 副作用/境界 | High | ✅実測確認 | Light 3/3、Dark 3/3 | value=`false/true`、path=`/`、残存秒=604798〜604799 | click直後にCDP `Network.getCookies` |
| 8 | keyboard focus ring | コード/画面 | a11y | High | ✅実測確認 | Light 1/1、Dark 1/1 | trigger/input/group-action/Homeすべて `oklch(0.556 0 0) 0 0 0 3px`、alpha省略=不透明 | Profile→Tabでtrigger、続くTab経路でinput→action→Home、transition完了600ms後にcomputed style取得 |
| 9 | collapsed Home tooltip | コード/画面 | 条件分岐/回帰 | High | ✅実測確認 | Light 1/1、Dark 1/1 | `role=tooltip` count=1、visible=true、text=`ホーム` | collapse→keyboard TabでHome focus→700ms待機 |
| 10 | desktop layout | コード/画面 | 境界/表示 | Medium | ✅実測確認 | Light 1/1、Dark 1/1 | expanded: sidebar 256px/inset x=256; collapsed: 48px/inset x=48; scrollWidth=clientWidth=1280 | 各状態でbounding rectとdocument幅を取得 |
| 11 | mobile初期状態 | コード/画面 | 状態遷移 | High | ✅実測確認 | Light 3/3、Dark 3/3 | 390x844、`mobile=true`、`mobileOpen=false`、表示「モバイル: 閉」 | fresh tab→listener後reload→state data属性取得 |
| 12 | Sheet semantics/content | コード/画面 | a11y | High | ✅実測確認 | Light 3/3、Dark 3/3 | `role=dialog`、labelledby title=`サイドバー`、describedby=`モバイル用のサイドバーを表示します。`、検索/追加/Home/受信トレイ/設定/Profile/footerあり | trigger click→DOM snapshotと属性/参照先text取得 |
| 13 | mobile focus trap | 画面 | N-switch | High | ✅実測確認 | Light 1/1、Dark 1/1 | 11連続観測すべてdialog内。input→追加→Home→受信→設定→Profile→inputと循環 | open後にTabを10回、各stepで`dialog.contains(activeElement)` |
| 14 | **Home focusからEscape 1回** | コード/画面 | 旧不具合直接回帰 | High | ✅実測確認 | **Light 3/3、Dark 3/3** | 全6回 `homeFocused=true`、直後`mobileOpen=false`、dialog count=0、trigger focus=true | input→Tab→追加→Tab→Home→`Escape`を1回だけpress |
| 15 | 初期autofocusからEscape 1回 | コード/画面 | エラー推測/回帰 | High | ✅実測確認 | Light 1/1、Dark 1/1 | autofocus=`sidebar input` / label=`サイドバーを検索`、Escape後 open=false/dialog=0/trigger focus=true | trigger click→activeElement確認→inputからEscape 1回 |
| 16 | mobile Ctrl+B / Meta+B | コード/画面 | 0-switch | High | ✅実測確認 | Light 1/1、Dark 1/1 | Ctrl `false→true→false`、Meta `false→true→false` | trigger/inputから各shortcutをpress |
| 17 | Light semantic token | 型/CSS/画面 | テーマ | Medium | ✅実測確認 | 1/1 | background=`oklch(100% 0 0)`、sidebar=`oklch(98.5% 0 0)`、foreground=`oklch(14.5% 0 0)` | root CSS custom propertyとcomputed color取得 |
| 18 | Dark semantic token | 型/CSS/画面 | テーマ | Medium | ✅実測確認 | 1/1 | background=`oklch(14.5% 0 0)`、sidebar=`oklch(20.5% 0 0)`、foreground=`oklch(98.5% 0 0)` | Dark root CSS custom propertyとcomputed color取得 |
| 19 | CDP/console/network監視 | 実行時 | 異常系 | High | ✅実測確認 | 全採用fresh tab | 4xx/5xx=0、loadingFailed=0、exception/pageerror=0、console error/warning=0、Log error/warning=0、dev error/warning=0 | listener cursor取得→reload→全操作→cursor以降のevents集計 |
| 20 | Light JPEG | 画面 | visual | Medium | ✅実測確認 | 1/1 | JFIF `ff d8 ff e0`、1280x900、Sidebar Lightを目視 | 撮影直前6条件照合→screenshot→magic/dimensions→`view_image` |
| 21 | Dark JPEG | 画面 | visual | Medium | ✅実測確認 | 1/1 | JFIF `ff d8 ff e0`、1280x900、Sidebar Darkを目視 | 撮影直前6条件照合→screenshot→magic/dimensions→`view_image` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 実測詳細

### cookie

| theme | value=false | value=true | path | max-age観測 |
|---|---:|---:|---|---:|
| Light | 3/3 | 3/3 | `/` | 604798〜604799秒 |
| Dark | 3/3 | 3/3 | `/` | 604798〜604799秒 |

### focus ring

Light/Darkとも、transition完了後のcomputed `box-shadow`は次の形だった。

```text
oklch(0.556 0 0) 0px 0px 0px 3px
```

CSS colorのalpha省略は1（不透明）。trigger、検索input、項目追加、Homeの4要素すべてで確認した。

### mobile focus trap

両テーマで実測した循環:

```text
検索input → 項目を追加 → Home → 受信トレイ → 設定 → プロフィール → 検索input
```

11回の連続focus観測はすべて`dialog.contains(document.activeElement) === true`だった。

### theme / layout

| theme | body background | sidebar background | foreground | expanded sidebar | collapsed sidebar | overflow |
|---|---|---|---|---:|---:|---|
| Light | `oklch(1 0 0)` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | 256px | 48px | なし |
| Dark | `oklch(0.145 0 0)` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | 256px | 48px | なし |

## 三方向導出のクロスチェック

### 実装コード

- `useIsMobile()`でdesktop sidebarとmobile Sheetを分岐。
- desktop stateは`expanded/collapsed`、mobile stateは`openMobile`で独立。
- clickとCtrl/Meta+Bは同じ`toggleSidebar`経路。
- desktop state変更だけがcookieを書き、mobile Sheet開閉はcookieを書かない。
- Tooltip構築条件は`tooltip && !isMobile && state === "collapsed"`。
- focus ringは対象要素に`ring-sidebar-ring`と`focus-visible:ring-3`。

### 画面/a11y tree

- 操作可能要素: 検索input、項目追加、Home、受信トレイ、設定、プロフィール、sidebar trigger、desktop rail。
- mobile open時はdialog/title/descriptionと同じメニュー内容を確認。
- コードにあるが画面から到達できない分岐: 今回のisolated previewでは`side=right`、`variant=floating/inset`、`collapsible=offcanvas/none`、controlled `open/onOpenChange`は導線なし。
- 画面から入力できるがコードで検証していない値: 検索inputはpreviewに検索処理を接続していない。表示・focus対象であり、検索機能の成功基準には含めない。

### 型/CSS schema

- `SidebarProps`: `side`、`variant`、`collapsible`の各unionを確認。
- `SidebarProviderProps`: `defaultOpen`、controlled `open`、`onOpenChange`を確認。
- `SidebarMenuButtonProps`: `isActive`、`variant`、`size`、`tooltip`を確認。
- OpenAPI等の外部schemaは対象に存在しない。
- 型にあるが今回のpreviewで扱わないparameter: 上記のright/floating/inset/offcanvas/none/controlled props。previewの到達範囲外であり、未到達分岐へ記録した。

## 未到達分岐

- `Sidebar collapsible="none"`
- desktop `collapsible="offcanvas"`
- `side="right"`
- `variant="floating"` / `variant="inset"`
- controlled `open` / `onOpenChange`
- `SidebarMenuButton`のtooltip object props経路（previewはstringのみ）
- catalog mode（isolated preview検証の対象外）

## 旧FAILからの直接回帰

- 旧観測: Dark mobileでHomeへkeyboard focus後、Escape 1回ではSheetが閉じず、2回必要だった（3/3で再現）。
- 原因: mobileでもTooltipを構築してmenu buttonをTooltipTriggerで包み、SheetとTooltipのdismiss layerが重なっていた。
- 新観測: Tooltipをdesktop collapsed時だけ構築する変更後、同一直接ケースはLight 3/3、Dark 3/3の計6/6で、Escape 1回によりSheet閉鎖・dialog消滅・trigger focus復帰まで成功した。

## 検証ハーネス上の中断（結果には不採用）

- CDP `readEvents`の`limit=2000`はAPI上限1000で拒否された。該当tabの結果は採用せずcloseし、`limit=1000`に修正したfresh tabで全件を再実行した。
- Browser locatorに`hover()`が無かった。該当tabの途中結果は採用せず、keyboard Tabでcollapsed Homeへfocusする利用可能な実経路に変えたfresh tabでtooltipを検証した。
- raw CDPの`Browser.getVersion`は非対応だった。機能結果には影響せず、Chrome版はローカル実行ファイルの`--version`で採取した。

## JPEG証跡

| path | 内容 | SHA-256 | 検証 |
|---|---|---|---|
| `/private/tmp/2026-08-02-sidebar-preview-light.jpg` | Sidebar Light expanded | `4b95e7fbfbdebcc7baeaafe20064f7e1370a93bda3974e47d566068cfd1dbbd4` | JFIF、1280x900、目視一致 |
| `/private/tmp/2026-08-02-sidebar-preview-dark.jpg` | Sidebar Dark expanded | `81f3c7060e22bd4ef0fd5841662bce2ecf3ee9ce47de9a767f92b6ce7f21eeb9` | JFIF、1280x900、目視一致 |

## 不具合

- 新規不具合: なし。
- flaky: なし。

## 未検証の残・正直な限界

- CDP listener設定前の最初のbrowser navigationは監視対象外。独立curl 200、URL/title、hydration selectorで補完したが、初回navigationのconsole/network 0件は主張しない。
- right/floating/inset/offcanvas/none/controlled/catalog分岐は当該isolated previewから到達不能のため未実行。
- touch gesture、実端末Safari/Android Chrome、RTL、画面回転、OS accessibility APIは未実行。
- modal dialogには`role=dialog`、labelledby、describedby、focus trapを実測した。DOM上の`aria-modal`属性は付与されていなかったため、これを付与済みとは主張しない。

## クリーンアップ

- 全fresh tabをcloseし、Browser session finalization時の残tabは0。
- `sidebar_state`をCDPで削除し、最終cookie検索は空配列。
- viewport overrideをreset。
- リポジトリはread-onlyを維持し、開始時・終了時ともworktree clean。

## 申し送り候補

- `.docs/actions/`候補: isolated previewから未到達のright/floating/inset/offcanvas/none/controlled/catalog分岐を必要に応じて専用previewで検証する。
- brain候補: Browser CDP listenerは初回HTTP navigationより前に設定できないため、初回到達性と監視区間を分離して報告する。
