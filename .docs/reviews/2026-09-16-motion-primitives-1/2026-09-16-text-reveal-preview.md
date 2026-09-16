verified_impl_sha: 20a920f0e326e2abd2907c29a2ec4b4efa73d877

# text-reveal preview 実ブラウザ検証

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§B](../../plans/2026-09-16-motion-primitives.md)。
- `npm run build:site` は exit 0、286ページ。成果物を以下のコマンドで配信した。

```sh
npx astro preview --host ::1 --port 52881
```

- IPv4 loopback は listen 済みにもかかわらず接続が EADDRNOTAVAIL / ERR_ADDRESS_INVALID となったため、IPv6 loopback を使用した。対象コードは変更していない。
- Playwright MCP から新規起動した headless Chromium 153.0.8010.48、viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始。hydrate、document.fonts.ready、1100msを待ち、操作前から16ms間隔で対象要素の computed style と getAnimations を収集した。button をclickし、1250ms後のDOM・computed styleを記録して撮影した。
- transitionend の propertyName / elapsedTime も記録した。時刻は計測開始からの相対値であり、duration自体とは区別する。

## 表示・エラー

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror |
| --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/text-reveal/` | 200 | 1 | 0 | 0 | 0 |
| dark | `/preview/text-reveal-dark/` | 200 | 1 | 0 | 0 | 0 |

preview selector: `[data-slot="text-reveal-preview"]`。両themeでdark classはrouteと一致、reduced-motionはfalse。

## computed style と getAnimations

| theme | 対象 | computed property | computed duration | computed easing | computed delay | transitionProperty | duration ms | easing | delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | text-reveal-unit #0「新しい」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| light | text-reveal-unit #0「新しい」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| light | text-reveal-unit #5「踏み出す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.12s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 120 |
| light | text-reveal-unit #5「踏み出す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.12s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 120 |
| light | text-reveal-unit #6「新」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| light | text-reveal-unit #6「新」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| light | text-reveal-unit #17「す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.36s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 360 |
| light | text-reveal-unit #17「す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.36s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 360 |
| dark | text-reveal-unit #0「新しい」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| dark | text-reveal-unit #0「新しい」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| dark | text-reveal-unit #5「踏み出す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.12s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 120 |
| dark | text-reveal-unit #5「踏み出す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.12s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 120 |
| dark | text-reveal-unit #6「新」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| dark | text-reveal-unit #6「新」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 0 |
| dark | text-reveal-unit #17「す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.36s` | `opacity` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 360 |
| dark | text-reveal-unit #17「す」 | `opacity, translate` | `0.5s` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0.36s` | `translate` | 500 | `cubic-bezier(0.16, 1, 0.3, 1)` | 360 |

すべて `CSSTransition` として取得した。

単語モードは非空白4単位（index 0〜3）でdelay 0 / 40 / 80 / 120ms、文字モードは非空白10単位（index 0〜9）でdelay 0〜360ms。表の # は両モードを結合したDOM順で、stagger indexとは異なる。空白はinline、delayを持たず、単語・文字の両表示とも最終テキストは「新しい 一歩を 踏み出す」。全unitはaria-hidden=true、rootのrole=imgとaria-labelで全文を公開する。

role=imgは、genericなspanへのaria-labelをBiomeが拒否するspecの書き漏れについて、司令塔の裁定で追加した。

## 証跡画像と判定範囲

- light: [2026-09-16-text-reveal-preview-light.jpg](2026-09-16-text-reveal-preview-light.jpg)
- dark: [2026-09-16-text-reveal-preview-dark.jpg](2026-09-16-text-reveal-preview-dark.jpg)

10 routeはそれぞれ新規撮影した1440×900のJPEGであり、既存画像の複製ではない。画像を目視し、本文・操作部品の欠落や切断がないことを確認した。

存在（selector・画像形式）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・指定状態の変化）を検証した。全propsの組合せ、Intl.Segmenter未搭載環境、全キーボード操作、他ブラウザの網羅検証は含まない。
