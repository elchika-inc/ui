verified_impl_sha: 9ae765fe602b9360c964fee1c30571a247a2c9c7

# animated-number preview 実ブラウザ検証

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§C](../../plans/2026-09-16-motion-primitives.md)。
- `npm run build:site` は exit 0、277 ページ。生成 CSS `dist/_astro/global.BgdARQDS.css` の `grep -c '@starting-style'` は 1、exit 0。
- 成果物を `npx astro preview --host ::1 --port 52942` で配信し、`http://[::1]:52942` へ接続した。
- IPv4 は TCP 一時ポート枯渇により errno 49 / Chromium `ERR_ADDRESS_INVALID` となった。IPv6 loopback で同じ成果物の HTTP 200 を確認した。OS 設定・部品コードは変更していない。
- Playwright から Chromium 153.0.8010.48 を `browserType().launch({ headless: true, channel: "chrome" })` で起動。viewport 1440×900、deviceScaleFactor 1、通常時は reducedMotion `no-preference`。
- 各 route で hydration（`astro-island[ssr]` が無いこと）、`document.fonts.ready`、200ms を待った。操作前から `setInterval(sample, 16)` を開始し、表示テキスト、aria-label、computed style、`getAnimations()` を採取した。
- 時刻は document の capture フェーズで検出した click からの相対値。表示値の丸めとポーリング間隔により、最終値の初観測時刻は rAF の終了時刻と一致しない。

## 表示・エラー

| theme | route | HTTP | preview selector 件数 | console error（favicon 除外） | favicon 404 | pageerror | dark class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/animated-number/` | 200 | 1 | 0 | 1 | 0 | false |
| dark | `/preview/animated-number-dark/` | 200 | 1 | 0 | 0 | 0 | true |

selector は `[data-slot="animated-number-preview"]`。favicon の URL は `http://[::1]:52942/favicon.ico`。初期表示は `12,000` と、小数表示の `120.00`。

## 通常モーション

| theme | 操作 | 最初 → 最後 | サンプル数 | 異なる表示値の数 | 単調性 | 最終値の初観測（ms） |
| --- | --- | --- | --- | --- | --- | --- |
| light | 10,000 増やす | 12,000 → 22,000 | 38 | 23 | 単調増加 | 394.3 |
| light | 10,000 減らす | 22,000 → 12,000 | 39 | 24 | 単調減少 | 383.5 |
| dark | 10,000 増やす | 12,000 → 22,000 | 38 | 23 | 単調増加 | 381.5 |
| dark | 10,000 減らす | 22,000 → 12,000 | 39 | 24 | 単調減少 | 390.3 |

単調性は全サンプルを数値へ戻して隣接比較した。同値の連続は許容し、逆方向への変化は無かった。小数表示も `120.00 → 220.00 → 120.00` に到達した。増加の約64ms後に減少へ反転させた追加観測でも、現在の表示値から減少して `12,000` に到達した。

| theme | `--duration-slower` | `--curve-entrance` | computed transition | computed animation | `getAnimations()` |
| --- | --- | --- | --- | --- | --- |
| light | `.4s` | `cubic-bezier(.16, 1, .3, 1)` | `all` / `0s` / `ease` | `none` / `0s` / `ease` | 全サンプル `[]` |
| dark | `.4s` | `cubic-bezier(.16, 1, .3, 1)` | `all` / `0s` / `ease` | `none` / `0s` / `ease` | 全サンプル `[]` |

数値文字列は spec 指定の rAF で更新するため CSS animation / transition は発生しない。`getAnimations()` が空であることだけでは動作を判定せず、トークンの computed value と16msごとの表示値を併記した。

## reduced-motion

各 theme の route を `emulateMedia({ reducedMotion: "reduce" })` 後に reload して検証した。hydration 後に `window.requestAnimationFrame` を元の関数へ委譲する計数ラッパーで観測し、表示 span の childList / characterData を MutationObserver で採取してから「10,000 増やす」を押した。

| theme | matchMedia.matches | 操作後の rAF 要求数 | 文字変更回数 | 最初の文字変更 | 中間値 |
| --- | --- | --- | --- | --- | --- |
| light | true | 0 | 1 | 22,000 | 無し |
| dark | true | 0 | 1 | 22,000 | 無し |

React の更新処理が反映された最初の文字変更が最終値であり、補間を経由しないことを確認した。click 応答直後の別 IPC 読み取りでは旧表示を観測するタイミングがあったため、同期的な DOM 更新そのものの保証とは区別した。

## アクセシビリティと裁定

最終値の書式化文字列を root の aria-label で公開し、表示用の子 span は aria-hidden。通常の増加中も aria-label は `22,000` を保持する。generic な span の aria-label は Biome が禁止するため、spec の書き漏れを司令塔の裁定で補正し root に `role="img"` を追加した。

## 証跡画像と判定範囲

- light: [2026-09-16-animated-number-preview-light.jpg](2026-09-16-animated-number-preview-light.jpg)
- dark: [2026-09-16-animated-number-preview-dark.jpg](2026-09-16-animated-number-preview-dark.jpg)

両画像は各 route で新規撮影した1440×900の JPEG。目視で見出し、数値、操作ボタンの欠落や切断を認めなかった。

存在（selector・画像）、実行（build・HTTP・エラー）、動作（単調な増減・途中反転・小数・最終ラベル・reduced-motion）まで実測した。全 locale / format 組合せや unmount 時の rAF cancel の実ブラウザ網羅検証は含まない。
