verified_impl_sha: cabb92826ba51ec998cb288299e2a1ec7e6f1c81

# chart preview 実ブラウザ検証（組版と Mono）

## 成功基準と再現手順

- 検証日: 2026-09-18。成功基準は [委任仕様 §4・§B.1・§B.3](../../plans/2026-09-17-typography-layer.md) と本文の司令塔裁定。
- `npm run build:site`（exit 0、292ページ）の成果物を `npx astro preview --host ::1 --port 43882` で配信した。
- Playwright / 新規 headless Chromium 153.0.8010.48（channel chrome）/ viewport 1440×900 / deviceScaleFactor 1 / locale ja-JP / reducedMotion no-preference。
- navigation 前に console error / pageerror を収集し、networkidle・preview selector の visible・Astro hydration 完了・`document.fonts.ready` を待った。
- `document.fonts.check('12px "IBM Plex Mono"')` を採取し、続いて `document.fonts.load('12px "IBM Plex Mono"')` と `document.fonts.ready` を待って再測定した。操作後600ms待ち、computed style と新規 JPEG を取得した。
- preview selector: `[data-slot="chart-preview"]`。

グラフ領域の横50%・縦40%へマウスを移し、6月の tooltip を表示した。container と tooltip の text-2xs を測定し、tooltip の既存 Mono 数値5件も確認した。

## 表示とエラー

| theme | route | HTTP | selector数 | lang | dark class | console error（favicon除外） | favicon 404 | pageerror | scrollWidth / clientWidth |
|---|---|---|---|---|---|---|---|---|---|
| light | `/preview/chart/` | 200 | 1 | ja | false | 0 | 0 | 0 | 1440 / 1440 |
| dark | `/preview/chart-dark/` | 200 | 1 | ja | true | 0 | 0 | 0 | 1440 / 1440 |

## フォント読込

| theme | fonts.ready 後の check | 明示 load 後の check | load の face / status | Mono font HTTP |
|---|---|---|---|---|
| light | false | true | IBM Plex Mono / loaded | 200 |
| dark | false | true | IBM Plex Mono / loaded | 200 |

`fonts.check` は既定400 weightの欧文 face を検査する。和文のみ、または別 weight を表示する preview では、`fonts.ready` 後も検査対象の face が未要求のため false になり得る。既存の Google Fonts 定義を明示 load した後の true と computed fontFamily を併記する扱いは司令塔裁定済み。和文ラベルの字形が Plex Sans JP にフォールバックするのは設計どおりで、Mono はラベルと数値の欧文・数字を担当する。

## 組版の computed style

測定対象の全要素を、同じ slot・font-size・line-height・letter-spacing の組で集計した（top-N / サンプリングなし）。

| theme | slot / tag | font-size | line-height | letter-spacing | 件数 |
|---|---|---|---|---|---|
| light | chart | 12px | 18px | 0.32px | 1 |
| light | DIV | 12px | 18px | 0.32px | 1 |
| dark | chart | 12px | 18px | 0.32px | 1 |
| dark | DIV | 12px | 18px | 0.32px | 1 |

## Mono と数値の computed style

| theme | 対象 | fontFamily | fontSize | lineHeight | letterSpacing | fontVariantNumeric | textAlign | 件数 |
|---|---|---|---|---|---|---|---|---|
| light | chart-tooltip-value | "IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace | 12px | 12px | 0.32px | tabular-nums | start | 5 |
| dark | chart-tooltip-value | "IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace | 12px | 12px | 0.32px | tabular-nums | start | 5 |

全対象の fontFamily が `"IBM Plex Mono"` で始まる。数値要素は全件 `tabular-nums`。SidebarGroupLabel の `normal` は数値要素ではないため対象外。

## 証跡画像と判定範囲

- light: [2026-09-18-chart-preview-light.jpg](2026-09-18-chart-preview-light.jpg) — 1440×900 JPEG、magic bytes `FF D8 FF`。
- dark: [2026-09-18-chart-preview-dark.jpg](2026-09-18-chart-preview-dark.jpg) — 1440×900 JPEG、magic bytes `FF D8 FF`。

画像は今回新規撮影し、各テーマを目視確認した。測定した注釈・数値の欠落を認めず、ページ全体の横溢れはない。存在（selector・画像形式）、実行（HTTP・hydration・console / pageerror）、組版（computed style・font 読込）を検証した。全 props 組合せ・全メニュー・全キーボード操作・reduced-motion の網羅検証は含まない。
