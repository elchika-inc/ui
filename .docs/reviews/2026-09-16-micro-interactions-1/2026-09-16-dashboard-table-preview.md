verified_impl_sha: cb79f3f3b733c08dea5afc9540e9c53c20537eb2

# dashboard-table preview 実ブラウザ検証（状態遷移とマイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§B](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site` の静的成果物を `npx astro preview --host 127.0.0.1 --port 52771` で配信した。
- Playwright MCP から Chromium（channel chrome、153.0.8010.48）を `launch({ headless: true, channel: "chrome" })` で起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始した。指定 selector の visible、`document.fonts.ready`、Astro island の hydration 完了、700msを待って computed style と画像を取得した。
- selector: `[data-slot="dashboard-table-preview"]`。computed style は担当要素の先頭を測った。

## 表示・エラーの実測

| theme | route | HTTP | selector 件数 | console error（favicon 除外） | favicon 404 | pageerror | dark class | reduced motion |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/dashboard-table/` | 200 | 1 | 0 | 0 | 0 | false | false |
| dark | `/preview/dashboard-table-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## computed style（生値）

| theme | transition-property | transition-duration | transition-timing-function |
|---|---|---|---|
| light | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |
| dark | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |

## Indicator の移動

各 TabsList の2番目の Trigger を click した。操作前から16ms間隔で `getAnimations()` を取り、click 直後も取得した。350ms後に active tab 座標を確認した。

| theme | variant | transition property | duration (ms) | easing | sample 数 | active left | trigger offsetLeft | hidden | 幅 × 高さ (px) |
|---|---|---|---:|---|---:|---|---:|---|---|
| light | default | `left` | 260 | `cubic-bezier(0.16, 1, 0.3, 1)` | 25 | `100.73413851120026px` | 101 | false | 56 × 25 |
| light | default | `width` | 260 | `cubic-bezier(0.16, 1, 0.3, 1)` | 25 | `100.73413851120026px` | 101 | false | 56 × 25 |
| dark | default | `left` | 260 | `cubic-bezier(0.16, 1, 0.3, 1)` | 22 | `100.73413851120026px` | 101 | false | 56 × 25 |
| dark | default | `width` | 260 | `cubic-bezier(0.16, 1, 0.3, 1)` | 22 | `100.73413851120026px` | 101 | false | 56 × 25 |

全対象の computed transition は `left, top, width, height` / `0.26s` / `cubic-bezier(0.16, 1, 0.3, 1)`。操作後の Trigger は `data-active` あり、`aria-selected="true"`。Trigger 背景は透明、after は `display: none`、Indicator は初期状態と操作後とも `hidden=false` である。

2番目の「作業中」を選択した状態を撮影した。light / dark とも `data-visible-rows="4"` で、選択に対応する4行が表示された。

## 司令塔の裁定と再検証

- `msg_79923fbf8099` の回答に基づき、spec の `group-has-data-[slot=tabs-indicator]/tabs-list:data-active:shadow-none` だけを `group-has-data-[slot=tabs-indicator]/tabs-list:data-active:shadow-none!` へ変更した。同じ詳細度の既存 `shadow-sm` が生成 CSS で後置され、Trigger に旧来の影が残るためである。
- 変更後、light / dark とも `--tw-shadow` は `0 0 #0000`。`box-shadow` は下記のとおり全項が透明・ゼロ寸法となり、Trigger の視覚的な影はなくなった。CSS の文字列表現は `none` ではなく Tailwind の透明影の列である。
- `--active-tab-left` と `offsetLeft` は「差が1px以内」で一致と判定する。Base UI の小数座標と整数へ丸められる `offsetLeft` の表現差を許容し、実測値は丸めず記録する。spec 自体は編集していない。

| theme | variant | --tw-shadow | box-shadow（生値） | 座標差 (px) |
|---|---|---|---|---:|
| light | default | `0 0 #0000` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px` | 0.26586148879974303 |
| dark | default | `0 0 #0000` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px` | 0.26586148879974303 |

## 証跡画像と判定範囲

- light: [2026-09-16-dashboard-table-preview-light.jpg](2026-09-16-dashboard-table-preview-light.jpg)
- dark: [2026-09-16-dashboard-table-preview-dark.jpg](2026-09-16-dashboard-table-preview-dark.jpg)

画像は各 route で新規撮影した1440×900のJPEGで、既存証跡の複製ではない。存在（selector・画像）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・属性）まで検証した。全 props 組合せ、他ブラウザ、全キーボード操作の網羅検証は含まない。
