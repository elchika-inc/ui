# 動作検証レポート: Button Group Preview

verified_impl_sha: deac47739b86ae1ca9ad9ad3b3f26e83e153a9ac

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02T05:28:59+09:00
- 対象route:
  - `http://127.0.0.1:3013/preview/button-group/`
  - `http://127.0.0.1:3013/preview/button-group-dark/`
- OS: macOS 26.3.1、Darwin 25.3.0、arm64
- ブラウザ: Google Chrome 150.0.7871.187
- viewport: 1512×828 CSS px
- ランタイム: Node.js v26.4.0
- 実行可否: ✅ 実ブラウザで実行
- 検証開始時Git状態: clean
- 検証終了時Git状態: 指定JPEG 2枚のみ未追跡
- source・設定・既存証跡: 未変更
- レポートファイル: 指示どおり未作成

## 上流・実装から導出した動作契約

固定実装と`provenance.json`が指すshadcn/ui上流実装を全読した。

- `ButtonGroup`は`role="group"`を固定する
- orientation:
  - horizontal: `flex-direction: row`
  - vertical: `flex-direction: column`
- horizontalでは後続要素の左borderを除去し、内側角丸を0にする
- verticalでは後続要素の上borderを除去し、内側角丸を0にする
- focus-visible要素を`relative z-10`へ引き上げる
- `ButtonGroupSeparator`の既定orientationはvertical
- previewには以下の3 groupがある:
  - 配置: horizontal、button 3件
  - 数量: horizontal、text、vertical separator、button 2件
  - 表示密度: vertical、button 3件、horizontal separator 2件

## 成功基準（rubric・実行前に定義）

- hydration後、`astro-island[ssr]`がなくなる
- `[data-slot="button-group-preview"]`が1件存在する
- `[data-slot="button-group"]`が3件存在する
- 各groupが`role="group"`と名前「配置」「数量」「表示密度」を持つ
- `data-orientation`が順に`horizontal/horizontal/vertical`
- horizontal groupは実寸とflex方向が横、vertical groupは縦
- separatorが計3件で、数量内はvertical、表示密度内はhorizontal
- buttonが8件で、accessible nameのDOM順とTab順が一致する
- focus transition完了後、不透明3px ringを視認できる
- 連結要素間の実寸gap/overlapが0px
- 内側borderが重複せず、角丸が外周だけに残る
- Light/Dark双方で文字・アイコン・separator・境界・focus ringを識別できる
- console errorが各routeで0件
- JPEG証跡が要求形式・magic bytes・拡張子・寸法を満たす

## テストケースと結果

| # | route | theme | 操作・動作パターン | 導出元 | リスク | selector件数 | console | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/preview/button-group/` | Light | hydration・初期構造 | コード・画面 | High | preview `1`、group `3` | error `0` | ✅実測確認 | 1/1 | 実DOM・Light JPEG | routeを開きSSR属性のdetached後に件数確認 |
| 2 | 同上 | Light | role・accessible name | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | a11y tree・実DOM | roleと`aria-label`を取得 |
| 3 | 同上 | Light | orientation・実寸方向 | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | rect・computed flex-direction | groupごとのrectとstyleを取得 |
| 4 | 同上 | Light | separator orientation | コード・画面 | High | separator `3` | error `0` | ✅実測確認 | 1/1 | ARIA/data属性・rect | separatorをgroup別に取得 |
| 5 | 同上 | Light | button DOM/Tab順 | コード・画面 | High | button `8` | error `0` | ✅実測確認 | 1/1 | activeElement操作列 | BODYからTab×8 |
| 6 | 同上 | Light | focus ring | コード・画面 | High | button `8` | error `0` | ✅実測確認 | 1/1 | computed style・Light JPEG | Tab後、transition完了を待ってstyle取得 |
| 7 | 同上 | Light | 連結border・角丸 | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | 隣接差分・border・radius | 全direct childのrect/styleを取得 |
| 8 | `/preview/button-group-dark/` | Dark | hydration・初期構造 | コード・画面 | High | preview `1`、group `3` | error `0` | ✅実測確認 | 1/1 | 実DOM・Dark JPEG | Lightと同じ |
| 9 | 同上 | Dark | role・accessible name | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | a11y tree・実DOM | Lightと同じ |
| 10 | 同上 | Dark | orientation・実寸方向 | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | rect・computed flex-direction | Lightと同じ |
| 11 | 同上 | Dark | separator orientation | コード・画面 | High | separator `3` | error `0` | ✅実測確認 | 1/1 | ARIA/data属性・rect | Lightと同じ |
| 12 | 同上 | Dark | button DOM/Tab順 | コード・画面 | High | button `8` | error `0` | ✅実測確認 | 1/1 | activeElement操作列 | Lightと同じ |
| 13 | 同上 | Dark | focus ring | コード・画面 | High | button `8` | error `0` | ✅実測確認 | 1/1 | computed style・Dark JPEG | Lightと同じ |
| 14 | 同上 | Dark | 連結border・角丸 | コード・画面 | High | group `3` | error `0` | ✅実測確認 | 1/1 | 隣接差分・border・radius | Lightと同じ |
| 15 | `/preview/button-group/` | Light | 視認性・JPEG | 画面 | Medium | preview `1` | error `0` | ✅実測確認 | 1/1 | Light JPEG | focus表示中にfull-page screenshot |
| 16 | `/preview/button-group-dark/` | Dark | 視認性・JPEG | 画面 | Medium | preview `1` | error `0` | ✅実測確認 | 1/1 | Dark JPEG | Lightと同じ |

