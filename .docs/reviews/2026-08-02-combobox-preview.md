# Combobox プレビュー動作検証レポート

検証対象: `/preview/combobox`（Light） / `/preview/combobox-dark`（Dark）

verified_impl_sha: 8112aae6ed8f0c9274575037f60356a152403b54

判定: ✅ 必須rubricをLight/Darkとも実測確認。旧SHAの証跡・判定は不採用とし、本書と同名JPEG 2枚を修正後実測で置換した。

- 取得方法/JPEG形式対応: Playwrightの `page.screenshot({ type: "jpeg", quality: 90, fullPage: true })` で各themeをJPEGとして直接取得し、`file`・JFIF magic・`sips format=jpeg`で拡張子と実形式の対応を確認した。

## 実行環境（再現性の前提）

| 項目 | 実測値 |
|---|---|
| 検証日時 | 2026-08-02T09:57:37+0900 |
| branch | `feat/batch-final` |
| 対象commit | 冒頭の `verified_impl_sha` |
| 起動対象 | 固定commitを `git archive` で `/private/tmp` の一時コピーへ展開し、そこで `npm run build:site` |
| URL | `http://127.0.0.1:3013/preview/combobox` / `http://127.0.0.1:3013/preview/combobox-dark` |
| OS | macOS 26.3.1 (25D2128) |
| Node / npm / Astro | Node v26.4.0 / npm 11.17.0 / Astro 7.1.6 |
| Browser | Chrome 150.0.0.0（Playwright）、viewport 1200×862 CSS px、DPR 1 |
| 実行可否 | ✅ Light/Dark全rubricを実行 |
| repo副作用 | repo内ファイル作成・変更なし。最終 `git status --short --untracked-files=all` 出力なし |

元リポジトリ書込禁止を守るため、repo内の既存 `dist` は利用・更新せず、固定commitの一時コピーでsiteを再buildした。一時コピーは検証後に `trash` でゴミ箱へ移動した。

## 成功基準（rubric・実行前に固定）

1. HEADと固定commitが一致し、開始前後ともtracked / untracked / staged / unstaged差分がない。
2. port 3013を明示して起動し、Light/Dark両URLがHTTP 200、終了時にLISTENがない。
3. `[data-slot="combobox-preview"]` が各themeで1件hydrateされる。
4. 初期inputはrole `combobox`、accessible name「フレームワーク」、`aria-expanded=false`、値空、popup/listboxなし、status「選択: なし / 閉じています」。
5. 最終実DOMのicon-only triggerは `aria-label="選択肢を開く"` で、closed時にaccessibility tree / role-name locatorでも `button "選択肢を開く"` と取得できる。
6. inputまたはtriggerからopenでき、input/triggerのexpanded状態、Portal popup、listbox、4 options、statusが同期する。
7. open中のbackground処理を `aria-hidden` / `inert` の実属性と実focus経路で確認する。
8. query `re` はReactだけ、非一致 `zzzz` は0 optionとEmpty「該当する項目はありません」になる。
9. 無filterの `ArrowDown` は先頭Astroをhighlightし、`Enter` はAstroを選択してclose、controlled state/status更新、input focusを維持する。
10. selected状態のEscapeはAstroを保持してcloseし、inputへfocusを戻す。
11. close後に `[data-slot="combobox-after"]` へkeyboardで到達できる。
12. clearはaccessible name「選択をクリア」で、実DOMのtabindexを記録する。click後はvalue null相当、closed、status更新、input focusとなる。
13. clearがtab順にない場合でも、input上の文字削除操作で選択解除できる。
14. focus時のInputGroupにopaqueな3px `--ring` が実効する。
15. popupのside / gap / rectと、semantic token / custom property utilityの計算値が一致する。
16. Light/Dark tokenとpopup/body描画色がthemeごとに切り替わる。
17. 採用する各themeの全操作期間でconsole error 0、warning 0、pageerror 0、HTTP 4xx/5xx 0。
18. JPEG 2枚がブラウザから直接取得され、JFIF magic・形式・寸法・SHA-256を確認できる。

## 一次情報からの動作パターン導出

### 実装コード

