# Sheet プレビュー動作検証レポート

- 判定: **PASS**
verified_impl_sha: 72aecb060b3422e3efab437e9e754225eaf1ce10
- 検証日時: 2026-08-02（Asia/Tokyo）
- 対象: `elchika-inc/ui` の Sheet プレビュー
- URL: Light `http://127.0.0.1:3013/preview/sheet/` / Dark `http://127.0.0.1:3013/preview/sheet-dark/`
- 実行可否: ✅ Light / Dark とも実ブラウザで実行

## 実行環境（再現性の前提）

| 項目 | 実測値 |
|---|---|
| OS | macOS 26.3.1（Build 25D2128） |
| Node.js | v26.4.0 |
| npm | 11.17.0 |
| ブラウザ | Chrome 150.0.0.0（Playwright MCP） |
| viewport | 1200 × 862 CSS px |
| 言語 | `ja` |
| サーバー | Astro 7.1.6、`127.0.0.1:3013` |
| 起動前ポート | LISTEN なし |
| 起動中ポート | node PID 38878 が `127.0.0.1:3013` を LISTEN |
| 対象状態 | 検証前に `git status --short`、`git diff --exit-code`、`git diff --cached --exit-code` がすべて空 / exit 0 |

## 成功基準（rubric・実行前に固定）

1. 固定対象であること: `git rev-parse HEAD` が Verified SHA と一致し、検証中にリポジトリ差分を作らない。
2. 起動の実体: 3013 番ポートが事前に空で、明示起動したサーバーだけが LISTEN し、Light / Dark の最終 URL が指定 URL と完全一致する。
3. hydration / 初期状態: reload 完了後、`astro-island` と `[data-slot="sheet-content"]` が各 1 個で、`defaultOpen` により Sheet が開いている。
4. dialog 意味論: `role="dialog"`、Title / Description の ID と `aria-labelledby` / `aria-describedby` が一致する。`aria-modal` は存在を仮定せず実測する。
5. 配置: `data-side="right"`、fixed、right/top/bottom が 0、右端密着・全高である。
6. modal 構造: content / backdrop がプレビュー island 外へ Portal され、backdrop が viewport 全面を覆い、背景操作要素が modal 中は accessibility tree から隠される。
7. focus: 初期フォーカスが Sheet 内、Tab / Shift+Tab が Sheet 内の操作要素間で循環し、前後の sentinel に漏れない。
8. close / reopen: Escape、Backdrop の実ポインター、footer Close、右上 Close の各経路で content が DOM から消え、毎回 trigger にフォーカスが戻る。trigger から再度開ける。
9. focus ring: keyboard close 後の trigger に不透明な 3px ring が現れる。
10. theme: Light / Dark で背景・前景・popover・muted・ring・border token が期待どおり切り替わる。
11. ランタイム健全性: 各 theme の console error / warning / pageerror が 0。
12. 証跡: JPEG をブラウザから直接生成し、拡張子だけでなく `file`、JFIF magic、画像寸法で JPEG 実体を確認する。
13. 後始末: サーバー停止後に 3013 番ポートが空で、HEAD が不変、tracked / untracked を含むリポジトリ状態が clean である。

## 一次情報からの動作パターン導出

### 実装コード

- `SheetContent` は Base UI Dialog の `Portal` 配下に `SheetOverlay` と `DialogPrimitive.Popup` を描画する。
- `side` の既定値は `right`。`right` 分岐は `right-0 inset-y-0 h-full w-3/4 sm:max-w-sm`。
- Popup 内には children と絶対配置の右上 `SheetClose` があり、プレビュー children の footer にも `SheetClose` がある。
- プレビューは `Sheet defaultOpen`、trigger、Title、Description、前後の操作要素を持つ。

### 実 DOM / accessibility tree

- `dialog "表示設定"`、level 2 heading、説明 paragraph、同名の Close button 2 個を列挙した。
- Close の DOM index / 座標を測定し、index 0 = footer（x=833, y=814, 351×32）、index 1 = 右上（x=1160, y=12, 28×28）と識別した。
- 背景側には「前の操作要素」「設定を開く」「次の操作要素」がある。

