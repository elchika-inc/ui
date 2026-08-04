verified_impl_sha: 8a8fe2fde917a8a31ba85b3653c00827e86db9fb
evidence_scope: shared-token-migration
targeted_dynamic_sha: 8a8fe2fde917a8a31ba85b3653c00827e86db9fb

# フォント一本化（IBM Plex）と共有依存の配布 実ブラウザ検証

## 対象と環境

- 検証日時: 2026-08-04、固定 SHA `8a8fe2fde917a8a31ba85b3653c00827e86db9fb`（`408fd3f` で `global.css` / `registry.json` / 依存を変更し、`587eaef` で履歴を接続、`8a8fe2f` で fixture を追随。共有トークンの最終変更は `408fd3f` で本証跡の検証 SHA の厳密な祖先）
- 環境: macOS / Playwright（Chromium headless）/ Node.js v24 系
- viewport: 1512×828 CSS px
- 配信: `npm run build:site` 成果物を `npx serve dist -l 4325` でローカル配信

## 直した不具合

### 1. フォントの2体系同居

変更前の実測: `global.css` は `@fontsource-variable/geist` を import して `--font-sans` に Geist スタックを置いていたが、`design-system/tokens.css` が `body { font-family: var(--font-body) }`（IBM Plex Sans JP）を直接宣言しているため、**継承より直接宣言が勝ち、実際の本文描画は常に IBM Plex Sans JP** だった（本番 ui.elchika.dev で `getComputedStyle(document.body).fontFamily` を実測して確認）。Geist は `font-sans` ユーティリティを明示的に使った箇所にだけ出る、という二重状態だった。

design system v1.8 の意図（`--font-display` / `--font-body` / `--font-mono` を持ち `:lang(en)` で語順を入れ替える）を正として、alias 層を design system 層へ接続した:

| alias | 変更前 | 変更後 |
|---|---|---|
| `--font-sans` | `'Geist Variable', 'Hiragino Sans', …` | `var(--font-body)` |
| `--font-heading` | `var(--font-sans)` | `var(--font-display)` |

検証（本 SHA のビルドを配信し computed 値を実測）:

| 対象 | 結果 |
|---|---|
| `body` | `"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif` |
| `font-sans` ユーティリティ | 同上（body と一致） |
| `font-heading` ユーティリティ | 同上 |
| `:root` で `--font-display` を上書き | `font-heading` が `BrandProbe, serif` へ変わり、**`font-sans` は不変** |

最後の行が重要で、見出しノブが**配布ファイルを編集せずに利用側 CSS の `:root` から回せる**ようになった（従来は `@theme inline` の `--font-heading` 行を直接編集する必要があり、`shadcn add` のたびに再適用が要るリスクがあった）。ビルド成果物からの Geist 参照は 0 件。

### 2. 共有依存が配布されずビルドが落ちる

変更前の実測: fresh install（`components.json` + tsconfig paths だけの最小プロジェクトへ `shadcn add`）の後に `npx @tailwindcss/cli -i elchika-ui/tokens.css -o out.css` を実行すると `Can't resolve 'tw-animate-css'` で失敗した。配布された `tokens.css` が `@import` する npm パッケージが registry の `dependencies` に含まれていなかったため。

`tw-animate-css` と `shadcn` を全 62 item の `dependencies` へ追加した（生成元 `scripts/add-component.mjs` の `SHARED_DEPENDENCIES` も追随）。`@fontsource-variable/geist` は上記1で import ごと削除したため不要になった。

検証（fresh install probe）:

- `shadcn add` 後の consumer `package.json` の dependencies: `@base-ui/react` / `class-variance-authority` / `shadcn` / `tw-animate-css`（+ 元からの react / react-dom / tailwindcss）
- `npm install` → `npx @tailwindcss/cli -i elchika-ui/tokens.css -o out.css` が **exit 0**（追加の手動インストールなし）

## 履歴の接続について（`587eaef`）

PR #16（brands.css 配布化）を **squash merge** した結果、証跡 `brands-css-distribution/report.md` が固定した `verified_impl_sha` (`f753e0d`) が main の履歴から消え、`check-evidence` の祖先判定を通らなくなった。証跡は immutable（SHA の書き換えも削除も検査が弾く）ため、squash 前の commit を `git merge --no-ff -s ours` で取り込み、**ツリーを変えずに履歴だけを接続**した。接続後 `f753e0d` は HEAD の祖先に戻り、当該証跡の形式検査は回復している。

**この repo の PR は以後 squash ではなく merge commit でマージする**（squash は証跡機構と構造的に両立しない）。

## 共有面の回帰確認（14 subject × light/dark、28枚）

`disabled-controls` / `catalog` は `/catalog/`・`/catalog-dark/`、他 12 subject は `/preview/<name>/`・`/preview/<name>-dark/` を全画面撮影した（同ディレクトリの `2026-08-04-*.jpg`）。本文書体が Geist から IBM Plex Sans JP へ切り替わる差分は意図した変更で、レイアウト崩れ・オーバーフローは観測されなかった。走査中の console error は favicon.ico の 404（serve 環境の既知事象）のみで、component 由来のエラーは 0 件。

## 検査

- `npm run registry:build` / `registry:legal` / `build:site`: いずれも exit 0
- `npm install`: exit 0（Geist 依存の削除を反映）
