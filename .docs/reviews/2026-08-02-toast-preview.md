# Toast プレビュー実ブラウザ動作検証レポート

- 判定: **PASS**
verified_impl_sha: d92346c9030af3d51c0af5285732f898d3b29818
- 検証日時: 2026-08-02 08:49–08:56（Asia/Tokyo）
- 対象 branch: `feat/batch-final`
- 対象 URL: Light `http://127.0.0.1:3013/preview/toast` / Dark `http://127.0.0.1:3013/preview/toast-dark`
- 取得方法/JPEG形式対応: Playwright の `page.screenshot({ type: "jpeg", quality: 90, fullPage: true })` で各 theme を JPEG として直接取得し、`file`・JFIF magic・`sips format=jpeg` で拡張子と実形式の対応を確認した。

## 実行環境（再現性の前提）

| 項目 | 実測値 |
|---|---|
| repo | `/Users/nishikawa/projects/elchika-inc/ui` |
| OS | macOS 26.3.1（Build 25D2128） |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Chrome 150.0.0.0（Playwright MCP） |
| viewport | 1200 × 862 CSS px、devicePixelRatio 1 |
| Server | Astro 7.1.6、`127.0.0.1:3013`、node PID 81208 |
| 開始時 | 3013 番 LISTEN なし、HEAD は structured field の固定実装と一致、tracked / untracked / staged / unstaged すべて clean |
| 実行可否 | ✅ Light / Dark とも実ブラウザで実行 |

## 成功基準（rubric・実行前に固定）

1. `[data-slot="toast-preview"]` が hydration 後に 1 個存在し、初期 Toast は 0 個である。
2. 通常追加で live notification region と Toast dialog が現れ、Title / Description のテキストおよび ARIA ID 関連付けが正しい。
3. Toast 表示中も背景を modal 化せず、body / preview / input が `inert` または `aria-hidden` にならず、背景 input に実際にフォーカスして値を変更できる。
4. Provider 既定 `timeout={1800}` の Toast は 1800ms 付近で終了遷移へ入り、遷移完了後に DOM から消える。
5. `timeout: 1200` の hover 用 Toast は pointer hover を 1200ms 超保持しても残り、hover 解除後に消える。
6. Action「元に戻す」の実行で Action count が 0→1 になり、その Toast が閉じる。
7. Close は Toast 内へフォーカス移動した操作可能状態で accessible name「通知を閉じる」を持ち、accessible-role 指定の click で閉じる。
8. 4件追加時の DOM 順序、`--toast-index`、`data-limited`、computed opacity を測り、`limit={3}` の実挙動を決めつけず記録する。
9. keyboard focus 時に Toast の focus ring が透明でなく、不透明な 3px ring として描画される。
10. Light / Dark の主要 theme token と body 色が切り替わる。
11. 各 theme の全操作中に console error / warning / pageerror が 0 である。
12. JPEG 2枚はブラウザから直接取得され、JFIF magic、画像寸法、形式、SHA-256 を確認できる。
13. 終了時に server を停止し、3013 番ポートが空、HEAD が不変、repo が clean である。

## 一次情報からの動作パターン導出

### 実装コード

- `ToastToaster timeout={1800} limit={3}` が provider と portal / viewport / list を構成する。
- 通常追加は Title「通知を追加しました」、Description「通常の自動消滅を確認します。」、type `info`。
- hover 用は timeout 1200、type `warning`。
- Action 付きは timeout 0、Action「元に戻す」で state count を加算して manager の `close(id)` を呼ぶ。
- 複数追加は index 1→2→3→4 の順で同期的に `toast.add` する。
- `ToastClose` は `aria-label="通知を閉じる"`、Toast root は `focus-visible:ring-[3px] focus-visible:ring-ring`。
- `data-limited:opacity-0` により、limit 超過要素は DOM から即削除するのではなく非表示化する実装である。

### 実 DOM / accessibility tree

