verified_impl_sha: c02cfed6c112c9549a53361c6219bdffcca90940
evidence_scope: shared-token-migration
targeted_dynamic_sha: c02cfed6c112c9549a53361c6219bdffcca90940

# font-mono の layer 衝突修正 実ブラウザ検証

## 対象と環境

- 検証日時: 2026-08-04、固定 SHA `c02cfed6c112c9549a53361c6219bdffcca90940`（`7f92521` で design-tokens.html / tokens.css / global.css を変更し、`c02cfed` で README を追随。共有トークンの最終変更は `7f92521` で本証跡の検証 SHA の厳密な祖先）
- 環境: macOS / Playwright（Chromium headless）/ Node.js v24 系
- viewport: 1512×828 CSS px
- 配信: `npm run build:site` 成果物を `npx serve dist -l 4326` でローカル配信

## 直した不具合

`font-mono` ユーティリティが design system の等幅（IBM Plex Mono）ではなく Tailwind 既定（`ui-monospace, SFMono-Regular, …`）にフォールバックしていた。

原因: `@import "./design-system/tokens.css" layer(design-system)` は `@import "tailwindcss"` より前に置かれるため、cascade layer 順で Tailwind の `@theme`（同名の `--font-mono` を持つ）が design-system layer に勝つ。`--font-sans` / `--font-heading` は `@theme inline` で `--font-body` / `--font-display` という**衝突しない名前**へ再マップされているため無傷だった。

対応: design system の正本 `design-tokens.html` に衝突しない別名 `--font-code` を追加し（`build-tokens.mjs` が `tokens.css` へ出力）、alias 層の `@theme inline` で `--font-mono: var(--font-code)` と再マップした。値の複製は発生しない（別名も正本が持つ）。

### 検証（本 SHA のビルドを配信し computed 値を実測）

| ユーティリティ | 修正前 | 修正後 |
|---|---|---|
| `font-mono` | `ui-monospace, SFMono-Regular, Menlo, …` | **`"IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace`** |
| `font-sans` | `"IBM Plex Sans JP", …` | 同左（不変） |
| `font-heading` | `"IBM Plex Sans JP", …` | 同左（不変） |
| `body` | `"IBM Plex Sans JP", …` | 同左（不変） |

また、最小プロジェクトでの Tailwind コンパイル出力で `.font-mono { font-family: var(--font-code); }` になることを確認し、方式を決めてから実装した。

## 直していないもの（意図的）

同じ layer 衝突は `--leading-*` / `--text-*` / `--tracking-*` / `--radius-xs` / `--shadow-*` にもあり、design system の値が Tailwind 既定に負けている。**これは直さない** — standards の DESIGN.md §5 が「タイポグラフィ・スペーシング・ブレークポイント・z-index は Tailwind v4 のデフォルトスケールを正とする（MUST）」と規定しており、現状が standards 準拠だからである。等幅だけは「和文フォールバックが失われる」という実害があるため対応した。

## 共有面の回帰確認（14 subject × light/dark、28枚）

`disabled-controls` / `catalog` は `/catalog/`・`/catalog-dark/`、他 12 subject は `/preview/<name>/`・`/preview/<name>-dark/` を全画面撮影した（同ディレクトリの `2026-08-04-*.jpg`）。等幅を使う箇所以外に見た目の変化はなく、レイアウト崩れ・オーバーフローは観測されなかった。走査中の console error は favicon.ico の 404（serve 環境の既知事象）のみで、component 由来のエラーは 0 件。

## 検査

- `node src/styles/design-system/build-tokens.mjs`: exit 0（正本と生成物の byte 一致）
- `npm run build:site`: exit 0