- `ComboboxPreview` は `value: string | null` と `open: boolean` のcontrolled stateを持つ。
- itemsは `Astro / React / Svelte / Vue` の固定順。無filterの最初のkeyboard候補はAstro。
- inputは `aria-label="フレームワーク"`、placeholder「選択または検索」。
- triggerは `InputGroupButton` とBase UI Triggerのrender合成で、修正後は `aria-label="選択肢を開く"`。
- clearはvalueがnullでない場合だけ表示され、`aria-label="選択をクリア"`。
- PopupはPortal、既定 `side=bottom`、`sideOffset=6`、`align=start`。
- Popup幅は `--anchor-width` と `--combobox-popup-min-width`、List高さは `--combobox-list-max-height` で制約される。
- statusはvalue/openのReact stateをそのまま表示し、外部button `combobox-after` がclose後focus経路を観測可能にする。

### 最終画面 / accessibility tree

- closed時のpreview treeにはnamed comboboxと `button "選択肢を開く"` が存在する。
- open時はPortal listboxと4 optionsがtreeへ追加される。
- Base UIのmodal処理はbody/preview全体をinertにせず、外部buttonとtriggerを含むaddonへ個別に `aria-hidden=true` を付与する。
- selected時はtriggerがCSSで非表示となり、clearが表示される。clearの実DOM `tabindex=-1` は仕様上の実態として記録し、input削除経路を別ケースで検証した。

### 型 / CSS

- `ComboboxInputProps` はBase UI Input propsに `showTrigger?` / `showClear?` を追加。
- Light/Darkは同一React previewを使用し、rootの `dark` classとsemantic CSS variablesだけを切り替える。
- InputGroupのfocus-visible条件は `ring-3` / `ring-ring`。opaque `--ring` をcomputed shadowで検証する。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | 固定commit / clean | Git | 偽成功対策 | High | ✅実測確認 | 2/2 | HEAD一致、status/diff空 | `git rev-parse HEAD`; `git status --short --untracked-files=all`; `git diff --exit-code` |
| 2 | 一時コピーbuild / port3013 / 2URL 200 | 環境 | 状態遷移 | High | ✅実測確認 | 2/2 | Astro 119 routes build、各HTTP 200 | `git archive`; `npm run build:site`; `npm run preview -- --host 127.0.0.1 --port 3013`; `curl` |
| 3 | hydration selector | 画面 | 同値分割 | High | ✅実測確認 | 2/2 | preview count Light=1 / Dark=1 | networkidle→`[data-slot="combobox-preview"]` visible待機 |
| 4 | 初期ARIA / closed | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | input value空、expanded=false、popup/list=0、statusなし/closed | 各URLをfresh contextでnavigate |
| 5 | trigger accessible name | コード・画面 | a11y | High | ✅実測確認 | 2/2 | DOM label一致、role-name count=1、aria snapshot `button "選択肢を開く"` | closed時にrole/name locatorと `ariaSnapshot()` |
| 6 | input click open | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | expanded=true、popup/list=1、options=4、status open | input click→popup visible待機 |
| 7 | trigger close / reopen | コード・画面 | 1-switch | High | ✅実測確認 | 2/2 | closeで0件、reopenで4 options | open中は実DOM selector、closed中はnamed buttonをclick |
| 8 | Portal / listbox / options | コード・画面 | 構造 | High | ✅実測確認 | 2/2 | popupはpreview外、listbox ID=input controls、4 items | DOM contains / role / ID取得 |
| 9 | open中background制御 | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | after `aria-hidden=true`、triggerもhidden祖先内、body/preview inert=false | open時に各属性・hidden祖先取得 |
| 10 | filter `re` | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | option=Reactのみ、input=`re` | open中にfill→140ms |
| 11 | no match / Empty | コード・画面 | 異常系 | High | ✅実測確認 | 2/2 | option=0、Empty表示flex | `zzzz` fill→140ms |
| 12 | filter状態からEscape | コード・画面 | 状態遷移 | Medium | ✅実測確認 | 2/2 | query空、closed、statusなし、input focus | Escape→160ms |
| 13 | 無filter ArrowDown | コード・画面 | 境界・順序 | High | ✅実測確認 | 2/2 | Astroのみhighlight、activeDescendantがAstro ID | fresh reload→focus→ArrowDown |
| 14 | EnterでAstro選択 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | value Astro、closed、status Astro、input active | ArrowDown直後にEnter |
| 15 | selected Escape | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | Astro維持、closed、input active | selected input click→Escape |
| 16 | close後external到達 | 画面 | 1-switch | High | ✅実測確認 | 2/2 | Tab1回で `combobox-after` active | selected Escape後にTab |
| 17 | input文字削除で解除 | 画面 | keyboard代替経路 | High | ✅実測確認 | 2/2 | Astro→空、statusなし、clear消滅、input active | selected inputでMeta+A→Backspace |
| 18 | clear name / tabindex / null / focus | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | name一致、tabindex=-1、click後空/closed/input active | accessible name指定click |
| 19 | 3px opaque ring | コード・CSS・画面 | 境界値 | High | ✅実測確認 | 2/2 | shadowにopaque `oklch(0.556 0 0) ... 3px` | input focus→InputGroup computed style |
| 20 | popup位置・寸法 | コード・画面 | 境界値 | Medium | ✅実測確認 | 2/2 | input 370×32、popup 398×120、bottom、gap6 | open時rect / data-side取得 |
| 21 | custom property utility | コード・CSS・画面 | 境界値 | Medium | ✅実測確認 | 2/2 | anchor 370px + spacing7=28px → min/width398px、list max252px | computed custom properties取得 |
| 22 | Light theme token / JPEG | CSS・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | Light token・popup/body色、JPEG目視 | Light route computed style / screenshot |
| 23 | Dark theme token / JPEG | CSS・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | dark class・Dark token・popup/body色、JPEG目視 | Dark route computed style / screenshot |
| 24 | console / warning / pageerror / HTTP error | 画面 | エラー推測 | High | ✅実測確認 | 2/2 | 各theme 0 / 0 / 0 / 0 | fresh browser contextでnavigate前にlistener登録 |
| 25 | JPEG実体 | 画面・環境 | 偽成功対策 | Medium | ✅実測確認 | 2/2 | JFIF、1200×862、SHA-256 | `file`; `xxd`; `sips`; `stat`; `shasum` |
| 26 | server / 一時データcleanup | 環境 | 後始末 | High | ✅実測確認 | 1/1 | Ctrl-C後3013 LISTENなし、一時コピーはゴミ箱へ移動 | Ctrl-C; `lsof`; `trash` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## ARIA・状態遷移の実測

