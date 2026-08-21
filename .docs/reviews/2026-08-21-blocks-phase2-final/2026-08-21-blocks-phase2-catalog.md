verified_impl_sha: 7116c97172241d2fc241fab75b35550c89362a54

# Phase 2 blocks catalog 横断証跡

## 実行環境・手順

- 対象SHA: `7116c97172241d2fc241fab75b35550c89362a54`
- URL: `http://127.0.0.1:4327`
- Browser: Google Chrome 151.0.7922.170
- runner: `BLOCKS_BASE_URL=http://127.0.0.1:4327 AXE_SOURCE_PATH=<一時axe-core>/axe.min.js node .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-browser-runner.mjs`
- runner exit code: `0`
- 対象: 25 block（login-02 / login-03 / login-04 / login-05 / signup-01 / signup-02 / signup-03 / signup-04 / signup-05 / sidebar-01 / sidebar-02 / sidebar-03 / sidebar-04 / sidebar-05 / sidebar-06 / sidebar-07 / sidebar-08 / sidebar-09 / sidebar-10 / sidebar-11 / sidebar-12 / sidebar-13 / sidebar-14 / sidebar-15 / sidebar-16）
- 実測route: 50 isolated + 2 catalog = 52

## catalog 実測結果

| theme | route | Document | Phase2 selector | 重複id | sidebar-10 overlay | console/network | axe critical/serious | JPEG |
|---|---|---:|---:|---:|---|---|---:|---|
| light | `/catalog/` | 200 | 25/25 | 0 | expanded=false, overlay=0 | pageerror 0, console 0, HTTP4xx5xx 0, failure 0 | 0 | [catalog-case51-light.jpg](evidence/catalog-case51-light.jpg) (1512×13625, 1172915 bytes) |
| dark | `/catalog-dark/` | 200 | 25/25 | 0 | expanded=false, overlay=0 | pageerror 0, console 0, HTTP4xx5xx 0, failure 0 | 0 | [catalog-case52-dark.jpg](evidence/catalog-case52-dark.jpg) (1512×13625, 1185610 bytes) |

全Phase2 selectorは同一DOM上で可視、`data-preview-mode=catalog`。固定id重複0、sidebar-10 actions popoverはcatalogで自動openしないことを実測した。

## axe / keyboard

- axe WCAG 2.2 AA相当タグ: isolated 50/50 route、catalog 2/2 routeで実行。critical/serious 0。
- login-02 auth form: ✅実測確認
- sidebar-10 actions trigger: ✅実測確認
- sidebar-16 toggle: ✅実測確認

## 生ログ

- `evidence/case00-target-derivation.json`
- `evidence/case00-route-results.json`
- `evidence/case00-catalog-results.json`
- `evidence/case00-axe-results.json`
- `evidence/case00-keyboard-results.json`
- `evidence/case00-summary.json`
- `evidence/case00-browser-runner.log`
- `evidence/case00-server.log`

## 目視

light/darkのfull-page JPEGを目視レビューし、カタログ全体に描画欠落・大きな重なり・切断の重大な異常がないことを確認した。

