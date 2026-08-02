# 動作検証レポート: Command Preview

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 10:24–10:32 JST
- 対象ブランチ: `feat/batch-final`
- 対象 URL: `http://127.0.0.1:3013/preview/command` / `http://127.0.0.1:3013/preview/command-dark`
- OS: Darwin 25.3.0 arm64
- Node.js: v26.4.0
- npm: 11.17.0
- Astro: 7.1.6
- Chromium: 150.0.7871.187
- viewport / DPR: 1200×900 CSS px / 1
- cmdk: 1.1.1
- 実行可否: ✅ 固定コミットの隔離コピーを実際に build・起動し、Light/Dark の全ケースを実行
- 作業ツリー: 検証開始時・終了時とも clean
- build: `npm run build:site` exit 0、121 pages
- 取得方法/形式: Playwright `page.screenshot({ type: "jpeg", quality: 90 })` により、Light は Light URL、Dark は Dark URL からそれぞれ JPEG を取得した。
- 自己採点対策: DOM 属性、computed style、フォーカス実体、console・network listener、JPEG magic bytes を機械取得して判定

verified_impl_sha: 14bc8cd2b81767cb161c798af4fb1ebaffd3dfd1

## 成功基準（rubric・実行前に定義）

- 固定コミットから作った隔離コピーが build でき、3013番で対象2 URLが HTTP 200を返す。
- 各 URLで hydration selector `[data-slot="command-preview"]` が1件だけ現れる。
- Light は `<html>` に `dark` がなく、Dark は `dark` を持つ。
- 初期表示に「プロフィールを開く」「請求情報を開く」「設定を開く」の3項目がこの順で存在する。
- input/list/group/item の role、ARIA、cmdk 属性が実 DOM に現れ、input の `aria-controls` が listbox の `id` と一致する。
- `設定` で1件へ絞られ、不一致語では「該当するコマンドはありません」が表示される。
- 空の状態から input を focus して `ArrowDown` を1回押すと2件目が選択状態になり、`Enter` で inline status が更新される。
- inline と dialog の両方で、filter 中および `ArrowDown` 後に `border-ring` と不透明な `ring-ring` 3px が computed style に現れる。
- trigger「コマンドパレットを開く」で dialog が開き、名前・説明・autofocus・Portal・背景隔離・focus trap が実 DOM で確認できる。
- dialog の filter、empty、keyboard selection が機能し、選択後は閉じて status を更新し、trigger へ focus を返す。
- 再表示後の `Escape` と、実 accessible name `Close` の close button が dialog を閉じ、選択状態を保持し、trigger へ focus を返す。
- Light/Dark の主要 semantic token が期待値と一致する。
- favicon 修正の決定性として、Light/Dark 各3 fresh browser contextで最初の navigation 前に listener を登録し、console error・warning・pageerror・HTTP 4xx/5xx が全 context で0件となる。
- JPEGが JFIF magic bytesを持つ実 JPEGで、Light/Darkとも1200×900であり、空ファイルでない。
- 検証終了後に3013番が解放され、一時ソースコピーが削除される。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | 固定SHAの隔離 build | コード | 構成確認 | High | ✅実測確認 | 1/1 | build出力: 121 pages / exit 0 | 固定SHAを `git archive` → `/private/tmp` へ展開 → `npm run build:site` |
| 2 | Light cold navigation の決定性 | 画面 | 反復・異常系 | High | ✅実測確認 | 3/3 | 各 context: HTTP 200、console error 0、warning 0、pageerror 0、4xx/5xx 0 | navigation前に listener登録 → fresh context → `goto("/preview/command", { waitUntil: "networkidle" })` |
| 3 | Dark cold navigation の決定性 | 画面 | 反復・異常系 | High | ✅実測確認 | 3/3 | 各 context: HTTP 200、console error 0、warning 0、pageerror 0、4xx/5xx 0 | navigation前に listener登録 → fresh context → `goto("/preview/command-dark", { waitUntil: "networkidle" })` |
| 4 | hydration と theme route | コード・画面 | 同値分割 | High | ✅実測確認 | 8/8 | 全 contextで selector 1、Light `dark=false`、Dark `dark=true` | `[data-slot="command-preview"]` の visible/countと`html.classList`を取得 |
| 5 | inline 初期3項目と順序 | コード・画面 | 0-switch | High | ✅実測確認 | 2/2 | `プロフィールを開く⌘P` → `請求情報を開く⌘B` → `設定を開く⌘S` | inline の `[data-slot="command-item"]` を全件取得 |
| 6 | inline role・ARIA・cmdk属性 | コード・画面・型 | 属性網羅 | High | ✅実測確認 | 2/2 | input=`combobox`、list=`listbox/Suggestions`、group=`presentation/操作`、item=`option`、各cmdk属性あり | 各要素のrole、ARIA、`cmdk-*`、`data-value`を取得 |
| 7 | input と listbox の関連 | 画面 | a11y関係検査 | High | ✅実測確認 | 2/2 | `aria-controls === listbox.id` | inputの`aria-controls`とlistの`id`を比較 |
| 8 | inline `設定` filter | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | 1件、`設定を開く⌘S`、empty非表示 | inline inputへ`設定`をfill |
| 9 | inline 不一致 empty | コード・画面 | 異常系 | Medium | ✅実測確認 | 2/2 | item 0件、empty文言表示 | inline inputへ`一致しない検索語`をfill |
| 10 | inline keyboard selection | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | `ArrowDown`後は2件目、`Enter`後は`選択: 請求情報を開く`、focusはinput | inputを空にしてfocus → `ArrowDown` → `Enter` |
| 11 | inline filter時のfocus ring | コード・画面 | 視覚境界 | High | ✅実測確認 | 2/2 | border=`oklch(0.556 0 0)`、box-shadowに同色3px、ring alphaなし | `設定` filter後300ms待機しInputGroupのcomputed style取得 |
| 12 | inline ArrowDown時のfocus ring | コード・画面 | 状態遷移・視覚境界 | High | ✅実測確認 | 2/2 | border=`oklch(0.556 0 0)`、不透明ring 3px | 空inputで`ArrowDown`後300ms待機しcomputed style取得 |
| 13 | dialog open と accessible name/description | コード・画面・型 | 0-switch | High | ✅実測確認 | 2/2 | role=`dialog`、name=`コマンドパレット`、description=`実行するコマンドを検索します。` | trigger click → `aria-labelledby` / `aria-describedby` の参照先を取得 |
| 14 | dialog autofocus・Portal・背景隔離 | コード・画面 | modal状態遷移 | High | ✅実測確認 | 2/2 | dialog inputへautofocus、preview外Portal、背景側ancestor `aria-hidden=true`、overlay `aria-hidden=true` / `data-base-ui-inert` | dialog open直後のactiveElement、包含関係、背景ancestorを取得 |
| 15 | dialog focus trap | 画面 | 1-switch | High | ✅実測確認 | 2/2 | input → TabでClose → Tabでinput → Shift+TabでClose | dialog open直後からTab操作し各activeElement取得 |
| 16 | dialog `設定` filter | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | 1件、`設定を開く⌘S`、empty非表示 | dialog inputへ`設定`をfill |
| 17 | dialog 不一致 empty | コード・画面 | 異常系 | Medium | ✅実測確認 | 2/2 | item 0件、empty文言表示 | dialog inputへ`一致しない検索語`をfill |
| 18 | dialog filter時のfocus ring | コード・画面 | 視覚境界 | High | ✅実測確認 | 2/2 | border=`oklch(0.556 0 0)`、box-shadowに同色3px、ring alphaなし | dialogで`設定` filter後300ms待機してcomputed style取得 |
| 19 | dialog ArrowDown時のfocus ring | コード・画面 | 状態遷移・視覚境界 | High | ✅実測確認 | 2/2 | border=`oklch(0.556 0 0)`、不透明ring 3px | dialog inputを空にして`ArrowDown`後300ms待機 |
| 20 | dialog keyboard selection・close・focus return | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 2件目選択、status=`選択: 請求情報を開く`、dialog closed、trigger focus | dialog input focus → `ArrowDown` → `Enter` |
| 21 | reopen後のEscape | コード・画面 | 1-switch | High | ✅実測確認 | 2/2 | 選択status保持、dialog closed、trigger focus | 選択後trigger click → `Escape` |
| 22 | showCloseButton の実名とclose path | コード・画面・型 | 分岐 | High | ✅実測確認 | 2/2 | accessible name=`Close`、clickでclosed、trigger focus | 再open → role button/name `Close` をclick |
| 23 | Light semantic token | スキーマ・画面 | テーマ同値分割 | Medium | ✅実測確認 | 1/1 | background 100%、foreground 14.5%、popover 100%、muted 97%、ring 55.6%、border/input 92.2% | LightでdocumentElementのCSS custom properties取得 |
| 24 | Dark semantic token | スキーマ・画面 | テーマ同値分割 | Medium | ✅実測確認 | 1/1 | background 14.5%、foreground 98.5%、popover 20.5%、muted 26.9%、ring 55.6%、border白10%、input白15% | DarkでdocumentElementのCSS custom properties取得 |
| 25 | dialog外形がviewport内 | 画面 | 視覚検査 | Medium | ✅実測確認 | 2/2 | Light約369×215、Dark約372×217、1200×900内 | `dialog.boundingBox()` |
| 26 | Light JPEG実体 | 画面 | 証跡検査 | High | ✅実測確認 | 1/1 | JFIF、1200×900、26,989 bytes、SHA-256 `457f50d09cc9f0a0d040859dac34c5fd050bb080271f2eeabf1be11eea2c796a` | `file`、`xxd -l 16`、`sips`、`shasum -a 256` |
| 27 | Dark JPEG実体 | 画面 | 証跡検査 | High | ✅実測確認 | 1/1 | JFIF、1200×900、36,199 bytes、SHA-256 `948f9fe9dc00328001fe01d6fab731ee3e2b335351dce98cf52a768fa591eced` | `file`、`xxd -l 16`、`sips`、`shasum -a 256` |
| 28 | 終了時SHA・clean・port解放 | コード | 完了ゲート | High | ✅実測確認 | 1/1 | HEAD一致、`git status --short`空、3013番`lsof` exit 1 | `git rev-parse HEAD`、`git status --short`、`lsof -nP -iTCP:3013 -sTCP:LISTEN` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