- viewport は `role="region"`, `aria-live="polite"`, `aria-atomic="false"`, `aria-relevant="additions text"`, `aria-label="Notifications"`。
- Toast は `role="dialog"`, `aria-modal="false"`, `tabindex="0"` で、Title / Description ID と `aria-labelledby` / `aria-describedby` が一致する。
- Toast が未展開の間、Base UI は Close を `aria-hidden="true"` にする。Toast を keyboard-focus すると `data-expanded` になり、Close は `aria-hidden="false"` となって accessible tree に「通知を閉じる」として現れる。
- 背景には 4 button、textbox「背景入力」、status「Action実行」があり、Toast 表示中も tree から隠されない。

### スキーマ・型

- API / OpenAPI スキーマは UI 単体プレビューのため対象外。
- props / manager 入力として timeout、limit、title、description、type、actionProps を実装から列挙し、プレビューが露出する値を実行した。

## テストケースと結果

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | 固定実装・branch・開始時 clean | コード・環境 | 前提検証 | High | ✅実測確認 | 1/1 | `git` 生出力 | `git branch --show-current`; `git rev-parse HEAD`; `git rev-parse --verify '<structured field>^{commit}'`; `git status --short`; staged / unstaged diff |
| 2 | port 空→明示 server 起動→両 URL 200 | 環境・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | PID 81208、各 HTTP 200、page URL 一致 | `lsof -nP -iTCP:3013 -sTCP:LISTEN`; `npm run preview -- --host 127.0.0.1 --port 3013`; `curl`; Playwright `goto` |
| 3 | hydration / 初期 Toast 0 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | preview=1, viewport=1, Toast=0 | 各 route を reload(networkidle)、selector 待機、500ms 後 count |
| 4 | 通常追加の live notification / dialog | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | region polite、dialog、Title / Description と ID 対応 | `[data-slot="toast-add"]` click 後に DOM / ARIA 取得 |
| 5 | 背景を modal 化しない | コード・画面 | 異常操作 | High | ✅実測確認 | 2/2 | body / preview inert=false、aria-hidden=null、input blocked ancestor=false | Toast 表示中に各属性と ancestor を取得 |
| 6 | Toast 中の背景 input 到達 | 画面 | ユースケース | High | ✅実測確認 | 2/2 | input active=true、値「通知表示中も入力到達済み」、Toast=1 | timeout 0 Toast 表示中に input を `fill` し activeElement / value を取得 |
| 7 | 既定 1800ms 自動消滅 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | 1600ms: present/ending=false、1900ms: present/ending=true、DOM除去 Light 2316ms / Dark 2315ms | click 時刻から 1600 / 1900ms を計測し、count=0 まで待機 |
| 8 | hover 1200ms超の pause | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | Light 2322ms / Dark 2321ms hover 保持後も present/ending=false | hover Toast を追加し root へ pointer を置き、1500ms以上待機して DOM 取得 |
| 9 | hover 解除後に消滅 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 解除後 Light 888ms / Dark 885ms で DOM=0 | pointer を (10,300) へ移し count=0 まで計測 |
| 10 | Action count + close | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | `Action実行: 0回`→`1回`、Toast 1→0 | Action付き通知→「元に戻す」click→state / DOM取得 |
| 11 | Close accessible name + close | コード・画面 | a11y / 状態遷移 | High | ✅実測確認 | 2/2 | focus後 expanded=true、Close aria-hidden=false/name一致、click後 Toast=0 | Action付き通知→keyboard modality→Toast focus→`getByRole('button',{name:'通知を閉じる'})` click |
| 12 | 4件の DOM 順序 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | DOM順 `通知 4, 3, 2, 1`、toastIndex `0,1,2,3` | 「複数通知」click→150ms後に全 root の DOM 順と style property 取得 |
| 13 | Base UI limit=3 / data-limited | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | total=4、visible=3、limited=1。`通知 1` のみ data-limited=true / opacity=0 | 同上、属性と computed opacity を取得 |
| 14 | focus 表示が非透明 | コード・画面・token | 境界値 | Medium | ✅実測確認 | 2/2 | focusVisible=true、`oklch(0.556 0 0)` の 3px box-shadow、border 同色 | keyboard modality 後、frontmost `通知 4` を focus して computed style |
| 15 | Light token / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | token 生値、Light JPEG目視 | Light route で custom properties / body computed color、JPEG取得 |
| 16 | Dark token / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | token 生値、Dark JPEG目視 | Dark route で同手順 |
| 17 | console / warning / pageerror 0 | 画面 | エラー推測 | High | ✅実測確認 | 2/2 | Light 0/0/0、Dark 0/0/0 | reload 前に listener 登録し、全操作終了後に配列取得 |
| 18 | JPEG 実体 | 画面・環境 | 偽成功対策 | Medium | ✅実測確認 | 2/2 | JFIF magic、1200×862、format jpeg、SHA-256 | 直接取得後に `file`; `xxd`; `sips`; `stat`; `shasum` |

