# 動作検証レポート: Message Scroller Preview

verified_impl_sha: 07d7d236ff7944a2c96cd95427375402784a81c3

## 結論

**総合判定: ✅ PASS**

Light / Darkの双方で、初期末尾配置、上方離脱、末尾ボタンの活性化とキーボードフォーカス、末尾復帰、末尾でのメッセージ追加、自動スクロールを解除した状態でのメッセージ追加を実ブラウザで確認した。

上方へ離れた状態でメッセージを追加した場合、実際の挙動は次のとおりだった。

- `scrollTop=0`を維持
- 最大スクロール量のみ`262`から`322`へ増加
- 末尾ボタンは`data-active="true"`を維持
- `inert`は解除されたまま
- `tabindex="0"`を維持

したがって、新着追加によってユーザーの閲覧位置を奪わない挙動を実測確認した。

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 07:53:20 JST
- 対象URL:
  - Light: `http://127.0.0.1:3013/preview/message-scroller/`
  - Dark: `http://127.0.0.1:3013/preview/message-scroller-dark/`
- OS: macOS 26.3.1 Build 25D2128、Darwin 25.3.0 arm64
- Node.js: v26.4.0
- ブラウザ: Google Chrome 150.0.7871.187
- `@shadcn/react`: 0.2.1
- 実行可否: ✅ 実ブラウザで全rubricを実行
- 最終検証コマンド終了コード: `0`
- リポジトリ状態:
  - `git diff --exit-code`: 差分なし
  - `git diff --cached --exit-code`: 差分なし
  - `git status --short`: 出力なし
- リポジトリ内ファイルは変更していない。指定されたJPEG 2件だけを上書きした。

## 成功基準（rubric・実行前に定義）

- 各ページがhydrationされ、対象selectorが一意に存在する。
- console error、warning、page exceptionが発生しない。
- viewportが`role="region"`、`aria-label="会話履歴"`、`tabindex="0"`を持つ。
- contentが`role="log"`、`aria-relevant="additions"`を持つ。
- 全itemに一意な`data-message-id`がある。
- `defaultScrollPosition="end"`により初期位置が末尾になる。
- 初期末尾状態では末尾ボタンがinactive、`inert`、tab順序外になる。
- PageUpで上方へ離れると、末尾ボタンがactiveになり、`inert`が解除され、Tabで到達できる。
- 末尾ボタンのキーボードフォーカスに、不透明な3px ringが表示される。
- 末尾ボタンのクリックで末尾へ戻り、button自身をblurし、再びinactiveになる。
- 末尾状態でのメッセージ追加では件数が増え、logへ追加され、末尾へ追従する。
- 上方離脱中の追加では、実際のライブラリ挙動を測定し、閲覧位置とbutton状態を記録する。
- Light / Darkのcomputed styleがテーマトークンと対応する。
- JPEGをブラウザAPIから直接取得し、magic bytes、寸法、ハッシュを確認できる。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | Light hydration・selector一意性 | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | 実DOM | Light URLを開き700ms待機 |
| 2 | Dark hydration・selector一意性 | コード・画面 | 状態遷移 | High | ✅実測確認 | 1/1 | 実DOM | Dark URLを開き700ms待機 |
| 3 | console / page error | 画面 | 異常系 | High | ✅実測確認 | 2/2 | browser console | 各ページを新規ロード |
| 4 | viewportのrole・label・tabindex | スキーマ・画面 | 属性検証 | High | ✅実測確認 | 2/2 | 実DOM | viewport属性を取得 |
| 5 | contentのlog semantics | スキーマ・画面 | 属性検証 | High | ✅実測確認 | 2/2 | 実DOM | content属性を取得 |
| 6 | 全itemの`data-message-id` | コード・画面 | 全数列挙 | High | ✅実測確認 | 2/2 | 実DOM | 8 itemを全件列挙 |
| 7 | 初期末尾配置 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | scroll実測 | `scrollTop`と最大値を比較 |
| 8 | 初期button inactive状態 | コード・画面 | 状態分割 | High | ✅実測確認 | 2/2 | DOM・computed style | button属性を取得 |
| 9 | PageUpによる上方離脱 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | scroll実測 | viewportへfocus後PageUp |
| 10 | 上方離脱後のbutton活性化 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 実DOM | button状態を取得 |
| 11 | Tabによるbutton到達 | コード・画面 | キーボード | High | ✅実測確認 | 2/2 | activeElement | viewportからTab |
| 12 | buttonの不透明3px focus ring | コード・画面 | 視覚・境界値 | High | ✅実測確認 | 2/2 | JPEG・computed style | buttonをkeyboard-focus |
| 13 | button clickによる末尾復帰 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | scroll実測 | active buttonをclick |
| 14 | click後のblurとinactive化 | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | activeElement・DOM | click後700ms待機 |
| 15 | 末尾状態でメッセージ追加 | コード・画面 | CRUD・状態遷移 | High | ✅実測確認 | 2/2 | DOM・scroll実測 | 追加buttonをclick |
| 16 | 末尾追加時のautoScroll | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | scroll実測 | 追加後900ms待機 |
| 17 | 上方離脱中のメッセージ追加 | コード・画面 | 複合状態 | High | ✅実測確認 | 2/2 | DOM・scroll実測 | PageUp後に追加 |
| 18 | 上方離脱中の位置維持 | コード・画面 | 回帰 | High | ✅実測確認 | 2/2 | scroll実測 | 追加前後の`scrollTop`比較 |
| 19 | Lightテーマトークン | コード・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | computed style | root/body/itemを測定 |
| 20 | Darkテーマトークン | コード・画面 | 同値分割 | Medium | ✅実測確認 | 1/1 | computed style | root/body/itemを測定 |
| 21 | JPEG直接取得と形式検証 | 画面 | 出力検証 | High | ✅実測確認 | 2/2 | JPEG | Playwright screenshot後に検査 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 初期DOM・ARIA

