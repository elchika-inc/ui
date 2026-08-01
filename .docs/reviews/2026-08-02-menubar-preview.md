# 動作検証レポート: Menubar Preview 修正後再検証

verified_impl_sha: cde2b2455994670d1f5434b917779748e1e6445f

## 結論

**総合判定: ✅ PASS**

前回不具合だった `MenubarCheckboxItem` と、今回previewへ追加された `MenubarRadioItem` のキーボードフォーカスを、Light / Darkで最初から再検証した。

両コンポーネントとも以下を確認した。

- 対象要素自身が `activeElement`
- `data-highlighted=true`
- `:focus-visible=true`
- 正しいroleと`aria-checked`
- 通常時の透明背景からテーマのaccent背景へ変化
- ring層が不透明な `oklch(0.556 0 0)`、幅 `3px`

通常item、submenu、フォーカス復帰、非モーダル性、catalogでのoverlay抑止、テーマトークン、consoleも、以前の結果を流用せず再実測した。

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 07:38:11 JST
- 対象URL:
  - `http://127.0.0.1:3013/preview/menubar/`
  - `http://127.0.0.1:3013/preview/menubar-dark/`
  - `http://127.0.0.1:3013/catalog`
  - `http://127.0.0.1:3013/catalog-dark`
- OS: macOS 26.3.1 Build 25D2128、Darwin 25.3.0 arm64
- Node.js: v26.4.0
- ブラウザ: Google Chrome 150.0.7871.187
- 実行可否: ✅ 実ブラウザで全対象を実行
- 最終検証コマンド終了コード: `0`
- リポジトリ状態:
  - `git diff --exit-code`: 差分なし
  - `git diff --cached --exit-code`: 差分なし
  - `git status --short`: 出力なし
- リポジトリ内ファイルは変更していない。指定されたJPEG 2件だけを上書きした。

## 成功基準（rubric・実行前に定義）

