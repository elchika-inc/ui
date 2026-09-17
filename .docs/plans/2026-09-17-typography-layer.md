# 組版トークンの接続と Mono の適用（issue #78、段階 3）

issue #52 の段階計画の 3 番目。design-tokens.html の組版（サイズ・行間・字間・Mono）を Tailwind の utility まで届かせる。PR A（接続 + site の再タグ付け + 共有面証跡）→ PR B1 / B2（部品と blocks の再タグ付け + Mono の適用。並走）の順で進める。再タグ付けと Mono 適用は同じ部品を触るので、部品ごとの証跡を 1 回で済ませるために同じ PR にまとめる。

## 1. 背景（実測済み。worker は再調査しない）

- 正本は `src/styles/design-system/design-tokens.html`（Typography 節と「決めたことと、その理由」）。生成物 `tokens.css` は `build-tokens.mjs` が作り、`global.css` が `@import "./design-system/tokens.css" layer(design-system)` で取り込む。**正本と生成器はこの issue では変更しない。**
- tokens.css の `body` は `font-size: var(--text-base); line-height: var(--leading-normal); letter-spacing: var(--tracking-normal)` を持つが、Tailwind の `@theme`（`@import "tailwindcss"` が展開する theme 層）が同名の `--text-*` / `--leading-*` / `--tracking-*` を後から `:root` に再定義し、cascade layer 順で勝つ。生成 CSS（main cd4efbb）で実測した勝者: `--leading-normal` 1.5（正本 1.75）、`--tracking-normal` 0em（正本 +0.02em）、`--text-xs` .75rem（正本 .8125rem）、`--leading-snug` 1.375（正本 1.5）、`--tracking-widest` .1em（正本に無い）。`--font-mono` の衝突と同じ構造で、`--font-weight-*` は `@theme inline` に `--font-weight-*: initial` と直書きで解消済み（global.css 135〜142 行付近）。
- Tailwind の `text-<size>` utility は `font-size: var(--text-<size>); line-height: var(--tw-leading, var(--text-<size>--line-height))` を出し、`--text-<size>--line-height` は Tailwind 既定の固定比率（xs 1.0、sm 1.43、base 1.5、lg 1.56、xl 1.4、2xl 1.33、3xl 1.2、4xl 1.11、5xl 以上 1）。utility を付けた要素では body の 1.75 が消える。
- `@theme inline` は値を utility に展開する（生成 CSS の `.font-heading{font-family:var(--font-display)}` は inline でも var が残るが、リテラル値は展開される）。組版トークンを inline に置くと `.leading-normal{line-height:1.75}` になり、tokens.css の `:lang(en){--leading-normal:1.6}` の再調整が utility に効かなくなる。**組版は非 inline の `@theme { … }` に置く。**
- `@theme` の値は `:root` にも出力される（生成 CSS に `--font-weight-medium:500` が 2 回出ることで確認）。
- `scripts/sync-registry-tokens.mjs`（`npm run registry:tokens`）は global.css の最初の `:root {` ブロックと `.dark {` ブロックだけを読む。`@theme` ブロックは対象外なので registry.json の cssVars は変わらないはずだが、§4 で `git diff --exit-code registry.json` を要求する。
- design-tokens.html の Typography 節のスケールと用途: 3xs 11px「Mono ラベル、eyebrow」、2xs 12px「バッジ、注釈」、xs 13px「密度の高い UI」、sm 14px「ボタン、補助テキスト」、base 16px「本文（和文の基準）」、lg 18px「リード文」、xl 21px「小見出し」、2xl 25px「セクション見出し」、3xl 30px、4xl 36px「ページ見出し」、5xl 44px、6xl 54px「ヒーロー」。行間: tight 1.25「欧文の大見出しのみ」、display 1.35「和文見出し」、snug 1.5「密度の高い UI」、normal 1.75「和文本文」、relaxed 1.9「長文」。字間: display -0.02em、heading -0.01em、normal +0.02em、label +0.08em。`--font-feature-display: "palt" 1`（見出し。欧文には無害）。`--numeric-tabular: tabular-nums`。
- Tailwind の `text-xs` は 12px で、部品では 12px 役割（バッジ・注釈・ラベル）に使われている。使用件数は `grep -rEo "(^|[ \"'])text-xs([ \"'/]|$)" src/components/ui src/site src/blocks | wc -l` で 58（部品 27 / site 5 / blocks 26）。13px 役割（密度の高い UI = 小さいコントロール）は `button.tsx` の size xs / sm、`toggle.tsx` の size sm、`sidebar.tsx` の SidebarMenuButton size sm（`h-7 text-xs`）、`attachment.tsx` の size sm / xs の 6 箇所だけ。見出しは `text-xl` 9 件・`text-2xl` 15 件・`text-4xl` 3 件で、`text-3xl` / `5xl` / `6xl` / `7xl` 以上は 0 件。`font-heading` は 23 件。
- `tracking-*` の使用: `tracking-widest` 4 件（command / menubar / dropdown-menu / context-menu の shortcut、いずれも `"ml-auto text-xs tracking-widest text-muted-foreground …"`）、`tracking-wider` 2 件（site の eyebrow: `component-index.tsx` 140 行付近と `component-documentation.tsx` 59 行付近、`font-mono text-xs font-medium tracking-wider text-primary uppercase`）、`tracking-tight` 5 件（`empty.tsx` の title、site の `documentation-shell.tsx` / `documentation-home.tsx` / `component-index.tsx` / `component-documentation.tsx` の見出し）。`tracking-normal` / `wide` / `tighter` は 0 件。
- `leading-*` の使用: `leading-none` 8 件（label / dialog / calendar / chart / sidebar blocks）、`leading-tight` 11 件（attachment と sidebar blocks の nav-user）、`leading-snug` 3 件（field / item / card）、`leading-normal` 2 件（field / item）、`leading-relaxed` 2 件（bubble / site）、数値 `leading-6` / `leading-7` / `leading-8` が site に計 9 件（`documentation-home.tsx` `leading-7` ×6 と `leading-8` ×1、`component-index.tsx` `leading-6` / `leading-7`、`component-documentation.tsx` `leading-6`）。`leading-loose` は 0 件。
- `font-mono` の使用: 部品は `chart.tsx` の 1 件、site は 5 件（component-index 4、component-documentation 1）、blocks は `dashboard-table.tsx` の 4 件。`tabular-nums` は sidebar / progress / chart / animated-number、`dashboard-01/section-cards.tsx`（`CardTitle className="text-2xl font-semibold tabular-nums"` ×4）、dashboard-table、previews/table。
- Mono 適用候補の現状: `kbd.tsx` は `… rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground …`。`sidebar.tsx` の `SidebarGroupLabel`（412 行付近）は `flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground …`。`badge.tsx` は cva（`text-xs font-medium`、variant と `appear` prop）。`table.tsx` の `TableHead` は `h-10 px-2 text-left align-middle font-medium whitespace-nowrap …`、`TableCell` は `p-2 align-middle whitespace-nowrap …`。`animated-number.tsx` の root は `tabular-nums`。
- フォントは tokens.css 先頭の `@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono…")` と `IBM+Plex+Sans+JP` で読まれる（build-tokens.mjs 78〜79 行付近が生成）。site / preview で追加の読み込みは不要。Playwright では `document.fonts.ready` と `document.fonts.check('12px "IBM Plex Mono"')` で確認できる。
- 共有トークン（global.css）を変えると `check-evidence` が共有面証跡を stale と判定する。撮り直しは `SHARED_TOKEN_IMAGE_SUBJECTS` の 14 subject（disabled-controls / alert-dialog / attachment / catalog / menubar / select / button / bubble / dialog / drawer / badge / alert / sheet / tabs）× light / dark = 28 枚で、report に `verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha` を付ける。`verified_impl_sha` はトークン変更 commit より後の commit を指す（`strictAncestor`）。書式の見本は `.docs/reviews/2026-09-16-micro-interactions-0/report.md`。
- block（`src/blocks/*`）を変更したら `node scripts/add-component.mjs <block> --resync` で `provenance.json` のハッシュを同期しないと CI の Completeness check が落ちる。自作 component（`origin: "elchika original"`）を変更したら同じコマンドで来歴のハッシュを同期する（shadcn 由来の component は対象外で、変更しても `generatedContentSha256` は動かさない）。
- `scripts/check-standards.mjs` は値系 arbitrary value（`text-[…]` / `leading-[…]` / `tracking-[…]` を含む）を弾く。新しい utility は theme 経由で出すので arbitrary value は不要。
- `check-evidence` は `src/components/ui/<name>.tsx` / `src/previews/<name>.tsx` / block の実パスが最新証跡の `verified_impl_sha` より後に変更されていると「検証 SHA 以降に component 固有 path が変更されている」で fail する。つまり class を 1 語変えた部品・block・preview ごとに `<日付>-<name>-preview.md` + light / dark 画像が要る。
- `node_modules/shadcn/dist/tailwind.css`（`@import "shadcn/tailwind.css"`）は `--text-*` / `--leading-*` / `--tracking-*` を定義しない。`scripts/contrast.test.mjs` 308 行付近の `text-xs` はテスト内の fixture 文字列で、実ファイルを参照していない。
- `src/previews` の `text-xs` は card / bubble / alert / message / sidebar の 5 箇所（デモ内の注釈・ラベル）。`src/pages` / `src/catalog` には無い。
- CI の Unit tests step は `scripts/*.test.mjs` を全件実行する。新しいテストファイルを置けば workflow の変更無しで CI に乗る。既存テストは main で fail 0 / skip 0。
- 環境の学び（2026-09-16）: codex worker を 3 本以上並走させると IPv4 一時ポートが枯渇して `gh` / `git push` / `127.0.0.1` が失敗する。ローカル配信は `npx astro preview --host ::1 --port <空きポート>` で回避できる。remote 操作が失敗したら 60 秒間隔で最大 10 回再試行し、通らなければ escalation で報告する。

