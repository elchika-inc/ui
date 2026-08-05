verified_impl_sha: a069114dab9bfae3ea1ebe62d72b8fa4bd33a5b2

# カタログ横断 実ブラウザ証跡（共有面の再検証）

- 検証日: 2026-08-05
- 環境: macOS / Chromium (Playwright) / viewport 1280×900 / scale css
- 対象: `npm run build:site` の静的出力を `npx serve dist -l 3022` で配信
- 対象 SHA: `a069114dab9bfae3ea1ebe62d72b8fa4bd33a5b2`

## 再検証の理由

`recheck-0869e78/2026-08-02-batch-final-catalog.md`（検証 SHA `0869e78`）が `check-evidence` の共有面 stale（`src/components/ui` / `src/previews` / `src/layouts/main.astro`）に該当していた。証跡は immutable なので新しい証跡を作って supersede する。

## 実測結果

| 項目 | `/catalog/`（light） | `/catalog-dark/`（dark） |
|---|---|---|
| title | `カタログ — elchika-inc/ui` | `カタログ Dark — elchika-inc/ui` |
| h1 | `カタログ` | `カタログ` |
| html class / data-theme / color-scheme | 無 / `light` / `light` | `dark` / `dark` / `dark`（3点同期） |
| body background | — | `rgb(21, 23, 28)` |
| hydrate 済みプレビュー | **49** | **49**（一致） |
| 不可視プレビュー | 0 | 0 |
| 旧文言 `検証用カタログ` | 0件 | 0件 |
| console error | 0 | 0 |
| 横 overflow | なし | なし |
| JPEG | `2026-08-05-shared-surface-catalog-light.jpg` (106106 bytes) | `2026-08-05-shared-surface-catalog-dark.jpg` (106827 bytes) |

## 2026-08-02 の証跡との差分

前回（`0869e78`）は「Light / Dark を各3 fresh tab、計6 run で実測し、全 run で期待 preview 集合と hydrated DOM 集合が完全一致」と記録している。今回は各テーマ1 run で、**hydrate 済みプレビュー数が両テーマとも 49 で一致**し、不可視・旧文言・console error はいずれも0件だった。前回の GREEN 判定と矛盾する観測はない。

**測定回数は前回より少ない**（各1 run / 前回は各3 run）。フレーク検出力はその分低い。

## 見た範囲 / 見ていない範囲

- 見た範囲: static build の `/catalog/` と `/catalog-dark/`、hydrate 済みプレビュー数と可視性、テーマ3点同期、公開文言、console error、horizontal overflow、JPEG 実体
- 見ていない範囲: 複数 run による揺らぎ（各テーマ1 run のみ）、viewport 1280×900 以外、overlay / toast の能動的な発火、個別 component route、network failure の詳細内訳