Light / Dark共通:

- `[data-slot="message-scroller-preview"]`: 1件
- `[data-slot="message-scroller"]`: 1件

### Viewport

- tag: `DIV`
- role: `region`
- `aria-label="会話履歴"`
- `tabindex="0"`
- `overflow-y: auto`

### Content

- tag: `DIV`
- role: `log`
- `aria-relevant="additions"`

### 初期item

8件すべてが`data-message-id`を持っていた。

| 順番 | `data-message-id` |
|---|---|
| 1 | `message-1` |
| 2 | `message-2` |
| 3 | `message-3` |
| 4 | `message-4` |
| 5 | `message-5` |
| 6 | `message-6` |
| 7 | `message-7` |
| 8 | `message-8` |

重複および欠落はなかった。

## 状態タイムライン

### S0: 初期末尾状態

Light / Darkで同値だった。

- item数: 8
- `scrollHeight`: 488
- `clientHeight`: 286
- 最大スクロール量: `488 - 286 = 202`
- `scrollTop`: 202
- 末尾一致: true
- viewport `data-scrollable="start"`
  - 末尾にいるため、start方向へは移動可能
  - end方向の余地はない
- 末尾button:
  - `data-active="false"`
  - `inert`あり
  - `tabindex="-1"`
  - opacity: `0`
  - pointer-events: `none`

`defaultScrollPosition="end"`による初期末尾配置を、`scrollTop === scrollHeight - clientHeight`で確認した。

### S1: PageUpで上方へ離脱

操作:

1. viewportをfocus
2. `PageUp`
3. 400ms待機

実測:

- `scrollTop`: 0
- 最大スクロール量: 202
- viewport `data-scrollable="end"`
- 末尾button:
  - `data-active="true"`
  - `inert`なし
  - `tabindex="0"`
  - opacity: `1`
  - pointer-events: `auto`

### S2: Tabで末尾buttonへ到達

viewportがfocusされた状態から`Tab`を1回押した。