### 1.1 サイズと行間の割り当て（この spec で決めた新しい決定。正本には無い）

| utility | font-size（正本の値） | line-height | 根拠（正本の用途表） |
|---|---|---|---|
| `text-3xs` | 0.6875rem | 1.5（snug） | Mono ラベル、eyebrow = 密度の高い UI |
| `text-2xs` | 0.75rem | 1.5 | バッジ、注釈 |
| `text-xs` | 0.8125rem | 1.5 | 密度の高い UI |
| `text-sm` | 0.875rem | 1.5 | ボタン、補助テキスト |
| `text-base` | 1rem | 1.75（normal） | 本文（和文の基準） |
| `text-lg` | 1.125rem | 1.9（relaxed） | リード文 |
| `text-xl` 〜 `text-6xl` | 1.3125 / 1.5625 / 1.875 / 2.25 / 2.75 / 3.375rem | 1.35（display） | 見出し（和文見出し） |

`text-7xl` 以上は出さない（0 件。系外の値を書けなくするのが正本の方針）。

## 2. 記法（全 PR 共通）

- 新しいトークン・依存は足さない。global.css の変更は §A の指定どおり。`design-tokens.html` / `build-tokens.mjs` / `tokens.css` / `brands.css` は編集しない。
- 生の色指定と値系 arbitrary value（`text-[13px]` 等）を使わない。サイズ・行間・字間は utility（`text-2xs` / `leading-snug` / `tracking-label` …）で書く。
- 再タグ付けは「役割」で判定する（§A.3 の一覧が正本。一覧に無い箇所を見つけたら question で報告し、独断で変えない）。
- 部品の変更は class 文字列の置換に限る。API（export 名・props 名と型）を足すのは §B の `numeric` prop だけ。
- コミットメッセージ・PR 本文・レビュー記録・report は日本語。commit 末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`、PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。

## 3. スコープ外

- 黄アクセント（段階 4）、ドキュメントサイトの意匠（段階 5）。
- `<html lang="en">` 全体での `:lang(en)` 再調整（theme 層の `:root` が勝つ。`--text-<size>--line-height` のリテラルも `:lang(en)` では再調整されない。現状 lang="en" のページは無い。§8.3 持ち越し）。
- `--tracking-*: initial` による旧 utility（`tracking-tight` / `wide` / `wider` / `widest` / `tighter`）の削除。global.css を触る PR を A の 1 本に限る（共有面 28 枚の撮り直しを 1 回にする）ため、旧名の排除はソース側のテスト（§B の `scripts/typography-usage.test.mjs`）で縛り、theme からの削除は段階 5 の global.css 変更時に同梱する。
- `src/previews/card.tsx` / `bubble.tsx` / `alert.tsx` の `text-xs`（デモの注釈）。13px のまま残す（触ると card / bubble / alert の証跡が要る）。`previews/message.tsx` と `previews/sidebar.tsx` は §B で部品と一緒に再タグ付けする。
- 本文・ボタン・入力欄への Mono 適用。`font-bold` 等の weight の追加。
- shadcn 由来 component の `provenance.json` ハッシュ更新（class 置換では動かさない）。

## 4. 検証（rubric。結果は PR 本文と worker_done に実測値で書く）

1. `node scripts/check-standards.mjs` exit 0。
2. `npm run lint` exit 0（error 0）。
3. `node --test scripts/check-completeness.test.mjs`、`node --test scripts/add-component.test.mjs`、`node --test scripts/contrast.test.mjs`、`node --test scripts/design-tokens.test.mjs`、および PR A では `node --test scripts/theme-typography.test.mjs`、PR B1 / B2 では `node --test scripts/typography-usage.test.mjs` がそれぞれ exit 0 で fail 0 / skip 0。既存 `test(` の削除行が無い。
4. `npm run build:lib` → `npm run check:props` → `node scripts/check-completeness.mjs` → `node scripts/check-preview-render.mjs` を 1 つずつ実行し全部 exit 0。
5. `npm run registry:build` → `node scripts/check-distribution.mjs` exit 0。その後 `git diff --exit-code registry.json` exit 0（cssVars が変わらないこと。変わったら question）。
6. `npm run build:site` exit 0。生成 CSS `dist/_astro/global.*.css` に対する grep（各 1 コマンド、exit 0 と件数を記録）:
   - `--text-xs:` / `--leading-normal:` / `--leading-snug:` / `--tracking-normal:` をそれぞれ `grep -o -- '<name>:[^;]*;'` で列挙し、Tailwind 既定値（`.75rem` / `1.5` / `1.375` / `0em`）が**出現しない**ことを確認する（`:lang(en)` 由来の `1.6` / `0em` は tokens.css の `:lang(en)` ブロック内なので、`grep -o ':lang(en){[^}]*}'` で切り出した中にだけ現れることを併せて確認する）。陽性対照: main cd4efbb の生成 CSS では `--leading-normal:1.5;` と `--text-xs:.75rem;` が出現する。
   - `grep -o '\.text-xs{[^}]*}'` が `font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))` を含み、`grep -o -- '--text-xs--line-height:[^;]*;'` が `1.5`。`--text-base--line-height` が `1.75`、`--text-lg--line-height` が `1.9`、`--text-2xl--line-height` が `1.35`。
   - `grep -o '\.leading-normal{[^}]*}'` が `var(--leading-normal)` を含む（inline で展開されていない）。
   - `grep -o '\.font-heading{[^}]*}'` の出力に `font-feature-settings:"palt"` が含まれる（minifier が末尾の ` 1` を落とすことがあるので ` 1` の有無は問わない）。
   - `grep -c -- '--text-7xl'` が 0。`grep -c -- '--leading-loose'` が 0。
7. Playwright（headless Chromium、viewport 1440×900、`npm run build:site` の成果物を `npx astro preview --host ::1 --port <空きポート>` で配信）:
   - PR A: `/preview/button/` と `/preview/badge/` の light で `getComputedStyle(document.body)` の `fontSize` `16px`、`lineHeight` `28px`、`letterSpacing` `0.32px`（陽性対照: main では `24px` / `0px`）。`document.fonts.check('16px "IBM Plex Sans JP"')` の結果を記録。固定高さ要素の溢れ検査: `[data-slot="badge"]`、`[data-slot="kbd"]`、`[data-slot="sidebar-group-label"]`、`[data-slot="button"]` の各要素で `scrollHeight <= clientHeight` を全件確認（陽性対照: 一時的に `--text-2xs--line-height: 2.5` を dev で当てて badge が引っかかることを 1 回だけ確認し、戻す。この確認は commit しない）。
   - PR B: 担当部品の preview を light / dark で開き、`[data-slot="kbd"]` / `[data-slot="sidebar-group-label"]` / shortcut / `[data-numeric]` / `[data-slot="animated-number"]` の computed `fontFamily` が `"IBM Plex Mono"` で始まること、`document.fonts.check('12px "IBM Plex Mono"')` が true であること、`fontVariantNumeric` が `tabular-nums` であること（numeric 要素）を記録。console error 0（favicon 404 は別記）、pageerror 0。
8. `node scripts/check-evidence.mjs` exit 0（report を書いた直後と証跡 commit 後の 2 回。証跡は 1 commit にまとめる）。
9. `git diff --stat origin/main` の変更ファイルが担当節の一覧 + 新規証跡だけであること（PR A ブランチの先頭 commit の spec は司令塔が入れた明記済みの例外。B1 / B2 は main に spec が入った後に着手する）。
10. 部品の変更が class 置換と `numeric` prop の追加だけであること（PR B1 / B2）: `git diff origin/main -- src/components/ui | grep '^[+-]' | grep -v 'className\|^+++\|^---\|"' ` が空、または差分の各行を PR 本文で説明する。

## 5. レビューサイクル（委譲先で完結）

- レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を fresh context で 1 回 1 レンズずつ順に起動する（Fresh Eyes → Security → Core Logic → Tests → Domain）。入力は `git diff origin/main -- <担当ファイル>`・変更ファイル全文・spec §1 / §2 / §4 と担当節のみ（先頭 commit の spec は含めない）。最大 3 ラウンド。出力が壊れていたら同じレンズを 1 回だけ取り直す。記録は `.docs/reviews/cycles/<日付>-typography-<a|b>.md`（先頭に `verified_impl_sha:` 行）。
- flag（確信度 80% 以上）が 0 になるまで修正 → 再レビュー。上限に達したら残りを PR 本文に ACCEPTED_RISKS として書く。

## 6. 完了条件（全 PR 共通）

- PR は base `main`、本文に `Part of #78`（PR B2 は `Closes #78`）。本文の節: 関連 Issue / エージェント実装の来歴 / 変更内容と担当節の対応 / 検証結果（§4 の各項目の実測値）/ レビュー記録 / 変更範囲（§4.9）と base 確認 / 裁量で決めた内容の申告。
- **base 追随**: 司令塔から指示が来たら `git merge origin/main` で追随し（rebase しない）、§4.1〜5 を再実行して結果を PR 本文に追記し、push する。
- マージは司令塔が行う。worker_done は PR 作成と CI 完走を確認してから 1 回だけ送る。
- spec ファイル自体は編集しない。裁定・申告の記録は PR 本文に書く。

