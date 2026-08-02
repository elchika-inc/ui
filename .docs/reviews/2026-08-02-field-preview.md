# 動作検証レポート: Field Preview

verified_impl_sha: 3996081cbbc5da1832a58ffd4fce88bd16ca7fee

## 結論

Light / Dark の Field Preview を実ブラウザーで検証した結果、指定された全確認項目に不具合は検出されなかった。

- 判定: ✅ PASS
- 実測確認: 10ケース
- ❌ 不具合: 0件
- 🔁 flaky: 0件
- ブラウザーコンソールエラー: Light 0件 / Dark 0件
- 実装および Git 状態への変更: なし

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 06:36:53 JST
- 対象コミット: 上記 `verified_impl_sha`
- 対象サーバー: `http://127.0.0.1:3013`
- Light URL: `http://127.0.0.1:3013/preview/field/`
- Dark URL: `http://127.0.0.1:3013/preview/field-dark/`
- Hydration セレクター: `[data-slot="field-preview"]`
- OS: macOS 26.3.1（Build 25D2128、arm64）
- Node.js: v26.4.0
- ブラウザー: Google Chrome 150.0.7871.187
- 実行可否: ✅ 実ブラウザーで実行した
- 終了時ゲート: exit code 0
- 終了時 `git status --short`: 出力なし
- 対象実装ファイルの `git diff --exit-code`: exit code 0

## 成功基準（rubric・実行前に定義）

1. 両ルートで hydration セレクターが出現し、ブラウザーコンソールエラーが0件である。
2. 通常・invalid・disabled の3種類の Field が実 DOM に存在する。
3. 各 `label.htmlFor` が対応する `input.id` と一致し、対象要素が実在する。
4. 全 input の `aria-describedby` が、実在する説明要素のみを参照する。
5. invalid input が `aria-invalid="true"` を持ち、エラー要素が `role="alert"` を持つ。
6. disabled input がネイティブ `disabled` を持ち、実際の Tab 順序から除外される。
7. キーボード Tab 順序が、通常 input → invalid input → BODY となり、disabled input に移動しない。
8. Light / Dark の `background`、`foreground`、`destructive`、focus ring が、それぞれのテーマトークンに到達する。
9. Light / Dark のスクリーンショットが JPEG として直接取得され、SOI、寸法、SHA-256を確認できる。
10. 終了時にも対象コミットと対象ファイルが変更されていない。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順（コマンド／操作） |
|---|---|---|---|---|---|---|---|---|
| 1 | Light / Dark の hydration とコンソールエラー | コード・画面 | 基本経路 | High | ✅実測確認 | 2/2 | 両ルートで preview 1件、console `[]` | 各 URL を開く → `[data-slot="field-preview"]` の出現を待つ → console messages を取得 |
| 2 | 通常・invalid・disabled の3状態 | コード・画面 | 状態分割 | High | ✅実測確認 | 2/2 | 各テーマで Field 3件。通常、`data-invalid="true"`、`data-disabled="true"` を確認 | hydration 後に `[data-slot="field"]` を全件取得し、属性と内包 input を照合 |
| 3 | label と input の関連付け | コード・画面 | 全件照合 | High | ✅実測確認 | 6/6 | `field-name`、`field-email`、`field-account-id` の全組で一致 | 各 label の `htmlFor` を取得 → 同値の `input.id` が1件存在することを確認 |
| 4 | `aria-describedby` の参照整合性 | コード・画面 | 参照整合性 | High | ✅実測確認 | 6/6 | 全参照先が実在。invalid は description と error の2要素を参照 | 各 input の属性を空白分割 → 各 ID を `document.getElementById` で解決 |
| 5 | invalid のエラーセマンティクス | コード・画面 | 異常系 | High | ✅実測確認 | 2/2 | `field-email`: `aria-invalid="true"`。エラー文「有効なメールアドレスを入力してください。」は `role="alert"` | Light / Dark で invalid input と error 要素の属性・a11y tree を確認 |
| 6 | disabled のネイティブ状態 | コード・画面・型 | 状態分割 | High | ✅実測確認 | 2/2 | `field-account-id.disabled === true`、a11y tree でも disabled textbox | disabled input の DOM property と accessibility snapshot を確認 |
| 7 | 実キーボード Tab 順序と disabled 除外 | 画面 | 状態遷移・0スイッチ | High | ✅実測確認 | 2/2 | Tab 1=`field-name`、Tab 2=`field-email`、Tab 3=`BODY`、Tab 4=`field-name` | BODY から実際に Tab を4回送信し、各回の `document.activeElement` を取得 |
| 8 | Light のテーマトークン到達 | コード・画面 | テーマ境界・computed style | Medium | ✅実測確認 | 1/1 | background、foreground、destructive、ring が Light トークンと一致 | CSS custom properties と body/input/error/focused input の computed style を取得 |
| 9 | Dark のテーマトークン到達 | コード・画面 | テーマ境界・computed style | Medium | ✅実測確認 | 1/1 | background、foreground、destructive、ring が Dark トークンと一致 | `.dark` 適用ルートで同じ computed style を取得 |
| 10 | JPEG 証跡の形式・寸法・ハッシュ | 画面 | 証跡完全性 | Medium | ✅実測確認 | 2/2 | JPEG返却、SOI `ffd8`、Light 1512×828、Dark 1512×772 | invalid input に Tab フォーカス → `screenshot({format:"jpeg"})` → `/private/tmp` へ直接保存 → `file`、`xxd`、`sips`、`shasum` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

