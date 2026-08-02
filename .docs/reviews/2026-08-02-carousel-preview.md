# 動作検証レポート: Carousel preview

verified_impl_sha: ff8d5bba41fa6cea951afcd9e49b3fbb85084be1

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 06:07:00 JST (+0900)
- 対象:
  - Light: `http://127.0.0.1:3013/preview/carousel`
  - Dark: `http://127.0.0.1:3013/preview/carousel-dark`
- OS: macOS 26.3.1 (25D2128), arm64
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- `embla-carousel-react`: 8.6.0
- 実行可否: ✅実行した
- Git状態: 対象SHAと一致。検証前後とも `git status --short` は空
- 副作用: リポジトリファイルの変更なし

## 成功基準（rubric・実行前に定義）

- hydration後に `[data-slot="carousel-preview"]` とCarousel rootが各1個存在する。
- rootが `role="region"`、`aria-roledescription="carousel"`、`aria-label="導入手順"` を持つ。
- 3つのslideが `role="group"`、`aria-roledescription="slide"`、`1 / 3`〜`3 / 3` のlabelを持つ。
- 初期状態が `スライド 1 / 3`、Previous disabled、Next enabledとなる。
- button操作で1→2→3と進み、末尾でNext disabledとなる。戻ると先頭でPrevious disabledになる。
- rootへTabでfocusした後、ArrowRight / ArrowLeftがbutton操作と同じ遷移を行う。
- 先頭・末尾で矢印キーを追加しても範囲外へ進まない。
- status、実transform、実際にviewport内へ表示されたslideが一致する。
- rootとnavigation buttonのfocus ringがcomputed style上で3px、不透明となる。
- Light / Darkで背景・前景・card・border・statusの色が切り替わる。
- console errorが両テーマとも0件となる。
- 指定JPEGが実在し、magic bytes、dimensions、size、SHA-256を取得できる。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順（コマンド／操作） |
|---|---|---|---|---|---|---|---|---|
| 1 | hydrationとCarousel root | コード・画面 | 0スイッチ | High | ✅実測確認 | 2/2 | 両テーマでpreview=1、root=1 | 各URLを開き、SSR属性の消滅とpreview可視化を待機 |
| 2 | ARIA region構造 | コード・画面・型 | 構造検査 | High | ✅実測確認 | 2/2 | region、carousel、導入手順、`tabindex=0` | hydration後のDOM snapshotと属性取得 |
| 3 | 3枚のslide構造 | コード・画面 | 同値分割 | High | ✅実測確認 | 2/2 | group×3、slide×3、label=`1 / 3`〜`3 / 3` | `[data-slot="carousel-item"]` を全列挙 |
| 4 | 初期statusと先頭境界 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | status=`スライド 1 / 3`、Previous disabled、Next enabled | 各URLの初期状態を取得 |
| 5 | Next clickで2枚目へ遷移 | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | status=`2 / 3`、両button enabled、2枚目だけ384px表示 | `次のスライド` を1回クリックし、アニメーション収束を待機 |
| 6 | 末尾3枚目とNext境界 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | status=`3 / 3`、Previous enabled、Next disabled、3枚目だけ384px表示 | Nextをさらに1回クリック |
| 7 | Previousで先頭へ復帰 | 画面 | 1スイッチ状態遷移 | High | ✅実測確認 | 2/2 | 3→2→1、先頭でPrevious disabled、Next enabled | Previousを2回クリック |
| 8 | root focusからArrowRight / Left | コード・画面 | 状態遷移 | High | ✅実測確認 | 2/2 | rootにfocusを保ったまま1→2→3→2→1 | 再読込→Tab→ArrowRight×2→ArrowLeft×2 |
| 9 | キーボード両端境界 | コード・画面 | 境界値 | High | ✅実測確認 | 2/2 | 末尾で追加ArrowRight後も3/3、先頭で追加ArrowLeft後も1/3 | ケース8で各端へ到達後、同方向キーを追加 |
| 10 | transform・可視slide・statusの一致 | コード・画面 | 実体照合 | High | ✅実測確認 | 2/2 | 1枚目≈0px、2枚目≈-400px、3枚目≈-800px。該当slideだけ384px表示 | track computed transformと各slide/viewportの交差幅を取得 |
| 11 | root focus ring | コード・画面 | computed style | High | ✅実測確認 | 2/2 | `oklch(0.556 0 0) ... 3px`、alphaなし | 初期状態でTab→250ms待機→rootのbox-shadow取得 |
| 12 | navigation button focus ring | コード・画面 | computed style | High | ✅実測確認 | 2/2 | Next buttonに同じ3px不透明ring | 初期状態でTab×2。disabledなPreviousがskipされNextへfocus |
| 13 | Light / Dark配色 | コード・画面 | 同値分割 | Medium | ✅実測確認 | 2/2 | 下記配色実測値参照 | body、card、border、statusのcomputed color取得 |
| 14 | console error | 画面 | 異常系監視 | High | ✅実測確認 | 2/2 | Light=`[]`、Dark=`[]` | 全操作後にBrowser dev logsをerror levelで取得 |
| 15 | JPEG証跡 | 実体ファイル | 書き出しゲート | High | ✅実測確認 | 2/2 | 下記JPEG証跡参照 | Browser screenshot→PNG→`sips`→形式・hash検査 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky（再現率を併記） / ⏭️未実行（破壊的・要人間実行） / ❌不具合