## 7. 制約（全 PR 共通）

- **指示と実態が矛盾したら止めて question で報告する**（例: §A.3 の一覧に無い `text-xs`、突合テストで正本と一致しない値、生成 CSS の grep が想定と違う、check-evidence が別の証跡を要求する）。担当範囲を戻す逆委任はしない。
- 裁量の範囲: テストの書き方、report の表現、一時ファイル名、Playwright スクリプトの構成。トークンの値・utility 名・行間の割り当て（§1.1）・再タグ付けの対象（§A.3）・`numeric` prop の API は変えない。裁量で決めた内容は PR 本文に申告する。
- 全件テスト・typecheck・check:all はローカルで実行せず PR CI で代替する。応答が遅いコマンドは打ち切らずに待つ。1 コマンドが 15 分を超えて返らない場合だけ報告する。
- 想定所要時間: PR A は 120〜180 分（global.css + テスト + site 再タグ付け + 証跡 28 枚）、PR B1 は 240〜360 分（部品 10 + preview + 証跡 10 組）、PR B2 は 300〜420 分（部品 7 + blocks 9 + 証跡 16 組）。その間 commit が無くても正常。B1 と B2 は同じマシンで並走する（codex は 2 本まで）。

## A. PR A: 組版トークンの接続（ブランチ `naoto24kawa/typography-a`）

