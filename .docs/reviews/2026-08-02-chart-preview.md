# 動作検証レポート: Chart preview

verified_impl_sha: 16355c5020366797a812f21ad0fa5321310e07a0

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 06:21:56 JST (+0900)
- 対象:
  - Light: `http://127.0.0.1:3013/preview/chart`
  - Dark: `http://127.0.0.1:3013/preview/chart-dark`
- OS: macOS 26.3.1 (25D2128), arm64
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- Recharts: 3.8.0
- 実行可否: ✅実行した
- Git状態: 対象SHAと一致。検証前後とも `git status --short` は空
- 副作用: リポジトリファイルの変更なし

## 成功基準（rubric・実行前に定義）

- hydration後に `[data-slot="chart-preview"]` と `[data-slot="chart"]` が各1個存在する。
- Chart rootが `role="img"`、`aria-label="月別利用者数"` を持つ。
- Recharts SVGとaccessibility layerが実DOMに存在する。
- X軸はデータどおり5月〜8月で、4月を含まない。
- desktop / mobileの2系列に各4本、合計8本のbarが存在する。
- legendに「デスクトップ」「モバイル」が表示される。
- `--color-desktop` / `--color-mobile` がテーマトークンへ解決され、SVG barのcomputed fillへ届く。
- legend indicatorと対応するbarのcomputed colorが一致する。
- desktop系列とmobile系列の実barをhoverすると、Tooltipが実DOMで可視となり、月・系列名・値を表示する。
- style要素にLight/Dark ruleがあり、sourceが`dangerouslySetInnerHTML`を使用しない。
- Light / Darkでbar色と背景色が切り替わる。
- console errorが両テーマとも0件となる。
- 指定JPEGが実在し、magic bytes、dimensions、size、SHA-256を取得できる。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順（コマンド／操作） |
|---|---|---|---|---|---|---|---|---|
| 1 | hydrationとChart root | コード・画面 | 0スイッチ | High | ✅実測確認 | 2/2 | preview=1、chart=1、role=`img`、label=`月別利用者数` | 各URLを開きSSR属性消滅、previewとSVG可視化を待機 |
| 2 | Recharts SVG・accessibility layer | コード・画面 | 構造検査 | High | ✅実測確認 | 2/2 | SVG=1、class=`recharts-surface`、role=`application`、tabindex=`0` | hydration後にSVG属性と`[role="application"]`を取得 |
| 3 | 月ラベル5月〜8月 | コード・画面・スキーマ | 同値分割 | High | ✅実測確認 | 2/2 | `["5月","6月","7月","8月"]`、4月なし | `text.recharts-cartesian-axis-tick-value`を全列挙 |
| 4 | 2系列×4本のbar | コード・画面 | CRUD相当マトリクス | High | ✅実測確認 | 2/2 | `.recharts-bar`=2、bar rectangle=8 | series groupとrectangleを全数取得 |
| 5 | legendラベル | コード・画面 | 同値分割 | Medium | ✅実測確認 | 2/2 | `デスクトップモバイル` | `.recharts-legend-wrapper`の実DOMを取得 |
| 6 | CSS変数からbar fillへの伝播 | コード・画面 | データフロー照合 | High | ✅実測確認 | 2/2 | 下記テーマ色表参照 | root custom properties、bar fill属性、computed fillを取得 |
| 7 | legend indicatorとbar色 | コード・画面 | ペア照合 | High | ✅実測確認 | 4/4 | 両テーマ×2系列で完全一致 | indicatorのcomputed backgroundとbarのcomputed fillを比較 |
| 8 | desktop系列bar hover | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 5月barで`5月デスクトップ186モバイル80` | desktop系列5月barの実bounding box中央へpointer移動 |
| 9 | mobile系列bar hover | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 8月barで`8月デスクトップ273モバイル190` | mobile系列8月barの実bounding box中央へpointer移動 |
| 10 | Tooltip indicator色 | コード・画面 | ペア照合 | Medium | ✅実測確認 | 4/4 | Tooltip内の2色が各テーマのbar色と一致 | 可視Tooltip内`--color-bg`のcomputed background取得 |
| 11 | Light/Dark style rule | コード・画面 | 静的・動的照合 | High | ✅実測確認 | 2/2 | style要素1個、通常selectorと`.dark` selectorを確認 | Chart root内style textを取得 |
| 12 | `dangerouslySetInnerHTML`不使用 | コード | 静的検査 | High | ✅実測確認 | 1/1 | `dangerous_html_present=no` | `rg -n 'dangerouslySetInnerHTML'` |
| 13 | console error | 画面 | 異常系監視 | High | ✅実測確認 | 2/2 | Light=`[]`、Dark=`[]` | 全操作後にBrowser dev logsをerror levelで取得 |
| 14 | JPEG証跡 | 実体ファイル | 書き出しゲート | High | ✅実測確認 | 2/2 | 下記JPEG証跡参照 | Browser screenshot→PNG→`sips`→形式・hash検査 |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky（再現率を併記） / ⏭️未実行（破壊的・要人間実行） / ❌不具合

