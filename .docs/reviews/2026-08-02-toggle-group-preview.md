# ToggleGroup プレビュー実ブラウザ動作検証レポート

- 判定: **PASS**
verified_impl_sha: d1e7af43bd752162b169dbd9b570f3119612bb49
- 検証日時: 2026-08-02 09:17–09:20（Asia/Tokyo）
- 対象 branch: `feat/batch-final`
- 対象 URL: Light `http://127.0.0.1:3013/preview/toggle-group` / Dark `http://127.0.0.1:3013/preview/toggle-group-dark`
- 取得方法/JPEG形式対応: Playwright の `page.screenshot({ type: "jpeg", quality: 90, fullPage: true })` で各 theme を JPEG として直接取得し、`file`・JFIF magic・`sips format=jpeg` で拡張子と実形式の対応を確認した。

## 実行環境（再現性の前提）

| 項目 | 実測値 |
|---|---|
| repo | `/Users/nishikawa/projects/elchika-inc/ui` |
| OS | macOS 26.3.1（Build 25D2128） |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Chrome 150.0.0.0（Playwright MCP） |
| viewport | 1200 × 862 CSS px、devicePixelRatio 1 |
| Server | Astro 7.1.6、`127.0.0.1:3013`、node PID 46689 |
| 開始時 | 3013番 LISTEN なし、HEAD は structured field の固定実装と一致、tracked / untracked / staged / unstaged すべて clean |
| 実行可否 | ✅ Light / Dark とも実ブラウザで全 rubric を実行 |

## 成功基準（rubric・実行前に固定）

1. hydration 後に `[data-slot="toggle-group-preview"]` が1個、groupが2個、各groupにitemが3個存在する。
2. 各groupの `role`、`aria-label`、`data-orientation`、`data-multiple` が single / multiple の仕様と一致する。
3. single初期値はcenterのみ `aria-pressed=true`、statusはcenter。right clickでrightのみ、再clickで全false / statusなしになる。
4. multiple初期値はbold。italic clickでbold+italic、bold再clickでitalicのみになる。
5. horizontal は ArrowRight / ArrowLeft / Home / End、vertical は ArrowDown / ArrowUp / Home / End で activeElement と唯一の `tabindex=0` が該当itemへ移る。
6. 矢印・Home・Endだけでは `aria-pressed` と status が変化せず、Space / Enter でfocused itemがtoggleされる。
7. keyboard focus ringが透明でなく、不透明な3px ringとして描画される。
8. spacing=0 のsingle groupで computed gap=0、item rectが隙間なく接し、角丸と左borderが連結形状になる。
9. Light / Dark のtheme tokenとbody色が切り替わる。
10. 各themeの全操作中に console error / warning / pageerror が0である。
11. JPEG 2枚をブラウザから直接取得し、JFIF magic、画像寸法、形式、SHA-256を確認する。
12. 終了時にserverを停止し、3013番ポートが空、HEADが不変、repoがcleanである。

## 一次情報からの動作パターン導出

### 実装コード

- wrapperは `orientation` を既定 `horizontal` で受け、`data-orientation`、Base UI公開prop `orientation={orientation}`、contextの3箇所へ渡す。
- single groupは `value=["center"]`、`multiple`なし、`orientation`既定horizontal、outline、`spacing={0}`。
- multiple groupは `value=["bold"]`、`multiple`あり、`orientation="vertical"`、spacing既定2。
- itemはBase UI Toggleで、`aria-pressed`とroving tabindexがランタイムで管理される。
- spacing=0では middle / last の左borderを0にし、horizontal先頭だけ左角、末尾だけ右角を持つclass分岐がある。

### 実 DOM / accessibility tree

- region「表示形式」配下に group「文字揃え」と group「文字装飾」があり、各3button、各statusが存在する。
- single rootは `role=group`, `aria-label=文字揃え`, `data-orientation=horizontal`, `data-multiple`なし。
- multiple rootは `role=group`, `aria-label=文字装飾`, `data-orientation=vertical`, `data-multiple`空属性。
- 初期roving tabindexは両groupとも先頭itemだけ0、残りは-1。singleの選択状態centerとtab stop左は独立していた。

### 型 / 公開props経路

- `ToggleGroupPrimitive.Props` の型定義に `orientation?: Orientation` が存在する。
- wrapperでdestructureした `orientation` がBase UI primitiveへ公開propとして明示転送されていることをソースと実ブラウザ挙動の双方で確認した。

