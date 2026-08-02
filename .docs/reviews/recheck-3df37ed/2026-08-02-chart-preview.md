# Chart Task 9 R4 動作検証レポート

verified_impl_sha: 3df37ed476863bbd863009af6892a7a16a7bdd6f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh target、計6/6で実測した。
- hydration後の`[data-slot="chart"]`は全runで`data-chart="chart-利用者:2026"`だった。
- root内`style.sheet.cssRules`をCSSOMとして読み出せ、Light / Dark双方の対応selector ruleが存在した。
- rootのcomputed `--color-desktop` / `--color-mobile`は空でなく、各4本のBarへ`fill="var(--color-desktop)"` / `fill="var(--color-mobile)"`として到達し、8本すべてのcomputed fillと矩形が有効だった。
- console error / warning、pageerror、network failure、未終端、4xx / 5xxは全run 0だった。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 固定HEAD | 上記`verified_impl_sha` |
| 検証日時 | 2026-08-02 15:30〜15:48 JST |
| OS | macOS 26.3.1（Build 25D2128）、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187、raw CDP |
| server | `127.0.0.1:3018`へ明示固定 |
| fresh build | `npm run build` exit 0、Astro 125 pages |

## 成功基準（実行前rubric）

1. Light / Darkを各3 fresh targetで実行する。
2. hydration後の`data-chart`が正確に`chart-利用者:2026`である。
3. inline styleのCSSOM parseに成功し、通常selectorと`.dark` selectorが存在する。
4. rootの2つのcomputed custom propertyが非空である。
5. desktop / mobile各4本のBarが対応custom propertyを参照し、computed fillと正の矩形を持つ。
6. requestとresponseが全件対応し、failure、未終端、4xx / 5xx、console / Runtime / Log errorが0である。

## 3/3実測結果

| theme | fresh target | `data-chart` | CSSOM rules | custom properties | Bar到達 | resource | error |
|---|---:|---|---|---|---|---|---|
| Light | 3/3 | 3/3 | 各2 rule | desktop `oklch(55.6% 0 0)` / mobile `oklch(43.9% 0 0)` | desktop 4 + mobile 4、全て正の矩形 | 各13 request / 13 response、全status 200 | 全0 |
| Dark | 3/3 | 3/3 | 各2 rule | desktop `oklch(87% 0 0)` / mobile `oklch(78% 0 0)` | desktop 4 + mobile 4、全て正の矩形 | 各13 request / 13 response、全status 200 | 全0 |

CSSOM selectorは全runで次の2件だった。

```text
[data-chart="chart-利用者:2026"]
.dark [data-chart="chart-利用者:2026"]
```

Barの`fill`属性はdesktop 4本が`var(--color-desktop)`、mobile 4本が`var(--color-mobile)`だった。computed fillはLightで`oklch(0.556 0 0)` / `oklch(0.439 0 0)`、Darkで`oklch(0.87 0 0)` / `oklch(0.78 0 0)`へ解決した。

## JPEG証跡

Chrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得し、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`のbase64を変換せず`.jpg`へ直接保存した。

| 画像 | bytes | 寸法 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-chart-preview-light.jpg` | 24,173 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `3b74e62d4aa047eb8b745d2d8a0f4677f9b45ceb37597e133ca377b9ee2bc60a` |
| `2026-08-02-chart-preview-dark.jpg` | 24,339 | 1280×900 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `0a376233a9eb05e8e3b934d612ef4dbf479d71f404084bef4f104b2ab1f6b7e6` |

`file`、`sips`、magicが一致した。Light / Darkとも5月〜8月のdesktop / mobile計8本のBar、軸、凡例が描画され、blankや途中描画でないことを目視確認した。

## 三方向導出と未検証範囲

- コード: `ChartContainer`のID生成、`ChartStyle`のCSS文字列、Rechartsの2 seriesを全て追跡した。
- 画面: hydrated DOM、CSSOM、computed property、Barの属性 / computed fill / 矩形を取得した。
- 型: `ChartConfig`の`color`経路と`ChartContainerProps.id`の公開契約に一致した。外部schemaは存在しない。
- 未検証: tooltip hover内容、legend click、resize後の再描画、animation中間frame、Safari / Firefox、スクリーンリーダー読み上げ、pixel baseline比較。

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
```

1. `/preview/chart/`と`/preview/chart-dark/`を各3 fresh targetで開く。
2. CDPのPage / Runtime / Network / Logをnavigation前にenableする。
3. hydration完了後、root属性、style CSSOM、custom property、Barのfillと矩形を評価する。
4. 全CDP eventを逐次購読し、request / response / failureとconsole / exceptionを照合する。
5. 3回目のtargetでCDPからJPEGを直接取得する。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- 全targetとheadless Chromeを終了し、CDP port 9228 LISTENなしを確認した。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADとbranchは開始時から不変で、tracked / cached差分は0だった。
