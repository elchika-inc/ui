verified_impl_sha: 7116c97172241d2fc241fab75b35550c89362a54

# login-02 実ブラウザ証跡（Phase 2 最終）

## 実行環境・手順

- 対象SHA: `7116c97172241d2fc241fab75b35550c89362a54`
- URL: `http://127.0.0.1:4327`
- Browser: Google Chrome 151.0.7922.170
- viewport: 1512×828 / DPR 1
- runner: `BLOCKS_BASE_URL=http://127.0.0.1:4327 AXE_SOURCE_PATH=<一時axe-core>/axe.min.js node .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-browser-runner.mjs`
- runner exit code: `0`
- 対象集合から導出した route 数: 25 block × 2 theme = 50

## 実測結果

| theme | route | Document | selector可視 | theme | overflow | console/network | axe critical/serious | JPEG |
|---|---|---:|---:|---|---|---|---:|---|
| light | `/preview/login-02/` | 200 | 1/1 | data-theme=light, dark=false | なし | pageerror 0, console 0, HTTP4xx5xx 0, failure 0 | 0 | [login-02-case01-light.jpg](evidence/login-02-case01-light.jpg) (33297 bytes) |
| dark | `/preview/login-02-dark/` | 200 | 1/1 | data-theme=dark, dark=true | なし | pageerror 0, console 0, HTTP4xx5xx 0, failure 0 | 0 | [login-02-case02-dark.jpg](evidence/login-02-case02-dark.jpg) (33493 bytes) |

preview selector: `[data-slot="login-02-preview"]`。light/dark 2/2 routeで可視、JPEG magic bytesを実測確認した。

## keyboard

- login-02 auth form: ✅実測確認（詳細: `evidence/case00-keyboard-results.json`）

## 目視

light/dark JPEGを目視レビューし、レイアウト欠落・重なり・切断の重大な異常がないことを確認した。