## テストケースと結果

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | 固定実装・branch・開始時clean | コード・環境 | 前提検証 | High | ✅実測確認 | 1/1 | `git`生出力 | `git branch --show-current`; `git rev-parse HEAD`; `git status --short`; staged / unstaged diff |
| 2 | port空→明示server起動→両URL 200 | 環境・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | PID 46689、各HTTP 200、page URL一致 | `lsof`; `npm run preview -- --host 127.0.0.1 --port 3013`; `curl`; Playwright `goto` |
| 3 | hydration / group・item数 | コード・画面 | 構造検証 | High | ✅実測確認 | 2/2 | preview=1、group=2、各item=3 | 各route reload(networkidle)→selector待機→DOM count |
| 4 | group role / label / orientation / multiple | コード・画面・型 | 属性検証 | High | ✅実測確認 | 2/2 | single: group/文字揃え/horizontal/multipleなし、multiple: group/文字装飾/vertical/multiple空属性 | root属性を取得 |
| 5 | single初期center | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | pressed `[false,true,false]`、status `選択: center` | reload後に全item属性とstatus取得 |
| 6 | single right→なし | コード・画面 | 0-switch / 1-switch | High | ✅実測確認 | 2/2 | 1回目 `[false,false,true]` / right、2回目全false / なし | 右揃えを2回click、各回80ms後に取得 |
| 7 | multiple bold→bold+italic→italic | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | `[true,false,false]`→`[true,true,false]`→`[false,true,false]`、statusも一致 | 斜体click→太字click、各回80ms後に取得 |
| 8 | horizontal ArrowRight / ArrowLeft | コード・画面・型 | 状態遷移 | High | ✅実測確認 | 2/2 | 左→中央→左へactive / tabindex0が移動 | 左focus→各key→60ms後にactiveElement / 全tabindex取得 |
| 9 | horizontal End / Home | コード・画面・型 | 境界値 | High | ✅実測確認 | 2/2 | End→右、Home→左 | 同上 |
| 10 | vertical ArrowDown / ArrowUp | コード・画面・型 | 状態遷移 | High | ✅実測確認 | 2/2 | 太字→斜体→太字へactive / tabindex0が移動 | 太字focus→各key→60ms後にactiveElement / 全tabindex取得 |
| 11 | vertical End / Home | コード・画面・型 | 境界値 | High | ✅実測確認 | 2/2 | End→下線、Home→太字 | 同上 |
| 12 | navigation keyで選択不変 | 画面 | 不変条件 | High | ✅実測確認 | 2/2 | horizontalはcenter、verticalはboldのpressed / statusが全矢印・Home・End後も不変 | 各key前後のaria-pressed / status比較 |
| 13 | horizontal Space / Enter toggle | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 左focusedでSpace→left、Enter→なし | keyboard操作後にpressed / status取得 |
| 14 | vertical Space / Enter toggle | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 太字focusedでSpace→なし、Enter→bold | 同上 |
| 15 | roving tabindex | 画面・型 | 状態遷移 | High | ✅実測確認 | 2/2 | 各navigation後、active itemのみ0、他2件は-1 | activeElementと全item tabindexを同時取得 |
| 16 | focus ring | コード・画面・token | 境界値 | Medium | ✅実測確認 | 2/2 | focusVisible=true、`oklch(0.556 0 0)` の3px box-shadow、border同色 | keyboard modalityで太字focus後にcomputed style取得 |
| 17 | spacing=0連結 | コード・画面 | 境界値 | Medium | ✅実測確認 | 2/2 | gap=0、隣接差 `[0,0]`、角丸 / borderが期待どおり | single group / itemsのcomputed styleとrect取得 |
| 18 | Light theme / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | token生値、Light JPEG目視 | Light routeでcustom properties / body color、JPEG取得 |
| 19 | Dark theme / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | token生値、Dark JPEG目視 | Dark routeで同手順 |
| 20 | console / warning / pageerror 0 | 画面 | エラー推測 | High | ✅実測確認 | 2/2 | Light 0/0/0、Dark 0/0/0 | reload前にlistener登録、全操作後に配列取得 |
| 21 | JPEG実体 | 画面・環境 | 偽成功対策 | Medium | ✅実測確認 | 2/2 | JFIF magic、1200×862、format jpeg、SHA-256 | 直接取得後に `file`; `xxd`; `sips`; `stat`; `shasum` |

## pointer状態遷移の実測

Light / Dark とも同一結果だった。

```text
reload
  single: centerのみpressed / 選択:center
  multiple: boldのみpressed / 選択:bold

右揃え click
  single: rightのみpressed / 選択:right
右揃え 再click
  single: 全false / 選択:なし

斜体 click
  multiple: bold+italic / 選択:bold, italic
太字 再click
  multiple: italicのみ / 選択:italic
```