### 初期 closed（Light / Dark共通）

- selector: `[data-slot="combobox-preview"]` = 1
- input: `INPUT role=combobox`、name「フレームワーク」、`aria-expanded=false`、`aria-autocomplete=list`、value空、controlsなし
- trigger: `BUTTON data-slot=input-group-button`、`aria-label=選択肢を開く`、`aria-expanded=false`、display flex、tabindex 0
- accessibility tree: `button "選択肢を開く"`
- popup/list/options/clear: 0 / 0 / 0 / 0
- status: 「選択: なし / 閉じています」

### open

- input: `aria-expanded=true`、controlsはlistbox IDと一致、focus維持
- trigger: `aria-expanded=true`、`data-pressed`あり、DOM labelは維持
- Popup / List: 1 / 1、optionsはAstro / React / Svelte / Vue
- status: 「選択: なし / 開いています」
- Portal: contentはpreview sectionの子孫ではない

open中はBase UIがtrigger祖先のaddonと外部buttonへ `aria-hidden=true` を付けるため、trigger自身のDOM labelは存在するがaccessibility treeから一時的に除外される。close後は属性が解除され、role-name count=1へ戻る。body/previewへの一括 `inert` は使われていない。

### keyboard選択

- `ArrowDown`: 先頭Astroに `data-highlighted`、inputのactiveDescendantはAstro option ID
- `Enter`: value「Astro」、popup/list 0、status「選択: Astro / 閉じています」、input active
- selected状態で再open→Escape: value「Astro」を維持し、closed、input active
- その後Tab: `combobox-after` がactive

誤った旧期待は採用していない。無filterの実装順どおりAstro選択を期待・実測した。

### clearとkeyboard代替

- clear: role button、accessible name「選択をクリア」、`tabindex=-1`
- clear click後: value空、clear 0、status「選択: なし / 閉じています」、input active
- input keyboard削除: Astro選択後、input上でMeta+A→Backspaceによりvalue空、clear消滅、statusなし、input focus維持

`tabindex=-1` は実態として記録するが、inputの標準的な文字削除経路をLight/Dark双方で実測したためflagにしない。

## filter / Empty

