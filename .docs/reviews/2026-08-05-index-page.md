verified_impl_sha: a069114dab9bfae3ea1ebe62d72b8fa4bd33a5b2

# index page `/` 実ブラウザ証跡（共有面の再検証）

- 検証日: 2026-08-05
- 環境: macOS / Chromium (Playwright) / viewport 1280×900 / scale css
- 対象: `npm run build:site` の静的出力を `npx serve dist -l 3022` で配信
- 対象 SHA: `a069114dab9bfae3ea1ebe62d72b8fa4bd33a5b2`

## 再検証の理由

`catalog-index-r2/report.md`（検証 SHA `71ade34`）が `check-evidence` の共有面 stale（`src/pages/index.astro` / `src/previews` / `src/layouts/main.astro`）に該当していた。証跡は immutable なので新しい証跡を作って supersede する。

## 実測結果

| 項目 | light | dark |
|---|---|---|
| title | `elchika-inc/ui - はじめに` | 同左 |
| h1 | `elchika-inc/ui` | 同左 |
| html class / data-theme / color-scheme | 無 / `light` / `light` | `dark` / `dark` / `dark` |
| body background / color | `rgb(246, 246, 247)` / `rgb(26, 28, 33)` | `rgb(21, 23, 28)` |
| component リンク数 | 62 | — |
| 横 overflow | なし | なし |
| JPEG | `2026-08-05-index-page-light.jpg` (74663 bytes) | `2026-08-05-index-page-dark.jpg` (77328 bytes) |

## テーマ切替の実測（DESIGN §4 の MUST）

テーマ切替ボタン（`aria-label="ダークテーマに切り替える"`）を実際にクリックし、3点すべてが切り替わることを確認した。

| 観測点 | クリック前 | クリック後 |
|---|---|---|
| `html` の class | （無し） | `dark` |
| `data-theme` | `light` | `dark` |
| `color-scheme` | `light` | `dark` |
| `body` の background | `rgb(246, 246, 247)` | `rgb(21, 23, 28)` |

**パレットが実際に変わった**ことまで確認している。class だけが切り替わってパレットが残る失敗（DESIGN §4 が警告する状態）ではない。

> 補足: standards の旧 AUDIT コマンドは `src/site/theme-toggle.tsx` を「`data-theme` の操作がない」として MUST 違反に判定していたが、これは検出パターンが `dataset.theme` を拾えなかったための偽陽性だった。本証跡は**実ブラウザで両方が切り替わること**を実測しており、その判定が誤りだったことの裏付けにもなる（standards rev.61 で検査を修正）。

## 見た範囲 / 見ていない範囲

- 見た範囲: static build の `/`、light/dark 両テーマ、テーマ切替ボタンの実クリック、computed background/color、component リンク数、horizontal overflow、JPEG 実体
- 見ていない範囲: viewport 1280×900 以外、`/components/<name>/` 個別ページ、サイドバー折りたたみ状態、assistive technology 固有の読み上げ