- 4ページが一意にhydrationされ、`document.readyState="complete"`になる。
- isolated previewでは`defaultOpen`によりFileメニューが開く。
- menu contentはpreviewコンテナ外へPortalされる。
- Menubar、trigger、menu、通常item、checkbox、radio group、radio item、separator、submenuに適切なrole、ARIA、状態属性が付く。
- Arrow、Enter、Escape、Tabによる移動、選択、開閉、フォーカス復帰が成立する。
- submenuの項目間移動と段階的なEscapeが成立する。
- menuが開いても前後sentinelが`inert`または`aria-hidden`にならず、非モーダルである。
- catalogではsentinelとopen overlayが生成されず、triggerは閉状態になる。
- Light / Darkの背景、前景、popover、accent、ring、borderがテーマトークンに従う。
- trigger、通常item、checkbox、radio item、submenu trigger、submenu itemのキーボードフォーカスに、不透明な3px ringが表示される。
- isolated Menubarでconsole errorまたはpage exceptionが発生しない。
- JPEGをブラウザから直接取得し、形式、magic bytes、寸法、ハッシュを確認できる。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | isolated Lightのhydration | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | 実DOM | Light URLを開き500ms待機 |
| 2 | isolated Darkのhydration | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | 実DOM | Dark URLを開き500ms待機 |
| 3 | `defaultOpen`によるFile menu初期展開 | コード・画面 | 条件分岐 | High | ✅実測確認 | 2/2 | DOM・ARIA | 各isolated URLを再読込 |
| 4 | menu contentのPortal配置 | コード・画面 | 構造検証 | High | ✅実測確認 | 2/2 | 実DOM | contentがpreviewの子孫か確認 |
| 5 | menubar / trigger / menuのrole・ARIA | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | 実DOM | 初期DOMの属性を列挙 |
| 6 | checkbox / radio group / radio itemのrole・ARIA | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | 実DOM | File menu内の全roleを列挙 |
| 7 | ArrowDown / ArrowUpによる通常item移動 | コード・画面 | 1-switch状態遷移 | High | ✅実測確認 | 2/2 | activeElement | Down、Down、Up |
| 8 | 通常itemの3px focus ring | コード・画面 | 視覚・境界値 | High | ✅実測確認 | 2/2 | computed style | `新規作成`をkeyboard-active化 |
| 9 | Enter後のFile triggerへのフォーカス復帰 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | activeElement・ARIA | `新規作成`でEnter |
| 10 | CheckboxItemの通常状態 | コード・画面 | 状態分割 | High | ✅実測確認 | 2/2 | computed style | 初期menuで`自動保存`を測定 |
| 11 | CheckboxItemのactive状態と3px ring | コード・画面 | 回帰・視覚 | High | ✅実測確認 | Light 2/2、Dark 2/2 | JPEG・computed style | 初期menuからArrowDown×3 |
| 12 | Personal RadioItemのactive状態と3px ring | コード・画面 | 回帰・視覚 | High | ✅実測確認 | Light 2/2、Dark 2/2 | computed style | 初期menuからArrowDown×4 |
| 13 | Team RadioItemのactive状態と3px ring | コード・画面 | 回帰・視覚 | High | ✅実測確認 | Light 1/1、Dark 1/1 | computed style | 初期menuからArrowDown×5 |
| 14 | RadioItemの選択状態遷移 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 実DOM・ARIA | `個人用`でEnter |
| 15 | submenu triggerへの移動とring | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | computed style | 初期menuからArrowDown×6 |
| 16 | ArrowRightでsubmenuを開く | コード・画面 | 1-switch状態遷移 | High | ✅実測確認 | 2/2 | activeElement・ARIA | `共有`でArrowRight |
| 17 | submenu内のDown / Up移動 | コード・画面 | 1-switch状態遷移 | Medium | ✅実測確認 | 2/2 | activeElement | Down、Up |
| 18 | Escapeによるsubmenu→mainの段階的閉鎖 | コード・画面 | 1-switch状態遷移 | High | ✅実測確認 | 2/2 | activeElement・DOM | Escapeごとに250ms待機 |
| 19 | 閉状態でArrowRightによりEdit triggerへ移動 | コード・画面 | 状態遷移 | Medium | ✅実測確認 | 2/2 | tabIndex・activeElement | File triggerでArrowRight |
| 20 | Edit menuのEnter / Down / Escape | コード・画面 | シナリオ | High | ✅実測確認 | 2/2 | activeElement・ARIA | Enter、Down、Escape |
| 21 | triggerの3px focus ring | コード・画面 | 視覚・境界値 | High | ✅実測確認 | 2/2 | computed style | Edit menuをEscapeで閉じる |
| 22 | Tabで後方sentinelへ移動 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | activeElement | 閉じたEdit triggerからTab |
| 23 | open中および閉鎖後の非モーダル性 | コード・画面 | 異常抑止 | High | ✅実測確認 | 2/2 | DOM | body・sentinel・祖先属性を確認 |
| 24 | catalog Lightのoverlay抑止 | コード・画面 | 条件分岐 | High | ✅実測確認 | 1/1 | 実DOM | catalogを開き600ms待機 |
| 25 | catalog Darkのoverlay抑止 | コード・画面 | 条件分岐 | High | ✅実測確認 | 1/1 | 実DOM | catalog-darkを開き600ms待機 |
| 26 | Lightテーマトークン適用 | コード・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | computed style | root、body、content、active itemを測定 |
| 27 | Darkテーマトークン適用 | コード・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | computed style | 同上 |
| 28 | isolated console / page exception | 画面 | 異常系 | High | ✅実測確認 | 2/2 | browser console | 各isolatedページを新規ロード |
| 29 | catalog consoleのscope判定 | コード・画面 | クロスチェック | Medium | ✅実測確認 | 2/2 | browser console・source | error URLと参照元を突合 |
| 30 | JPEGの直接取得と形式検証 | 画面 | 出力検証 | High | ✅実測確認 | 2/2 | JPEGファイル | Playwright screenshot後にmagic・寸法・SHA検査 |

## 初期DOM・ARIA実測

### Menubar

- `[data-slot="menubar-preview"]`: 1件
- `[data-slot="menubar"]`:
  - tag: `DIV`
  - role: `menubar`
  - `tabindex="-1"`

### Trigger

File:

- tag: `BUTTON`
- role: `menuitem`
- `aria-haspopup="menu"`
- `aria-expanded="true"`
- `aria-controls`あり
- `tabindex="0"`