## group role・名前・orientation・実寸

両themeで同じ寸法と構造だった。

| DOM順 | role | accessible name | data-orientation | computed方向 | 実寸 |
|---|---|---|---|---|---|
| 1 | `group` | 配置 | horizontal | row | 96×32 px |
| 2 | `group` | 数量 | horizontal | row | 115×32 px |
| 3 | `group` | 表示密度 | vertical | column | 91.164×98 px |

horizontal 2件は幅が高さを上回り、direct childのx座標が増加した。vertical 1件は高さが幅を上回り、direct childのy座標が増加した。

## separatorの実測

- 総件数: `3`
- 数量group:
  - role: `separator`
  - `aria-orientation="vertical"`
  - `data-orientation="vertical"`
  - 実寸: 1×30 px
- 表示密度group:
  - 2件ともrole: `separator`
  - `aria-orientation="horizontal"`
  - `data-orientation="horizontal"`
  - 実寸: 89.164×1 px

group方向を分断する線として、数量では縦線、表示密度では横線になっていた。

## button accessible name・DOM順・Tab順

DOM順とTab順はLight/Darkで完全一致した。

1. 配置 / 左揃え
2. 配置 / 中央揃え
3. 配置 / 右揃え
4. 数量 / 減らす
5. 数量 / 増やす
6. 表示密度 / コンパクト
7. 表示密度 / 標準
8. 表示密度 / ゆったり

separatorと「数量」textはTab stopにならなかった。

## focus ringの実測

最初のTabで「左揃え」へfocusした。

実装に`transition-all 0.15s`があるため、focus直後はringが補間途中だった。250ms後に再計測した確定値はLight/Darkで同一だった。

```text
box-shadow:
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
oklch(0.556 0 0) 0px 0px 0px 3px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px
```

```text
--tw-ring-shadow: 0 0 0 calc(3px + 0px) oklch(55.6% 0 0)
```

ring色にalpha指定はなく、不透明3pxである。JPEGでも最初の「左揃え」の外周ringを識別できた。

## 連結border・角丸の実測

### 配置・horizontal

- 隣接差分: `0px, 0px`
- 左揃え: 左border `1px`、左角丸 `10px`、右角丸 `0px`
- 中央揃え: 左border `0px`、全角丸 `0px`
- 右揃え: 左border `0px`、左角丸 `0px`、右角丸 `10px`

### 数量・horizontal

- text → separator → 減らす → 増やすの隣接差分: 全て`0px`
- 先頭textだけ左角丸`10px`
- separatorは1px幅、borderなし
- 後続buttonの左borderは`0px`
- 最後の「増やす」だけ右角丸`10px`

### 表示密度・vertical

- button → separator → button → separator → buttonの隣接差分: 全て`0px`
- 「コンパクト」だけ上角丸`10px`
- separatorは1px高、borderなし
- 「標準」「ゆったり」の上borderは`0px`
- 「ゆったり」だけ下角丸`10px`

幾何学的な隙間・重なりはなく、接合部のborder重複、角丸欠け、内側角丸の残留は観測しなかった。

## 視認性

### Light

- body background: `oklch(1 0 0)`
- foreground: `oklch(0.145 0 0)`
- 配置アイコン、数量text、増減アイコン、表示密度の3文言を識別可能
- separator、外周角丸、接合線、focus ringを識別可能
- 文字欠け・意図しない重なり・クリップなし

### Dark

- `<html class="dark">`
- body background: `oklch(0.145 0 0)`
- foreground: `oklch(0.985 0 0)`
- button背景: `oklab(1 0 0 / 0.045)`
- separator背景: `oklch(1 0 0 / 0.15)`
- Lightと同じ構造・境界・focus ringを暗色背景上で識別可能
- 文字欠け・意図しない重なり・クリップなし