証跡ディレクトリ `.docs/reviews/<日付>-typography-a/`（共有面 report.md + 28 枚）。**commit は 3 分割**: (1) global.css + 突合テスト、(2) site の再タグ付け + 手順書の節、(3) 証跡とレビュー記録。report の `verified_impl_sha` / `targeted_dynamic_sha` は (2) を指す。**部品（`src/components/ui`）・blocks・previews は触らない**（触ると部品ごとの証跡が要る。§B の担当）。

### A.1 global.css

`@theme inline { … }` ブロックの**直後**に、非 inline の `@theme { … }` ブロックを 1 つ足す（コメントで「組版は :lang(en) の再調整を残すため inline にしない」と理由を書く）。内容:

```css
@theme {
  /* design-tokens.html の Typography 節を正本とし、Tailwind と同名のトークンは値を直書きする（scripts/theme-typography.test.mjs が tokens.css と突合する）。 */
  --text-*: initial;
  --text-3xs: 0.6875rem;
  --text-3xs--line-height: 1.5;
  --text-2xs: 0.75rem;
  --text-2xs--line-height: 1.5;
  --text-xs: 0.8125rem;
  --text-xs--line-height: 1.5;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.5;
  --text-base: 1rem;
  --text-base--line-height: 1.75;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.9;
  --text-xl: 1.3125rem;
  --text-xl--line-height: 1.35;
  --text-2xl: 1.5625rem;
  --text-2xl--line-height: 1.35;
  --text-3xl: 1.875rem;
  --text-3xl--line-height: 1.35;
  --text-4xl: 2.25rem;
  --text-4xl--line-height: 1.35;
  --text-5xl: 2.75rem;
  --text-5xl--line-height: 1.35;
  --text-6xl: 3.375rem;
  --text-6xl--line-height: 1.35;
  --leading-*: initial;
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-display: 1.35;
  --leading-snug: 1.5;
  --leading-normal: 1.75;
  --leading-relaxed: 1.9;
  --tracking-display: -0.02em;
  --tracking-heading: -0.01em;
  --tracking-normal: 0.02em;
  --tracking-label: 0.08em;
}
```