Edit:

- tag: `BUTTON`
- role: `menuitem`
- `aria-haspopup="menu"`
- `aria-expanded="false"`
- 閉状態では`aria-controls`なし
- `tabindex="-1"`

### Portal content

- tag: `DIV`
- role: `menu`
- `data-slot="menubar-content"`
- `data-open`
- `data-side="bottom"`
- `tabindex="-1"`
- 初期activeElement
- previewコンテナの子孫ではない
- `DIV.isolate.z-50.outline-none`配下に配置

`MenubarPortal`とmenu rootは非描画コンポーネントであるため、それ自体の`data-slot`要素がDOMに出ないことは異常と判定していない。

### Menu内要素

- `新規作成`: `role="menuitem"`
- `開く`: `role="menuitem"`
- separator: `role="separator"`
- `自動保存`:
  - `role="menuitemcheckbox"`
  - `aria-checked="true"`
- radio group:
  - `role="group"`
- `個人用`:
  - `role="menuitemradio"`
  - 初期`aria-checked="false"`
- `チーム用`:
  - `role="menuitemradio"`
  - 初期`aria-checked="true"`
- `共有`:
  - `role="menuitem"`
  - `aria-haspopup="menu"`
  - 初期`aria-expanded="false"`

## CheckboxItem修正の個別実測

### 通常状態

Light / Dark共通:

- activeElement: false
- `data-highlighted`: false
- `:focus-visible`: false
- background: `rgba(0, 0, 0, 0)`
- box-shadow: `none`
- role: `menuitemcheckbox`
- `aria-checked="true"`

### Light active状態

- activeElement: true
- `data-highlighted`: true
- `:focus-visible`: true
- role: `menuitemcheckbox`
- `aria-checked="true"`
- background: `oklch(0.97 0 0)`
- color: `oklch(0.205 0 0)`
- ring層: `oklch(0.556 0 0) 0px 0px 0px 3px`
- ring層にalpha指定なし
- 再現率: `2/2`

### Dark active状態

- activeElement: true
- `data-highlighted`: true
- `:focus-visible`: true
- role: `menuitemcheckbox`
- `aria-checked="true"`
- background: `oklch(0.269 0 0)`
- color: `oklch(0.985 0 0)`
- ring層: `oklch(0.556 0 0) 0px 0px 0px 3px`
- ring層にalpha指定なし
- 再現率: `2/2`

JPEGでも`自動保存`の周囲に3px ringが表示されることを目視確認した。

## RadioItemの個別実測

### 通常状態

`個人用`と`チーム用`はLight / Darkとも以下だった。

- activeElement: false
- `data-highlighted`: false
- `:focus-visible`: false
- background: `rgba(0, 0, 0, 0)`
- box-shadow: `none`
- role: `menuitemradio`

初期ARIA:

- `個人用`: `aria-checked="false"`
- `チーム用`: `aria-checked="true"`

### Light active状態

`個人用`と`チーム用`を個別にkeyboard-active化し、双方で以下を確認した。

- activeElement: true
- `data-highlighted`: true
- `:focus-visible`: true
- role: `menuitemradio`
- background: `oklch(0.97 0 0)`
- color: `oklch(0.205 0 0)`
- ring層: `oklch(0.556 0 0) 0px 0px 0px 3px`
- ring層にalpha指定なし

### Dark active状態

`個人用`と`チーム用`を個別にkeyboard-active化し、双方で以下を確認した。

- activeElement: true
- `data-highlighted`: true
- `:focus-visible`: true
- role: `menuitemradio`
- background: `oklch(0.269 0 0)`
- color: `oklch(0.985 0 0)`
- ring層: `oklch(0.556 0 0) 0px 0px 0px 3px`
- ring層にalpha指定なし

### 選択状態遷移

`個人用`がactiveの状態でEnterを押した結果:

- `個人用`: `aria-checked="false"` → `"true"`
- `チーム用`: `aria-checked="true"` → `"false"`
- activeElementは`個人用`
- File menuは開状態を維持

Light / Darkで同じ遷移を確認した。

## キーボード操作の実測タイムライン

