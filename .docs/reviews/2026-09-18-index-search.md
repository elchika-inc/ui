verified_impl_sha: 276a7d7e0814acd1fe72beee5aa047880c97f708

# 一覧ページの絞り込みと install カード — issue #90 実ブラウザ証跡

- 検証日: 2026-09-18
- 実装: `276a7d7e0814acd1fe72beee5aa047880c97f708`。判定基準は `.docs/plans/2026-09-18-index-search.md` §4・§A。
- 環境: macOS / Node.js 24.21.0 / Playwright 1.63.0 / headless Chromium 153.0.8010.12 / deviceScaleFactor 1。
- 配信: `http://[::1]:63489`。`npm run build:site` の静的出力 292 ページを使用した。
- 一覧: 1440×900、light / dark を独立 context で検証。375px: 375×812、light。デスクトップ回帰: 1440×900、light。

## 再現手順

```sh
npm run build:site
npx astro preview --host ::1 --port 63489
```

1. 新しい Chromium context ごとに `colorScheme` と localStorage `elchika-ui-theme` を対象テーマへ設定し、指定 URL を開く。
2. HTTP 200、networkidle、`astro-island[ssr]` の消失、`document.fonts.ready` を待つ。フォントの load 前後を後述の条件で測る。
3. `/components/` の `[data-index-search]` に下表の語を順に入力し、`[data-component-index-item]` の名前・種別、カテゴリごとのカード件数、status を突合する。
4. カテゴリは `#main-content > div > section` で数える。部品プレビュー内の section や Sidebar は含めない。サイトの Sidebar は `nav[aria-label="ドキュメントナビゲーション"]` の `/components/` 向けリンクで数え、一覧自身1＋個別96＝97を各検索語で確認する。
5. `zzzz` のあと `[data-index-search-clear]` をクリックし、96件への復帰と検索欄へのフォーカスを確認する。0件案内内のクリアボタンも別にクリックし、同じ復帰を確認する。
6. `login-01` に絞ってプレビュー読込ボタンをクリックし、iframe の load・hydration・autofocus 復元区間を待つ。`zzzz` で隠した後に `login-01` へ戻し、読込ボタンなしで iframe が表示されることを確認する。
7. 375pxで5ページを開き、`document.documentElement.scrollWidth` と `clientWidth` を比較する。個別ページでは `section[aria-labelledby="install-heading"] pre` の `scrollLeft=100` を設定し、実際の正の値を記録する。
8. 1440pxの Button 個別ページで install grid の computed `gridTemplateColumns` と両カードの位置を測る。
9. 一覧画像は検索語「モーション」、0件画像は「zzzz」で先頭へ戻して撮影する。375px画像は install 節へスクロールし、コード欄の `scrollLeft=0` に戻して撮る。

## 絞り込み結果（light / dark 共通）

| 検索語 | カード数 | 残存カード | カテゴリ数 | 件数表示 |
|---|---:|---|---:|---|
| 空文字（初期状態） | 96 | 全96件（既存 catalog-build の SSR 集合一致も成功） | 11 | 96 件 |
| text | 5 | textarea / context-menu / text-reveal / text-swap / streaming-text | 4 | 5 件 |
| モーション | 5 | animated-number / icon-swap / success-check / text-reveal / text-swap | 1 | 5 件 |
| Text Reveal | 1 | text-reveal | 1 | 1 件 |
| TEXTREVEAL | 1 | text-reveal | 1 | 1 件 |
| block | 28 | login-01 / login-02 / login-03 / login-04 / login-05 / signup-01 / signup-02 / signup-03 / signup-04 / signup-05 / dashboard-01 / dashboard-table / sidebar-01 / sidebar-02 / sidebar-03 / sidebar-04 / sidebar-05 / sidebar-06 / sidebar-07 / sidebar-08 / sidebar-09 / sidebar-10 / sidebar-11 / sidebar-12 / sidebar-13 / sidebar-14 / sidebar-15 / sidebar-16 | 2 | 28 件 |
| zzzz | 0 | なし | 0 | 0 件：該当するコンポーネントがありません |