導出元ラベル: コード / 画面 / 型

## 状態別の実測結果

| 状態 | 表示ラベル | input ID | 状態属性 | 説明参照 | Tab 到達 | 判定 |
|---|---|---|---|---|---|---|
| 通常 | 表示名 | `field-name` | `disabled=false`、`aria-invalid` なし | `field-name-description` | 1番目 | ✅ |
| invalid | メールアドレス | `field-email` | `aria-invalid="true"` | `field-email-description field-email-error` | 2番目 | ✅ |
| disabled | アカウント ID | `field-account-id` | native `disabled=true` | `field-account-id-description` | 到達しない | ✅ |

## キーボード操作の実測

Light / Dark の両方で同じ遷移を観測した。

1. Tab 1回目: `field-name`
2. Tab 2回目: `field-email`
3. Tab 3回目: `BODY`
4. Tab 4回目: `field-name`

`field-account-id` には一度もフォーカスが移らなかった。判定にはプログラム上の `tabIndex` 値ではなく、実際のキーボード Tab 操作を使用した。

## テーマトークンと computed style

### Light

| 意味 | テーマトークン | 観測対象 | computed style | 判定 |
|---|---|---|---|---|
| background | `oklch(100% 0 0)` | body background | `oklch(1 0 0)` | ✅ 同値 |
| foreground | `oklch(14.5% 0 0)` | body / normal input color | `oklch(0.145 0 0)` | ✅ 同値 |
| destructive | `oklch(50.5% .213 27.518)` | error text / invalid focus ring | `oklch(0.505 0.213 27.518)` | ✅ 同値 |
| ring | `oklch(55.6% 0 0)` | normal input focus ring | `oklch(0.556 0 0)`、3px | ✅ 同値 |

補足:

- description color: `oklch(0.54 0 0)`
- invalid input の border は destructive 色
- disabled input opacity: `0.5`
- disabled label opacity: `0.5`

### Dark

| 意味 | テーマトークン | 観測対象 | computed style | 判定 |
|---|---|---|---|---|
| background | `oklch(14.5% 0 0)` | body background | `oklch(0.145 0 0)` | ✅ 同値 |
| foreground | `oklch(98.5% 0 0)` | body / normal input color | `oklch(0.985 0 0)` | ✅ 同値 |
| destructive | `oklch(70.4% .191 22.216)` | error text / invalid focus ring | `oklch(0.704 0.191 22.216)` | ✅ 同値 |
| ring | `oklch(55.6% 0 0)` | normal input focus ring | `oklch(0.556 0 0)`、3px | ✅ 同値 |

補足:

- description color: `oklch(0.708 0 0)`
- invalid input の非フォーカス border: `oklab(0.704 0.176821 0.072217 / 0.5)`
- invalid input のフォーカス ring: destructive 色、3px、不透明
- disabled input opacity: `0.5`
- disabled label opacity: `0.5`

CSSOM のシリアライズにより、パーセント表記と0〜1表記、`oklch` と `oklab` が混在する箇所がある。判定は数値および実際の適用先を照合して行った。

## JPEG 証跡

スクリーンショットは PNG から変換せず、ブラウザー API に `format: "jpeg"` を指定して直接取得した。返却値は `Uint8Array` であり、先頭8バイトは両方とも `ff d8 ff e0 00 10 4a 46`（JFIF）だった。