## keyboard・roving tabindexの実測

Light / Dark とも同一結果だった。角括弧はDOM順のtabindexである。

| Group | 操作 | activeElement | tabindex | pressed / status |
|---|---|---|---|---|
| horizontal | 開始 | 左揃え | `[0,-1,-1]` | centerのまま |
| horizontal | ArrowRight | 中央揃え | `[-1,0,-1]` | centerのまま |
| horizontal | ArrowLeft | 左揃え | `[0,-1,-1]` | centerのまま |
| horizontal | End | 右揃え | `[-1,-1,0]` | centerのまま |
| horizontal | Home | 左揃え | `[0,-1,-1]` | centerのまま |
| horizontal | Space | 左揃え | `[0,-1,-1]` | leftのみ / left |
| horizontal | Enter | 左揃え | `[0,-1,-1]` | 全false / なし |
| vertical | 開始 | 太字 | `[0,-1,-1]` | boldのまま |
| vertical | ArrowDown | 斜体 | `[-1,0,-1]` | boldのまま |
| vertical | ArrowUp | 太字 | `[0,-1,-1]` | boldのまま |
| vertical | End | 下線 | `[-1,-1,0]` | boldのまま |
| vertical | Home | 太字 | `[0,-1,-1]` | boldのまま |
| vertical | Space | 太字 | `[0,-1,-1]` | 全false / なし |
| vertical | Enter | 太字 | `[0,-1,-1]` | boldのみ / bold |

矢印・Home・Endはfocusとroving tabindexだけを移し、選択状態は変えなかった。Space / Enterだけがfocused itemをtoggleした。

## 修正前後の差分実測

- 修正前 SHA `8e7d172d010e60045501e59e71e6d98f050f7f8b` では、Lightのvertical groupで太字をactive / tabindex `[0,-1,-1]` にして ArrowDown を押しても太字 / `[0,-1,-1]` のまま、続く ArrowUpも同じで移動しなかった。End→下線、Home→太字は移動した。
- 修正前wrapperは `orientation` をdestructureして `data-orientation` とcontextにのみ使い、Base UI primitiveへ公開propを渡していなかったため、実ランタイムの矢印処理は既定horizontalのままだった。
- 修正後wrapperは `orientation={orientation}` をBase UI primitiveへ渡す。Light / Darkとも ArrowDownで太字→斜体、ArrowUpで斜体→太字へ移動し、roving tabindexも追従した。pressed / statusは不変だった。
- 上流が orientation 転送を修正したらローカル変更を再評価して除去する。

## spacing=0の実測

Light / Dark とも同じだった。

| item | rect x–right | radius | border-left / right |
|---|---|---|---|
| 左揃え | 24–84 | `10px 0 0 10px` | 1px / 1px |
| 中央揃え | 84–157 | `0px` | 0px / 1px |
| 右揃え | 157–216 | `0 10px 10px 0` | 0px / 1px |

- group gap / row-gap / column-gap: すべて0px。
- 左→中央、中央→右の境界差: どちらも0px。
- 後続itemの左borderを0にし、先頭左角・末尾右角だけを残すことで二重borderなしの連結形状になった。

## Theme token

