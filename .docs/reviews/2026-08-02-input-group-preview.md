# 動作検証レポート: Input Group Preview

verified_impl_sha: 6fa3a6aeaeeac72d5c8a02ab4a1bc3c882b22b51

## 結論

判定は ✅ PASS。

修正後の固定コミットで Light / Dark の全操作と computed style を再実測した。前回不具合 IG-01 だった親 `input-group` の focus ring は、両テーマ・両 input で不透明3pxとなり、テーマの `--ring` と一致した。

- ❌ 不具合: 0件
- 🔁 flaky: 0件
- ⚠️ invalid ring: Preview に導線がなく実ブラウザー未到達
- checker: 20/20成功
- 全 component standards 再走査: 103ファイル、0違反
- ブラウザーコンソールエラー: Light 0件 / Dark 0件
- リポジトリ変更: なし

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 06:57:23 JST
- 対象コミット: 上記 `verified_impl_sha`
- 対象サーバー: `http://127.0.0.1:3013`
- Light URL: `http://127.0.0.1:3013/preview/input-group/`
- Dark URL: `http://127.0.0.1:3013/preview/input-group-dark/`
- Hydration selector: `[data-slot="input-group-preview"]`
- OS: macOS 26.3.1（Build 25D2128、arm64）
- Node.js: v26.4.0
- ブラウザー: Google Chrome 150.0.7871.187
- 実行可否: ✅ 実ブラウザーで全対象ケースを再実行
- 終了時 `git status --short`: 出力なし
- 対象ファイルの `git diff --exit-code`: exit code 0
- 最終検証ゲート: exit code 0

## 成功基準

1. 両テーマで hydration selector が出現し、console error が0件である。
2. prefix addon の非 button 領域をクリックすると検索 input へ focus する。
3. Tab 順が検索 input → 共有 URL input → copy button → BODY となる。
4. input focus 中、親 group に `--ring` と一致する alpha なし3px ring が適用される。
5. copy 後に status が「コピーしました」へ変化し、button の accessible name を維持する。
6. Light / Dark の semantic token が実要素へ到達する。
7. JPEG を Browser API から直接取得し、magic bytes・寸法・SHA-256を確認する。
8. checker の回帰テストと全 component 再走査が成功する。
9. 検証後も固定 SHA と対象実装が変更されていない。

invalid ring は Preview から到達できないため、source と checker の確認に留め、実ブラウザー合格には算入しない。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 実体エビデンス |
|---|---|---|---|---|---|---|
| 1 | Light / Dark hydration と console | コード・画面 | 基本・異常系 | High | ✅実測確認 | selector各1件、console各0件 |
| 2 | prefix addon click | コード・画面 | 分岐・pointer | High | ✅実測確認 | active=`INPUT`、name=`サイト内検索` |
| 3 | Tab順と直接 keyboard 到達 | 画面・型 | 状態遷移 | High | ✅実測確認 | 検索 → 共有URL → copy button → BODY |
| 4 | 検索 input の親 ring | コード・画面 | computed style | High | ✅実測確認 | Light/Dark各3/3、alphaなし3px |
| 5 | 共有URL input の親 ring | コード・画面 | computed style | High | ✅実測確認 | 両themeでalphaなし3px |
| 6 | ring token 到達 | コード・画面 | token照合 | High | ✅実測確認 | `--ring` と描画値が数値一致 |
| 7 | copy status と accessible name | コード・画面 | 状態遷移 | High | ✅実測確認 | status更新、name「URLをコピー」維持 |
| 8 | Light / Dark style | コード・画面 | computed style | Medium | ✅実測確認 | background/foreground/input/muted/ring到達 |
| 9 | invalid ring | コード | 分岐確認 | High | ⚠️未確認・要人間判断 | `[aria-invalid=true]` は0件 |
| 10 | checker 回帰 | コード・型 | 自動テスト | High | ✅実測確認 | tests 20、pass 20、fail 0 |
| 11 | 全 component 再走査 | コード | 静的全数検査 | High | ✅実測確認 | standards適合、103ファイル |
| 12 | JPEG証跡 | 画面 | 証跡完全性 | Medium | ✅実測確認 | JFIF、SOI `ffd8`、2枚 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

導出元ラベル: コード / 画面 / 型

## IG-01 の RED → 修正 → GREEN

前回 SHA では、親 group の ring が次の computed style となり、Light 3/3・Dark 3/3で不合格だった。

```text
oklab(0.556 0 0 / 0.5) 0px 0px 0px 3px
```

修正差分:

- `ring-ring/50` → `ring-ring`
- `ring-destructive/20` → `ring-destructive`
- dark の `ring-destructive/40` → `ring-destructive`

修正後は Light / Dark 共通で次を得た。

```text
--ring: oklch(55.6% 0 0)
focused parent border: oklch(0.556 0 0)
focused parent ring: oklch(0.556 0 0) 0px 0px 0px 3px
```

幅は3px、alpha指定なし、tokenと数値一致であり、Light 3/3・Dark 3/3で GREEN となった。

## checker の RED / GREEN

旧 checker は状態 variant が token 先頭にある形を前提とし、次を検出できなかった。

```text
has-[[data-slot=x]:focus-visible]:ring-ring/50
```

クラストークン全体に `focus` または `invalid` があるかを判定後、同じ token 内の透明度付き ring を検出する形へ変更し、上記の回帰テストを追加した。

```text
tests 20
pass 20
fail 0
standards 適合（103 ファイルを検査）
```

修正 checker で既存全 component に同型違反は検出されなかった。

## 実 DOM と keyboard 操作

両テーマで preview 1件、input group 2件、addon 2件、control 2件、button 1件、status 1件を確認した。prefix addon の click 後は「サイト内検索」input が active となった。Tab 順は以下のとおりだった。

1. `INPUT`「サイト内検索」
2. `INPUT`「共有 URL」
3. `BUTTON`「URLをコピー」
4. `BODY`

copy button 操作後は status が「コピーしました」へ変化し、accessible name は「URLをコピー」のまま維持された。suffix addon 内の button click では addon の input focus 分岐は発火せず、`closest("button")` の early return と一致した。

## テーマ style

Light:

- background: `oklch(1 0 0)`
- foreground: `oklch(0.145 0 0)`
- input border: `oklch(0.922 0 0)`
- muted foreground: `oklch(0.54 0 0)`
- focused ring: `oklch(0.556 0 0)`、3px、alphaなし

Dark:

- background: `oklch(0.145 0 0)`
- foreground: `oklch(0.985 0 0)`
- input token: `oklch(1 0 0 / 0.15)`
- muted foreground: `oklch(0.708 0 0)`
- focused ring: `oklch(0.556 0 0)`、3px、alphaなし

## invalid ring の扱い

source 上では invalid ring の透明度指定も除去され、checker も透明度付き invalid ring を検出対象としている。ただし Preview の実 DOM に `[aria-invalid="true"]` は存在せず、到達操作もないため、実ブラウザーでは未確認とした。

## JPEG証跡

PNG変換を介さず Browser API に `format: "jpeg"` を指定して直接取得した。返却型は `Uint8Array`、先頭8 byte は両方 `ff d8 ff e0 00 10 4a 46` だった。

| テーマ | 保存先 | サイズ | 寸法 | SHA-256 |
|---|---|---:|---:|---|
| Light | `/private/tmp/input-group-preview-light.jpg` | 15,730 bytes | 1512×828 | `37ad71f85475685081549e5a5ebd8bb5d41a254937b8e07888df84216c56a7e8` |
| Dark | `/private/tmp/input-group-preview-dark.jpg` | 15,120 bytes | 1512×772 | `636429c97eada9759945ce7f372e0086bbd0bfe199d03a68af85fdcf04565d7c` |

撮影時は status「コピーしました」、検索 input active、修正後の不透明3px ring、各テーマの背景と前景を表示した。

## 未到達分岐

- invalid / disabled
- combobox 内の focus ring 抑制
- addon の block-start / block-end
- addon 内の `kbd`
- `InputGroupTextarea`
- preview 未使用の button size/type/variant
- consumer から渡す任意 native props
- 実 clipboard 書き込み

## 発見した不具合

なし。前回 IG-01 は今回の固定 SHA では再現しなかった。

## 未検証の残

- invalid / disabled の実ブラウザー挙動
- textarea と block方向 addon
- form submit と検索処理
- 実スクリーンリーダー
- Chrome/macOS 以外
- mobile viewport、zoom、高コントラスト、強制色
- network断、JavaScript無効環境

## クリーンアップ

- 検証用データ作成: なし
- リポジトリ変更: なし
- `/private/tmp` の JPEG 2件は修正後証跡として保持
- 証跡合計は10MB未満
- Browser session: finalize済み
- `.docs/actions/` 登録候補: invalid InputGroup の Preview 追加と実ブラウザー検証
- brain 記録候補: 状態 variant 内の透明 ring 検査は prefix 位置に依存せず token 全体を解析する