導出元ラベル: コード / 画面 / 型・スキーマ

## ring重点ゲート

| Theme | Surface | 状態 | border | ring | 判定 |
|---|---|---|---|---|---|
| Light | inline | `設定` filter | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Light | inline | `ArrowDown` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Light | dialog | `設定` filter | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Light | dialog | `ArrowDown` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Dark | inline | `設定` filter | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Dark | inline | `ArrowDown` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Dark | dialog | `設定` filter | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |
| Dark | dialog | `ArrowDown` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` 3px、不透明 | GREEN |

全8状態で実クラス `focus-within:border-ring focus-within:ring-3 focus-within:ring-ring` と、transition完了後のcomputed styleを併用して判定した。

## console・network決定性ゲート

| Theme | Context | HTTP | console error | warning | pageerror | HTTP 4xx/5xx | 判定 |
|---|---:|---:|---:|---:|---:|---:|---|
| Light | fresh 1 | 200 | 0 | 0 | 0 | 0 | GREEN |
| Light | fresh 2 | 200 | 0 | 0 | 0 | 0 | GREEN |
| Light | fresh 3 | 200 | 0 | 0 | 0 | 0 | GREEN |
| Dark | fresh 1 | 200 | 0 | 0 | 0 | 0 | GREEN |
| Dark | fresh 2 | 200 | 0 | 0 | 0 | 0 | GREEN |
| Dark | fresh 3 | 200 | 0 | 0 | 0 | 0 | GREEN |

各contextは、page生成直後かつ最初のnavigation前に `console`、`pageerror`、`response` listenerを登録した。追加のLight/Dark通し操作contextでも全カテゴリ0件だった。

## 三方向導出のクロスチェック結果

- コードからは、初期3項目、selection状態、inline/dialog分岐、filter/empty、dialog open/close、Escape、close button、focus ring、Light/Dark route、faviconの`data:,`を導出した。
- 画面からは、button、combobox、listbox、group、option、dialog、Close buttonの全操作可能要素と、実際のrole・ARIA・cmdk属性を列挙した。
- 型・registryからは、`CommandDialogProps`の`title`、`description`、`className`、`showCloseButton`、`children`、cmdk/lucide依存、dialog/input-group registry依存を列挙した。
- コードにあるが画面から到達できない分岐: `mode !== "isolated"`、custom `title` / `description` / `className`、`showCloseButton=false`、`CommandSeparator`、disabled item。
- 画面から入力できるがコードで検証していない値: Command検索語は自由入力だが、外部送信や永続化はなく、cmdkのfilter対象として処理される。確認した代表値は一致、部分一致、不一致、空。
- スキーマにあるがコードで扱っていないパラメータ: 検出なし。公開propsはprimitiveへspreadまたは明示利用される。
- registry依存と実装importの乖離: 検出なし。cmdkの実インストール版は1.1.1。

## 未到達分岐（網羅の穴・機械的な証拠）

- preview routeは`mode="isolated"`のため、dialog trigger/statusを描画しない`mode !== "isolated"`経路へ未到達。
- previewは既定値を利用するため、custom dialog title/description/classNameへ未到達。
- previewは`showCloseButton`を有効化するため、close button非表示分岐へ未到達。
- previewにseparatorとdisabled itemがないため、該当する見た目・keyboard skip経路へ未到達。
- これらは公開component API側の分岐であり、今回のCommand preview rubric外として残した。

## 発見した不具合

- なし。
- 前SHAで観測されたcold navigationの単発404は、Light/Dark各3 fresh contextと全操作contextで再現しなかった。
- 検証ハーネス内で一度LocatorへDOM Element APIを誤適用したが、製品判定には採用せず、漏れたcontextを閉じ、修正した検証コードでDark通しを最初から再実行した。

## 未列挙・未検証の残（正直な限界）

- IME composing、非常に長い検索語、Unicode正規化差、項目数が大量の場合のscroll/virtualizationは未検証。
- custom props、separator、disabled item、`mode !== "isolated"`は今回のpreviewから到達不能。
- スクリーンリーダー実機の読み上げ品質は未検証。DOM role・ARIA関係とkeyboard focusのみ実測した。
- Chromium以外のFirefox/WebKit、ズーム、OS forced-colors、高コントラストモードは未検証。
- builderと判定者が同一であるため、最終承認は人間に委ねる。

## クリーンアップ

- 永続データ、課金、外向き送信、削除操作は発生していない。
- Astro preview serverを停止し、3013番にLISTENがないことを`lsof` exit 1で確認した。
- 固定SHAの隔離コピーとtarをTrashへ移動した。
- 検証対象repositoryには書き込まず、終了時もcleanを確認した。
- Light/Dark JPEGのみ `/private/tmp` に証跡として保持した。
- `.docs/actions/` への登録候補: なし。
- brainへの記録候補: previewのcold navigation consoleゲートでは、暗黙favicon要求を明示的なdata URL faviconで抑止する。