| 入力 | Light | Dark |
|---|---|---|
| `re` | React 1件 | React 1件 |
| `zzzz` | option 0、Empty flex | option 0、Empty flex |
| `zzzz` 後Escape | query空、closed、input focus | query空、closed、input focus |

## positioning / semantic custom property

| 項目 | Light | Dark |
|---|---:|---:|
| input rect | x25, y96, 370×32 | x25, y96, 370×32 |
| popup rect | x25, y134, 398×120 | x25, y134, 398×120 |
| gap / side | 6px / bottom | 6px / bottom |
| popup role | presentation | presentation |
| `--anchor-width` | 370px | 370px |
| `--combobox-popup-min-width` | `calc(370px + calc(.25rem * 7))` | 同左 |
| computed popup min/width | 398px / 398px | 398px / 398px |
| `--available-height` / max-height | 723px / 723px | 723px / 723px |
| List computed max-height | 252px | 252px |

anchor 370pxにspacing7（28px）が加わり398pxとなるため、semantic custom property utilityは実効している。

## focus ring

Light/Dark共通:

- `--ring: oklch(55.6% 0 0)`
- focused InputGroup: `:focus-within=true`
- computed box-shadowに `oklch(0.556 0 0) 0px 0px 0px 3px`
- outline width: 3px
- alpha指定なしのopaque ring

## Theme token

| token / computed color | Light | Dark |
|---|---|---|
| `--background` | `oklch(100% 0 0)` | `oklch(14.5% 0 0)` |
| `--foreground` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` |
| `--popover` | `oklch(100% 0 0)` | `oklch(20.5% 0 0)` |
| `--popover-foreground` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` |
| `--muted` | `oklch(97% 0 0)` | `oklch(26.9% 0 0)` |
| `--muted-foreground` | `oklch(54% 0 0)` | `oklch(70.8% 0 0)` |
| popup background | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| popup foreground | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| body background | `oklch(1 0 0)` | `oklch(0.145 0 0)` |

## console / network

採用したLight/Darkの各fresh browser contextでは、navigate前にlistenerを登録し、全操作・JPEG取得完了後まで収集した。

| theme | console error | warning | pageerror | HTTP 4xx/5xx |
|---|---:|---:|---:|---:|
| Light | 0 | 0 | 0 | 0 |
| Dark | 0 | 0 | 0 | 0 |

探索中の不採用runでは、既定tool pageからのfavicon要求が404となる事象を1回観測した。製品rubricの採用runは、themeごとに新規browser contextを作成してlistenerをnavigate前に登録し、その実行ではfavicon要求自体が発生せず上表の結果だった。採用runの0件を不採用runへ遡及して一般化しない。

## JPEG evidence

| path | 内容 | 実形式 / magic | 寸法 | bytes | SHA-256 |
|---|---|---|---:|---:|---|
| `/private/tmp/2026-08-02-combobox-preview-light.jpg` | Light、open popup、4 options、3px ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 21161 | `d12ae2b6e829394c7cc98e4135301241c581144d6f175effc2ab11e474a82eae` |
| `/private/tmp/2026-08-02-combobox-preview-dark.jpg` | Dark、open popup、4 options、3px ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 20551 | `49cae9a6573b284af29d660546544dcb52dcb3144d8a2021eab7c02c67bad544` |

両画像を原寸表示で目視し、theme、見出し、placeholder、open popup、4 options、focus ringを確認した。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: 今回previewが使用する範囲ではなし。chips / group / separator等の未使用exportは本previewの対象外。
- 画面から入力できるがコードで検証していない値: Base UI側がfilterを担い、preview固有の追加validationはない。代表一致・不一致を実測した。
- スキーマにあるがコードで扱っていないパラメータ: OpenAPI等は対象外。TypeScript propsのoptional `showTrigger` / `showClear` はpreview利用と整合。
- コードの修正点と最終DOM: sourceのtrigger labelが、Light/Dark両方の実DOMとaccessibility treeへ反映された。

## 未到達分岐（網羅の穴・機械的な証拠）

- `disabled=true`
- `showTrigger=false`
- `multiple=true`
- chips anchor / chips remove
- Group / Label / Separator
- Positionerのtop / left / right / inline方向と非既定offset
- option disabled

これらはexport全体には存在するが、今回の固定previewから到達する入力・操作導線がない。

