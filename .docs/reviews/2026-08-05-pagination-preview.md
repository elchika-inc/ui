verified_impl_sha: c2286e58279a48f5ec9f86eb0906d1b025715372

# pagination 実ブラウザ証跡（noUncheckedIndexedAccess 対応後の再検証）

- 検証日: 2026-08-05
- 環境: macOS / Chromium (Playwright) / viewport 1280×900 / scale css
- 対象: `npm run build:site` の静的出力を `npx serve dist -l 3021` で配信した isolated preview
- selector: `[data-slot="pagination-preview"]`

## 再検証の理由

`src/previews/pagination.tsx` を変更したため、`brand-token-migration/2026-08-03-pagination-preview.md` の証跡が `check-evidence` の「検証 SHA 以降に component 固有 path が変更されている」に該当した。変更内容は `noUncheckedIndexedAccess` 有効化に伴う型の明示化で、描画結果を変えない想定だったため、**実測して同一であることを確認する**目的で撮り直した。

## 実測結果

| Theme | Route | Theme同期 | target background / color | Keyboard | Console / HTTP / network failure | 横overflow | JPEG |
|---|---|---|---|---|---|---|---|
| light | `/preview/pagination/` | class 無 / `data-theme=light` / `color-scheme=light` 一致 | `rgba(0, 0, 0, 0)` / `rgb(26, 28, 33)` | `A`「1」、focus-visible=true、ring `rgb(47, 95, 209)` 3px | 1 / 0 / 0（下記） | なし | `2026-08-05-pagination-preview-light.jpg` (1280×900, 10229 bytes) |
| dark | `/preview/pagination-dark/` | `class=dark` / `data-theme=dark` / `color-scheme=dark` 一致 | `rgba(0, 0, 0, 0)` / `rgb(246, 246, 247)` | `A`「1」、focus-visible=true、outline `rgb(110, 147, 240)` | 1 / 0 / 0（下記） | なし | `2026-08-05-pagination-preview-dark.jpg` (1280×900, 10178 bytes) |

描画テキストは両テーマとも `前へ 1 2 3 その他のページ 8 次へ`。

## 2026-08-03 の証跡との差分

| 項目 | 2026-08-03 | 2026-08-05 | 判定 |
|---|---|---|---|
| light の background / color | `rgba(0, 0, 0, 0)` / `rgb(26, 28, 33)` | 同一 | 変化なし |
| dark の background / color | `rgba(0, 0, 0, 0)` / `rgb(246, 246, 247)` | 同一 | 変化なし |
| theme 同期 | 一致 | 一致 | 変化なし |
| focus-visible | true | true | 変化なし |
| 横 overflow | なし | なし | 変化なし |

**computed style が両テーマで前回と完全に一致した。** 型の明示化が描画へ影響していないことを実測で確認した。

## console error 1 件について

両ルートで `Failed to load resource: 404 @ /favicon.ico` が1件出る。**component とは無関係の既存挙動**で、原因は次のとおり:

- サイトは `public/favicon.svg` を持つが `favicon.ico` を持たない
- isolated preview のページは `rel="icon"` を宣言していないため、ブラウザが `/favicon.ico` を自動要求して 404 になる

2026-08-03 の証跡は `0 / 0 / 0` と記録しているが、当時と異なる配信方法（当時: 固定 SHA から build、今回: `serve dist`）で測っているため、**同じ条件での比較にはなっていない**。この 404 を「今回の変更で増えた」とは判定していない。preview ページに favicon を宣言するかは別課題。

## 見た範囲 / 見ていない範囲

- 見た範囲: static build の isolated light/dark、hydration 後 DOM、computed background/color、Tab 後の focus と focus-visible、theme 3点（class / data-theme / color-scheme）の同期、console、horizontal overflow、JPEG 実体（`file` コマンドで 1280×900 baseline JPEG を確認）
- 見ていない範囲: viewport 1280×900 以外、preview から到達できない state（`currentPage` が 4〜7 のときの省略表示）、assistive technology 固有の読み上げ、実 CI 環境での再現