### 属性・token

- `data-slot`、`data-side`、ARIA 関連付け、computed style、CSS custom properties を列挙した。
- OpenAPI 等の API スキーマは UI 単体コンポーネントのため対象外。

## テストケースと結果

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | 固定 SHA・開始時 clean | コード | 前提検証 | High | ✅実測確認 | 1/1 | `git` 生出力 | `git rev-parse HEAD`; `git status --short`; `git diff --exit-code`; `git diff --cached --exit-code` |
| 2 | 空ポートから明示 server 起動 | 実環境 | 状態遷移 | High | ✅実測確認 | 1/1 | PID 38878 / LISTEN 実体 | `lsof -nP -iTCP:3013 -sTCP:LISTEN`; `npm run preview -- --host 127.0.0.1 --port 3013`; 同じ `lsof` を再実行 |
| 3 | Light / Dark URL 到達 | 画面 | 同値分割 | High | ✅実測確認 | 2/2 | HTTP 200 と `page.url()` 完全一致 | `curl -I` で各 URL; Playwright `goto`; `location.href` 取得 |
| 4 | hydration 後 defaultOpen / 一意 content | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 両 theme で island=1, content=1, overlay=1 | `reload({waitUntil:'networkidle'})`; 600ms 待機; DOM count |
| 5 | Title / Description / dialog 関連付け | コード・画面 | 属性検証 | High | ✅実測確認 | 2/2 | accessibility snapshot と DOM 属性 | `role`, `aria-labelledby`, `aria-describedby`, 対応 ID / text を取得 |
| 6 | `aria-modal` を仮定せず観測 | 画面 | 属性検証 | Medium | ✅実測確認 | 2/2 | Light / Dark とも属性値 `null` | `getAttribute('aria-modal')`。属性なしを観測値として記録し、他の modal 挙動は別ケースで実証 |
| 7 | right 配置・全高 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | rect = left 816, right 1200, top 0, bottom 862, 384×862 | computed style と `getBoundingClientRect()` |
| 8 | Portal / Backdrop | コード・画面 | 構造検証 | High | ✅実測確認 | 2/2 | content / overlay は island 外、overlay = viewport 全面 | DOM contains、overlay computed style / rect |
| 9 | 背景 modal 抑止 | 画面 | 異常操作防止 | High | ✅実測確認 | 2/2 | 背景 `ASTRO-ISLAND aria-hidden="true"`、3操作要素すべてその配下 | 背景 button ごとに `[inert],[aria-hidden="true"]` ancestor を探索 |
| 10 | 初期 focus と Tab 正方向循環 | 画面 | 0-switch / 1-switch | High | ✅実測確認 | 2/2 | footer Close → 右上 Close → footer Close、全て content 内 | focus を記録; `Tab`; 80ms 待機を2回 |
| 11 | Shift+Tab 逆方向循環 | 画面 | 1-switch | High | ✅実測確認 | 2/2 | footer ↔ 右上のみ、sentinel 到達なし | `Shift+Tab`; 80ms 待機を2回 |
| 12 | Escape close / focus return | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | content=0, overlay=0, trigger focused, expanded=false | `Escape`; 500ms 待機; DOM / activeElement 取得 |
| 13 | keyboard trigger reopen | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | content=1, overlay=1, Sheet 内 focus, expanded=true | Escape 後に `Enter`; 500ms 待機 |
| 14 | Backdrop 実ポインター close | コード・画面 | 異常系 | High | ✅実測確認 | 2/2 | (10,10) click 後 content=0、trigger focus return | 開状態で `page.mouse.click(10,10)`; 500ms 待機 |
| 15 | footer Close | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | DOM index 0 click 後 content=0、trigger focus return | trigger reopen; `[data-slot="sheet-close"]` index 0 click; 500ms 待機 |
| 16 | 右上 Close | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | DOM index 1 click 後 content=0、trigger focus return | trigger reopen; `[data-slot="sheet-close"]` index 1 click; 500ms 待機 |
| 17 | 閉状態で content 不在 | コード・画面 | 状態遷移 | High | ✅実測確認 | 8/8 | 各 theme × 4 close 経路で content=0 / overlay=0 | 各 close 後に selector count |
| 18 | trigger focus ring | 画面・token | 境界値 | Medium | ✅実測確認 | 2/2 | `:focus-visible=true`; ring token `oklch(55.6% 0 0)`; box-shadow 3px / alpha 1 | Escape 後に trigger computed style |
| 19 | Light theme token / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | Light JPEG、computed tokens | Light URL reload; token / computed color 取得; JPEG 取得 |
| 20 | Dark theme token / 描画 | 画面・token | 同値分割 | Medium | ✅実測確認 | 1/1 | Dark JPEG、computed tokens | Dark URL reload; token / computed color 取得; JPEG 取得 |
| 21 | console / pageerror | 画面 | エラー推測 | High | ✅実測確認 | 2/2 | 各 theme で error=0, warning=0, pageerror=0 | reload 前に listener 登録し、全操作後に配列を取得 |
| 22 | JPEG 実体 | 画面・実環境 | 偽成功対策 | Medium | ✅実測確認 | 2/2 | `file`, `xxd`, `sips`, SHA-256 | JPEG 直接生成後に各コマンドを独立実行 |