導出元ラベル: コード / 画面 / スキーマ（複数可）

## 実測詳細

### ARIA構造

hydration後のaccessibility tree:

- region: `導入手順`
- group `1 / 3`
  - ステップ1
  - 見出し「基盤」
  - 「共通トークンと公開APIを確認します。」
- group `2 / 3`
  - ステップ2
  - 見出し「検証」
  - 「操作・focus・境界状態を実測します。」
- group `3 / 3`
  - ステップ3
  - 見出し「配布」
  - 「registryとライブラリの両経路へ届けます。」
- button `前のスライド`
- button `次のスライド`
- status `スライド 1 / 3`

### button操作

Light / Darkとも同じ結果:

| 状態 | status | Previous | Next | 可視slide | 収束時transform |
|---|---|---|---|---|---|
| 初期 | `スライド 1 / 3` | disabled | enabled | 1枚目 384px | `matrix(..., 0, 0)` |
| Next×1 | `スライド 2 / 3` | enabled | enabled | 2枚目 384px | 約 `matrix(..., -400, 0)` |
| Next×2 | `スライド 3 / 3` | enabled | disabled | 3枚目 384px | 約 `matrix(..., -800, 0)` |
| Previous×1 | `スライド 2 / 3` | enabled | enabled | 2枚目 | 約-400px |
| Previous×2 | `スライド 1 / 3` | disabled | enabled | 1枚目 | `matrix(..., 0, 0)` |

### rootキーボード操作

- 初期画面でTabを1回押すと、`document.activeElement.dataset.slot` は `carousel`。
- ArrowRight 1回:
  - active=`carousel`
  - status=`スライド 2 / 3`
  - transform≈-400px
- ArrowRight 2回:
  - status=`スライド 3 / 3`
  - transform≈-800px
  - Next disabled
- 末尾でArrowRightを追加:
  - statusは3/3のまま
  - transformは-800pxのまま
- ArrowLeftで2/3、さらにArrowLeftで1/3へ復帰。
- 先頭でArrowLeftを追加:
  - statusは1/3のまま
  - transformは0pxのまま
- 全操作中、rootが実focusを保持した。

### transformの非決定的な中間値

Emblaのscroll animation中は、例えば-399.72px、-799.70px、先頭復帰直後-0.01pxのような小数残差を観測した。これはstatus更新後も短時間継続するアニメーションの途中値である。

1〜1.5秒待機後、先頭は0px、中央は-399.99px付近、末尾は-800pxへ収束し、viewportとの交差幅では対象slideだけが384px表示された。status・見出し・可視slideに不一致はなかったため、不具合とは判定しない。

### focus ring

rootとNext buttonで共通:

```text
box-shadow:
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px,
oklch(0.556 0 0) 0px 0px 0px 3px,
rgba(0, 0, 0, 0) 0px 0px 0px 0px
```