`block` の28件はすべて `data-component-index-kind="block"`。`モーション` では他カテゴリの section は0件。`zzzz` ではカード0・section 0・`data-index-search-empty` 1で、検索欄と0件案内それぞれのクリア操作により96件へ戻った。
初期カテゴリの件数はアクション4、フォーム14、データ表示11、ナビゲーション7、オーバーレイ9、フィードバック6、モーション5、チャット6、レイアウト6、認証10、アプリシェル18。両テーマで全検索語の表示件数と実カード数を照合した。

### 絞り込み後のカテゴリ件数の突合

| 検索語 | カテゴリ | 表示 | 実カード数 | 結果 |
|---|---|---|---:|---|
| text | フォーム | 1 items | 1 | 一致（両テーマ） |
| text | オーバーレイ | 1 items | 1 | 一致（両テーマ） |
| text | モーション | 2 items | 2 | 一致（両テーマ） |
| text | チャット | 1 items | 1 | 一致（両テーマ） |
| モーション | モーション | 5 items | 5 | 一致（両テーマ） |
| block | 認証 | 10 items | 10 | 一致（両テーマ） |
| block | アプリシェル | 18 items | 18 | 一致（両テーマ） |

### 入力・読み上げ・block状態

- 入力は `type="search"`、`aria-label="コンポーネントを絞り込む"`。Chromiumの標準クリアを `[&::-webkit-search-cancel-button]:hidden` で隠す。
- クリアは初期0個、入力後1個。`data-index-search-status` の `aria-live="polite"` と視覚的件数表示をDOMで確認した。スクリーンリーダー固有の実音声は検証対象外。
- 初期・各検索語で Sidebar のリンクは常に97個（一覧1＋個別96）であり、本文の絞り込みに影響されなかった。
- `login-01` は light で `/preview/login-01/`、dark で `/preview/login-01-dark/` の iframe が再表示された。いずれも再表示時の読込ボタンは0個。読み込み済み name の保持を確認しており、iframe 内の入力値やネットワーク再読込の保持を要求するものではない。

## 375px の横はみ出し

司令塔が提供した修正前の `/components/text-reveal/` は scrollWidth 641 / clientWidth 375。本検証では修正後を測定した。

| ページ | scrollWidth | clientWidth | 結果 |
|---|---:|---:|---|
| `/components/text-reveal/` | 375 | 375 | 一致 |
| `/components/button/` | 375 | 375 | 一致 |
| `/components/login-01/` | 375 | 375 | 一致 |
| `/` | 375 | 375 | 一致 |
| `/components/` | 375 | 375 | 一致 |

### install のコード欄

| ページ | カード | pre clientWidth | pre scrollWidth | scrollLeft=100 設定後 | overflowX | article minWidth |
|---|---|---:|---:|---:|---|---|
| `/components/text-reveal/` | 直接 URL | 299 | 581 | 100 | auto | 0px |
| `/components/text-reveal/` | 名前空間 | 299 | 398 | 99 | auto | 0px |
| `/components/button/` | 直接 URL | 299 | 538 | 100 | auto | 0px |
| `/components/button/` | 名前空間 | 299 | 355 | 56 | auto | 0px |
| `/components/login-01/` | 直接 URL | 299 | 555 | 100 | auto | 0px |
| `/components/login-01/` | 名前空間 | 299 | 372 | 73 | auto | 0px |

すべて `pre.scrollWidth > pre.clientWidth` かつ `scrollLeft > 0`。修正箇所は `component-documentation.tsx` の install カード2個のみで、`CommandBlock` の変更は不要だった。トップと一覧は375pxの実測で収まったため、修正を広げていない。

## 1440px の回帰

- Button 個別ページ: document scrollWidth / clientWidth は1440 / 1440。
- install grid: `470px 470px` の2列。左カード x=368、右カード x=858、両方 y=798.59375、幅470。
- 一覧は両テーマ・全検索語で document scrollWidth / clientWidth が1440 / 1440。

## ブラウザエラー・フォント