`--tracking-*: initial` は入れない（旧名 `tracking-tight` / `wider` / `widest` は §B で再タグ付けするまで部品が使っているため。§3）。加えて既存の `@theme inline` 内の `--font-heading: var(--font-display);` の直後に `--font-heading--font-feature-settings: "palt" 1;` を足す（コメント: design system の `--font-feature-display`。欧文には無害なので言語で分けない）。`--leading-display` / `--tracking-label` / `--tracking-heading` / `--tracking-display` / `--text-3xs` / `--text-2xs` は Tailwind と衝突しないが、var 参照と直書きを混ぜず全部を同じ非 inline ブロックに直書きで揃える（突合テストが全件を検査する）。

### A.2 突合テスト `scripts/theme-typography.test.mjs`

- global.css の非 inline `@theme {` ブロックから `--text-<size>`（`--line-height` を除く）、`--leading-<name>`、`--tracking-<name>` を読み、tokens.css の同名トークン（`:root` 内の最初の定義。`:lang(en)` ブロックは除外。tokens.css は 1 行に複数の宣言を並べているので、行単位でなく `/--([\w-]+):\s*([^;]+);/g` で全宣言を拾う）と値が文字列一致することを検査する（`0.02em` と `.02em` のような表記差は数値に正規化せず、正本の表記どおり global.css に書くことで一致させる）。
- `--text-<size>--line-height` は §1.1 の表と一致することを検査する（表をテスト内の定数に持つ）。
- global.css に `--text-7xl` 以上と `--leading-loose` が無いこと、`--font-heading--font-feature-settings: "palt" 1` があることを検査する。
- 陽性対照: テスト内で global.css の文字列の `--leading-normal: 1.75;` を `1.5;` に置換した入力に対して fail することを 1 件のテストで確認する（ファイルは触らず文字列で）。
- `test(` は 4 件以上。実行は `node --test scripts/theme-typography.test.mjs`。

