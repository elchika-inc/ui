verified_impl_sha: f15c89293bea3afa92f8ea909e3c277ca40f5bbc

# ドキュメントサイトの意匠 — issue #86 実ブラウザ証跡

- 検証日: 2026-09-18
- 対象: 実装 commit `f15c89293bea3afa92f8ea909e3c277ca40f5bbc`。`npm run build:site` の静的出力（292ページ）。
- 環境: macOS / Playwright 1.63.0 / headless Chromium 153.0.8010.12 / viewport 1440×900 / deviceScaleFactor 1。
- 配信: `http://[::1]:4336`。各ページを独立した browser context で開き、`elchika-ui-theme` と colorScheme を light / dark に設定した。
- 判定基準: `.docs/plans/2026-09-18-docs-site.md` §4.7・§4.8。Sidebar 件数と生成 CSS の期待値は司令塔の明示裁定に従う。

## 再現手順

```sh
npm run build:site
npx astro preview --host ::1 --port 4336
```

1. `/`、`/components/`、`/components/button/` を各テーマの新規 context で開く。networkidle と Astro の hydration（`astro-island[ssr]` の消失）、`document.fonts.ready` を待つ。
2. `document.fonts.load('500 11px "IBM Plex Mono"', 'REGISTRY')` と `document.fonts.load('600 44px "IBM Plex Sans JP"', '取り込んで、所有する。共有 UI の実体。')` の前後を記録する。
3. hydration 時の preview の autofocus の影響を除くため、activeElement を blur して `scrollTo(0, 0)` を実行し、250ms 後の scrollY=0 で JPEG を撮る。
4. 下表の selector の件数と computed style を測る。トップは scrollY=800 にして masthead と subnav の境界を再測する。
5. トップを640×900へ変更し、h1 のサイズ・字間・行間と折り返し行数を再測する。
6. テーマボタンを実クリックし、`data-theme`・class `dark`・localStorage を照合する。再読込後も選択を保持することを確認する。
7. skip link にフォーカスして Enter を押し、`document.activeElement.id` が `main-content` になることを確認する。

## 3ページ × 2テーマ

| ページ | テーマ | HTTP | console / pageerror / favicon error | masthead | Sidebar 全体 / サイト用 | eyebrow | eyebrow color |
|---|---|---:|---|---:|---|---:|---|
| `/` | light | 200 | 0 / 0 / 0 | 1 | 0 / 0 | 3 | `rgb(133, 105, 10)` |
| `/` | dark | 200 | 0 / 0 / 0 | 1 | 0 / 0 | 3 | `rgb(245, 208, 101)` |
| `/components/` | light | 200 | 0 / 0 / 0 | 1 | 2 / 1 | 11 | `rgb(133, 105, 10)` |
| `/components/` | dark | 200 | 0 / 0 / 0 | 1 | 2 / 1 | 11 | `rgb(245, 208, 101)` |
| `/components/button/` | light | 200 | 0 / 0 / 0 | 1 | 1 / 1 | 1 | `rgb(133, 105, 10)` |
| `/components/button/` | dark | 200 | 0 / 0 / 0 | 1 | 1 / 1 | 1 | `rgb(245, 208, 101)` |

全6ケースで `#main-content` は存在し、skip link から本文へフォーカスが移った。1440px幅で水平 overflow は0件、failed request も0件。
トップの `[data-site-masthead]` / `[data-site-subnav]` / `[data-site-hero]` は各1件。カテゴリ一覧の eyebrow は11件、トップは3件、個別ページは1件をすべて検査した。

一覧の document 全体では Sidebar が2件ある。2件目は既存の `[data-component-index-item="sidebar"]` 内の inert な部品プレビューであり、サイトの Sidebar と別に数える。司令塔の裁定に従い、次の数をサイトの合格条件にした。

```js
[...document.querySelectorAll('[data-slot="sidebar"]')]
  .filter((el) => !el.closest('[data-component-index-item]')).length
```

## 組版・寸法・位置

| 観測対象 | 実測（両テーマ共通） |
|---|---|
| masthead | `position: sticky`、`backdropFilter: blur(12px)`、高さ69px |
| eyebrow | `fontFamily: "IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace`、11px、weight 500、`uppercase`、`letterSpacing: 0.88px` |
| hero h1（1440px） | 44px、字間 -0.88px、行間59.4px（44×1.35）、2行、幅576px（`max-w-xl`） |
| hero h1（640px） | 36px、字間 -0.72px、行間48.6px（36×1.35）、2行、幅576px |
| hero リード（1440px / 640px） | 18px、行間34.2px、各2行、`max-w-2xl` |
| テーマボタン | `borderRadius: 3.35544e+07px`、offsetHeight 36px、半径 ≥ 高さ÷2、Mono、`uppercase` |
| トップ初期位置 | masthead top=0 / bottom=69、subnav top=69 / bottom=110.5、境界差0px |
| トップ800pxスクロール後 | masthead top=0 / bottom=69、subnav top=69 / bottom=110.5、境界差0px |