- `document.activeElement`: 末尾button
- `data-slot="message-scroller-button"`
- `aria-label="末尾へ移動"`
- `:focus-visible=true`
- `data-active="true"`
- `inert`なし
- `tabindex="0"`

focus ringのring層:

`oklch(0.556 0 0) 0px 0px 0px 3px`

色にalpha指定はなく、不透明な3px ringだった。

buttonのcomputed style:

| Theme | background | color |
|---|---|---|
| Light | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| Dark | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |

### S3: 末尾buttonをクリック

activeな末尾buttonを実クリックし、700ms待機した。

- `scrollTop`: 202
- 最大スクロール量: 202
- 末尾一致: true
- viewport `data-scrollable="start"`
- button:
  - `data-active="false"`
  - `inert`あり
  - `tabindex="-1"`
- activeElement:
  - `BODY`
  - buttonではない

末尾復帰、buttonのblur、inactive化をLight / Darkで確認した。

### S4: 末尾状態でメッセージ追加

操作前:

- item数: 8
- `scrollTop`: 202
- 最大スクロール量: 202

「メッセージを追加」を実クリックし、900ms待機した。

操作後:

- item数: 9
- 追加item:
  - `data-message-id="message-added-1"`
  - text: `追加メッセージ 1`
- content:
  - role: `log`
  - `aria-relevant="additions"`
- `scrollTop`: 262
- 最大スクロール量: 262
- 末尾一致: true
- viewport `data-scrollable="start"`
- button:
  - `data-active="false"`
  - `inert`あり

末尾状態では、新着item追加後の新しい最大値までautoScrollが追従した。

### S5: 上方離脱中にメッセージ追加

S4後にviewportへfocusし、`PageUp`を押した。

追加直前:

- item数: 9
- `scrollTop`: 0
- 最大スクロール量: 262
- viewport `data-scrollable="end"`
- button:
  - `data-active="true"`
  - `inert`なし

「メッセージを追加」を実クリックし、900ms待機した。

追加後:

- item数: 10
- 追加item:
  - `data-message-id="message-added-2"`
  - text: `追加メッセージ 2`
- `scrollTop`: 0
- 最大スクロール量: 322
- 閲覧位置維持: true
- viewport `data-scrollable="end"`
- button:
  - `data-active="true"`
  - `inert`なし
  - `tabindex="0"`

実挙動は「ユーザー位置を奪わず、末尾buttonをactiveのまま維持」だった。

## テーマ実測

### Light

- `--background`: `oklch(100% 0 0)`
- `--foreground`: `oklch(14.5% 0 0)`
- `--card`: `oklch(100% 0 0)`
- `--card-foreground`: `oklch(14.5% 0 0)`
- `--muted`: `oklch(97% 0 0)`
- `--muted-foreground`: `oklch(54% 0 0)`
- `--ring`: `oklch(55.6% 0 0)`
- `--border`: `oklch(92.2% 0 0)`
- `--secondary`: `oklch(97% 0 0)`
- `--secondary-foreground`: `oklch(20.5% 0 0)`
- body背景: `oklch(1 0 0)`
- body前景: `oklch(0.145 0 0)`
- scroller背景: `oklch(1 0 0)`
- scroller前景: `oklch(0.145 0 0)`
- item背景: `oklch(0.97 0 0)`
- item前景: `oklch(0.145 0 0)`

### Dark

- `--background`: `oklch(14.5% 0 0)`
- `--foreground`: `oklch(98.5% 0 0)`
- `--card`: `oklch(20.5% 0 0)`
- `--card-foreground`: `oklch(98.5% 0 0)`
- `--muted`: `oklch(26.9% 0 0)`
- `--muted-foreground`: `oklch(70.8% 0 0)`
- `--ring`: `oklch(55.6% 0 0)`
- `--border`: `oklch(100% 0 0/.1)`
- `--secondary`: `oklch(26.9% 0 0)`
- `--secondary-foreground`: `oklch(98.5% 0 0)`
- body背景: `oklch(0.145 0 0)`
- body前景: `oklch(0.985 0 0)`
- scroller背景: `oklch(0.205 0 0)`
- scroller前景: `oklch(0.985 0 0)`
- item背景: `oklch(0.269 0 0)`
- item前景: `oklch(0.985 0 0)`