### A.3 site の再タグ付け（`src/site` のみ。役割で判定。一覧が正本）

- `text-xs` → `text-2xs`: `documentation-shell.tsx` 65 行付近（`text-xs leading-relaxed text-muted-foreground`）、`component-index.tsx` の 68 / 155 行付近（`font-mono text-xs text-muted-foreground`）。
- eyebrow 2 箇所（`component-index.tsx` 140 行付近、`component-documentation.tsx` 59 行付近、`font-mono text-xs font-medium tracking-wider text-primary uppercase`）→ `font-mono text-3xs font-medium tracking-label text-primary uppercase`（Mono ラベル 11px / +0.08em）。
- `tracking-tight` → `tracking-heading`: `documentation-shell.tsx` / `documentation-home.tsx` / `component-index.tsx` / `component-documentation.tsx` の見出し 4 箇所。
- `leading-7` → `leading-normal`、`leading-8` → `leading-relaxed`、`leading-6` → `leading-normal`（`documentation-home.tsx` / `component-index.tsx` / `component-documentation.tsx` の計 9 箇所）。
- 完了後に `grep -rEn "tracking-(tight|wider|widest)|leading-[0-9]" src/site` が空であることを PR 本文に貼る。

### A.4 証跡（commit 3）

- `.docs/reviews/<日付>-typography-a/report.md`（先頭 3 行: `verified_impl_sha: <commit 2 の SHA>`、`evidence_scope: shared-token-migration`、`targeted_dynamic_sha: <commit 2 の SHA>`）。内容: §4.6 の grep 結果、§4.7 の computed style と溢れ検査の表、14 subject × light / dark の HTTP / console / pageerror 表、画像一覧。
- 画像 28 枚: `<日付>-<subject>-preview-light.jpg` / `-dark.jpg`（1440×900 JPEG、新規撮影）。subject 名は §1 の 14 件。
- レビュー記録 `.docs/reviews/cycles/<日付>-typography-a.md`。
- `check-evidence` が site の証跡（`src/site` の index-page 系 report）を要求した場合は、その要求内容を question で報告する（司令塔が要否を裁定する）。