| token / computed | Light | Dark |
|---|---|---|
| `html.class` | 空 | `dark` |
| `--background` | `oklch(100% 0 0)` | `oklch(14.5% 0 0)` |
| `--foreground` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` |
| `--popover` | `oklch(100% 0 0)` | `oklch(20.5% 0 0)` |
| `--popover-foreground` | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` |
| `--muted` | `oklch(97% 0 0)` | `oklch(26.9% 0 0)` |
| `--muted-foreground` | `oklch(54% 0 0)` | `oklch(70.8% 0 0)` |
| `--ring` | `oklch(55.6% 0 0)` | `oklch(55.6% 0 0)` |
| `--border` | `oklch(92.2% 0 0)` | `oklch(100% 0 0/.1)` |
| body bg / fg | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.145 0 0)` / `oklch(0.985 0 0)` |

## JPEG evidence

| ファイル | 目視内容 | format / magic | 寸法 | bytes | SHA-256 |
|---|---|---|---|---:|---|
| `/private/tmp/2026-08-02-toggle-group-preview-light.jpg` | Light UI、single連結形状、singleなし、vertical bold、太字の3px focus ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 22027 | `71a90d7e43cbc3dedcfd445bb585ba4644b68fa1ad2d5fbb5843268037879c5a` |
| `/private/tmp/2026-08-02-toggle-group-preview-dark.jpg` | Dark UI、同じ状態と非透明focus ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 22374 | `e0dd904bde17db0928ad0540322117789a732b83e24edc551e8e22293c02d72f` |

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: size `sm`、spacingが0/2以外、variant default、disabled item、RTLは本プレビューに導線がなく未到達。
- 画面から入力できるがコードで検証していない値: 自由入力なし。6buttonはすべてpointerまたはkeyboardで実行した。
- 型にあるがコードで扱っていないパラメータ: Base UI公開props全般は対象外。今回の問題に直結した `orientation` は型・wrapper・DOM・keyboard実挙動を全てクロスチェックした。
- 見た目だけの `data-orientation=vertical` と実keyboard処理を別々に検証したことで、修正前の「見た目はverticalだがArrowDown/Upが動かない」乖離を検出し、修正後の一致を確認できた。

## 未到達分岐（網羅の穴・機械的な証拠）

- RTLでのhorizontal ArrowLeft / ArrowRight反転
- disabled itemを跨ぐroving focus
- wrap-around（末尾から次、先頭から前）
- orientationを実行中に切り替える状態遷移
- size / variant / spacingのプレビュー未露出値

指定rubricのHighリスク分岐はすべてLight / Dark双方で到達した。

## 発見した不具合

- 修正後固定実装ではなし。
- 修正前に発見したvertical ArrowDown/Up不動は、公開orientation prop転送追加後にLight / Dark双方で解消を実測した。

## 未列挙・未検証の残（正直な限界）

- VoiceOver等の実スクリーンリーダー読み上げは未実行。accessibility tree、role、label、pressed stateまでを検証した。
- Chrome 150以外、狭幅、RTL、zoom、reduced motionは未実行。
- screenshotの自動baseline差分比較はなく、JPEGを人間が再確認できる形で保存した。
- 上流shadcn/uiが将来orientation転送を修正してwrapperのローカル差分が不要になるかは未確認。上記の再評価条件として明示した。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git branch --show-current
git rev-parse HEAD
git status --short
lsof -nP -iTCP:3013 -sTCP:LISTEN
npm run preview -- --host 127.0.0.1 --port 3013
```

各themeをreloadして次を実行する。

1. preview / groups / items / root属性 / pressed / tabindex / status / tokenを取得する。
2. 右揃えを2回clickし、rightのみ→なしを確認する。
3. 斜体→太字をclickし、bold+italic→italicのみを確認する。
4. reloadし、左揃えfocus→ArrowRight→ArrowLeft→End→Home→Space→Enterの各直後にactiveElement / tabindex / pressed / statusを取得する。
5. 太字focus→ArrowDown→ArrowUp→End→Home→Space→Enterを同様に取得する。
6. 太字focus時の `:focus-visible` / box-shadow / border colorを取得してJPEGを撮る。
7. 全期間のconsole error / warning / pageerrorを取得する。

JPEG検証:

```bash
file /private/tmp/2026-08-02-toggle-group-preview-light.jpg /private/tmp/2026-08-02-toggle-group-preview-dark.jpg
xxd -l 16 /private/tmp/2026-08-02-toggle-group-preview-light.jpg
xxd -l 16 /private/tmp/2026-08-02-toggle-group-preview-dark.jpg
sips -g pixelWidth -g pixelHeight -g format /private/tmp/2026-08-02-toggle-group-preview-light.jpg /private/tmp/2026-08-02-toggle-group-preview-dark.jpg
stat -f '%N %z bytes' /private/tmp/2026-08-02-toggle-group-preview-light.jpg /private/tmp/2026-08-02-toggle-group-preview-dark.jpg
shasum -a 256 /private/tmp/2026-08-02-toggle-group-preview-light.jpg /private/tmp/2026-08-02-toggle-group-preview-dark.jpg
```

## クリーンアップ

- 永続データ・外部送信・repo内ファイル作成なし。
- Astro preview serverをCtrl-Cで停止した。
- 停止後、3013番LISTENなし、HEAD不変、tracked / untracked / staged / unstagedすべてcleanを最終ゲートで確認する。

## 申し送り候補

- `.docs/actions/` 登録候補: 上流shadcn/uiがorientation転送を修正した時点で、ローカルの明示転送が不要か再検証する。
- brain記録候補: 見た目用data属性だけではkeyboard契約を満たさない。公開primitive prop転送とactiveElement / roving tabindexを実体で検証する。