## Console・page error

Light / Darkとも:

- console errors: 0
- console warnings: 0
- page exception: 観測なし

## 三方向導出のクロスチェック

### コードと実DOMが一致した項目

- `@shadcn/react/message-scroller`を使用
- 実インストール版: 0.2.1
- provider:
  - `autoScroll`
  - `defaultScrollPosition="end"`
- viewport:
  - region semantics
  - accessible label
- content:
  - live log semantics
- item:
  - `messageId`から`data-message-id`を生成
- button:
  - `direction="end"`
  - active / inactive状態
  - `inert`とtab順序の連動
- preview:
  - React stateによるitem追加
  - 連番ID生成

### コードにあるが今回のpreviewから到達できない分岐

- `direction="start"`
- `scrollAnchor=true`
- custom `render`
- buttonの別variant / size
- 各公開hookをpreviewから直接利用する経路
- 外部制御されたprovider状態

### 画面から操作できるが未検証の経路

- scrollbarのpointer drag
- mouse wheel / trackpadによる中間位置への移動
- タッチ操作
- キー連打
- 追加buttonの高速連打

## 未到達分岐（網羅の穴・機械的な証拠）

- contentがviewportより短く、overflowが存在しない状態
- 中間位置で`data-scrollable`が両方向になる状態
- start方向button
- scroll anchor item
- item削除・並べ替え
- resize中の追従
- reduced motion
- RTL
- 複数scroller同時配置

## 発見した不具合

なし。

## JPEG evidence

### 取得方法

Playwrightのブラウザページから次の指定で直接取得した。

```js
await page.screenshot({
  path: "/private/tmp/message-scroller-preview-<theme>.jpg",
  type: "jpeg",
  quality: 90,
  fullPage: false,
});
```

PNG等からの後変換ではない。取得時は上方離脱状態で、末尾buttonがactiveかつ`:focus-visible=true`だった。

### Light

- パス: `/private/tmp/message-scroller-preview-light.jpg`
- サイズ: 78,889 bytes
- 寸法: 2400 × 1612
- 形式: JPEG / JFIF 1.01
- magic bytes: `ff d8 ff e0 00 10 4a 46`
- SHA-256: `332ff10cb826fc6e3f225c0d21adc9c579a9400156944a553f898822b993e17b`

### Dark

- パス: `/private/tmp/message-scroller-preview-dark.jpg`
- サイズ: 81,878 bytes
- 寸法: 2400 × 1724
- 形式: JPEG / JFIF 1.01
- magic bytes: `ff d8 ff e0 00 10 4a 46`
- SHA-256: `3b57924e40949d339625547c96df5e6cb45402916ec3e284a1bf337ba30cda26`

両画像を実際に開き、テーマ、上方離脱位置、activeな末尾button、不透明focus ringを目視確認した。

## 未列挙・未検証の残（正直な限界）

- Firefox / Safari
- スクリーンリーダー実機の読み上げ
- mouse wheel、trackpad、touch
- reduced motion
- zoom、高コントラスト
- resize時のscroll保持
- 連打や大量追加時の非決定性
- empty / non-scrollable content
- start方向button
- 複数instance間の干渉

指定により画像以外のevidenceファイルは作成していない。DOM、computed style、scroll値、状態遷移の生出力は本実行で確認し、判定に必要な数値を本レポートへ固定した。

列挙、実行、判定を同一エージェントが行う自己採点構造であるため、最終承認は人間にある。

## クリーンアップ

- 追加messageはReactローカルstateのみ
- 永続データ作成なし
- 削除、課金、外部送信なし
- リポジトリ変更なし
- 指定JPEG 2件のみ上書き