## 発見した不具合

- 必須rubricに対する不具合なし。
- clearの `tabindex=-1` は実態として記録したが、input上の文字削除経路を両themeで確認したためflagなし。

## 未列挙・未検証の残（正直な限界）

- 実支援技術（VoiceOver等）での読み上げは未実測。accessibility tree / role-name locatorまでを確認した。
- viewportは1200×862のみ。狭幅、zoom、RTL、high-DPIは未実測。
- filterは代表一致 `re` と不一致 `zzzz`。Unicode正規化・IME composingは未実測。
- screenshotの自動pixel baseline比較はなく、保存JPEGを原寸目視した。
- 探索runのfavicon 404と採用runの0件差はbrowser context生成経路に依存するため、各結果の適用範囲を分離した。

## 再現手順

repoを変更せず固定commitを一時コピーへ展開:

```bash
git rev-parse HEAD
git status --short --untracked-files=all
mktemp -d /private/tmp/combobox-verify.XXXXXX
git archive --format=tar --output=<TEMP>/source.tar <verified_impl_shaの値>
tar -xf <TEMP>/source.tar -C <TEMP>
ln -s /Users/nishikawa/projects/elchika-inc/ui/node_modules <TEMP>/node_modules
npm run build:site
npm run preview -- --host 127.0.0.1 --port 3013
```

各themeを独立browser contextで実行:

1. viewportを1200×862に固定し、console / warning / pageerror / response listenerをnavigate前に登録する。
2. URLへ `networkidle` でnavigateし、`[data-slot="combobox-preview"]` visibleを待つ。
3. closed時にinputのARIA、triggerのDOM label、`getByRole("button", { name: "選択肢を開く" })`、aria snapshotを取得する。
4. input clickでopenし、Portal / listbox / options / background属性 / popup rect / CSS custom propertiesを取得する。
5. triggerでclose / reopenし、expanded / pressed / statusを取得する。open中triggerはhidden祖先内なのでDOM selectorで操作する。
6. `re`、`zzzz`をfillしてoption / Emptyを取得し、Escapeする。
7. fresh reload後、input focus→ArrowDownでAstro highlight→EnterでAstro選択。status / close / focusを取得する。
8. selected状態で再open→Escape→Tabし、値維持とexternal focusを取得する。
9. fresh reload後にAstro選択→Meta+A→Backspaceし、input削除経路を取得する。
10. fresh reload後にAstro選択→clear clickし、null相当 / status / focusを取得する。
11. input focusのcomputed ringを取得し、再openしてJPEGを直接取得する。
12. 全listener配列が0件であることを確認し、browser contextを閉じる。

JPEG検証:

```bash
file /private/tmp/2026-08-02-combobox-preview-light.jpg /private/tmp/2026-08-02-combobox-preview-dark.jpg
xxd -l 16 /private/tmp/2026-08-02-combobox-preview-light.jpg
xxd -l 16 /private/tmp/2026-08-02-combobox-preview-dark.jpg
sips -g pixelWidth -g pixelHeight -g format /private/tmp/2026-08-02-combobox-preview-light.jpg
sips -g pixelWidth -g pixelHeight -g format /private/tmp/2026-08-02-combobox-preview-dark.jpg
stat -f '%N %z bytes' /private/tmp/2026-08-02-combobox-preview-light.jpg /private/tmp/2026-08-02-combobox-preview-dark.jpg
shasum -a 256 /private/tmp/2026-08-02-combobox-preview-light.jpg /private/tmp/2026-08-02-combobox-preview-dark.jpg
```

## クリーンアップ

- browser contextとtool pageをcloseした。
- Astro preview serverへCtrl-Cを送信し、終了後 `lsof -nP -iTCP:3013 -sTCP:LISTEN` がexit 1・出力なしであることを確認した。
- 固定commit一時コピーと中間HTML/favicon取得物は `trash` でゴミ箱へ移動した。直接削除は安全装置に拒否されたため、回収可能な手段へ切り替えた。
- 永続データ、課金、外部送信、repo内ファイル作成なし。

## 申し送り候補

- `.docs/actions/` 登録候補: なし。
- brain記録候補: Portal widgetのopen中はtrigger自身にlabelがあっても祖先 `aria-hidden` でaccessibility treeから除外されるため、closed/openを分けてaccessible nameを判定する。