### A.5 手順書

`.docs/component-addition-procedure.md` の末尾に節「組版 utility の使い方」を足す（`text-3xs` / `text-2xs` / `text-xs` の役割、`tracking-label` / `heading` / `display`、`leading-*` の段、旧名 `tracking-tight` / `wider` / `widest` と数値 `leading-N` は使わない、arbitrary value 禁止、`font-heading` に palt が付くこと）。12 行以内。

## B. PR B1 / B2: 部品と blocks の再タグ付けと Mono の適用（PR A のマージ後、並走）

B1 はブランチ `naoto24kawa/typography-b1`、B2 は `naoto24kawa/typography-b2`。担当ファイルは互いに素で、共有ファイルは B1 が `scripts/typography-usage.test.mjs` と `src/previews/badge.tsx`、B2 が `provenance.json`（`--resync`）、`src/previews/table.tsx`、`src/previews/message.tsx`、`src/previews/sidebar.tsx`、手順書。証跡ディレクトリは `.docs/reviews/<日付>-typography-b1/` / `-b2/`（部品別 report + light / dark 画像）。commit は (1) 部品・preview・blocks（+ resync）、(2) 証跡とレビュー記録。report の `verified_impl_sha` は (1)。2 本目にマージされる側は §6 の追随を行う（conflict は `provenance.json` のみ想定。両方の変更を採る）。

### B.1 共通の再タグ付け規則

- `text-xs` → `text-2xs`（12px 役割）。`text-xs` のまま残す 13px 役割は `button.tsx` の size xs / sm、`toggle.tsx` の size sm、`sidebar.tsx` の SidebarMenuButton size sm（`h-7 text-xs`）、`attachment.tsx` の size sm / xs（16〜17 行付近）の 6 箇所だけ。
- `tracking-widest` → `tracking-label`、`tracking-tight` → `tracking-heading`。
- 変更した block は `node scripts/add-component.mjs <block> --resync`。自作 component（animated-number）も同じコマンドで来歴を同期する。shadcn 由来の component は class 置換だけで来歴を動かさない。

### B.2 B1 の担当（部品 10 + preview）

| 部品 | 変更 |
|---|---|
| `badge.tsx` | cva の base `text-xs` → `text-2xs`。`numeric?: boolean` prop を足す（`state: { …, numeric: numeric \|\| undefined }` で `data-numeric` を出し、base に `data-numeric:font-mono data-numeric:tabular-nums` を足す。`BadgeProps` に `numeric` を追加） |
| `kbd.tsx` | `font-sans text-xs` → `font-mono text-2xs` |
| `tooltip.tsx` | TooltipContent の `text-xs` → `text-2xs` |
| `command.tsx` / `menubar.tsx` / `dropdown-menu.tsx` / `context-menu.tsx` | shortcut の class 先頭を `ml-auto font-mono text-2xs tracking-label text-muted-foreground …` に揃える（4 箇所とも同一の並び。末尾の group 修飾は各部品のまま）。`dropdown-menu.tsx` / `context-menu.tsx` のグループラベル（`px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7`）の `text-xs` → `text-2xs` |
| `select.tsx` | グループラベル（`px-1.5 py-1 text-xs text-muted-foreground`）→ `text-2xs` |
| `combobox.tsx` | 2 箇所（`px-2 py-1.5 text-xs text-muted-foreground` と chip）→ `text-2xs` |
| `empty.tsx` | title の `tracking-tight` → `tracking-heading` |