## JPEG取得・形式検証

取得経路:

1. Chrome実ブラウザで「左揃え」へTab focus
2. 0.15秒のtransition完了後に3px ringを再計測
3. `tab.screenshot({ fullPage: true })`でPNG bytesを取得
4. `/usr/bin/sips -s format jpeg -s formatOptions 90 <input.png> --out <requested.jpg>`
5. `file`、`xxd`、`sips`、SHA-256、目視で検証

| theme | requested format | 拡張子 | magic bytes | JFIF | 寸法 | size | SHA-256 |
|---|---|---|---|---|---|---|---|
| Light | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 27,662 bytes | `b73811e4fcf2cb000342857038f0fdb04e07cfe4c35ee29674700dff5dc631ea` |
| Dark | JPEG | `.jpg` | `ff d8 ff e0 00 10 4a 46 49 46` | 1.01 | 1512×828 | 27,581 bytes | `d29cdb144971adc04932c6dbbcf88530a940a4aea363bd2a1e57a82b654ebba9` |

両ファイルとも`file`で「JPEG image data, JFIF standard 1.01, baseline, precision 8, 1512x828, components 3」と判定された。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - orientation未指定時の既定horizontal
  - nested ButtonGroup用の`gap-2`
  - select triggerとの連結
  - input childの`flex-1`
  - `ButtonGroupText render`
- 画面から操作できるがコードで検証していない値:
  - buttonは状態変更handlerを持たず、押下後の業務状態は存在しない
- 型・スキーマにあるがpreviewで扱っていない値:
  - custom `className`
  - `ButtonGroupText render`
  - 任意のSeparator props
- コード・画面・型の一致:
  - role/name、orientation、separator、DOM順は実装と一致
  - CSS接合規則は実寸・computed border/radiusと一致

## 未到達分岐（網羅の穴・機械的な証拠）

- orientation省略
- nested ButtonGroup
- select trigger連結
- input連結
- `ButtonGroupText render`
- disabled button
- loading button
- button variant・sizeの追加組み合わせ
- RTL
- 狭幅viewport
- hover・active状態
- pointer click後の状態変化

## 発見した不具合

- 指定された確認範囲では不具合なし
- console errorはLight/Dark各0件
- flakyは観測しなかった
- focus直後のring補間値はCSS transition中の一時値であり、完了後は期待どおり不透明3pxとなった

## 未列挙・未検証の残（正直な限界）

- Firefox、Safari、モバイルブラウザは未実施
- RTL、zoom、forced-colors、狭幅viewportは未実施
- axe等による全ページ自動a11y監査は未実施
- hover・active・disabled・loading状態は未実施
- screenshotは1512×828の1 viewportのみ
- builderと判定者は同一だが、DOM値、実寸、computed style、Tab操作列、JPEG実体を残した

## 再現手順

ブラウザ操作:

```text
1. 対象routeを開く
2. astro-island[ssr]がdetachedになるまで待つ
3. [data-slot="button-group-preview"]のvisibleを確認
4. preview=1、group=3、separator=3、button=8を確認
5. 各groupのrole、aria-label、data-orientation、rect、flex-directionを取得
6. 各direct childのrect、border幅、四隅radiusを取得
7. 隣接child間のx/y差分を算出
8. 各separatorのrole、aria-orientation、data-orientation、rectを取得
9. BODYからTabを8回入力し、各activeElementの名前と所属groupを記録
10. 最初のTab後、transition完了を待ち、focus buttonのbox-shadowを取得
11. console error件数を取得
12. Light/Dark双方で1〜11を反復
```

画像形式の再検証:

```bash
file .docs/reviews/button-group-preview-light.jpg .docs/reviews/button-group-preview-dark.jpg
xxd -l 16 .docs/reviews/button-group-preview-light.jpg
xxd -l 16 .docs/reviews/button-group-preview-dark.jpg
/usr/bin/sips -g format -g pixelWidth -g pixelHeight \
  .docs/reviews/button-group-preview-light.jpg \
  .docs/reviews/button-group-preview-dark.jpg
shasum -a 256 \
  .docs/reviews/button-group-preview-light.jpg \
  .docs/reviews/button-group-preview-dark.jpg
```

## クリーンアップ

- 作成データ: 指定JPEG 2枚のみ
- 一時PNG:
  - `/tmp/button-group-preview-light.png`
  - `/tmp/button-group-preview-dark.png`
- 外部送信、削除、課金、永続データ変更: なし
- source・設定・既存証跡: 未変更
- ブラウザ検証タブ: 終了
- `.docs/actions/`への登録候補: なし
- brainへの記録候補: なし
