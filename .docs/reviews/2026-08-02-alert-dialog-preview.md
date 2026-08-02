# 動作検証レポート: Alert Dialog Preview

verified_impl_sha: 697c24ee51ab5d26721b13fdcd7fe12ab8a3893d

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02T05:02:05+09:00
- 対象:
  - `http://127.0.0.1:3013/preview/alert-dialog/`
  - `http://127.0.0.1:3013/preview/alert-dialog-dark/`
- OS: macOS 26.3.1、Darwin 25.3.0、arm64
- ブラウザ: Google Chrome 150.0.7871.187
- viewport: 1512×828 CSS px
- `devicePixelRatio`: 2
- ランタイム: Node.js v26.4.0
- UI基盤: `@base-ui/react` 1.6.0
- 実行可否: ✅ 実ブラウザで実行
- Git状態: 検証開始時はclean。終了時の未追跡ファイルは指定されたJPEG 2枚のみ
- ソース保全: 対象コンポーネント、preview、route、provenance、package設定は固定実装から差分なし
- レポートファイル: 指示どおり未作成

## 上流実体から定めた確認対象

`provenance.json` が指す [shadcn/uiの固定上流実装](https://github.com/shadcn-ui/ui/blob/687f09817b614a3450f0f56779edf367082e1e53/apps/v4/registry/bases/base/ui/alert-dialog.tsx) と、実際にインストールされた Base UI 1.6.0 のソースを確認した。

Base UIの実体ではAlert Dialogに対して以下が固定される。

- `modal = true`
- `disablePointerDismissal = true`
- `role = "alertdialog"`
- Escapeによるdismissは有効
- `Popup`の既定initial focusは通常のキーボード操作では最初のtabbable要素
- modal focus managerがTab移動をpopup内に閉じ込め、閉鎖時にfocusを復元する

このため、名称から推測せず、次を正常基準とした。

- overlay外側のpointer clickでは閉じない
- Escapeでは閉じる
- Tab/Shift+Tabでは背景sentinelへ到達しない
- popupのrole、名前、説明が実DOMで接続される
- 閉じた後はtriggerへfocusが戻る

## 成功基準（rubric・実行前に定義）

- Astro hydration完了後、`astro-island`の`ssr`属性が消え、`[data-slot="alert-dialog-content"]`が1件以上存在する
- console errorが0件である
- contentのroleが`alertdialog`で、accessible nameがtitle「この項目を削除しますか」に接続される
- 初期focusがdialog内の最初のtabbable要素「キャンセル」に置かれる
- Tab/Shift+Tabを前後に反復しても`[data-sentinel="before"]`・`[data-sentinel="after"]`へ到達しない
- overlay実体をクリックしてもcontent件数が維持される
- Escape後にcontentが消え、trigger「削除を確認する」へfocusが戻る
- dialog表示中、背景preview subtreeが`aria-hidden`またはnative `inert`で除外される
- Light/Dark双方で中央dialog、タイトル、説明、ボタン、overlayが識別でき、欠け・重なり・クリップがない
- 保存画像が要求形式JPEG、`.jpg`拡張子、JPEG magic bytes、取得時寸法を満たす

## テストケースと結果

| # | route | theme | 操作・動作パターン | 導出元 | リスク | selector件数 | console | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/preview/alert-dialog/` | Light | hydration完了後の初期表示 | コード・画面 | High | content `1` | error `0` | ✅実測確認 | 2/2 | Light JPEG、実DOM | `goto(route)` → contentを`visible`待機 → `astro-island[ssr]`不在とcontent件数を評価 |
| 2 | `/preview/alert-dialog/` | Light | role・accessible name・description・初期focus | コード・画面・上流 | High | content `1` | error `0` | ✅実測確認 | 2/2 | role=`alertdialog`、初期focus=`alert-dialog-cancel` | contentの`role`、`aria-labelledby`、`aria-describedby`と参照先IDを評価 |
| 3 | `/preview/alert-dialog/` | Light | Tab/Shift+Tab focus trap | コード・画面・上流 | High | content `1` | error `0` | ✅実測確認 | 2/2 | focus操作列 | 初期focusからTab×3、Shift+Tab×3。各操作後の`document.activeElement`を記録 |
| 4 | `/preview/alert-dialog/` | Light | overlay外側click | コード・上流 | High | `1 → 1` | error `0` | ✅実測確認 | 2/2 | hit target=`alert-dialog-overlay` | `elementFromPoint(24,24)`でoverlayを確認 → `(24,24)`をclick → content件数を再評価 |
| 5 | `/preview/alert-dialog/` | Light | Escape閉鎖・focus return | コード・上流 | High | `1 → 0` | error `0` | ✅実測確認 | 2/2 | focus=`alert-dialog-trigger` | overlay click後にTabでdialog内復帰を確認 → Escape → contentをhidden待機 → activeElementを評価 |
| 6 | `/preview/alert-dialog-dark/` | Dark | hydration完了後の初期表示 | コード・画面 | High | content `1` | error `0` | ✅実測確認 | 2/2 | Dark JPEG、実DOM | Lightと同じ |
| 7 | `/preview/alert-dialog-dark/` | Dark | role・accessible name・description・初期focus | コード・画面・上流 | High | content `1` | error `0` | ✅実測確認 | 2/2 | role=`alertdialog`、初期focus=`alert-dialog-cancel` | Lightと同じ |
| 8 | `/preview/alert-dialog-dark/` | Dark | Tab/Shift+Tab focus trap | コード・画面・上流 | High | content `1` | error `0` | ✅実測確認 | 2/2 | focus操作列 | Lightと同じ |
| 9 | `/preview/alert-dialog-dark/` | Dark | overlay外側click | コード・上流 | High | `1 → 1` | error `0` | ✅実測確認 | 2/2 | hit target=`alert-dialog-overlay` | Lightと同じ |
| 10 | `/preview/alert-dialog-dark/` | Dark | Escape閉鎖・focus return | コード・上流 | High | `1 → 0` | error `0` | ✅実測確認 | 2/2 | focus=`alert-dialog-trigger` | Lightと同じ |
| 11 | `/preview/alert-dialog/` | Light | 見た目・JPEG証跡 | 画面 | Medium | content `1` | error `0` | ✅実測確認 | 1/1 | `alert-dialog-preview-light.jpg` | dialog表示中にfull-page screenshot取得 → JPEG変換 → 目視・形式検査 |
| 12 | `/preview/alert-dialog-dark/` | Dark | 見た目・JPEG証跡 | 画面 | Medium | content `1` | error `0` | ✅実測確認 | 1/1 | `alert-dialog-preview-dark.jpg` | Lightと同じ |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 操作実測の詳細

### Light

- hydration完了: `astro-island`の`ssr=false`
- 初期content件数: `1`
- role: `alertdialog`
- accessible name: `この項目を削除しますか`
- description: `この操作は取り消せません。確認後に削除を実行してください。`
- 初期focus: `BUTTON[data-slot="alert-dialog-cancel"]`「キャンセル」
- focus列:
  - 初期: キャンセル
  - Tab: 削除する
  - Tab: キャンセル
  - Tab: 削除する
  - Shift+Tab: キャンセル
  - Shift+Tab: 削除する
  - Shift+Tab: キャンセル
- `data-sentinel`到達: 0回
- overlay/content矩形:
  - overlay: `x=0, y=0, width=1512, height=828`
  - content: `x=564, y=330.5, width=384, height=167`
- `(24,24)`のhit target: `[data-slot="alert-dialog-overlay"]`
- overlay click後: content `1`で開いたまま
- overlay click直後のactiveElement: `BODY`
- その後Tab: dialog内の「削除する」へ復帰し、sentinelには到達しない
- Escape後: content `0`
- Escape後focus: trigger「削除を確認する」
- console error: `0`

### Dark

- hydration完了: `astro-island`の`ssr=false`
- `<html class="dark">`
- 初期content件数: `1`
- role/name/description/初期focus/focus列/overlay矩形はLightと同じ
- `data-sentinel`到達: 0回
- overlay click後: content `1`で開いたまま
- overlay click直後のactiveElement: `BODY`
- その後Tab: dialog内の「削除する」へ復帰
- Escape後: content `0`
- Escape後focus: trigger「削除を確認する」
- console error: `0`

overlay click直後に`activeElement=BODY`となる現象は両themeで再現した。ただしdialogは閉じず、背景sentinelへは移動せず、次のTabでdialog内へ復帰した。上流実装のpointer dismissal禁止と要求されたTab focus trapを満たすため、本検証では欠陥に分類しない。

## 背景のinert / aria-hidden実体

dialog表示中、preview本体とsentinelを内包する`ASTRO-ISLAND`は両routeで以下となった。

- `aria-hidden="true"`
- `data-base-ui-inert=""`
- native `inert`属性: なし

同じマーカーはbody直下の`STYLE`にも付与された。dialog portal自体には`aria-hidden`は付かない。したがって背景preview subtreeは支援技術から除外されているが、ブラウザnativeの`inert`属性ではなく、Base UIの`aria-hidden`＋内部markerによる実装である。

## 見た目の実測

### Light

- `<html>`のtheme class: 空
- body: `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`
- content: `oklch(1 0 0)`、foreground `oklch(0.145 0 0)`
- overlay: `oklch(0 0 0 / 0.1)`
- 中央dialog、タイトル、説明、footer境界、2ボタンを明瞭に識別できた
- 初期focusのキャンセルボタンにfocus ringが表示された
- 欠け、意図しない重なり、viewport外へのクリップなし

### Dark

- `<html class="dark">`
- body: `oklch(0.145 0 0)`、foreground `oklch(0.985 0 0)`
- content: `oklch(0.205 0 0)`、foreground `oklch(0.985 0 0)`
- overlay: `oklch(0 0 0 / 0.1)`
- Lightと同じ構造を保ちつつ、背景・content・文字・ボタンの明暗がDark tokenへ切り替わった
- 欠け、意図しない重なり、viewport外へのクリップなし

## JPEG取得・形式検証

取得方法:

1. Chrome実ブラウザでdialog表示中に`tab.screenshot({ fullPage: true })`
2. Browser APIが返したPNG bytesを一時PNGとして保存
3. `/usr/bin/sips -s format jpeg -s formatOptions 90 <input.png> --out <requested.jpg>`
4. `file`、`xxd -l 16`、`sips -g format -g pixelWidth -g pixelHeight`、目視で検証

要求形式と実体:

| theme | requested format | 保存拡張子 | magic bytes | JFIF | 寸法 | size | SHA-256 |
|---|---|---|---|---|---|---|---|
| Light | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 42,359 bytes | `c0979484c683bb0c40114eccd7f425bd3bc94734a5c3dbea6870baad2e482f57` |
| Dark | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 40,537 bytes | `f532e00e7aea08bc25a3be89639bad5348c3a39e160c3d1bd87c3933554ff6b6` |

`file`は両方を「JPEG image data, JFIF standard 1.01, baseline, precision 8, 1512x828, components 3」と判定した。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - `AlertDialogContent`の`size="sm"`分岐は今回のpreviewが既定`size="default"`のみのため未到達
  - touch起動時にpopup自身へinitial focusするBase UI分岐はデスクトップChromeのキーボード操作では未到達
- 画面から入力できるがコードで検証していない値:
  - テキスト入力は存在しない
  - 操作可能要素は前後sentinel、trigger、cancel、actionの4種類
- スキーマにあるがコードで扱っていないパラメータ:
  - OpenAPI等の外部スキーマは対象外
  - TypeScript Props上の`initialFocus`、`finalFocus`、`size`はpreviewから未指定
- 画面とコードの一致:
  - title/description IDはcontentの`aria-labelledby`/`aria-describedby`と一致
  - `AlertDialogCancel`はClose primitive、`AlertDialogAction`は通常Buttonとして実装されている
  - overlay click非閉鎖、Escape閉鎖、`alertdialog` roleはBase UI実体と一致

## 未到達分岐（網羅の穴・機械的な証拠）

- `size="sm"`レイアウト
- touch入力時のinitial focus
- 入れ子Alert Dialog
- 複数trigger/handle API
- controlled `open`、`onOpenChange`、`initialFocus`、`finalFocus`
- `AlertDialogCancel`のclick閉鎖
- handler未指定の`AlertDialogAction` click後の状態
- viewport幅が`sm`未満のresponsiveレイアウト

これらは今回指定された2 routeと操作契約の外側であり、合格へ昇格していない。

## 発見した不具合

- 指定された確認範囲では不具合なし
- Light/Darkとも同じ挙動を2/2で再現し、flakyは観測しなかった

## 未列挙・未検証の残（正直な限界）

- axe等による全ページ自動a11y監査は未実施
- Windows/Linux、Firefox、Safari、モバイル・touch環境は未実施
- zoom、forced-colors、prefers-reduced-motionは未実施
- 狭幅viewport、長文、翻訳文、フォントロード失敗時の見た目は未実施
- action/cancelのpointer click、二重click、連打は未実施
- screenshotは1512×828の1 viewportのみ
- builderと判定者は同一だが、操作列・DOM値・JPEG実体を残して後から再検証可能にした

## 再現手順

ブラウザ操作:

```text
1. http://127.0.0.1:3013/preview/alert-dialog/ を開く
2. [data-slot="alert-dialog-content"] がvisibleになるまで待つ
3. astro-islandにssr属性がないこと、content件数が1であることを確認
4. contentのrole/aria-labelledby/aria-describedbyと参照先textを確認
5. document.activeElementが[data-slot="alert-dialog-cancel"]であることを確認
6. Tabを3回、Shift+Tabを3回入力し、毎回activeElementを記録
7. elementFromPoint(24,24)が[data-slot="alert-dialog-overlay"]であることを確認
8. (24,24)を左clickし、content件数が1のままであることを確認
9. Tabを入力し、dialog内buttonへfocusが戻ることを確認
10. Escapeを入力し、content件数が0になることを確認
11. activeElementが[data-slot="alert-dialog-trigger"]であることを確認
12. console error件数を確認
13. /preview/alert-dialog-dark/ でも2〜12を反復
```

画像形式の再検証:

```bash
file .docs/reviews/alert-dialog-preview-light.jpg .docs/reviews/alert-dialog-preview-dark.jpg
xxd -l 16 .docs/reviews/alert-dialog-preview-light.jpg
xxd -l 16 .docs/reviews/alert-dialog-preview-dark.jpg
/usr/bin/sips -g format -g pixelWidth -g pixelHeight \
  .docs/reviews/alert-dialog-preview-light.jpg \
  .docs/reviews/alert-dialog-preview-dark.jpg
shasum -a 256 \
  .docs/reviews/alert-dialog-preview-light.jpg \
  .docs/reviews/alert-dialog-preview-dark.jpg
```

## クリーンアップ

- 作成データ: JPEG証跡2枚のみ
- 一時PNG: `/tmp/alert-dialog-preview-light.png`、`/tmp/alert-dialog-preview-dark.png`
- アプリデータ、外部送信、削除、課金操作: なし
- source・設定・既存証跡: 未変更
- ブラウザ検証タブ: 終了
- `.docs/actions/`への登録候補: なし
- brainへの記録候補: なし