導出元ラベル: コード / 画面 / スキーマ（複数可）

## 実測詳細

### DOM・accessibility layer

両テーマで以下を確認した。

```text
img "月別利用者数"
├─ generic "デスクトップ"
├─ generic "モバイル"
└─ application
   ├─ generic "5月"
   ├─ generic "6月"
   ├─ generic "7月"
   └─ generic "8月"
```

- Chart root:
  - `data-slot="chart"`
  - `role="img"`
  - `aria-label="月別利用者数"`
- Recharts SVG:
  - `class="recharts-surface"`
  - `role="application"`
  - `tabindex="0"`
- `accessibilityLayer`指定はsourceに1件存在。
- 4月ラベルはDOM・accessibility treeのいずれにも存在しない。

### データとbar

| 月 | desktop | mobile |
|---|---:|---:|
| 5月 | 186 | 80 |
| 6月 | 305 | 200 |
| 7月 | 237 | 120 |
| 8月 | 273 | 190 |

実DOMではdesktop系列4本、mobile系列4本、合計8本。全barのheightは正数で、データ大小関係と描画高の大小関係が一致した。

### テーマ色の伝播

Light:

| 系列 | theme token | `--color-*` | bar fill属性 | bar computed fill | legend computed |
|---|---|---|---|---|---|
| desktop | `--chart-1: oklch(55.6% 0 0)` | `oklch(55.6% 0 0)` | `var(--color-desktop)` | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` |
| mobile | `--chart-2: oklch(43.9% 0 0)` | `oklch(43.9% 0 0)` | `var(--color-mobile)` | `oklch(0.439 0 0)` | `oklch(0.439 0 0)` |

Dark:

| 系列 | theme token | `--color-*` | bar fill属性 | bar computed fill | legend computed |
|---|---|---|---|---|---|
| desktop | `--chart-1: oklch(87% 0 0)` | `oklch(87% 0 0)` | `var(--color-desktop)` | `oklch(0.87 0 0)` | `oklch(0.87 0 0)` |
| mobile | `--chart-2: oklch(78% 0 0)` | `oklch(78% 0 0)` | `var(--color-mobile)` | `oklch(0.78 0 0)` | `oklch(0.78 0 0)` |

背景色もLight=`oklch(1 0 0)`、Dark=`oklch(0.145 0 0)`へ切り替わった。

### Tooltip

Tooltip wrapperは初期状態で`visibility: hidden`、中身なし。

desktop系列5月barをhover後:

```text
visibility: visible
5月
デスクトップ 186
モバイル 80
```

mobile系列8月barをhover後:

```text
visibility: visible
8月
デスクトップ 273
モバイル 190
```

Rechartsの共有axis Tooltipであるため、どちらの系列barをhoverしても同じ月の両系列が表示される。各系列から実際にTooltipを発火でき、月label・系列label・対応値を確認した。

Tooltip indicatorも、Lightではdesktop=`oklch(0.556 0 0)`、mobile=`oklch(0.439 0 0)`、Darkではdesktop=`oklch(0.87 0 0)`、mobile=`oklch(0.78 0 0)`となり、bar・legendと一致した。

### style生成

実DOMのstyle要素は次の構造だった。動的なchart ID部分だけ省略する。

```css
[data-chart=<chart-id>] {
  --color-desktop: var(--chart-1);
  --color-mobile: var(--chart-2);
}

