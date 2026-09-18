verified_impl_sha: c4a28708f5ffef05282383bc4e5a1194204d2059

# Tabs line の黄アクセント検証

成功基準と環境は [共有面report](report.md)。2026-09-18、headless Chromium 153.0.8010.50、1440×900。main由来の変更前と実装commitを同じAstro preview・Playwright経路で比較した。

| theme | URL | HTTP | line Indicator | active Trigger ::after | default Indicator | console / favicon / pageerror |
|---|---|---:|---|---|---|---|
| light | `/preview/tabs/` | 200 | `rgb(242, 194, 48)` | `rgb(242, 194, 48)` | `rgb(255, 255, 255)` | 0 / 0 / 0 |
| dark | `/preview/tabs-dark/` | 200 | `rgb(245, 208, 101)` | `rgb(245, 208, 101)` | `rgb(28, 31, 38)` | 0 / 0 / 0 |

lineは2つ目の `[data-slot="tabs-list"]` 内の `[data-slot="tabs-indicator"]`、疑似要素は同listのactive Triggerから取得した。変更前のlineはlight `rgb(26, 28, 33)`、dark `rgb(246, 246, 247)`。default Indicatorは前後同値。Indicator併用時の `::after` はdisplay noneであり、computed色の検証と可視下線を区別した。

active / inactive文字色はlight `rgb(26, 28, 33)` / `rgb(99, 103, 111)`、dark `rgb(246, 246, 247)` / `rgb(150, 156, 168)`。fontFamilyは両テーマとも `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`、fonts.checkはfonts.load前後ともtrue。pageerror / requestfailed / 横overflow / dev toolbarは全て0。

## 受容根拠

lightの下線はcard（surface）に対し1.6753（約1.68）:1、background（canvas）に対し1.5512:1で非テキスト3:1を満たさない。activeを文字色でも識別できるため、黄は補助表現として使うユーザー決定に従いdecorative gateで登録した。darkの比率はcard 11.0674:1、background 12.0326:1。nontext-uiへ一時変更した陽性対照でlight両caseのFAILを観測し、decorativeへ戻した。

## 画像と検証限界

- [light](2026-09-18-tabs-preview-light.jpg)
- [dark](2026-09-18-tabs-preview-dark.jpg)

共有面28枚のうちTabsの2枚を兼用する。いずれも新規撮影の1440×900 JPEG。HTTP、hydration、selector、computed値、画像のデコードと目視を確認した。全props、vertical、Indicatorなしの可視描画、クリック・キーボード操作、pixel差分、他ブラウザは検証していない。
