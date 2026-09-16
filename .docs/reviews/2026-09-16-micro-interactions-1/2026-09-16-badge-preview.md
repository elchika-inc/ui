verified_impl_sha: cb79f3f3b733c08dea5afc9540e9c53c20537eb2

# badge preview 実ブラウザ検証（状態遷移とマイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§B](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site` の静的成果物を `npx astro preview --host 127.0.0.1 --port 52771` で配信した。
- Playwright MCP から Chromium（channel chrome、153.0.8010.48）を `launch({ headless: true, channel: "chrome" })` で起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始した。指定 selector の visible、`document.fonts.ready`、Astro island の hydration 完了、700msを待って computed style と画像を取得した。
- selector: `[data-slot="badge"]`。computed style は担当要素の先頭を測った。

## 表示・エラーの実測

| theme | route | HTTP | selector 件数 | console error（favicon 除外） | favicon 404 | pageerror | dark class | reduced motion |
|---|---|---:|---:|---:|---:|---:|---|---|
| light | `/preview/badge/` | 200 | 7 | 0 | 0 | 0 | false | false |
| dark | `/preview/badge-dark/` | 200 | 7 | 0 | 0 | 0 | true | false |

## computed style（生値）

| theme | transition-property | transition-duration | transition-timing-function |
|---|---|---|---|
| light | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |
| dark | `background, border-color, color, box-shadow` | `0.12s, 0.12s, 0.12s, 0.12s` | `cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.2, 0, 0, 1)` |

## appear の実行と静的属性

読込完了直後に `[data-appear]` の `getAnimations()` を取得した。

| theme | navigation 完了からの経過 (ms) | 種類 | property | duration (ms) | easing |
|---|---:|---|---|---:|---|
| light | 50 | CSSTransition | `opacity` | 500 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |
| light | 50 | CSSTransition | `scale` | 500 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |
| dark | 45 | CSSTransition | `opacity` | 500 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |
| dark | 45 | CSSTransition | `scale` | 500 | `cubic-bezier(0.34, 1.36, 0.64, 1)` |

静的 HTML の `grep -c 'data-appear' dist/preview/badge/index.html` は 1（exit 0）。HTMLParser でも badge 7 要素のうち `data-appear=""` は新着の1要素だけ、既存6要素では属性なしと確認した。

`grep -c` は行数を数え、class 内の `data-appear:` も拾うため、単独では属性の存在・不在の根拠にしない。Tests レンズの指摘に対応し、次の属性一致コマンドも単独実行した（exit 0）。出力は `data-appear=""` の1行のみで、HTMLParser の属性数と一致した。

```bash
grep -o 'data-appear="[^"]*"' dist/preview/badge/index.html
```

```text
data-appear=""
```

生成 CSS の appear 規則:

```css
@starting-style{.data-appear\:starting\:scale-75[data-appear]{--tw-scale-x:75%;--tw-scale-y:75%;--tw-scale-z:75%;scale:var(--tw-scale-x) var(--tw-scale-y)}.data-appear\:starting\:opacity-0[data-appear]{opacity:0}}
```

## 証跡画像と判定範囲

- light: [2026-09-16-badge-preview-light.jpg](2026-09-16-badge-preview-light.jpg)
- dark: [2026-09-16-badge-preview-dark.jpg](2026-09-16-badge-preview-dark.jpg)

画像は各 route で新規撮影した1440×900のJPEGで、既存証跡の複製ではない。存在（selector・画像）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・属性）まで検証した。全 props 組合せ、他ブラウザ、全キーボード操作の網羅検証は含まない。