## Theme 別の実測値

| 観測 | Light | Dark |
|---|---|---|
| `html.class` | dark なし | `dark` |
| content background / foreground | `oklch(1 0 0)` / `oklch(.145 0 0)` | `oklch(0.205 0 0)` / `oklch(0.985 0 0)` |
| `--background` / `--foreground` | `oklch(100% 0 0)` / `oklch(14.5% 0 0)` | `oklch(14.5% 0 0)` / `oklch(98.5% 0 0)` |
| `--popover` / `--popover-foreground` | `oklch(100% 0 0)` / `oklch(14.5% 0 0)` | `oklch(20.5% 0 0)` / `oklch(98.5% 0 0)` |
| `--muted` / `--muted-foreground` | `oklch(97% 0 0)` / `oklch(54% 0 0)` | `oklch(26.9% 0 0)` / `oklch(70.8% 0 0)` |
| `--ring` | `oklch(55.6% 0 0)` | `oklch(55.6% 0 0)` |
| `--border` | `oklch(92.2% 0 0)` | `oklch(100% 0 0/.1)` |
| backdrop | fixed / inset 0 / `oklab(0 0 0 / .1)` / blur 4px | fixed / inset 0 / `oklab(0 0 0 / .1)` / blur 4px |
| console error / warning / pageerror | 0 / 0 / 0 | 0 / 0 / 0 |

## Focus・状態遷移の実測

Light / Dark とも同一結果だった。

```text
reload(defaultOpen)
  -> content 1 / overlay 1 / focus=footer Close(index 0)
  -> Tab: 右上 Close(index 1)
  -> Tab: footer Close(index 0)
  -> Shift+Tab: 右上 Close(index 1)
  -> Shift+Tab: footer Close(index 0)
  -> Escape: content 0 / overlay 0 / focus=trigger
  -> Enter: content 1 / overlay 1 / focus inside
  -> Backdrop pointer: content 0 / overlay 0 / focus=trigger
  -> trigger reopen -> footer Close: content 0 / overlay 0 / focus=trigger
  -> trigger reopen -> 右上 Close: content 0 / overlay 0 / focus=trigger
```

## JPEG evidence

| ファイル | 視覚確認 | `file` | 寸法 | bytes | magic | SHA-256 |
|---|---|---|---|---:|---|---|
| `/private/tmp/2026-08-02-sheet-preview-light.jpg` | 右側 Light Sheet、背景 blur、Title / Description / 2 Close を確認 | JPEG / JFIF 1.01 | 2400×1724 | 59610 | `ff d8 ff e0 00 10 4a 46` | `133021146b6bae98ca85b550f6cc1e862542fd389867252eb53b50f833b7ccc8` |
| `/private/tmp/2026-08-02-sheet-preview-dark.jpg` | 右側 Dark Sheet、背景 blur、Title / Description / 2 Close を確認 | JPEG / JFIF 1.01 | 1200×862 | 19964 | `ff d8 ff e0 00 10 4a 46` | `cd169aec3815d174a3cb075d6fa51bfabd08d131c96737192a6c923d242ce57f` |