行数は `Math.round(el.offsetHeight / parseFloat(getComputedStyle(el).lineHeight))` で計算した。1440pxで h1 の offsetHeight=119、640pxで97、リードは両方68。
フォントは6ケースとも `fonts.check` が load 前後とも Mono / heading=true。`fonts.load` は Mono 1 face、和文 heading 7 faces を返した。computed fontFamily は h1 が `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`、eyebrow とボタンが上表の Mono。

## テーマ切替とキーボード

- light で `DARK` をクリック: `data-theme=dark`、`classList.contains('dark')=true`、localStorage `elchika-ui-theme=dark`。
- dark で `LIGHT` をクリック: `data-theme=light`、`classList.contains('dark')=false`、localStorage `elchika-ui-theme=light`。
- 3ページすべてで両方向を実行し、再読込後のテーマも維持した。日本語の切替先 aria-label を維持している。
- 3ページの両テーマで skip link をフォーカスし Enter で本文へ移動した。Tab の初期順序や screen reader 固有の読み上げは今回の合否対象にしていない。

## 生成 CSS とローカル検査

`grep -c` は1、該当ルールは `.text-highlight-text{color:var(--highlight-text)}`。`@theme inline` による展開後の値を期待値とする裁定に従い、上表の light/dark の computed RGB と突合した。

```sh
grep -c '\.text-highlight-text{' dist/_astro/global.*.css
```

- standards: exit 0、263ファイル、arbitrary value 違反0。lint: exit 0、517ファイル、error 0（warning 215 / info 3）。
- 指定テスト: docs-site 11、site-delivery 3、catalog-build 10、check-completeness 95、typography-usage 6、contrast 18。すべて exit 0 / fail 0 / skip 0。
- catalog-build の旧契約は10件中8 pass / 2 failだった。司令塔の許可で2件の assert を更新し、件数10と個別ページ検査ループを保持した。
- 陽性対照: 一時コピーだけでトップの `/components/` 期待値を存在しない `/components-intentionally-missing/` へ置換し、exit 1 / pass 9 / fail 1 / skip 0 を観測。実ファイルの期待値は変更せず、正規ファイルを再実行して10件成功した。
- `check:contrast`、`build:lib`、`check:props`、completeness、preview-render、registry:build、distribution、build:site は各 exit 0。`git diff --exit-code registry.json` は exit 0。
- 全件テスト・typecheck・check:all は指示に従いローカル未実行。PR CI の最終結果と check-evidence の2回の結果は PR 本文に記録する。

## JPEG

- [2026-09-18-index-page-light.jpg](2026-09-18-index-page-light.jpg) — 1440×900、65,972 bytes、SHA-256 `15b7f0243f99470eaf45360b4503e6518fbbf756871d2090fa9bcd6e7ed1cdcd`。
- [2026-09-18-index-page-dark.jpg](2026-09-18-index-page-dark.jpg) — 1440×900、67,917 bytes、SHA-256 `fc63643662b607a987ed5b191fe4d085987d41ccad257a94f839ddce001d66c7`。
- [2026-09-18-components-index-light.jpg](2026-09-18-components-index-light.jpg) — 1440×900、90,942 bytes、SHA-256 `d19973e2e97b28b90b50443a1a31bd3d616f831c542f40e54eb044cef5ca97ec`。
- [2026-09-18-components-index-dark.jpg](2026-09-18-components-index-dark.jpg) — 1440×900、93,473 bytes、SHA-256 `b8f93b128a062f645b52d118891b1419871b301e9653a3ccfd94698afe6413ac`。
- [2026-09-18-component-page-light.jpg](2026-09-18-component-page-light.jpg) — 1440×900、78,875 bytes、SHA-256 `f6672edbf8644e16ef3d076a878fec50455124da10d99020a0621434b9313abe`。
- [2026-09-18-component-page-dark.jpg](2026-09-18-component-page-dark.jpg) — 1440×900、79,571 bytes、SHA-256 `9061a362ae3ab761792a1888e352adb6af1230782810f458f559fa4a4db03b8c`。

## 補足・未検証範囲

- 375px幅の追加観測ではトップと一覧に横 overflow はなく、全ページの masthead 内のテーマ操作は画面内に収まった。
- 375px幅の Button 詳細の既存 install カードは document scrollWidth=598px。masthead を DOM から除いても598pxで、変更していないカード・コードの最小幅による既存レイアウトの課題として切り分けた。本PRでは修正していない。
- 画像は各ページの先頭表示。個別の全96ページ、すべての部品操作、screen reader 固有の読み上げ、公開環境への反映はこの証跡の対象外。
