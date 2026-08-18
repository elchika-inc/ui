verified_impl_sha: 01818d293143739948986f9dc7b14a6f0ff7eed9

# login-01 実ブラウザ証跡（レビュー指摘の修正後・再検証）

- 検証日: 2026-08-18（JST）
- 環境: macOS / Chromium (Playwright) / viewport 1200×762 / scale css
  （2026-08-17 の証跡は 1280×900。撮影前に resize しなかったため既定の viewport で撮っている。
  以下の比はすべて分母 762）
- 対象: `npm run dev`（Astro dev server）の isolated preview とカタログ。
  既定 port は 4321 だが別プロセスが掴んでいたため Astro が 4322 へ繰り上げた。
  追試時は `npm run dev` の出力の port を使う
- selector: `[data-slot="login-01-preview"]`

## 再検証の理由

並行レビューで `src/previews/login-01.tsx` に flag が付き、修正したため
`2026-08-17-login-01-preview.md`（`verified_impl_sha: b390284`）が
`check-evidence` の「検証 SHA 以降に component 固有 path が変更されている」に該当した。

指摘は「preview が `mode` を捨てており、カタログでも `min-h-svh` が効いてグリッド行が
縦に破綻する」。`src/previews/sidebar.tsx` に同型の先例（catalog 時だけ高さを固定する）が
既にあり、login-01 だけがその規約に従っていなかった。

**この指摘は `check-evidence` の block 対応（同 commit）が無ければ検出されなかった。**
修正前の `check-evidence` は証跡カバレッジを `src/components/ui` 由来の名前だけで回しており、
block の証跡が stale でも緑のままだった。

## 実測結果

| 対象 | Route | HTTP | ルート要素 | data-preview-mode | 高さ | Console error | JPEG |
|---|---|---|---|---|---|---|---|
| light | `/preview/login-01/` | 200 | `<html lang="ja" data-theme="light">` | `isolated` | 762px（= viewport 高 762。上流の枠を保持） | 1（favicon 404、下記） | `2026-08-18-login-01-preview-light.jpg` (30547 bytes) |
| dark | `/preview/login-01-dark/` | 200 | `<html lang="ja" class="dark" data-theme="dark">` | `isolated` | 同上 | 1（同上） | `2026-08-18-login-01-preview-dark.jpg` (29742 bytes) |
| catalog | `/catalog/` | 200 | — | `catalog` | **384px（= h-96 = 24rem。viewport 高 762 の 0.504）** | 0 | `2026-08-18-login-01-catalog.jpg` (62371 bytes) |

横 overflow は isolated で `scrollWidth > clientWidth` が false（なし）。

カタログの証跡は login-01 のセルを画面中央へスクロールして撮った。隣接する Label セルと
同じ行の高さに収まっており、修正前に想定された「セル 1 個が全画面高になり同じ行が
stretch で引き伸ばされる」状態が解消していることを目視で確認した。

## 公開 component ページのソースリンク

同レビューで「`/components/login-01/` の『GitHubでソースを見る』が
`src/components/ui/login-01.tsx` を指し 404」と指摘された。`npm run build:site` の
出力で修正を実測した。

| ページ | href | 判定 |
|---|---|---|
| `dist/components/login-01/index.html` | `https://github.com/elchika-inc/ui/tree/main/src/blocks/login-01` | block はディレクトリの tree URL |
| 同 | `src/components/ui/login-01.tsx` の出現 0 件（`grep -c` → 0） | 旧リンクは残っていない |
| `dist/components/button/index.html` | `https://github.com/elchika-inc/ui/blob/main/src/components/ui/button.tsx` | component は従来どおり blob URL |

## 測った範囲

- **動作**: 実ブラウザで描画し、accessibility tree・要素の実寸（`getBoundingClientRect`）・
  `data-preview-mode` の到達・横 overflow の有無を測り、スクリーンショットを目視確認した
- **未測定**: キーボード操作とフォーカスリングの computed style
- **未測定**: `tree` URL の到達性。リンク先は `main` を指すが本ブランチは未マージなので、
  マージ後に実在する（既存 component の blob URL と同じ規約）

## console error 1 件について

isolated の両ルートで `Failed to load resource: 404 @ /favicon.ico` が 1 件出る。
component とは無関係の既存挙動で、preview のページが `rel="icon"` を宣言しないため
ブラウザが自動要求して 404 になる。既存の証跡（`2026-08-05-pagination-preview.md` 等）と同じ。

## 共有面の stale について

`check-evidence` は本ブランチで次の 2 件を stale として報告する（exit 0 の警告）。

```
2026-08-05-index-page.md: src/previews
2026-08-05-shared-surface-catalog.md: src/previews
```

これは `src/previews/login-01.tsx` を足したことによる。集約証跡（index-page /
shared-surface-catalog）は `evidencePaths` のスコープに `src/previews` を含むため、
preview を 1 枚足すだけで stale 一覧へ載る。

**共有トークン（`src/styles/global.css` / `src/styles/design-system/**`）は変更していない**ため、
`SHARED_TOKEN_IMAGE_SUBJECTS`（14 subject × light/dark = 28 枚）の撮り直しは発生しない。
集約証跡の撮り直しは Phase 2（残り 26 件）の完了時にまとめて行うのが妥当で、
1 件ごとに 2 枚撮り直す運用にはしない。