.dark [data-chart=<chart-id>] {
  --color-desktop: var(--chart-1);
  --color-mobile: var(--chart-2);
}
```

sourceではCSS textをReactの`<style>{cssText}</style>`として描画している。`dangerouslySetInnerHTML`は存在しない。

## JPEG証跡

取得経路:

1. Browser API `tab.screenshot({ format: "png" })` で通常viewportのPNG bytesを取得。
2. `/private/tmp/chart-preview-{light,dark}.png` へ一時保存。
3. `/usr/bin/sips -s format jpeg -s formatOptions 90 <png> --out <jpg>` でJPEGへ変換。
4. `file`、`xxd -l 16`、`sips -g pixelWidth -g pixelHeight -g format`、`shasum -a 256`で検査。
5. 中間PNGは削除し、指定JPEGだけを残した。

JPEGは8月mobile barをhoverし、8本のbarとTooltip `8月 / デスクトップ 273 / モバイル 190` が同時に見える状態。

| Theme | 保存先 | magic / format | dimensions | size | SHA-256 |
|---|---|---|---|---:|---|
| Light | `/private/tmp/chart-preview-light.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×828 | 51,555 bytes | `09c80312b0d32ac4fb1caf6db310580b49b81eaa4804c950ab12863dd51ce736` |
| Dark | `/private/tmp/chart-preview-dark.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×772 | 46,868 bytes | `4dd744dd2d286be6fe5379b7e0b20b5e6b4c66de0899572481ec0b816f8c0c81` |

### 証跡取得上の注意

`fullPage: true`での撮影も試行したが、撮影時の一時的なviewport変更でResponsiveContainerが再計算され、bar animation開始時の高さ0に近い瞬間が写った。DOM上では直前まで8本のbarが正の高さを持っており、通常viewport撮影では8本すべてが写ることを再確認した。

このfull-page画像は実状態と一致しない偽証跡として破棄し、通常viewportで再取得したJPEGを採用した。製品不具合とは判定しない。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - colorなしconfigで`ChartStyle`が`null`を返す分岐
  - seriesごとの`theme.light` / `theme.dark`指定
  - Tooltipの`hideLabel` / `hideIndicator`
  - Tooltip indicatorの`line` / `dashed`
  - `labelFormatter` / `formatter`
  - config icon
  - `nameKey` / `labelKey`
  - payloadなし、`type="none"`、null value
  - Legendの`hideIcon` / `verticalAlign="top"` / `nameKey`
- 画面から入力できるがコードで検証していない値:
  - 自由入力なし。
  - SVGのkeyboard navigationとtouch interactionは未検証。
- スキーマにあるがコードで扱っていないパラメータ:
  - ChartTooltip / ChartLegendはRecharts propsを広く公開するが、previewは既定Tooltip、既定Legend、BarChartだけを使う。
  - 未使用propsはpreview網羅外であり、仕様乖離とは判定しない。
- コード・画面・データの不一致:
  - 検出なし。

## 未到達分岐（網羅の穴・機械的な証拠）

- colorなし・空config
- themeオブジェクト指定
- Tooltip全variant、formatter、icon
- Legend全variant
- Line / Area / Pie / Radar等の他chart種別
- null、負数、0、非常に大きな値
- 5系列以上、長い系列名
- データ0件・1件
- 動的データ更新
- resize後のResponsiveContainer再計算
- locale・数値桁区切りの別条件

## 発見した不具合（あれば）

- 対象ケースでは不具合を検出しなかった。
- flakyなケースなし。
- full-page screenshotのbar消失は撮影時のviewport再計算による証跡取得経路の問題であり、通常表示中の製品DOMでは再現しなかった。

## 未列挙・未検証の残（正直な限界）

- macOS上のGoogle Chrome以外のブラウザ、OS
- モバイル、touch
- SVG keyboard navigation
- viewport resize、zoom
- forced-colors、prefers-reduced-motion
- Tooltipの全8本hover。今回は各系列から代表1本ずつ実行
- 高速pointer移動時のTooltip追随
- 長いlabel、欠損値、負値、大量データ
- screen reader実機での読み上げ順

## クリーンアップ

- アプリケーションデータの作成・削除なし。
- 中間PNG 2件と不採用full-page JPEGを削除・上書き済み。
- 指定JPEG 2件のみ保存。
- リポジトリ変更なし。
- `.docs/actions/` への登録候補: なし。
- brainへの記録候補: Responsive chartのfull-page撮影は再レイアウト中の偽証跡になり得るため、通常viewport・正の描画寸法・Tooltip実DOMを同時に検査する。
