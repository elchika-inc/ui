verified_impl_sha: 9ae765fe602b9360c964fee1c30571a247a2c9c7

# streaming-text preview 実ブラウザ検証

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§C](../../plans/2026-09-16-motion-primitives.md)。
- `npm run build:site` は exit 0、277 ページ。生成 CSS `dist/_astro/global.BgdARQDS.css` の `grep -c '@starting-style'` は 1、exit 0。
- 成果物を `npx astro preview --host ::1 --port 52942` で配信し、`http://[::1]:52942` へ接続した。
- IPv4 は TCP 一時ポート枯渇により errno 49 / Chromium `ERR_ADDRESS_INVALID` となったため、同じ成果物を IPv6 loopback で検証した。OS 設定・部品コードは変更していない。
- Playwright から Chromium 153.0.8010.48 を `browserType().launch({ headless: true, channel: "chrome" })` で起動。viewport 1440×900、deviceScaleFactor 1、通常時は reducedMotion `no-preference`。
- hydration（`astro-island[ssr]` が無いこと）、`document.fonts.ready`、200ms を待って操作した。操作前から `setInterval(sample, 16)` で本文、aria-busy、computed style、`getAnimations()` を採取した。追記後220msまで観測した。

## 表示・エラー

| theme | route | HTTP | preview selector 件数 | console error | favicon 404 | pageerror | dark class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/streaming-text/` | 200 | 1 | 0 | 0 | 0 | false |
| dark | `/preview/streaming-text-dark/` | 200 | 1 | 0 | 0 | 0 | true |

selector は `[data-slot="streaming-text-preview"]`。初期本文は「生成した文章を」。

## チャンク追記と確定

「チャンクを追加」を3回押し、「少しずつ」「受け取り、」「表示します。」を順に追加した。既存本文は維持され、差分の `[data-slot="streaming-text-chunk"]` だけが出現した。

| theme | 追記 | computed transition-property | duration | easing | 観測した opacity | 220ms後の chunk 数 |
| --- | --- | --- | --- | --- | --- | --- |
| light | 1 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 0.999731 | 0 |
| light | 2 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 0.999732 | 0 |
| light | 3 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 1 | 0 |
| dark | 1 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 0.999737 | 0 |
| dark | 2 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 1 | 0 |
| dark | 3 | `opacity` | `0.12s` | `cubic-bezier(0.2, 0, 0, 1)` | 0 → 1 | 0 |

ポーリング間隔により opacity=1 になる前の値が最後のサンプルとなる場合がある。transitionend 後は chunk span が無くなり、本文に確定したことを DOM で確認した。最終本文はいずれも「生成した文章を少しずつ受け取り、表示します。」。

| theme | 操作 | 種別 | transitionProperty | `effect.getTiming().duration`（ms） | easing | delay |
| --- | --- | --- | --- | --- | --- | --- |
| light | 追記1・2・3 | CSSTransition | opacity | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |
| dark | 追記1・2・3 | CSSTransition | opacity | 120 | `cubic-bezier(0.2, 0, 0, 1)` | 0 |

## caret・完了・全文置換

| theme | computed animation-name | duration | computed easing | `getAnimations()` | timing duration / easing |
| --- | --- | --- | --- | --- | --- |
| light | `caret-blink` | `1.25s` | `cubic-bezier(0.16, 1, 0.3, 1)` | CSSAnimation / caret-blink | 1250ms / linear |
| dark | `caret-blink` | `1.25s` | `cubic-bezier(0.16, 1, 0.3, 1)` | CSSAnimation / caret-blink | 1250ms / linear |

CSS animation の easing は keyframes 側にあるため、effect 全体の timing easing が linear であることは正常（司令塔の既出裁定）。受信中は aria-busy="true"。両テーマで「完了」を押すと caret は0件になった。

「全文を置換」を押すと「新しい文章へ置き換えました。」へ変わり、観測中の chunk span は0件、`getAnimations()` は空だった。先頭が一致しない変更に追記アニメーションを適用していない。

## reduced-motion の追加確認

リセット後に `emulateMedia({ reducedMotion: "reduce" })` を設定し、3回追記した。両テーマで最終本文が「生成した文章を少しずつ受け取り、表示します。」と完全一致し、重複・欠落が無いことを確認した。この部品には JS の数値補間が無く、CSS の動きは共有 reduced-motion 規則に従う。

## 証跡画像と判定範囲

- light: [2026-09-16-streaming-text-preview-light.jpg](2026-09-16-streaming-text-preview-light.jpg)
- dark: [2026-09-16-streaming-text-preview-dark.jpg](2026-09-16-streaming-text-preview-dark.jpg)

両画像は各 route で新規撮影した1440×900の JPEG。目視で見出し、本文、caret、操作ボタンの欠落や切断を認めなかった。

存在（selector・画像）、実行（build・HTTP・エラー）、動作（3回追記・transition・確定・caret・全文置換・reduced-motion での本文整合）まで実測した。全テキスト更新順序、全ブラウザ、支援技術による読み上げの網羅検証は含まない。
