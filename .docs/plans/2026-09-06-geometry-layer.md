[Issue #52](https://github.com/elchika-inc/ui/issues/52)

# 委任仕様: 幾何レイヤーを design system のトークンへ接続する（issue #52）

## 1. 背景（司令塔が実測済み。再調査不要）

- リポジトリ: elchika-inc/ui（Astro 7 + React 19 + Tailwind CSS v4 + Base UI）。`AGENTS.md` と `CLAUDE.md` を最初に読むこと。
- `src/styles/global.css` は `@import "./design-system/tokens.css" layer(design-system)` の後に `@import "tailwindcss"` を読む。ビルド済み CSS の layer 順は `design-system` → `theme` → `base` → `utilities`。**同名の CSS 変数は Tailwind の `@layer theme` 側が design-system 側に勝つ**（実測: `--shadow-xs` は design-system の値が 2 定義あるのに Tailwind 既定の `0 1px 2px 0 rgb(0 0 0 / 0.05)` が有効。`--radius-xs` も Tailwind の 0.125rem が有効）。
- この衝突は過去に `--font-mono` で起きており、`design-tokens.html` に別名 `--font-code` を置き `global.css` の `@theme inline` で `--font-mono: var(--font-code)` と再マップして解決した（commit 7f92521、`design-tokens.html` 88 行目付近）。本タスクは同じ方式を radius / shadow へ広げる。
- `global.css` の `:root` と `.dark` にある `--radius: 0.625rem` は shadcn の既定値で、`@theme inline` がそこから `--radius-sm〜4xl` を派生させている。design system の正本値は `--radius-xs 0.25rem / sm 0.375rem / md 0.5rem / lg 0.75rem / xl 1rem / full 9999px`、`--control-radius: var(--radius-md)`。
- design system の部品寸法は `--control-height-sm 1.75rem / md 2.25rem / lg 2.75rem`、`--control-padding-x: var(--space-4)`。部品層は Button が `h-7 / h-8 / h-9`、Input が `h-8`。
- design system の weight は 400 / 500 / 600 のみ。`font-bold` が `src/blocks` に 6 箇所ある（login-02 / login-04 / login-05 / signup-02 / signup-04 / signup-05 の `login-form.tsx` / `signup-form.tsx`）。`global.css` に weight の上書きは無い。
- design system の motion は `--duration-fast: 120ms`、`--ease-standard: cubic-bezier(0.2, 0, 0, 1)`。Tailwind 既定は `--default-transition-duration: 150ms`（`node_modules/tailwindcss/theme.css` 492 行目）。
- `ring-1 ring-foreground/10` は shadcn 固有の輪郭で、`card.tsx` / `dialog.tsx` / `alert-dialog.tsx` / `combobox.tsx` / `menubar.tsx`（2 箇所）にある。
- `--spacing-tabs-trigger` を `@theme inline` に置いて `h-tabs-trigger` として使う前例が `global.css` と `tabs.tsx` にある。
- `tokens.css` / `brands.css` は生成物。`src/styles/design-system/design-tokens.html` を編集して `node src/styles/design-system/build-tokens.mjs` で再生成する。生成物を直接編集しない。
- ベースライン（main、2026-09-06 実測）: `npm run lint` exit 0（warning 200 件は既存）、`node scripts/check-standards.mjs` exit 0、`npm run typecheck` はローカルで OOM になることが既知（CI で代替する）、`node --test "scripts/*.test.mjs"` は全件実行で毎回別の 1 件が落ちる flaky（落ちた 1 件を単独再実行して切り分ける）。
- `global.css` / `tokens.css` の変更は「共有トークンの変更」に当たり、`scripts/check-evidence.mjs` が 14 subject × light / dark = 28 枚の証跡と report を要求する（`AGENTS.md`「重要な設計原則」）。書式の見本は `.docs/reviews/2026-09-04-info-alias/report.md`。

## 2. 実施内容（literal）

### 2.1 design-tokens.html に値を持つ別名を追加し、参照方向を逆にする

`src/styles/design-system/design-tokens.html` のトークン定義（`:root` ブロックと `[data-theme="dark"]` ブロック）を次のように変える。

- ELEVATION: `--elevation-xs / --elevation-sm / --elevation-md / --elevation-lg` を新設し、現在 `--shadow-xs / sm / md / lg` が持つ値をそのまま移す（light は `:root`、dark は `[data-theme="dark"]` の両方）。`--shadow-xs: var(--elevation-xs)` のように `--shadow-*` 側を別名への参照にする。`--shadow-focus` は変えない。
- RADIUS: `--rounding-xs / sm / md / lg / xl / full` を新設し、現在 `--radius-xs / sm / md / lg / xl / full` が持つ値を移す。`--radius-xs: var(--rounding-xs)` のように `--radius-*` 側を参照にする。
- 「決めたことと、その理由」に 1 項目追加する。趣旨は「Tailwind の `@theme` と同名の変数は layer 順で Tailwind 側が勝つため、値は別名（`--elevation-*` / `--rounding-*`）に置き、`--shadow-*` / `--radius-*` はその参照にする。`--font-code` と同じ理由」。文言は既存項目の体裁に合わせる。
- `node src/styles/design-system/build-tokens.mjs` で `tokens.css` / `brands.css` を再生成し、`node src/styles/design-system/build-tokens.mjs --check` が exit 0 であることを確認する。build-tokens.mjs が別名の追加を受け付けない（未定義参照の検証等で落ちる）場合は、止めて ask で報告する。

### 2.2 global.css の @theme inline を接続する

`src/styles/global.css` を次のように変える。

- `:root` と `.dark` の `--radius: 0.625rem;` を削除する。
- `@theme inline` 内の `--radius-sm / md / lg / xl / 2xl / 3xl / 4xl` の 7 行を削除し、代わりに次の 5 行を置く: `--radius-xs: var(--rounding-xs); --radius-sm: var(--rounding-sm); --radius-md: var(--rounding-md); --radius-lg: var(--rounding-lg); --radius-xl: var(--rounding-xl);`
- `@theme inline` に追加: `--shadow-*: initial;` の後に `--shadow-xs: var(--elevation-xs); --shadow-sm: var(--elevation-sm); --shadow-md: var(--elevation-md); --shadow-lg: var(--elevation-lg);`
- `@theme inline` に追加: `--font-weight-*: initial;` の後に `--font-weight-normal: 400; --font-weight-medium: 500; --font-weight-semibold: 600;`。値の正本が `design-tokens.html`（`--font-weight-regular / medium / semibold`）である旨をコメントで書く（同名衝突を避けるため値を直書きしている）。
- `@theme inline` に追加: `--default-transition-duration: var(--duration-fast); --default-transition-timing-function: var(--ease-standard);`
- `@theme inline` に追加: `--spacing-control-sm: var(--control-height-sm); --spacing-control-md: var(--control-height-md); --spacing-control-lg: var(--control-height-lg); --spacing-control-x: var(--control-padding-x);`
- 各追加行の直前に、design system のどのトークンへ接続しているかの日本語コメントを 1 行置く（既存の `--font-heading` のコメントと同じ体裁）。

### 2.3 部品の class を置き換える（対象ファイルと置換を列挙。列挙外は触らない）

- `src/components/ui/button.tsx`: base の `rounded-lg` → `rounded-md`。size `default` の `h-8` → `h-control-md`、`px-2.5` → `px-control-x`。size `sm` の `h-7` → `h-control-sm`。size `lg` の `h-9` → `h-control-lg`、`px-2.5` → `px-control-x`。size `icon` の `size-8` → `size-control-md`。`icon-sm` の `size-7` → `size-control-sm`。`icon-lg` の `size-9` → `size-control-lg`。size `xs / sm / icon-xs / icon-sm` 内の `rounded-md` → `rounded-sm`、`in-data-[slot=button-group]:rounded-lg` → `in-data-[slot=button-group]:rounded-md`。`xs / icon-xs` の高さは変えない。
- `src/components/ui/button-group.tsx`: `rounded-lg` があれば `rounded-md` に置き換える（Button と角丸を揃える）。
- `src/components/ui/input.tsx`: `h-8` → `h-control-md`、`rounded-lg` → `rounded-md`。
- `src/components/ui/textarea.tsx`: `rounded-lg` → `rounded-md`。
- `src/components/ui/select.tsx`: trigger 要素の `h-8` → `h-control-md`、`h-7` → `h-control-sm`、trigger の `rounded-lg` → `rounded-md`。content（ポップアップ面）の `rounded-lg` は変えない。
- `src/components/ui/native-select.tsx`: `h-8` → `h-control-md`、`h-7` → `h-control-sm`、`rounded-lg` があれば `rounded-md`。
- `src/components/ui/input-group.tsx`: `h-8` → `h-control-md`、コンテナの `rounded-lg` があれば `rounded-md`。
- `src/components/ui/combobox.tsx`: 入力 / trigger 要素の `h-8` → `h-control-md`。`ring-1 ring-foreground/10` → `border border-border`。
- `src/components/ui/card.tsx`: `ring-1 ring-foreground/10` → `border border-border shadow-xs`。`rounded-xl` → `rounded-lg`、`rounded-t-xl` → `rounded-t-lg`、`rounded-b-xl` → `rounded-b-lg`。
- `src/components/ui/dialog.tsx` と `src/components/ui/alert-dialog.tsx`: `ring-1 ring-foreground/10` → `border border-border`。 `DialogContent` / `AlertDialogContent` に `shadow-lg` を追加する（司令塔裁定: モーダルの ELEVATION 正本へ揃える）。`rounded-xl` → `rounded-lg`、`rounded-b-xl` → `rounded-b-lg`（`rounded-t-xl` があれば `rounded-t-lg`）。
- `src/components/ui/menubar.tsx`: 2 箇所の `ring-1 ring-foreground/10` → `border border-border`。
- `src/components/ui/toast.tsx`: `rounded-2xl` → `rounded-lg`。
- `src/components/ui/badge.tsx`: `rounded-4xl` → `rounded-full`。
- `src/components/ui/` 内で `shadow-xl` を使う 1 箇所 → `shadow-lg`。
- `src/blocks` の `font-bold` 6 箇所 → `font-semibold`。

置換後に `rounded-2xl / rounded-3xl / rounded-4xl / shadow-xl / shadow-2xl / font-bold / ring-foreground/10` が `src/` に残っていないことを 4 節の負の検査で確認する。

### 2.4 証跡を撮り直す

- `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port <空きポート>` で配信して撮る（dev server は使わない。Astro の dev toolbar が写り込む）。実ポートは `curl -sI` で確かめる。
- `.docs/reviews/2026-09-06-geometry-layer/` に 14 subject（`disabled-controls, alert-dialog, attachment, catalog, menubar, select, button, bubble, dialog, drawer, badge, alert, sheet, tabs`）× light / dark = 28 枚と `report.md` を置く。report の書式・表・frontmatter（`verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha`）は `.docs/reviews/2026-09-04-info-alias/report.md` に合わせる。
- `verified_impl_sha` は **トークン変更を含む commit より後の commit** を指す（同じ commit を指すと `check-evidence` の祖先判定を通らない）。証跡は実装 commit の後に別 commit で追加する。
- report に 4 節 5 項の computed style 実測表を含める。

- 司令塔裁定（2026-09-06）: `check-evidence` の component stale 判定を解消するため、変更21件の component 固有 `*-preview.md` と light / dark の画像を追加する。対象は badge / button / input / card / dialog / native-select / select / textarea / alert-dialog / button-group / chart / combobox / input-group / menubar / toast、および login-02 / 04 / 05、signup-02 / 04 / 05。画像と個別 report は同じ commit に追加し、既存の証跡は変更しない。追加裁定により、共有と重複する6件も再撮影し、21 report と42画像を新規 commit にまとめる。レビュー記録2件の検証SHAだけを補正した commit `25b528c` は以後 amend しない。

### 2.5 仕様と記録を残す

- この仕様の 1〜7 節を `.docs/plans/2026-09-06-geometry-layer.md` として保存する（本文はそのまま。冒頭に issue #52 へのリンクを付ける）。
- レビューで残った flag の受容は `.docs/risk-registry.md` に DOCS_OPS §3 の書式で記録する。

## 3. スコープ外

- 色トークン・`--brand-*` / `--accent-*` / status 色・`--font-*` 系は変えない。
- `src/site/`、`src/blocks/`（2.3 の `font-bold` 6 行を除く）、`src/previews/`、`src/pages/` は変えない。
- `src/components/ui/sidebar.tsx` の高さ（`h-8` 等）は変えない。
- 2.3 に列挙していないファイルの class は変えない（`rounded-lg` → `rounded-md` を列挙外へ広げない）。
- `.docs/reviews/` の既存 report と画像を書き換えない・削除しない。
- `tokens.css` / `brands.css` を手で編集しない。
- `main` へのマージ、`gh pr merge`、ruleset の変更をしない。
- `scripts/check-standards.mjs` にルールを足さない（sensor の追加は別途 human 承認）。

- 司令塔裁定（2026-09-06）: `scripts/contrast-cases.mjs` / `scripts/contrast.mjs` は consumer contract の同期に限り変更可。`check:all` が削除済み `ring-foreground/10` の固定契約で失敗したため、border on card（Card）/ border on popover（AlertDialog / Dialog / Combobox / Menubar）へ同期し、必須ラベルとdigestを更新する。decorative gate・閾値・他caseは維持する。旧digest / 新digestと各比率をPR本文に記録し、再レビューと収束の対を更新する。

- 司令塔裁定（2026-09-06）: `provenance.json` は `--resync` による6件のハッシュ同期に限り変更可。`font-bold` 置換で block 実体と `generatedContentSha256` が不一致になり、completeness が失敗したため、既存手順で対象6件だけを再同期する。`--modified` / `--force` は付けず、他フィールド不変と `shasum -a 256` の独立再計算で照合する。

## 4. 検証（rubric）。結果は worker_done の body に実測値（コマンドと exit code）で含める

1. `node src/styles/design-system/build-tokens.mjs --check` が exit 0。
2. `npm run lint` が exit 0。
3. `node scripts/check-standards.mjs` が exit 0。
4. `npm run build:site` が exit 0。その後 `ls dist/_astro/global.*.css` で得た CSS ファイルに対して次を実測する（各 grep は単独で実行し、件数を報告する）:
   - `grep -c -- '--radius:.625rem' <css>` の件数が 0
   - `grep -c 'rounded-lg{border-radius:var(--rounding-lg)}' <css>` の件数が 1 以上
   - `grep -c 'shadow-xs{' <css>` の行に `var(--elevation-xs)` が含まれる（`grep -o 'shadow-xs{[^}]*}' <css>` の出力で確認）
   - `grep -c '\.font-bold{' <css>` の件数が 0
   - `grep -c 'h-control-md{height:var(--control-height-md)}' <css>` の件数が 1 以上
   - `grep -c 'transition-duration:var(--duration-fast)' <css>` の件数が 1 以上
5. Playwright（headless Chromium、viewport 1440×900）で preview server を開き、`getComputedStyle` を実測して report に表で書く:
   - `/preview/button/` の `[data-slot="button"]` 先頭要素: `height` が `36px`、`border-radius` が `8px`
   - `/preview/dialog/` の `[data-slot="dialog-content"]`: `border-radius` が `12px`、`box-shadow` が `rgba(26, 28, 33, 0.1) 0px 12px 32px 0px`
   - `/preview/dialog-dark/` の `[data-slot="dialog-content"]`: `box-shadow` が `rgba(0, 0, 0, 0.55) 0px 12px 32px 0px`
   - `/preview/button/` の `[data-slot="button"]` 先頭要素: `transition-duration` に `0.12s` が含まれる
   司令塔裁定: `box-shadow` の上記期待値は末尾の実影1層を表す。合否は「末尾1層が期待値と一致し、それ以外の層はすべて完全透明かつゼロ寸法であること」とし、生の computed style 文字列を report に省略せず記録する。Tailwind v4 の shadow utility による透明ゼロ寸法4層の合成は許容する。
   期待値と実測が食い違う場合は止めて ask で報告する（期待値の側が誤っている可能性を含む）。
6. `node --test "scripts/*.test.mjs"` を実行し、失敗した test があれば単独で再実行する。単独再実行でも失敗する test が 0 件であること。全件実行と単独再実行の結果を両方報告する。
7. `npm run check:all` が exit 0（約 9 分。`check-evidence` を含む）。typecheck が OOM で落ちた場合はその旨を報告し、PR CI の `Lint, typecheck, test & build` の結果で代替する。
8. 負の検査（司令塔裁定により `src/components`、`src/blocks`、`src/site`、`src/previews`、`src/pages`、`src/styles/global.css` を対象に各 1 コマンドで実行し、件数 0 を報告する。`src/styles/design-system/design-tokens.html` は説明文の出現位置であり class の残存ではないため対象外とする。正本の説明文に出現する場合は出現位置と件数を report / PR 本文に記録して合格扱いとする）: `ring-foreground/10`、`font-bold`、`rounded-4xl`、`rounded-2xl`、`rounded-3xl`、`shadow-xl`、`--radius: 0.625rem`。
9. `node scripts/check-evidence.mjs`（`check:all` に含まれるが単独でも実行）が exit 0。
10. 実測の範囲を報告に書く: 各項目が「存在」「実行」「動作（computed style）」のどこまでを測ったか。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。fresh context のレビュアーを立てて `lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3 に従う: 最大 3 ラウンド（skill の既定値を上書き）。3 ラウンドで残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」（§3）: 終了宣言時に 4 節 1〜3・6 のコマンドを再実行して exit code を PR 本文へ書く。
- 指摘の正しさと修正の妥当性は別（brain URISK-117）。検査道具が守る対象より複雑になる修正は採らず、採らない理由を PR 本文へ書く。

## 6. 完了条件

- ブランチ `naoto24kawa/issue-52-geometry-layer` で PR を作成する（マージしない。human 承認へ落とす）。PR 本文は日本語で、次を含む: 変更概要、4 節の各項目の実測結果（コマンド・exit code・件数）、レビュー記録（ラウンドごとの指摘と処置）、受容した flag と risk-registry の ID、実装担当識別子（エージェント名とモデル）、`Closes #52`。
- PR 本文はファイルに書いて `--body-file` で渡す（シェルのダブルクォートに直書きしない）。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。

## 7. 制約

- **指示と実態が矛盾したら止めて ask で報告する**（例: 2.3 の置換対象 class が存在しない、2.1 で build-tokens.mjs が別名を拒む、4 節 5 項の期待値と実測が食い違う、Playwright が使えない）。
- 裁量の範囲: 2.3 で「trigger 要素」「入力要素」の特定、コメント文言、report の表現。シグネチャ・export・props・色は変えない。裁量で変えた内容は worker_done と PR 本文に申告する。
- 逆委任は受けない。環境制約（ツール不在・turn 上限等）で担当範囲を遂行できないときは、範囲を司令塔へ戻さず ask で報告して判断を待つ。
- 想定所要時間: 90〜150 分（証跡 28 枚とレビュー 3 ラウンドを含む）。その間 commit が無くても正常。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。