ring色の`oklch(0.556 0 0)`にはalpha指定がなく、不透明。幅は3px。

### 配色

| 対象 | Light | Dark |
|---|---|---|
| body background | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| body foreground | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| card background | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| card foreground | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| card border | `oklch(0.922 0 0)` | `oklch(1 0 0 / 0.1)` |
| status | `oklch(0.54 0 0)` | `oklch(0.708 0 0)` |

## JPEG証跡

取得経路:

1. Browser API `tab.screenshot({ format: "png" })` でPNG bytesを取得。
2. `/private/tmp/carousel-preview-{light,dark}.png` へ一時保存。
3. `/usr/bin/sips -s format jpeg -s formatOptions 90 <png> --out <jpg>` でJPEGへ変換。
4. `file`、`xxd -l 16`、`sips -g pixelWidth -g pixelHeight -g format`、`shasum -a 256` で検査。
5. 中間PNGは削除し、指定JPEGだけを残した。

両JPEGは、rootへfocusした状態でArrowRightにより2枚目「検証」へ移動した画面。画面上の見出しとstatus `スライド 2 / 3`、実transform約-400pxが一致している。

| Theme | 保存先 | magic / format | dimensions | size | SHA-256 |
|---|---|---|---|---:|---|
| Light | `/private/tmp/carousel-preview-light.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×828 | 31,942 bytes | `c2643ca73b165ea99b42cb3f9eb91c96da9b9a5e36b02994c03d4d07822105de` |
| Dark | `/private/tmp/carousel-preview-dark.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×772 | 30,788 bytes | `69578eed26e5a46592b44035aea6120a08695b7b4d874b84c65a2fa7c7cda0ce` |

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - `orientation="vertical"` と縦方向class
  - `opts.axis="y"`
  - plugins指定
  - `setApi`未指定
  - API未初期化時のearly return
  - `reInit`イベント
  - `useCarousel()`をProvider外で呼ぶ例外
  - component利用者がbutton propsを上書きする経路
- 画面から入力できるがコードで検証していない値:
  - 自由入力なし。操作可能要素はCarousel root、Previous、Nextの3種。
  - pointer drag / swipeは画面から可能だが今回未検証。
- スキーマにあるがコードで扱っていないパラメータ:
  - `CarouselProps`はEmblaのopts/plugins、orientation、setApiと通常div propsを公開する。
  - previewはhorizontal既定値とsetApiのみを利用。公開propsの残りはpreview網羅外であり、仕様乖離とは判定しない。
- コード・画面・状態の不一致:
  - 今回の対象ケースでは検出なし。

## 未到達分岐（網羅の穴・機械的な証拠）

- vertical orientation
- `loop=true`
- `dragFree`等のEmbla options
- plugins
- 0枚、1枚、4枚以上のslide
- dynamic slide増減と`reInit`
- resize中の再計算
- Provider外の`useCarousel`
- API初期化前・unmount直後の操作
- 利用者指定のbutton `disabled` / `onClick`上書き
- pointer drag、touch swipe、trackpad
- RTL

## 発見した不具合（あれば）

- 対象ケースでは不具合を検出しなかった。
- transformの小数残差はアニメーション中だけで、収束後の可視slide・status・境界状態は一致した。
- flakyなケースなし。

## 未列挙・未検証の残（正直な限界）

- macOS上のGoogle Chrome以外のブラウザ、OS
- モバイル、touch、pointer drag、trackpad
- vertical、loop、plugins、dragFree
- 動的なslide追加・削除
- zoom、forced-colors、prefers-reduced-motion
- 画面サイズ変更時の再初期化
- 高速連打・キーリピート・複数入力の競合
- 長時間連続操作

## クリーンアップ

- アプリケーションデータの作成・削除なし。
- 中間PNG 2件を削除済み。
- 指定JPEG 2件のみ保存。
- リポジトリ変更なし。
- `.docs/actions/` への登録候補: なし。
- brainへの記録候補: アニメーションUIはstatus更新直後のtransformだけで判定せず、収束待機と実viewport交差を併用する。
