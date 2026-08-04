verified_impl_sha: f753e0d0394caa2a0ab09544de512f5eee9ff053
evidence_scope: shared-token-migration
targeted_dynamic_sha: f753e0d0394caa2a0ab09544de512f5eee9ff053

# brands.css 配布化の実ブラウザ検証

## 対象と環境

- 検証日時: 2026-08-04、固定 SHA `f753e0d0394caa2a0ab09544de512f5eee9ff053`（`3f23c10` で `src/styles/global.css` へ brands.css の import を追加し registry 62 item へ配布 entry を追加、`f753e0d` で distribution 検査と fixture を追随）
- 環境: macOS / Playwright（Chromium headless）/ Node.js v24 系
- viewport: 1512×828 CSS px / DPR 1（headless。過去証跡の DPR 2 と異なるが checkImage の検査対象は実体形式のみ）
- 配信: `npm run build:site` 成果物を `npx serve dist -l 4323` でローカル配信

## 変更の性質と検証方針

変更は「生成済み `brands.css` を registry 配布に含め、`global.css`（配布名 `elchika-ui/tokens.css`）から design-system layer で import する」のみ。トークン値の変更はない。`brands.css` のセレクタはすべて `[data-brand="…"]` で、`data-brand` 未指定の描画には一切適用されない——よって既存 preview の見た目は不変が期待値であり、共有面（14 subject × light/dark）の再撮影で回帰がないことを確認した。

## data-brand の実挙動（今回の変更で新たに可能になる操作）

`/preview/button/` 上で `--primary` の computed color を実測:

| 状態 | computed `--primary` | 期待値（brands.css / tokens.css） |
|---|---|---|
| 未指定 light | rgb(47, 95, 209) | elchika ブルー brand-600 一致 |
| `data-brand="indigo"` light | rgb(92, 83, 217) | indigo `--brand-600: 92 83 217` 一致 |
| `data-brand="indigo"` dark（`.dark` + `data-theme="dark"` 併記） | rgb(144, 137, 243) | indigo `--brand-400: 144 137 243` 一致 |
| 未指定 dark | rgb(110, 147, 240) | elchika ブルー dark 一致 |

ビルド後 CSS（`dist/_astro/global.*.css`）に `[data-brand=indigo]` 等のルールが含まれることも確認した。

## 共有面の回帰確認（14 subject × light/dark、28枚）

`disabled-controls` / `catalog` は `/catalog/`・`/catalog-dark/`、他 12 subject は `/preview/<name>/`・`/preview/<name>-dark/` を全画面撮影した（同ディレクトリの `2026-08-04-*.jpg`）。走査中の console error は favicon.ico の 404（serve 環境の既知事象）のみで、component 由来のエラーは 0 件。

## fresh-install probe

最小プロジェクト（components.json + tsconfig paths のみ）へ `npx shadcn@4.16.0 add http://127.0.0.1:4323/r/button.json` を実行:

- `elchika-ui/tokens.css` / `elchika-ui/design-system/tokens.css` / `elchika-ui/design-system/brands.css` が配布された
- 配布された `tokens.css` の2行目が `@import "./design-system/brands.css" layer(design-system);` を含む
- 配布 `brands.css` はリポジトリ原本と byte 一致（`cmp` で確認）

## 検査

- `node --test scripts/check-distribution.test.mjs scripts/add-component.test.mjs`: pass（fixture へ brands 追加後）
- `node --test scripts/design-tokens.test.mjs`: pass（単独実行）
- `npm run registry:build` / `registry:legal`: exit 0。`public/r/button.json` の files に brands.css entry を確認