- `src/previews/badge.tsx` に `numeric` の例（`<Badge numeric>1,234</Badge>` と `<Badge variant="secondary" numeric>99+</Badge>`）を足す。
- `scripts/typography-usage.test.mjs` を足す: `src/components/ui` / `src/blocks` / `src/site` / `src/previews` を走査し、`tracking-(tighter|tight|wide|wider|widest)` と `leading-[0-9]+` の使用が 0 件、`text-xs` の使用が B.1 の 6 箇所（ファイル名と行の class 文字列で特定）だけであることを検査する。陽性対照: 走査対象の文字列に `tracking-widest` を足した入力で fail することを 1 件で確認する。B2 のファイル（calendar / chart / sidebar / message / attachment / table / animated-number / blocks / previews）は B1 の時点では未変更なので、このテストは **B2 の再タグ付け完了後に緑になる**。B1 の PR 本文には「B2 マージ後に緑」と書き、CI が赤なら §6 の追随後に再実行する（司令塔が B2 → B1 の順でマージする）。
- 証跡: badge / kbd / tooltip / command / menubar / dropdown-menu / context-menu / select / combobox / empty の 10 本 + light / dark 20 枚。

### B.3 B2 の担当（部品 7 + blocks 9 + preview + 手順書）

| 対象 | 変更 |
|---|---|
| `calendar.tsx` | weekday / week_number の `text-xs` → `text-2xs` |
| `chart.tsx` | container / tooltip の `text-xs` → `text-2xs` |
| `sidebar.tsx` | `SidebarGroupLabel`（412 行付近）の `text-xs font-medium` → `font-mono text-3xs font-medium tracking-label uppercase`（Mono ラベル。`h-8` 等は不変）。`SidebarMenuBadge`（607 行付近）の `text-xs` → `text-2xs`。SidebarMenuButton size sm の `text-xs` は残す |
| `message.tsx` | 2 箇所の `text-xs` → `text-2xs` |
| `attachment.tsx` | description（118 行付近）の `text-xs` → `text-2xs`。size sm / xs の `text-xs` は残す |
| `table.tsx` | `TableHead` / `TableCell` に `numeric?: boolean` prop を足す（`data-numeric={numeric ? "" : undefined}`、class に `data-numeric:text-right data-numeric:font-mono data-numeric:tabular-nums`。`TableHeadProps` / `TableCellProps` に `numeric` を追加） |
| `animated-number.tsx` | root の class を `font-mono tabular-nums` にし、`--resync` |
| blocks | `src/blocks/**` の `text-xs` 26 箇所すべて → `text-2xs`。`dashboard-01/components/section-cards.tsx` の `CardTitle`（`text-2xl font-semibold tabular-nums` ×4）に `font-mono` を足す。`dashboard-table/components/dashboard-table.tsx` の数値セル（`font-mono tabular-nums` ×2）を `TableCell numeric` に置き換える。変更した block（sidebar-07 / 08 / 09 / 10 / 12 / 15 / 16、dashboard-01、dashboard-table）は `--resync` |
| previews | `src/previews/table.tsx` の数値列を `TableHead numeric` / `TableCell numeric` にする（既存の `tabular-nums` は外す）。`src/previews/message.tsx` の `actionClassName` と `src/previews/sidebar.tsx` 109 行付近の `text-xs` → `text-2xs` |
| 手順書 | `.docs/component-addition-procedure.md` の「組版 utility の使い方」節に「Mono はラベルと数値だけ（Kbd / SidebarGroupLabel / shortcut / `numeric` prop / AnimatedNumber）。本文・ボタンには乗せない」を 2 行で足す |

- 証跡: calendar / chart / sidebar / message / attachment / table / animated-number の 7 本 + 14 枚、block の dashboard-01 / dashboard-table / sidebar-07 / 08 / 09 / 10 / 12 / 15 / 16 の 9 本 + 18 枚（書式は `.docs/reviews/2026-09-06-block-copy/2026-09-06-dashboard-01-preview.md` と同じディレクトリの画像に倣う）。§4.7 の Mono 確認（computed fontFamily、`document.fonts.check`、`fontVariantNumeric`）を Mono を触った report に載せる。