## 実測詳細

### 通常 Toast / live notification

Light / Dark とも以下で一致した。

- Toast count: 1
- Toast: `role=dialog`, `aria-modal=false`, `tabindex=0`
- Title: 「通知を追加しました」
- Description: 「通常の自動消滅を確認します。」
- Title / Description の実 IDは Toast の `aria-labelledby` / `aria-describedby` と一致
- viewport: `role=region`, `aria-live=polite`, `aria-atomic=false`, `aria-relevant="additions text"`, `aria-label=Notifications`
- Toast 表示中も body / preview は inert でなく aria-hidden もなし

### timeout 状態遷移

```text
通常追加
  -> 1600ms: Toast 1 / data-ending-style=false
  -> 1900ms: Toast 1 / data-ending-style=true
  -> 約2315ms: transition完了後に Toast 0

hover用追加
  -> pointer hoverを約2321ms保持: Toast 1 / data-ending-style=false
  -> pointer解除
  -> 約886ms後: Toast 0
```

1800ms は DOM 即時削除時刻ではなく終了遷移の開始境界として実測された。Root の CSS に 500ms transition があり、DOM 除去は約2.315秒だった。HTTP 200 や表示文字だけでなく、`data-ending-style` と最終 DOM count 0 の両方で判定した。

### 複数4件 / limit=3

Light / Dark とも同じだった。

| DOM index | Title | `--toast-index` | `data-limited` | computed opacity | 判定 |
|---:|---|---:|---|---:|---|
| 0 | 通知 4 | 0 | false | 1 | visible / frontmost |
| 1 | 通知 3 | 1 | false | 1 | visible |
| 2 | 通知 2 | 2 | false | 1 | visible |
| 3 | 通知 1 | 3 | true | 0 | DOMに残るが非表示 |

したがって `limit=3` の実挙動は「DOMを3件に切る」ではなく、「4件を newest-first で DOM に保持し、最古の1件へ `data-limited` を付けて opacity 0 にし、視覚表示を3件に制限する」だった。JPEG では通知 2・3・4 の3件を確認できる。

### Theme token

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
| `/private/tmp/2026-08-02-toast-preview-light.jpg` | Light UI、背景 input の変更値、Action count 1、右下に通知2/3/4、通知4のfocus ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 33769 | `4395144bfd0c6f277e89d5ab75e853667f33f314275045ae214151b6b6281420` |
| `/private/tmp/2026-08-02-toast-preview-dark.jpg` | Dark UI、同じ状態と3件表示、通知4のfocus ring | JPEG JFIF 1.01 / `ff d8 ff e0 00 10 4a 46` | 1200×862 | 32353 | `acbe84196e01365c5c39614dac813594a6674d89de1b7e8c020d3a5c3e580f2e` |

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: `ToastIcon` の success / warning / info は到達した。error / loading / iconなし分岐、swipe の4方向は本プレビューに導線がなく未到達。
- 画面から入力できるがコードで検証していない値: 背景 input は Toast データ入力ではなく、非modal到達性の probe。値は controlled validation を持たず、検証漏れではない。
- スキーマにあるがコードで扱っていないパラメータ: API スキーマなし。Base UI の全 props は公開プレビュー対象外。
- コードと実 DOM の重要な一致: limit は Root 数を削らず `data-limited:opacity-0` で視覚数を制限する。DOM4 / visible3 という実測は実装 class と一致した。
- a11y tree と DOM の重要な一致: Close は未展開時に Base UI が一時的に `aria-hidden=true` とするが、keyboard focusで Toast を展開すると `aria-hidden=false` になり accessible name で操作できた。

## 未到達分岐（網羅の穴・機械的な証拠）