| テーマ | 保存先 | サイズ | 寸法 | SOI | SHA-256 |
|---|---|---:|---:|---|---|
| Light | `/private/tmp/field-preview-light.jpg` | 27,275 bytes | 1512×828 | `ffd8` | `281617caf8ff730698e1e4f07ce6dce53ec855e1ca29b5cddcae3153b84e2d82` |
| Dark | `/private/tmp/field-preview-dark.jpg` | 26,178 bytes | 1512×772 | `ffd8` | `8a50a6aa25d91982333e97bf35dfe82e6b84a309f32f210a90e2e12152206322` |

両画像を目視確認し、次を確認した。

- 3つの Field が表示される。
- invalid email input に destructive のフォーカスリングが表示される。
- エラーメッセージが表示される。
- disabled Field は label と input の双方が減光される。
- Light / Dark の背景と前景が各テーマに対応する。

再検証コマンド:

```bash
test -s /private/tmp/field-preview-light.jpg
test -s /private/tmp/field-preview-dark.jpg
file /private/tmp/field-preview-light.jpg /private/tmp/field-preview-dark.jpg
xxd -p -l 2 /private/tmp/field-preview-light.jpg
xxd -p -l 2 /private/tmp/field-preview-dark.jpg
sips -g pixelWidth -g pixelHeight /private/tmp/field-preview-light.jpg /private/tmp/field-preview-dark.jpg
shasum -a 256 /private/tmp/field-preview-light.jpg /private/tmp/field-preview-dark.jpg
```

## 三方向導出のクロスチェック結果

### コードから導出

- `Field` の通常・invalid・disabled 状態
- `FieldLabel`、`FieldDescription`、`FieldError`
- vertical / horizontal / responsive orientation
- error 配列の重複排除と単一／複数エラー表示
- `Input` の focus-visible、invalid、disabled スタイル

### 画面から導出

- 操作可能要素は通常 input、invalid input、disabled input の3件
- 実際の preview は vertical orientation
- invalid error は accessibility tree 上で `alert`
- disabled textbox は accessibility tree 上でも disabled
- 通常 input と invalid input のみが逐次フォーカス対象

### 型・属性から導出

- `Field` と各子コンポーネントは React のネイティブ要素 props を継承
- input の `disabled`、`aria-invalid`、`aria-describedby`
- label の `htmlFor`
- エラー要素の `role`

OpenAPI や独立した入力バリデーションスキーマは、この UI Preview の対象範囲には存在しない。

### 差分

- コードにあるが今回の画面から到達できない分岐:
  - horizontal / responsive orientation
  - `FieldSet` / `FieldLegend`
  - checkbox / radio を使う Field
  - `FieldContent` / `FieldTitle` / `FieldSeparator`
  - 複数エラーの結合・重複排除
  - error が空または未指定の分岐
- 画面から入力できるがコードで検証していない値:
  - Preview は入力値の送信・業務バリデーションを持たないため該当なし
- 型にあるがコードで扱っていないパラメーター:
  - ネイティブ props は透過される設計であり、個別分岐として扱わない
- Preview と実装間の不整合:
  - 検出なし

## 未到達分岐（網羅の穴・機械的な証拠）

今回の3ケースから到達しない実装分岐は次のとおり。

- `orientation="horizontal"`
- `orientation="responsive"`
- `FieldSet` と `FieldLegend`
- checkbox / radio グループ
- `FieldContent`
- `FieldTitle`
- `FieldSeparator`
- `errors` が複数件の表示
- `errors` の重複メッセージ除去
- `errors` が空配列または未指定
- label 内に control をネストする利用形態
- consumer から任意のネイティブ props を渡す経路

これらは Preview に導線がないため、今回のブラウザー検証では合格判定していない。

## 発見した不具合

なし。

## 未列挙・未検証の残（正直な限界）

- input への文字入力後の状態変化
- form submit と業務バリデーション
- autofill
- label のポインタークリックによるフォーカス移動
- 実スクリーンリーダーでの読み上げ順序
- Chrome 以外のブラウザー
- macOS 以外の OS
- モバイル viewport
- ズーム、高コントラスト、強制色モード
- Preview に存在しない上記未到達分岐
- ネットワーク断や JavaScript 無効環境

## クリーンアップ

- 検証用データの作成: なし
- 実装ファイルの変更: なし
- evidence 以外のファイル作成: なし
- `/private/tmp` の JPEG 2件はレビュー証跡として保持
- 証跡合計は10MB未満のため、Git LFS または外部ストレージへの退避提案は不要
- ブラウザー検証セッション: finalize 済み
- `.docs/actions/` 登録候補: なし
- brain 記録候補: native disabled input は `tabIndex` の数値だけで逐次フォーカス可否を判定せず、実際の Tab 操作で確認する
