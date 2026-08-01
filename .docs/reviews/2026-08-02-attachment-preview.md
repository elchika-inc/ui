# 動作検証レポート: Attachment Preview

verified_impl_sha: a740015c41c3de98266cb15fe47d538131edd568

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02T05:16:41+09:00
- 対象route:
  - `http://127.0.0.1:3013/preview/attachment/`
  - `http://127.0.0.1:3013/preview/attachment-dark/`
- OS: macOS 26.3.1、Darwin 25.3.0、arm64
- ブラウザ: Google Chrome 150.0.7871.187
- viewport: 1512×828 CSS px
- ランタイム: Node.js v26.4.0
- UI基盤: React 19.2.6、Astro 7、`@base-ui/react` 1.6.0
- 実行可否: ✅ 実ブラウザで実行
- 検証開始時Git状態: clean
- 検証終了時Git状態: 指定JPEG 2枚のみ未追跡
- source・設定・既存証跡: 未変更
- レポートファイル: 指示どおり未作成

## 上流・実装から導出した動作契約

`provenance.json`が指すshadcn/ui上流実装と、固定実装のコンポーネント・previewを全読した。

- Attachment container:
  - 既定stateは`done`
  - state型は`idle | uploading | processing | error | done`
  - `focus-within:ring-[3px] focus-within:ring-ring`
- Attachment Trigger:
  - container全面を覆う`absolute inset-0 z-10`
  - accessible nameは「仕様書.pdfを開く」
- Attachment Action:
  - Actions containerが`relative z-20`
  - triggerより前面に配置
  - accessible nameは「仕様書.pdfを削除」
- preview:
  - attachmentを3件表示
  - stateは順に`done`、`uploading`、`error`
  - trigger操作はstatusを「仕様書.pdfを選びました。」へ更新
  - action操作はstatusを「仕様書.pdfの削除操作を選びました。」へ更新

この実装から、action操作後のstatusが削除文言だけであることを、trigger誤発火なしの判定根拠とした。

## 成功基準（rubric・実行前に定義）

- Astro hydration完了後、`astro-island[ssr]`がなくなる
- `[data-slot="attachment-preview"]`が1件存在する
- `[data-slot="attachment"]`が3件存在する
- stateがDOM順に`done/uploading/error`
- title・descriptionが各stateに対応する
- console errorが各routeで0件
- 最初のattachmentにtriggerとactionが各1件あり、それぞれ固有のaccessible nameを持つ
- pointer操作とkeyboard操作の双方で、trigger/actionが別々のstatus文言を設定する
- action操作後にtrigger側のstatusへ上書きされない
- Tabでactionへfocusした際、Attachment containerに不透明3pxのfocus-within ringが出る
- 次のTabで全面triggerへ到達し、ringが維持される
- Light/Dark双方で3状態、文字、アイコン、spinner、error表現、focus ringが識別できる
- JPEG証跡が要求形式・拡張子・magic bytes・寸法を満たす

## テストケースと結果

| # | route | theme | 操作・動作パターン | 導出元 | リスク | selector件数 | console | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/preview/attachment/` | Light | hydration・初期構造 | コード・画面 | High | preview `1`、attachment `3` | error `0` | ✅実測確認 | 1/1 | 実DOM・Light JPEG | routeを開き`astro-island[ssr]`のdetached後にselector件数を評価 |
| 2 | `/preview/attachment/` | Light | state `done/uploading/error` | コード・型・画面 | High | attachment `3` | error `0` | ✅実測確認 | 1/1 | `data-state`配列 | 各attachmentのstate/title/descriptionをDOM順に取得 |
| 3 | `/preview/attachment/` | Light | Tab focus・3px ring | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | computed `box-shadow`、Light JPEG | BODYからTab → activeElementとcontainer computed styleを取得 |
| 4 | `/preview/attachment/` | Light | action keyboard操作 | コード・画面 | High | status `1` | error `0` | ✅実測確認 | 1/1 | 削除status | action focus中にEnter |
| 5 | `/preview/attachment/` | Light | trigger keyboard操作 | コード・画面 | High | status `1` | error `0` | ✅実測確認 | 1/1 | 選択status | actionからTabでtriggerへ移動してEnter |
| 6 | `/preview/attachment/` | Light | action pointer・trigger非誤発火 | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | 削除statusのみ | actionをclickしてstatusを確認 |
| 7 | `/preview/attachment/` | Light | trigger pointer | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | 選択status | 全面triggerをclickしてstatusを確認 |
| 8 | `/preview/attachment-dark/` | Dark | hydration・初期構造 | コード・画面 | High | preview `1`、attachment `3` | error `0` | ✅実測確認 | 1/1 | 実DOM・Dark JPEG | Lightと同じ |
| 9 | `/preview/attachment-dark/` | Dark | state `done/uploading/error` | コード・型・画面 | High | attachment `3` | error `0` | ✅実測確認 | 1/1 | `data-state`配列 | Lightと同じ |
| 10 | `/preview/attachment-dark/` | Dark | Tab focus・3px ring | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | computed `box-shadow`、Dark JPEG | Lightと同じ |
| 11 | `/preview/attachment-dark/` | Dark | action keyboard操作 | コード・画面 | High | status `1` | error `0` | ✅実測確認 | 1/1 | 削除status | Lightと同じ |
| 12 | `/preview/attachment-dark/` | Dark | trigger keyboard操作 | コード・画面 | High | status `1` | error `0` | ✅実測確認 | 1/1 | 選択status | Lightと同じ |
| 13 | `/preview/attachment-dark/` | Dark | action pointer・trigger非誤発火 | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | 削除statusのみ | Lightと同じ |
| 14 | `/preview/attachment-dark/` | Dark | trigger pointer | コード・画面 | High | action `1`、trigger `1` | error `0` | ✅実測確認 | 1/1 | 選択status | Lightと同じ |
| 15 | `/preview/attachment/` | Light | 視認性・JPEG | 画面 | Medium | preview `1` | error `0` | ✅実測確認 | 1/1 | Light JPEG | Tabでring表示中にfull-page screenshot |
| 16 | `/preview/attachment-dark/` | Dark | 視認性・JPEG | 画面 | Medium | preview `1` | error `0` | ✅実測確認 | 1/1 | Dark JPEG | Lightと同じ |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 初期DOMの実測