### 通常item

1. 初期activeElementはmenu content
2. `ArrowDown` → `新規作成`
3. `ArrowDown` → `開く`
4. `ArrowUp` → `新規作成`
5. `Enter`
6. menuが閉じ、File triggerへフォーカス復帰
7. File triggerの`aria-expanded="false"`
8. content件数0

### Submenu

1. 初期menuから`ArrowDown`×6 → `共有`
2. `ArrowRight`
3. submenuが開き、`リンクをコピー`がactive
4. `ArrowDown` → `共同編集者を招待`
5. `ArrowUp` → `リンクをコピー`
6. `Escape`後250ms待機
7. submenu件数0、`共有`へフォーカス復帰
8. 再度`Escape`後250ms待機
9. main content件数0、File triggerへフォーカス復帰

アニメーション中の中間DOMを最終状態と誤認しないよう、閉鎖判定は各Escape後250ms待機して行った。

### 隣接メニュー

1. 閉状態のFile triggerで`ArrowRight`
2. Edit triggerがactive、`tabindex="0"`
3. File triggerは`tabindex="-1"`
4. Edit triggerで`Enter`
5. Edit menuが開き、`元に戻す`がactive
6. `ArrowDown` → `やり直す`
7. `Escape`後250ms待機
8. Edit triggerへフォーカス復帰
9. Edit triggerの`aria-expanded="false"`
10. content件数0

### Tabと非モーダル性

Edit triggerへフォーカス復帰後に`Tab`を押すと、後方sentinel「次の操作要素」へ移動した。

sentinel:

- `tabindex="0"`
- `inert`なし
- `aria-hidden`なし
- `inert`または`aria-hidden="true"`を持つ祖先なし

`body`にも`inert`および`aria-hidden`はなかった。

## 通常item・submenu・triggerのring

Light / Darkとも、次の各要素でkeyboard focus時に同じ不透明3px ringを確認した。

- Menubar trigger
- 通常Menubar item
- submenu trigger
- submenu item

ring層:

`oklch(0.556 0 0) 0px 0px 0px 3px`

通常itemとsubmenu itemのactive背景:

- Light: `oklch(0.97 0 0)`
- Dark: `oklch(0.269 0 0)`

## Catalog抑止

Light / Darkとも以下を確認した。

- verification catalog: 1件
- Menubar preview: 1件
- Menubar: 1件
- local sentinel: 0件
- global sentinel: 0件
- local Menubar content: 0件
- global Menubar content: 0件
- open overlay: 0件
- File / Edit trigger: `aria-expanded="false"`
- closed triggerに`aria-controls`なし
- `body`に`inert`・`aria-hidden`なし

## テーマ実測

### Light

- `--background`: `oklch(100% 0 0)`
- `--foreground`: `oklch(14.5% 0 0)`
- `--popover`: `oklch(100% 0 0)`
- `--popover-foreground`: `oklch(14.5% 0 0)`
- `--accent`: `oklch(97% 0 0)`
- `--accent-foreground`: `oklch(20.5% 0 0)`
- `--muted`: `oklch(97% 0 0)`
- `--ring`: `oklch(55.6% 0 0)`
- `--border`: `oklch(92.2% 0 0)`
- body背景: `oklch(1 0 0)`
- body前景: `oklch(0.145 0 0)`
- content背景: `oklch(1 0 0)`
- content前景: `oklch(0.145 0 0)`

### Dark

- `--background`: `oklch(14.5% 0 0)`
- `--foreground`: `oklch(98.5% 0 0)`
- `--popover`: `oklch(20.5% 0 0)`
- `--popover-foreground`: `oklch(98.5% 0 0)`
- `--accent`: `oklch(26.9% 0 0)`
- `--accent-foreground`: `oklch(98.5% 0 0)`
- `--muted`: `oklch(26.9% 0 0)`
- `--ring`: `oklch(55.6% 0 0)`
- `--border`: `oklch(100% 0 0/.1)`
- body背景: `oklch(0.145 0 0)`
- body前景: `oklch(0.985 0 0)`
- content背景: `oklch(0.205 0 0)`
- content前景: `oklch(0.985 0 0)`

## Console・page exception

### isolated Menubar