全8 context（一覧2、375px5、1440px個別1）で HTTP 200、console error 0、pageerror 0、favicon error 0、failed request 0。テーマを HTML の `data-theme` とも照合した。
`document.fonts.check('500 11px "IBM Plex Mono"')` と `document.fonts.check('600 44px "IBM Plex Sans JP"')` は全 context で load 前後ともtrue。
`document.fonts.load('500 11px "IBM Plex Mono"', 'REGISTRY')` は1 face、`document.fonts.load('600 44px "IBM Plex Sans JP"', 'コンポーネント一覧')` は3 faces。h1 の computed fontFamily は全 context で `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif`。

## ローカル検証

各コマンドは個別に終了コードを観測した。テストファイルは無変更で既存 `test(` の削除は0行。

| 検査 | exit | 実測 |
|---|---:|---|
| standards | 0 | 263ファイル適合 |
| lint | 0 | 517ファイル、error 0 / warning 215 / info 3 |
| catalog-build | 0 | test 10 / pass 10 / fail 0 / skip 0 |
| docs-site | 0 | test 11 / pass 11 / fail 0 / skip 0 |
| site-delivery | 0 | test 3 / pass 3 / fail 0 / skip 0 |
| typography-usage | 0 | test 6 / pass 6 / fail 0 / skip 0 |
| check-completeness.test | 0 | test 95 / pass 95 / fail 0 / skip 0 |
| contrast.test | 0 | test 18 / pass 18 / fail 0 / skip 0 |
| build:lib | 0 | ESM・型宣言生成 |
| check:props | 0 | props契約適合 |
| check-completeness | 0 | component 68 / block 28 |
| check-preview-render | 0 | preview selector 宣言 OK |
| registry:build | 0 | registry index OK |
| check-distribution | 0 | CSS・トークン・法務ファイル一致 |
| registry.json 差分検査 | 0 | 差分なし |
| build:site | 0 | 292ページ |
| Playwright | 0 | 上記全ケース適合 |

再実行するコマンドは次のとおり（build:lib→check:props→completeness→preview-render、registry:build→distribution、build:siteの順序を保つ）。

```sh
node scripts/check-standards.mjs
npm run lint
node --test scripts/catalog-build.test.mjs
node --test scripts/docs-site.test.mjs
node --test scripts/site-delivery.test.mjs
node --test scripts/typography-usage.test.mjs
node --test scripts/check-completeness.test.mjs
node --test scripts/contrast.test.mjs
npm run build:lib
npm run check:props
node scripts/check-completeness.mjs
node scripts/check-preview-render.mjs
npm run registry:build
node scripts/check-distribution.mjs
git diff --exit-code registry.json
npm run build:site
node scripts/check-evidence.mjs
```

全件テスト・typecheck・check:all は指示に従ってローカル未実行。PR CI の最終結果と、report直後・証跡commit後の check-evidence の結果は PR 本文へ記録する。

## JPEG

- [2026-09-18-component-page-375-light.jpg](2026-09-18-component-page-375-light.jpg) — 375×812、37,147 bytes、SHA-256 `b9cab5cd2206563fd3726148a1aa42daec75ad757c17a1abc2a22530cbd7d146`。
- [2026-09-18-index-search-dark.jpg](2026-09-18-index-search-dark.jpg) — 1440×900、91,631 bytes、SHA-256 `d697a2705207d16272b84e4baa03ac2d541f01976bd071e0fe07fdbfe4bdb485`。
- [2026-09-18-index-search-empty-light.jpg](2026-09-18-index-search-empty-light.jpg) — 1440×900、62,206 bytes、SHA-256 `19390f96069658d81da8b767ca03211276575abf2846d9b46f4dc443a195bf25`。
- [2026-09-18-index-search-light.jpg](2026-09-18-index-search-light.jpg) — 1440×900、89,906 bytes、SHA-256 `afdbf57992506329dfe514d100fac231165f54a888b8f51ac49b5c772ec6933e`。

## 検証の範囲

公開環境へのデプロイ、全96個別ページ、全プレビュー操作、スクリーンリーダーの実音声は対象外。既存の `2026-09-18-index-page.md` とその画像、共有トークン、registry定義、provenance、scriptsは変更していない。