- Toast type `error`, `loading`, type未指定
- swipe direction `up`, `down`, `left`, `right`
- viewport の pointer expanded 配置と swipe threshold の境界
- window blur / focus による timer pause
- 5件以上の limit 超過連鎖

指定 rubric の High リスク分岐はすべてケースから到達した。上記はこのプレビューが操作導線を持たないか、今回指定外の分岐である。

## 発見した不具合

- なし。指定 rubric は Light / Dark とも実測で合格した。

## 検証 harness の再実行記録

- 最初の Light 一括計測は検証スクリプト側で Node context に存在しない `performance` を参照し、対象操作の開始前に停止したため全結果を破棄した。`Date.now()` に直し reload から再実行した結果だけを本レポートに採用した。
- 次の探索実行では、未展開時 `aria-hidden=true` の Close を accessible-role で直接探して timeout した。Base UI ソースと実 DOM から focus 時に公開されることを確認し、reload から「keyboard modality→Toast focus→Close aria-hidden=false→accessible-role click」の正しい経路で再実行した。本レポートの合格判定はこの再実行結果だけを使用した。

## 未列挙・未検証の残（正直な限界）

- VoiceOver 等の実スクリーンリーダー読み上げは未実行。accessibility tree / live region / accessible name までを検証した。
- Chrome 150 以外、狭幅、RTL、zoom、reduced motion は未実行。
- 自動消滅の時刻はブラウザイベントループと transition を含む実測値であり、ミリ秒単位の固定値を保証しない。境界前・境界後・DOM除去の状態で判定した。
- Toast manager の内部 queue 状態は直接読まず、公開 DOM 属性と画面描画で判定した。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git branch --show-current
git rev-parse HEAD
git status --short
lsof -nP -iTCP:3013 -sTCP:LISTEN
npm run preview -- --host 127.0.0.1 --port 3013
```

Playwright で各 URL を開き、次の操作を theme ごとに reload から実行する。

1. network idle と `[data-slot="toast-preview"]` を待ち、初期 root / input 属性 / token を取得する。
2. 「通知を追加」click。直後、1600ms、1900ms、DOM count 0 の各時点を記録する。
3. 「ホバー検証通知」click。Toast root を hover して1200ms超待ち、残存を確認する。pointerを外して count 0 まで待つ。
4. 「Action付き通知」click。背景 input を変更して到達性を確認後、「元に戻す」を click。Action countとToast countを確認する。
5. もう一度「Action付き通知」click。keyboard modalityでToastへfocusし、Closeが accessibility treeへ公開された後、「通知を閉じる」を clickする。
6. 「複数通知」click。150ms後に全 `[data-slot="toast"]` のDOM順、`--toast-index`、`data-limited`、computed opacityを取得する。
7. `通知 4` rootへkeyboard focusし、`:focus-visible` と box-shadow / border colorを取得してJPEGを撮る。
8. 全期間の console error / warning / pageerror を収集する。

JPEG 検証:

```bash
file /private/tmp/2026-08-02-toast-preview-light.jpg /private/tmp/2026-08-02-toast-preview-dark.jpg
xxd -l 16 /private/tmp/2026-08-02-toast-preview-light.jpg
xxd -l 16 /private/tmp/2026-08-02-toast-preview-dark.jpg
sips -g pixelWidth -g pixelHeight -g format /private/tmp/2026-08-02-toast-preview-light.jpg /private/tmp/2026-08-02-toast-preview-dark.jpg
stat -f '%N %z bytes' /private/tmp/2026-08-02-toast-preview-light.jpg /private/tmp/2026-08-02-toast-preview-dark.jpg
shasum -a 256 /private/tmp/2026-08-02-toast-preview-light.jpg /private/tmp/2026-08-02-toast-preview-dark.jpg
```

## クリーンアップ

- 永続データ・外部送信・repo内ファイル作成なし。
- Astro preview server を Ctrl-C で停止した。
- 停止後、3013 番 LISTEN なし、HEAD 不変、tracked / untracked / staged / unstaged すべて clean を最終ゲートで確認する。

## 申し送り候補

- `.docs/actions/` 登録候補: なし。
- brain 記録候補: Base UI Toast の Close は未展開時に `aria-hidden=true`、Toast keyboard focus後に公開されるため、accessible-role検証は正しいフォーカス導線を通して行う。