両routeで以下が一致した。

| DOM順 | state | title | description |
|---|---|---|---|
| 1 | `done` | `仕様書.pdf` | `1.8 MB・アップロード済み` |
| 2 | `uploading` | `写真.jpg` | `アップロード中` |
| 3 | `error` | `データ.csv` | `アップロードに失敗しました` |

追加のselector件数:

- `[data-slot="attachment-preview"]`: `1`
- `[data-slot="attachment"]`: `3`
- `[data-slot="attachment-action"]`: `1`
- `[data-slot="attachment-trigger"]`: `1`
- `[data-slot="attachment-preview"] > p[role="status"]`: `1`

最初のattachmentの実測寸法:

- container: 240.875×58 px
- 全面trigger: 238.875×56 px
- 前面action: 24×24 px
- trigger accessible name: `仕様書.pdfを開く`
- action accessible name: `仕様書.pdfを削除`

## keyboard操作の実測

両routeで同じ結果となった。

1. BODYからTab
   - activeElement: `BUTTON[data-slot="attachment-action"]`
   - accessible name: `仕様書.pdfを削除`
2. actionでEnter
   - status: `仕様書.pdfの削除操作を選びました。`
   - trigger側の文言への上書きなし
3. Tab
   - activeElement: `BUTTON[data-slot="attachment-trigger"]`
   - accessible name: `仕様書.pdfを開く`
4. triggerでEnter
   - status: `仕様書.pdfを選びました。`

actionとtriggerは別々のTab stopとして到達でき、各handlerだけが実行された。

## pointer操作の実測

両routeで同じ結果となった。

- 前面actionをclick:
  - activeElement: `attachment-action`
  - status: `仕様書.pdfの削除操作を選びました。`
  - trigger誤発火なし
- 全面triggerをclick:
  - activeElement: `attachment-trigger`
  - status: `仕様書.pdfを選びました。`

actionの親containerは実装上`z-20`、全面triggerは`z-10`で、実ブラウザでも両方を独立してclickできた。

## focus-within ringの実測

両routeで同一だった。

focus前:

```text
box-shadow: none
```

Tabでactionへfocusした後:

```text
box-shadow:
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
oklch(0.556 0 0) 0px 0px 0px 3px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px
```

関連computed custom properties:

```text
--tw-ring-color: oklch(55.6% 0 0)
--tw-ring-shadow: 0 0 0 calc(3px + 0px) oklch(55.6% 0 0)
```

ring色にalpha指定がなく、不透明な3px ringである。actionからtriggerへTab移動した後も同じringが維持された。

## 視認性

### Light

- `<html>`のtheme class: 空
- body: `oklch(1 0 0)`
- foreground: `oklch(0.145 0 0)`
- card: `oklch(1 0 0)`
- `done`: ファイルアイコン・タイトル・完了description・削除actionを識別可能
- `uploading`: spinner、淡色タイトル、アップロード中descriptionを識別可能
- `error`: 赤系media、border、descriptionを識別可能
- focus ring: card外周に不透明3pxで視認可能
- 文字欠け、重なり、クリップなし

### Dark

- `<html class="dark">`
- body: `oklch(0.145 0 0)`
- foreground: `oklch(0.985 0 0)`
- card: `oklch(0.205 0 0)`
- 3状態、spinner、error色、action、focus ringを背景から識別可能
- 文字欠け、重なり、クリップなし

## JPEG取得・形式検証

取得経路:

1. Chrome実ブラウザでactionにTab focusし、3px ring表示を確認
2. `tab.screenshot({ fullPage: true })`でPNG bytesを取得
3. 一時PNGとして保存
4. `/usr/bin/sips -s format jpeg -s formatOptions 90 <input.png> --out <requested.jpg>`
5. `file`、`xxd -l 16`、`sips`、SHA-256、目視で検証

| theme | requested format | 保存拡張子 | magic bytes | JFIF | 寸法 | size | SHA-256 |
|---|---|---|---|---|---|---|---|
| Light | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 37,905 bytes | `94e74bb3847daaa42c05cfe3735ea5b2a1d8657b8fd4e85833863dd147b0d971` |
| Dark | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 37,801 bytes | `e31b2dbe1e1bc2946c00b1ef75521cff132c07f8f9f9163dcd3758b3a50e51eb` |

`file`は両方を「JPEG image data, JFIF standard 1.01, baseline, precision 8, 1512x828, components 3」と判定した。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - state `idle`
  - state `processing`
  - size `sm`
  - size `xs`
  - orientation `vertical`
  - media variant `image`
  - Triggerのcustom `render`
- 画面から操作できるがコードで検証していない値:
  - 入力欄は存在しない
  - 操作可能要素は最初のattachmentのactionとtriggerのみ
- 型・スキーマにあるがpreviewで扱っていない値:
  - `idle`、`processing`
  - `sm`、`xs`
  - `vertical`
  - `image`
- コード・画面・型の一致:
  - previewの3stateは型定義に含まれる
  - DOM state、title、descriptionがコードと一致
  - action/triggerのaccessible nameとstatus更新がコードと一致
  - focus ringのcomputed実体が固定実装の3px契約と一致

## 未到達分岐（網羅の穴・機械的な証拠）

- `state="idle"`
- `state="processing"`
- `size="sm"`、`size="xs"`
- `orientation="vertical"`
- `AttachmentMedia variant="image"`
- `AttachmentTrigger render={...}`
- trigger/actionのdisabled状態
- 2件目・3件目へのtrigger/action追加
- 横スクロールが必要な狭幅viewport
- hover状態
- Spaceキーによるbutton activation
- pointer以外のtouch入力

## 発見した不具合

- 指定された確認範囲では不具合なし
- action操作によるtrigger誤発火はpointer・keyboardとも観測しなかった
- console errorはLight/Dark各0件
- flakyは観測しなかった

## 未列挙・未検証の残（正直な限界）

- Firefox、Safari、モバイルブラウザは未実施
- touch、狭幅viewport、zoom、forced-colorsは未実施
- axe等による全ページ自動a11y監査は未実施
- keyboard activationはEnterで検証し、Spaceは未実施
- screenshotは1512×828の1 viewportのみ
- uploading animationの長時間継続性・reduced-motionは未実施
- builderと判定者は同一だが、DOM値、computed style、操作列、JPEG実体を残して後から再検証可能にした

## 再現手順

ブラウザ操作:

```text
1. 対象routeを開く
2. astro-island[ssr]がdetachedになるまで待つ
3. [data-slot="attachment-preview"]のvisibleを確認
4. preview件数=1、attachment件数=3を確認
5. 各attachmentのdata-state/title/descriptionを取得
6. BODYからTab
7. activeElementが「仕様書.pdfを削除」であることを確認
8. 最初のattachmentのcomputed box-shadowを取得
9. Enterを入力し、statusが削除文言だけになることを確認
10. Tabを入力し、activeElementが「仕様書.pdfを開く」であることを確認
11. Enterを入力し、statusが選択文言になることを確認
12. actionをpointer clickし、削除文言だけになることを確認
13. triggerをpointer clickし、選択文言になることを確認
14. console error件数を取得
15. Light/Dark双方で1〜14を反復
```

画像形式の再検証:

```bash
file .docs/reviews/attachment-preview-light.jpg .docs/reviews/attachment-preview-dark.jpg
xxd -l 16 .docs/reviews/attachment-preview-light.jpg
xxd -l 16 .docs/reviews/attachment-preview-dark.jpg
/usr/bin/sips -g format -g pixelWidth -g pixelHeight \
  .docs/reviews/attachment-preview-light.jpg \
  .docs/reviews/attachment-preview-dark.jpg
shasum -a 256 \
  .docs/reviews/attachment-preview-light.jpg \
  .docs/reviews/attachment-preview-dark.jpg
```

## クリーンアップ

- 作成データ: 指定JPEG 2枚のみ
- 一時PNG:
  - `/tmp/attachment-preview-light.png`
  - `/tmp/attachment-preview-dark.png`
- 外部送信、削除、課金、永続データ変更: なし
- source・設定・既存証跡: 未変更
- ブラウザ検証タブ: 終了
- `.docs/actions/`への登録候補: なし
- brainへの記録候補: なし
