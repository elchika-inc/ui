verified_impl_sha: 5b93bb1610a36500e9bd171fb745a83a3b1947ea

# dialog preview 実ブラウザ検証（overlay 開閉モーション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§A](../../plans/2026-09-15-overlay-motion.md)。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 52770` で配信した。
- Playwright MCP から Chromium（channel chrome、153.0.8010.36）を `launch({ headless: true, channel: "chrome" })` で新規起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror を収集し、指定selectorのvisible、`document.fonts.ready`、700msを待った。
- preview-selectors.json のselector: `[data-slot="dialog-content"]`。属性遷移の対象: `[data-slot="dialog-content"]`。
- 初期open状態でcomputed styleを測り、「閉じる」をclickして閉じ、先頭の `[data-slot="dialog-trigger"]` をclickして再度開いた。
- 操作前に `setInterval(sample, 16)` を開始し、要素の存在、starting / ending / instant属性、computed styleを取得した。閉じた要素はdetachedまで待ち、その後35ms、再open後は700ms待って記録した。
- 開き直した状態をJPEG撮影した。時刻は各操作のポーリング開始からの相対値で、click開始までの待ちを含むためdurationそのものとは区別する。

## 表示・エラーの実測

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror | dark class | reduced motion |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/dialog/` | 200 | 1 | 0 | 1 | 0 | false | false |
| dark | `/preview/dialog-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## computed style（開いた状態の生値）

| theme | 対象 | transition-property | transition-duration | transition-timing-function |
|---|---|---|---|---|
| light | popup | `opacity, scale` | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| dark | popup | `opacity, scale` | `0.26s` | `cubic-bezier(0.16, 1, 0.3, 1)` |

## 閉じる側の属性遷移

全テーマで `data-ending-style` を観測した後に対象がDOMから消えた。

| theme | 全sample数 | ending sample数 | 最初のending (ms) | 最後のending (ms) | 最初の不在 (ms) | ending時duration | ending時easing |
|---|---:|---:|---:|---:|---:|---|---|
| light | 21 | 14 | 105.6 | 305.7 | 322.2 | `0.12s` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| dark | 14 | 9 | 58.1 | 178.9 | 194 | `0.12s` | `cubic-bezier(0.16, 1, 0.3, 1)` |

閉じるtransitionの最後に採れた値:

- light: opacity `0`、scale `0.96`、translate `-50% -50%`、transform `none`。
- dark: opacity `0`、scale `0.96`、translate `-50% -50%`、transform `none`。

## 開く側の属性観測

| theme | 全sample数 | starting sample数 | click直後starting | click直後instant | instant sample数 |
|---|---:|---:|---|---|---:|
| light | 47 | 0 | false | false | 0 |
| dark | 47 | 0 | false | false | 0 |

`data-starting-style` はbest-effortの16msポーリングで未観測だった。1フレームの属性が付かないことを意味せず、仕様どおり開く側の合否には上表のcomputed style一致を用いた。通常のtrigger click直後とポーリング中に `data-instant` は付かなかった。

## 証跡画像と判定範囲

- light: [2026-09-16-dialog-preview-light.jpg](2026-09-16-dialog-preview-light.jpg)
- dark: [2026-09-16-dialog-preview-dark.jpg](2026-09-16-dialog-preview-dark.jpg)

2画像は各routeで新規撮影した1440×900のJPEG（magic bytes `FF D8 FF`）であり、既存画像の複製ではない。目視で本文や操作ボタンの欠落・切断を認めなかった。

存在（selector、画像形式）、実行（build、HTTP、console / pageerror）、動作（computed style、閉じる属性からDOM不在への遷移、再open）まで検証した。全propsの組合せ、非既定の配置やサイズ、全キーボード操作の網羅検証は含まない。