Light は device scale、Dark は CSS scale で保存したためピクセル寸法は異なるが、いずれも同じ 1200×862 CSS px viewport の全画面を撮影した。拡張子だけでなく JPEG magic と画像デコーダーで実体を確認済み。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: 今回のプレビューは既定 `right` のみを露出するため、`top` / `bottom` / `left` の side 分岐は画面から到達不能。対象 rubric は既定 `right` のため不具合扱いにしない。
- 画面から入力できるがコードで検証していない値: テキスト入力はなく、該当なし。
- スキーマにあるがコードで扱っていないパラメータ: API スキーマなし。React props 全般のうちプレビュー未露出の side 値は上記の未到達分岐として記録。
- DOM と a11y の差分: `aria-modal` 属性は付与されていない。一方で背景 island の `aria-hidden=true`、focus trap、Escape / pointer dismiss、focus return はすべて実測できた。属性の存在を成功条件に後付けせず、観測事実として残す。

## 未到達分岐（網羅の穴・機械的な証拠）

- `side="top"`
- `side="bottom"`
- `side="left"`
- controlled open 状態、Close 無効化、Title / Description 欠落等、このプレビューが入力として露出しない Base UI Dialog の別構成

## 発見した不具合

- なし。High リスクの指定ケースはすべて実測で成功した。

## 未列挙・未検証の残（正直な限界）

- VoiceOver 等の実スクリーンリーダー読み上げは未実行。accessibility tree と ARIA 関連付けまでを検証した。
- Chrome 150 以外のブラウザ、狭幅 viewport、RTL、zoom、reduced motion は今回の指定範囲外。
- side の非既定 3 分岐はプレビュー導線がなく未実行。
- 視覚差分の自動 baseline 比較はなく、JPEG を人間が再確認できる形で保存した。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
git status --short
lsof -nP -iTCP:3013 -sTCP:LISTEN
npm run preview -- --host 127.0.0.1 --port 3013
```

別端末または Playwright から次を開く。

```text
http://127.0.0.1:3013/preview/sheet/
http://127.0.0.1:3013/preview/sheet-dark/
```

各ページで、reload 後の DOM / ARIA / computed style を取得し、Tab、Tab、Shift+Tab、Shift+Tab、Escape、Enter、Backdrop click、trigger reopen + footer Close、trigger reopen + 右上 Close の順で操作する。各操作後に 500ms（focus 移動のみ 80ms）待機し、content / overlay count、`document.activeElement`、trigger の `aria-expanded` を記録する。

JPEG 検証:

```bash
file /private/tmp/2026-08-02-sheet-preview-light.jpg /private/tmp/2026-08-02-sheet-preview-dark.jpg
xxd -l 16 /private/tmp/2026-08-02-sheet-preview-light.jpg
xxd -l 16 /private/tmp/2026-08-02-sheet-preview-dark.jpg
sips -g pixelWidth -g pixelHeight -g format /private/tmp/2026-08-02-sheet-preview-light.jpg /private/tmp/2026-08-02-sheet-preview-dark.jpg
shasum -a 256 /private/tmp/2026-08-02-sheet-preview-light.jpg /private/tmp/2026-08-02-sheet-preview-dark.jpg
```

## クリーンアップ

- 検証用データの作成なし。
- Astro preview server は検証完了後に停止する。
- 停止後に 3013 番ポート空、HEAD 不変、`git status --short` 空、staged / unstaged diff なしを独立確認する。

## 申し送り候補

- `.docs/actions/` 登録候補: なし。
- brain 記録候補: 同名 Close を index だけで命名せず、座標・class・ソース順で footer / 右上を確定してから証跡化する。