Light / Darkとも:

- console errors: 0
- console warnings: 0
- page exception: 観測なし

### catalog

Light / Darkとも、次のresource errorを1件観測した。

`GET /avatar-missing.png` → `404 Not Found`

これは`src/previews/avatar.tsx`がAvatar fallbackを到達させるために明示的に指定している入力であり、Menubar由来のconsole errorまたはpage exceptionではない。参照元コードとURLを突合したうえで、Menubarの合否から除外した。エラー自体は隠蔽せず、本節に記録する。

## 三方向導出のクロスチェック結果

### コードにあり画面から到達できた分岐

- `defaultOpen`
- 通常item
- checkbox item
- radio group / radio item
- submenu trigger / submenu content
- File / Editの隣接menu
- isolated / catalog
- Light / Dark

### コードにあるが今回の画面から到達できない分岐

- `MenubarGroup`
- `MenubarLabel`
- `inset=true`
- destructive variant
- disabled item
- alternate align / alignOffset / sideOffset
- bottom以外のside
- controlled open state
- RTL

### 画面から入力できるがコードで検証していない値

自由入力フィールドはなく、該当なし。

pointer hover / clickとtypeaheadは操作可能だが、今回のキーボード中心rubricでは未実行として残した。

### スキーマにあるがコードで扱っていないパラメータ

API/OpenAPIスキーマを持つ対象ではないため該当なし。React propsの未到達値は上記へ列挙した。

## 未到達分岐（網羅の穴・機械的な証拠）

- group / label
- inset
- destructive
- disabled
- alternate placement / offsets
- controlled state
- RTL
- pointer hover / click
- typeahead

## 発見した不具合

なし。

前回のCheckboxItem focus ring欠落は、同じ再現手順によりLight / Dark各2回実行し、今回は3pxの不透明ringを実測した。

## JPEG evidence

### 取得方法

Playwrightの実ブラウザページに対して次の形式で直接取得した。

```js
await page.screenshot({
  path: "/private/tmp/menubar-preview-<theme>.jpg",
  type: "jpeg",
  quality: 90,
  fullPage: false,
});
```

PNG等からの後変換ではなく、ブラウザの`type: "jpeg"`出力を直接保存した。取得時のactiveElementはLight / Darkとも`自動保存`で、`:focus-visible=true`だった。

### Light

- パス: `/private/tmp/menubar-preview-light.jpg`
- サイズ: 58,185 bytes
- 寸法: 2400 × 1612
- 形式: JPEG / JFIF 1.01
- magic bytes: `ff d8 ff e0 00 10 4a 46`
- SHA-256: `0ae8092e4142d49dd83e49596319a35cd632f83b33be426ccfe94e860edefbef`

### Dark

- パス: `/private/tmp/menubar-preview-dark.jpg`
- サイズ: 59,081 bytes
- 寸法: 2400 × 1724
- 形式: JPEG / JFIF 1.01
- magic bytes: `ff d8 ff e0 00 10 4a 46`
- SHA-256: `c4e45d26de0e21f4e74bf0cdc40f3ee2e86f223e459c073c486112f73b5f4e27`

両画像を実際に開き、Light / Darkの表示、open menu、radio項目、checkbox項目の3px focus ringを目視確認した。

## 未列挙・未検証の残（正直な限界）

- pointer hover / click
- typeahead
- RTL
- disabled / destructive / inset
- group / label
- alternate placement / offsets
- controlled open state
- viewport縮小時の衝突回避
- zoom、高コントラスト、OS固有アクセシビリティ設定
- スクリーンリーダー実機での読み上げ
- Firefox / Safari
- 長時間操作、キー連打、タイミング揺らぎ

指定により画像以外のevidenceファイルは書き出していない。DOM属性、computed style、操作結果の生出力は本実行セッションで確認し、判定に必要な値を本レポートへ固定した。

列挙、実行、判定を同一エージェントが行う自己採点構造であるため、最終承認は人間にある。

## クリーンアップ

- 永続データ作成なし
- 削除、課金、外部送信なし
- Reactローカル状態以外のデータ変更なし
- リポジトリ変更なし
- 指定されたJPEG 2件のみ上書き
