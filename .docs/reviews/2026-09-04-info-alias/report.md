verified_impl_sha: 6633051ff86d487bbe7b78fb6f0ca25add614832
evidence_scope: shared-token-migration
targeted_dynamic_sha: 6633051ff86d487bbe7b78fb6f0ca25add614832

# 情報ステータス alias の実ブラウザ検証

## 対象と環境

- 検証日: 2026-09-04
- 対象実装: `6633051ff86d487bbe7b78fb6f0ca25add614832`
- 環境: macOS / Node.js v26.7.0 / Playwright MCP（Chromium headless）
- viewport: 1440×900 CSS px
- 配信方法: `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port 4391` で配信
- 実ポート: `4391`
- 疎通: `curl -sI http://127.0.0.1:4391/` は exit 0、HTTP 200

## route・selector・console error

`console error` は component 由来と favicon 由来を分離した。全 route で `pageerror` は 0 件、`document.documentElement.scrollWidth > document.documentElement.clientWidth` は false だった。

| subject | theme | route | `preview-selectors.json` の selector | selector 件数 | console error（component / favicon） | `pageerror` | 横 overflow |
|---|---|---|---|---:|---:|---:|---|
| alert-dialog | light | `/preview/alert-dialog/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| alert-dialog | dark | `/preview/alert-dialog-dark/` | `[data-slot="alert-dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| attachment | light | `/preview/attachment/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| attachment | dark | `/preview/attachment-dark/` | `[data-slot="attachment-preview"]` | 1 | 0 / 0 | 0 | なし |
| menubar | light | `/preview/menubar/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| menubar | dark | `/preview/menubar-dark/` | `[data-slot="menubar-content"]` | 1 | 0 / 0 | 0 | なし |
| select | light | `/preview/select/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| select | dark | `/preview/select-dark/` | `[data-slot="select-content"]` | 1 | 0 / 0 | 0 | なし |
| button | light | `/preview/button/` | `[data-slot="button"]` | 9 | 0 / 0 | 0 | なし |
| button | dark | `/preview/button-dark/` | `[data-slot="button"]` | 9 | 0 / 0 | 0 | なし |
| bubble | light | `/preview/bubble/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| bubble | dark | `/preview/bubble-dark/` | `[data-slot="bubble-preview"]` | 1 | 0 / 0 | 0 | なし |
| dialog | light | `/preview/dialog/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| dialog | dark | `/preview/dialog-dark/` | `[data-slot="dialog-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | light | `/preview/drawer/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| drawer | dark | `/preview/drawer-dark/` | `[data-slot="drawer-content"]` | 1 | 0 / 0 | 0 | なし |
| badge | light | `/preview/badge/` | `[data-slot="badge"]` | 6 | 0 / 0 | 0 | なし |
| badge | dark | `/preview/badge-dark/` | `[data-slot="badge"]` | 6 | 0 / 0 | 0 | なし |
| alert | light | `/preview/alert/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| alert | dark | `/preview/alert-dark/` | `[data-slot="alert"]` | 2 | 0 / 0 | 0 | なし |
| sheet | light | `/preview/sheet/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| sheet | dark | `/preview/sheet-dark/` | `[data-slot="sheet-content"]` | 1 | 0 / 0 | 0 | なし |
| tabs | light | `/preview/tabs/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| tabs | dark | `/preview/tabs-dark/` | `[data-slot="tabs"]` | 1 | 0 / 0 | 0 | なし |
| catalog | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| catalog | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | light | `/catalog/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |
| disabled-controls | dark | `/catalog-dark/` | `[data-slot="verification-catalog"]` | 1 | 0 / 0 | 0 | なし |

`disabled-controls` は専用 selector を `preview-selectors.json` に持たないため、coordinator の裁定に従い `catalog` の selector を共用した。同じ route 内で `[disabled]` 属性を持つ要素は light 15 件、dark 15 件だった。

## alias と下層 token の実測

`/preview/button/` と `/preview/button-dark/` の `document.documentElement` で computed style を取得した。alias はすべて対応する `tokens.css` の token を `rgb(...)` へ展開した値と一致した。

| theme | alias | computed 値 | 対応 token | token 値 | 一致 |
|---|---|---|---|---|---|
| light | `--info` | `rgb(227 234 251)` | `--color-status-info-bg` | `227 234 251` | はい |
| light | `--info-foreground` | `rgb(30 58 143)` | `--color-status-info-text` | `30 58 143` | はい |
| light | `--success` | `rgb(220 243 234)` | `--color-status-success-bg` | `220 243 234` | はい |
| light | `--success-foreground` | `rgb(20 108 74)` | `--color-status-success-text` | `20 108 74` | はい |
| light | `--warning` | `rgb(252 233 214)` | `--color-status-warning-bg` | `252 233 214` | はい |
| light | `--warning-foreground` | `rgb(143 70 8)` | `--color-status-warning-text` | `143 70 8` | はい |
| dark | `--info` | `rgb(30 58 143)` | `--color-status-info-bg` | `30 58 143` | はい |
| dark | `--info-foreground` | `rgb(143 172 245)` | `--color-status-info-text` | `143 172 245` | はい |
| dark | `--success` | `rgb(20 61 46)` | `--color-status-success-bg` | `20 61 46` | はい |
| dark | `--success-foreground` | `rgb(52 192 138)` | `--color-status-success-text` | `52 192 138` | はい |
| dark | `--warning` | `rgb(61 37 12)` | `--color-status-warning-bg` | `61 37 12` | はい |
| dark | `--warning-foreground` | `rgb(232 148 62)` | `--color-status-warning-text` | `232 148 62` | はい |

`--info` と `--info-foreground` はいずれも light / dark で異なる値になった。

## 利用側到達 probe

worktree 内の一時 HTML に `<span class="bg-info text-info-foreground">info</span>` を置き、worktree ルートで次を実行した。

- `npx --yes @tailwindcss/cli@4 -i src/styles/global.css -o .playwright-mcp/probe/out.css`: exit 0
- `grep -c '\.bg-info' .playwright-mcp/probe/out.css`: `1`（exit 0）
- `grep -c -- '--color-info:' .playwright-mcp/probe/out.css`: `1`（exit 0）

これにより、利用側が `bg-info` と `text-info-foreground` を使用した場合に Tailwind v4 が alias を走査して CSS を生成する経路を実測した。一時ファイルは証跡コミットへ含めない。

## JPEG の実体

| ファイル | 幅×高さ | magic bytes |
|---|---:|---|
| `2026-09-04-alert-dialog-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-alert-dialog-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-attachment-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-attachment-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-menubar-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-menubar-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-select-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-select-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-button-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-button-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-bubble-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-bubble-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-dialog-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-dialog-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-drawer-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-drawer-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-badge-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-badge-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-alert-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-alert-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-sheet-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-sheet-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-tabs-preview-light.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-tabs-preview-dark.jpg` | 1440×900 | `FF D8 FF` |
| `2026-09-04-catalog-preview-light.jpg` | 1440×27212 | `FF D8 FF` |
| `2026-09-04-catalog-preview-dark.jpg` | 1440×27212 | `FF D8 FF` |
| `2026-09-04-disabled-controls-light.jpg` | 1440×27212 | `FF D8 FF` |
| `2026-09-04-disabled-controls-dark.jpg` | 1440×27212 | `FF D8 FF` |

## 目視結果

28 枚を light / dark の対で目視した。各 preview の文字、枠、メニュー、modal、drawer、sheet、状態色は viewport 内に収まり、意図しない重なり、切れ、横方向のはみ出しは観測されなかった。`catalog` と `disabled-controls` の全画面画像でも、カード列や各 section に横方向の崩れは観測されなかった。
