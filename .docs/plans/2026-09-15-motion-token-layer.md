[Issue #58](https://github.com/elchika-inc/ui/issues/58)

# 委任仕様: motion トークン層を transitions.dev の設計へ拡張し、Tailwind と sensor へ接続する（issue #58、サブプロジェクト 1/4）

## 1. 背景（司令塔が実測済み。再調査不要）

### 1.1 取り込みの方針と法務上の立ち位置

- [transitions.dev](https://transitions.dev/) は純 CSS のトランジション集で、`t-*` クラスと `:root` の motion トークン（`--duration-quick: 150ms`、`--ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1)` 等）から成る。GitHub リポジトリ `Jakubantalik/transitions.dev` に LICENSE ファイルは無く（GitHub API の `license` は null）、利用条件は `https://transitions.dev/terms.html`（Last updated July 2026）の本文のみ。要旨は「無制限の個人・商用利用と改変は可。コレクション（または相当部分）をコンポーネントキットとして再配布するのは不可」。
- 当リポジトリは公開 shadcn registry で配る component kit そのものにあたるため、**snippet（`t-*` クラス・`.is-open` / `.is-closing`・`_root.css`）を逐語で持ち込まない**。持ち込むのは「用途で写像する motion トークン」という設計と、段の値だけである。この判断はユーザーが 2026-09-15 に選択した（「既存 component の動きに適用」「既存スケールを拡張」「sensor を含める」）。
- 4 サブプロジェクトへの分解と、2〜4 がスコープ外である理由は issue #58 に書いてある。本仕様はサブプロジェクト 1 だけを扱う。

### 1.2 当リポジトリのモーションの現状（2026-09-15、origin/main `bd4c7cc5a810b31ae1b3c2721eedf73a54550027` で実測）

- `src/styles/design-system/design-tokens.html` の `<style>` 内 `:root` ブロックにある MOTION は次の 8 個: `--duration-instant: 0ms; --duration-fast: 120ms; --duration-base: 180ms; --duration-slow: 260ms; --duration-slower: 400ms; --ease-standard: cubic-bezier(0.2, 0, 0, 1); --ease-entrance: cubic-bezier(0.16, 1, 0.3, 1); --ease-exit: cubic-bezier(0.4, 0, 1, 1)`。`[data-theme="dark"]` 側に motion トークンは無い。同ページの Theming 節の表は `--space-* / --radius-* / --duration-*` を「固定」（手触りの一貫性。ここを緩めると系が崩れる）としている。本仕様はこの決定を「**段の値は固定。段の追加は用途を伴えば可**」と読み替え、その読み替え自体を決定記録に残す（2.1）。
- `tokens.css` / `brands.css` は `node src/styles/design-system/build-tokens.mjs` の生成物。`--check` は検証のみ。出力に `29 token(s) not exposed in tailwind.config.js` という warning が出るが、これは advisory で exit code に影響しない（`build-tokens.mjs` の該当箇所のコメントに "Warning, not failure" とある）。トークンを足すとこの件数は増えるが、失敗ではない。
- `src/styles/global.css` は `@import "./design-system/tokens.css" layer(design-system)` → `@import "tailwindcss"` → `@import "tw-animate-css"` の順に読む。**Tailwind の `@theme` と同名の CSS 変数は layer 順で Tailwind 側が勝つ**（過去に `--font-mono` / `--radius-*` / `--shadow-*` で起きた。解決は「値を別名 `--font-code` / `--rounding-*` / `--elevation-*` に置き、元名はその参照にする」方式。`.docs/plans/2026-09-06-geometry-layer.md` の 2.1 と、design-tokens.html の決定記録「角丸と影の値は Tailwind と衝突しない別名に置く」を参照）。Tailwind v4 では `--ease-*` が theme 名前空間なので、easing はこの方式が要る。`--duration-*` は Tailwind に名前空間が無いので別名は要らない。
- `global.css` の `@theme inline` がモーションに関して接続しているのは `--default-transition-duration: var(--duration-fast)` と `--default-transition-timing-function: var(--ease-standard)` の 2 行だけ。`duration-fast` / `ease-entrance` のような utility は存在しない。
- `global.css` には `@utility state-hover-overlay` と `@utility opacity-disabled` の前例がある。
- Tailwind v4 の `duration-<数値>` utility は `--tw-duration` と `transition-duration` の両方を書く。`ease-<名前>` utility は `--tw-ease` と `transition-timing-function` の両方を書く（`node_modules/tailwindcss/dist/lib.js` で実測）。tw-animate-css の `animate-in` / `animate-out` は `var(--tw-animation-duration, var(--tw-duration, .15s))` と `var(--tw-ease, ease)` を読む（`node_modules/tw-animate-css/dist/tw-animate.css` で実測）。したがって、新設する duration utility は `--tw-duration` にも書けば `animate-in` に効く。
- Tailwind v4 の `translate-(<custom-property>)` / `scale-(<custom-property>)` / `blur-(<custom-property>)` 記法は theme 定義なしで使える。当リポジトリでは `tooltip.tsx` の `origin-(--transform-origin)` に前例があり、`check-standards.mjs` の arbitrary 検査（`[` を探す）には掛からない。
- `src/**` にあるモーションの生値（`src/components/ui/*.tsx` と `src/blocks/**/*.tsx`。`src/site` / `src/pages` / `src/layouts` は 0 件）: Tailwind 既定の `duration-0 / 100 / 150 / 200 / 250 / 300 / 400 / 450 / 1000`、`ease-in / ease-out / ease-in-out / ease-linear`、`toast.tsx` の `[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]`。件数は本仕様に書かない（2.4.1 の allowlist は checker の出力から生成する）。
- `scripts/check-standards.mjs` の既存ルールは `focus-ring-opacity` / `arbitrary-value` / `boolean-data-inset` の 3 つ。行ごとの検査は関数 `checkFileWithAnalysis` の `executableSource.split("\n").forEach` 内で行い、`ARBITRARY` の許容は `const ALLOWED_ARBITRARY = new Set(["ring-[3px]"])` で持つ。公開関数は `checkFiles(sources)`（`Map<path, source>` を受ける）と `checkFile(path, source)`。テストは `scripts/check-standards.test.mjs` が `import { checkFile, checkFiles } from "./check-standards.mjs"` で直接呼ぶ。
- 証跡の規定: `global.css` / `tokens.css` の変更は「共有トークンの変更」にあたり、`scripts/check-evidence.mjs` が `SHARED_TOKEN_IMAGE_SUBJECTS`（`disabled-controls, alert-dialog, attachment, catalog, menubar, select, button, bubble, dialog, drawer, badge, alert, sheet, tabs` の 14 subject）× light / dark = 28 枚と report を要求する。書式の見本は `.docs/reviews/2026-09-06-geometry-layer/report.md`（先頭 3 行が `verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha`、画像名は `2026-09-06-<subject>-preview-light.jpg` 形式。`disabled-controls` だけ `-preview` が無い）。`verified_impl_sha` はトークン変更 commit より後の commit でなければならない（`strictAncestor` 判定）。
- ベースライン（origin/main、2026-09-15 実測）: `node scripts/check-standards.mjs` exit 0（248 ファイル）、`node src/styles/design-system/build-tokens.mjs --check` exit 0、`npm run lint` exit 0（warning 200 件・info 3 件は既存）。`npm run typecheck` はローカルで OOM になることが既知（CI で代替する）。`node --test "scripts/*.test.mjs"` は全件実行で毎回別の 1 件が落ちる flaky が既知（落ちた test を単独再実行して切り分ける）。
- transitions.dev の motion トークン（出典: `skills/transitions-dev/SKILL.md` の「Motion tokens」節、2026-09-15 取得）: duration は stagger 40 / micro 80 / quick 150 / fast 250 / medium 350 / slow 400 / very-slow 500ms。easing は smooth-out `cubic-bezier(0.22, 1, 0.36, 1)` / in-out / out / linear / bounce `cubic-bezier(0.34, 1.36, 0.64, 1)` / bounce-strong `cubic-bezier(0.34, 3.85, 0.64, 1)`。distance は 4 / 6 / 8 / 12 / 30px。scale は 0.96 / 0.97 / 0.98 / 0.99。blur は 2 / 3 / 8px。同 SKILL.md は「数値でなく用途で写像する」を規律としている。

## 2. 実施内容（literal）

### 2.1 design-tokens.html にトークンと用途表と決定記録を足す

`src/styles/design-system/design-tokens.html` を次のように変える。編集後に `node src/styles/design-system/build-tokens.mjs` で `tokens.css` / `brands.css` を再生成する（生成物を手で編集しない）。

1. `<style>` 内の `:root` ブロックにある `/* ---------- MOTION ---------- */` の区画で、既存 8 トークンの値は変えず、次を足す。既存の `--ease-standard` / `--ease-entrance` / `--ease-exit` は値を `--curve-*` へ移し、`--ease-*` 側をその参照にする（`--rounding-*` と同じ方式）。

   ```css
   --duration-stagger: 40ms; --duration-micro: 80ms; --duration-emphasis: 500ms;
   --curve-standard: cubic-bezier(0.2, 0, 0, 1);
   --curve-entrance: cubic-bezier(0.16, 1, 0.3, 1);
   --curve-exit: cubic-bezier(0.4, 0, 1, 1);
   --curve-bounce: cubic-bezier(0.34, 1.36, 0.64, 1);
   --curve-bounce-strong: cubic-bezier(0.34, 3.85, 0.64, 1);
   --ease-standard: var(--curve-standard);
   --ease-entrance: var(--curve-entrance);
   --ease-exit: var(--curve-exit);
   --ease-bounce: var(--curve-bounce);
   --ease-bounce-strong: var(--curve-bounce-strong);
   --motion-distance-sm: 4px; --motion-distance-md: 8px; --motion-distance-lg: 12px;
   --motion-scale-lg: 0.96; --motion-scale-md: 0.97; --motion-scale-sm: 0.98;
   --motion-blur-sm: 2px; --motion-blur-lg: 8px;
   ```

   `--ease-linear` は足さない（Tailwind の `ease-linear` は静的 utility で design system の値を持たないため）。`[data-theme="dark"]` 側には何も足さない。

2. `<section class="band" id="motion">` の中、`<div class="motion">` の閉じタグの直後に、用途表を足す。体裁は同ページの他の表（例: Layer & Opacity 節の `Token / Value / 用途` の表）に合わせる。行は次の 13 行で、列は `Token / Value / 用途`:

   | Token | Value | 用途 |
   |---|---|---|
   | `--duration-stagger` | 40ms | リスト項目の stagger 間隔 |
   | `--duration-micro` | 80ms | tooltip の appear delay、shake の 1 セグメント |
   | `--duration-fast` | 120ms | modal / dropdown の close、tooltip の appear、text swap、状態色（`--state-transition`） |
   | `--duration-base` | 180ms | 位置・サイズの微調整 |
   | `--duration-slow` | 260ms | modal / dropdown の open、icon swap、tabs の indicator、page slide |
   | `--duration-slower` | 400ms | panel / toast / sheet の open と close、skeleton から content への reveal |
   | `--duration-emphasis` | 500ms | 強調の一点（success check、badge の appear、text reveal） |
   | `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | 状態色・位置の標準 |
   | `--ease-entrance` | cubic-bezier(0.16, 1, 0.3, 1) | overlay の open と close、page slide、resize |
   | `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) | 画面外へ退場する要素 |
   | `--ease-bounce` | cubic-bezier(0.34, 1.36, 0.64, 1) | badge の pop、switch の thumb |
   | `--ease-bounce-strong` | cubic-bezier(0.34, 3.85, 0.64, 1) | hover 解除時の戻り（avatar group） |
   | `--motion-distance-* / --motion-scale-* / --motion-blur-*` | 4 / 8 / 12px、0.96 / 0.97 / 0.98、2 / 8px | 開閉の translate 距離、開閉の初期 scale（modal は lg、dropdown は md、tooltip は sm）、cross-blur |

   `<span class="eyebrow">--duration-* / --ease-*</span>` は `--duration-* / --ease-* / --motion-*` に変える。

3. `<section class="band" id="decisions">` の `<div class="log">` 内、先頭の `<div class="entry">`（見出し「角丸と影の値は Tailwind と衝突しない別名に置く」）の**直前**に、同じ体裁（`<div class="entry"><h4>…</h4><p>…</p></div>`）で 1 項目足す。見出しは「モーションは段の値を固定し、段の追加は用途を伴うときだけ認める」。本文の趣旨は次の 4 点をこの順で含める（文言は既存項目の体裁に合わせる。箇条書きにしない）:
   - `--duration-*` の既存の段の値は動かさない。両端（stagger / micro / emphasis）と、easing の bounce 2 種、幾何（distance / scale / blur）を足した。
   - 段は数値でなく用途で選ぶ（Motion 節の用途表が正本）。
   - easing の値は Tailwind の `@theme` と同名衝突しない `--curve-*` に置き、`--ease-*` はその参照にする（`--rounding-*` と同じ理由）。幾何は Tailwind の `--blur-*` 名前空間を避けるため `--motion-` 接頭辞にする。
   - 用途表と段の値の出典は transitions.dev（`https://transitions.dev/`）。利用条件は同サイトの terms（値と設計の参照・改変は可、コレクションの再配布は不可）で、当リポジトリは snippet を持ち込まず値と設計だけを参照する。

4. `node src/styles/design-system/build-tokens.mjs` を実行し、続けて `node src/styles/design-system/build-tokens.mjs --check` が exit 0 であることを確認する。`build-tokens.mjs` が `--curve-*` への参照や `--motion-*` を拒む（未定義参照の検証等で落ちる）場合は止めて ask で報告する。

### 2.2 global.css の Tailwind 接続

`src/styles/global.css` を次のように変える。

1. `@theme inline` ブロック内、`--default-transition-timing-function: var(--ease-standard);` の行の**直後**に、次を足す（コメントは既存行の体裁に合わせて各行の直前に置く）:

   ```css
   --ease-standard: var(--curve-standard);
   --ease-entrance: var(--curve-entrance);
   --ease-exit: var(--curve-exit);
   --ease-bounce: var(--curve-bounce);
   --ease-bounce-strong: var(--curve-bounce-strong);
   ```

   `--ease-*: initial` は**書かない**（Tailwind 既定の `ease-in / ease-out / ease-in-out / ease-linear` を残す。無効化は issue #58 のスコープ外）。

2. `@utility opacity-disabled { … }` の**直後**に、次の 8 個の静的 utility を足す。各 utility は `transition-duration` と `--tw-duration` の両方に同じ `var(--duration-<段>)` を書く。

   ```css
   @utility duration-instant { transition-duration: var(--duration-instant); --tw-duration: var(--duration-instant); }
   @utility duration-stagger { transition-duration: var(--duration-stagger); --tw-duration: var(--duration-stagger); }
   @utility duration-micro { transition-duration: var(--duration-micro); --tw-duration: var(--duration-micro); }
   @utility duration-fast { transition-duration: var(--duration-fast); --tw-duration: var(--duration-fast); }
   @utility duration-base { transition-duration: var(--duration-base); --tw-duration: var(--duration-base); }
   @utility duration-slow { transition-duration: var(--duration-slow); --tw-duration: var(--duration-slow); }
   @utility duration-slower { transition-duration: var(--duration-slower); --tw-duration: var(--duration-slower); }
   @utility duration-emphasis { transition-duration: var(--duration-emphasis); --tw-duration: var(--duration-emphasis); }
   ```

   Tailwind の関数型 utility `duration-*` と名前が重なって静的 utility が生成されない場合（4 節 4 項の probe が 0 件になる場合）は止めて ask で報告する。

3. distance / scale / blur の utility は作らない（`translate-y-(--motion-distance-md)` / `scale-(--motion-scale-lg)` / `blur-(--motion-blur-sm)` の custom-property 記法で参照する。参照する側は issue #58 のサブプロジェクト 2 以降）。

### 2.3 DESIGN.md の「避けるもの」に 1 行足す

`DESIGN.md` の `## 避けるもの（design system として）` の箇条書きの**末尾**に 1 行足す。趣旨は「モーションに Tailwind 既定の `duration-<数値>` / `ease-out` や生の `ms` / `cubic-bezier()` を書かない。段は Motion 節の用途表から `duration-<段>` / `ease-<名前>` で選ぶ。`check-standards.mjs` の `motion-literal` が検知する」。既存行の体裁（太字の禁止事項 + ` — ` + 理由）に合わせる。

### 2.4 check-standards.mjs に `motion-literal` ルールと allowlist の ratchet を足す

`scripts/check-standards.mjs` を次のように変える。

1. `const ALLOWED_ARBITRARY = new Set(["ring-[3px]"]);` の**直後**に、正規表現 3 つと allowlist を足す:

   ```js
   // Tailwind 既定の数値 duration / delay。design system の段（duration-fast 等）を使う。
   const MOTION_DURATION_LITERAL = /\b(?:duration|delay)-\d+(?![\w-])/g;
   // Tailwind 既定の easing。design system の曲線（ease-standard / ease-entrance 等）を使う。
   // ease-linear は design system の値を持たないため対象外。
   const MOTION_EASE_LITERAL = /\bease-(?:in-out|in|out)(?![\w-])/g;
   // arbitrary な transition / animation 宣言に生の時間や cubic-bezier を書いたもの。
   const MOTION_ARBITRARY_LITERAL =
     /\[(?:transition|animation)(?:-[a-z-]+)?:[^\]]*?(?:\d+m?s(?![a-z])|cubic-bezier\()[^\]]*\]/g;
   // 既存箇所の許容。path ごとの token の配列。エントリは issue #58 のサブプロジェクト 2〜4 で減らす。
   // 実在しないエントリは motion-literal-allowlist-stale として失敗させる（ratchet）。
   const MOTION_LITERAL_ALLOWLIST = new Map([
     // 3 節の手順で checker の出力から生成する
   ]);
   ```

2. `checkFileWithAnalysis` の行ループ内、`BOOLEAN_DATA_INSET` の `for` ループの**直後**に、3 つの正規表現それぞれについて `for (const m of line.matchAll(<正規表現>))` を回し、`MOTION_LITERAL_ALLOWLIST.get(path)` に `m[0]` が含まれていなければ `{ rule: "motion-literal", line: i + 1, text: m[0] }` を push する。含まれていれば「その path でその token が実在した」ことを記録し、`checkFileWithAnalysis` の戻り値に `motionLiteralsSeen`（実在した token の `Set`）を足して返す（3 の stale 判定に使う。既存の `violations` フィールドはそのまま）。既存の `unique` による重複排除はそのまま効く。 司令塔裁定（2026-09-15）: motionLiteralsSeen は allowlist の有無に関係なく検出した全 token を記録する。§2.4.5 の第 3 テストと整合させるため。

3. `checkFiles` / `checkFile` のシグネチャは変えない。新しい export として `staleMotionAllowlist(results, allowlist = MOTION_LITERAL_ALLOWLIST)` を足す。`results` は `checkFiles` の戻り値（`Map<path, { violations, motionLiteralsSeen }>`）で、**`results` に含まれる path についてだけ** allowlist の各 token が `motionLiteralsSeen` に無ければ `{ path, rule: "motion-literal-allowlist-stale", line: 0, text: <token> }` を配列で返す。`results` に含まれない path の allowlist エントリは判定しない（単体テストが 1 ファイルだけ渡すときに他の全エントリが stale にならないようにするため）。

4. CLI の入口（`const results = checkFiles(analysisFiles);` の直後）で `staleMotionAllowlist(results)` を呼び、返った要素を既存の違反と同じ形式（`rule` / `line` / `text`）で表示し、1 件でもあれば exit 1 にする。既存の違反表示の形式は変えない。

5. `scripts/check-standards.test.mjs` に次の 3 test を足す（既存 test の体裁に合わせる。fixture は文字列リテラルで書き、実ファイルに依存しない）:
   - 「モーションの生値を検出する」: `duration-100`、`ease-out`、`ease-in-out`、`[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1)]`、`[transition:opacity_200ms_ease]` を含む tsx 文字列を path `x.tsx` で `checkFiles` に渡し、`motion-literal` が 5 件で、`text` がそれぞれ上の 5 値であること。`ease-in-out` が `ease-in` と二重に検出されないこと（司令塔が 2026-09-15 に 2.4 の正規表現をこの fixture で実測済み。`\d+m?s` の直後の lookahead を `(?![\w-])` にすると `_` 区切りで沈黙するため `(?![a-z])` にしてある）。
   - 「design system の段は検出しない」: `duration-fast ease-entrance ease-linear translate-y-(--motion-distance-md) blur-(--motion-blur-sm) animate-in fade-in-0` を含む tsx 文字列で `motion-literal` が 0 件であること。
   - 「allowlist の実在しないエントリを失敗させる」: `checkFiles` に `x.tsx` を 1 件渡した結果を `staleMotionAllowlist(results, new Map([["x.tsx", ["duration-100"]]]))` に渡し、`x.tsx` の内容に `duration-100` が無いとき戻り値が 1 件（`rule` が `motion-literal-allowlist-stale`、`text` が `duration-100`）、あるとき 0 件であること。allowlist に `results` に無い path（例 `y.tsx`）のエントリがあっても戻り値に含まれないこと。

   1 番目と 2 番目の fixture の path は `x.tsx` のように既定の allowlist に無い名前にする（既定の allowlist は実ファイルの path をキーにするため、fixture の検出には影響しない）。

### 2.4.1 allowlist の生成手順

`MOTION_LITERAL_ALLOWLIST` を空にした状態で `node scripts/check-standards.mjs` を実行し、出力された `motion-literal` の `path` と `text` をそのまま allowlist に写す（手で書き起こさない）。写した後に再実行して `motion-literal` が 0 件、`motion-literal-allowlist-stale` が 0 件、exit 0 であることを確認する。allowlist の path 数と token 数を PR 本文に書く。

### 2.5 risk-registry に受容記録を足す

`.docs/risk-registry.md` の末尾に `## RISK-016: transitions.dev の利用条件（LICENSE ファイル無し、再配布禁止条項あり）` を足す。体裁は既存項目（`date / confidence / location / status / reason / anchor`）に合わせる。

- date: 2026-09-15
- confidence: high
- location: `.docs/plans/2026-09-15-motion-token-layer.md` §1.1
- status: accepted
- reason の趣旨: 上流に SPDX ライセンスが無く、terms は「値と設計の参照・改変・商用利用は可、コレクションの再配布は不可」。当リポジトリは公開 registry の component kit なので、snippet（`t-*` クラス、`.is-open` / `.is-closing`、`_root.css`）を持ち込まず、段の値と用途表だけを参照する。コードを持ち込まないため THIRD_PARTY_LICENSES は変えない。
- anchor の趣旨: `src/` 配下に `t-` 接頭辞の CSS クラス（`"t-` または ` t-` に続く英字）と `is-open` / `is-closing` クラスが存在しないことを grep で検査する（4 節 8 項）。design-tokens.html の決定記録が出典と利用条件を持つ。

### 2.6 証跡（共有トークン変更の撮り直し）

6 節の commit (A) と (B) を作ったあと、(B) の HEAD で（4 節 4 項の一時ファイルを削除した状態の build で）14 subject × light / dark の 28 枚と report を撮り、`.docs/reviews/2026-09-15-motion-token-layer/` に新規保存する。手順と report の書式は `.docs/reviews/2026-09-06-geometry-layer/report.md` と `.docs/component-addition-procedure.md` §4 に従う。`verified_impl_sha` / `targeted_dynamic_sha` は実装の最終 commit（トークン変更 commit より後）を指す。既存の証跡は書き換えない・削除しない。

本サブプロジェクトは見た目を変えないので、report には「変更前後で computed style が同一であること」を 4 節 5 項の実測で書く。

## 3. スコープ外

- `src/components/**`、`src/blocks/**`、`src/previews/**`、`src/pages/**`、`src/site/**` を変えない（見た目を変えない。allowlist に載せるだけで、生値の置き換えはサブプロジェクト 2〜4）。
- `--ease-*: initial` を書かない。tw-animate-css の依存・registry 登録を変えない。
- 既存 8 トークンの値を変えない。`[data-theme="dark"]` にモーショントークンを足さない。
- `tokens.css` / `brands.css` を手で編集しない。
- `THIRD_PARTY_LICENSES` / `fetch-third-party-licenses.mjs` / `provenance.json` / `registry.json` / `AGENTS.md` を変えない。
- `.docs/reviews/` の既存 report と画像を書き換えない・削除しない。
- `main` へのマージ、`gh pr merge`、ruleset の変更をしない。
- `check-standards.mjs` の既存 3 ルールの判定を変えない。

## 4. 検証（rubric）。結果は worker_done の body に実測値（コマンドと exit code）で含める

各コマンドは単独で実行し、個々の exit code を報告する（`&&` / `;` / pipe で連結しない）。

1. トークン生成と検証:

   ```bash
   node src/styles/design-system/build-tokens.mjs
   node src/styles/design-system/build-tokens.mjs --check
   ```

   どちらも exit 0。続けて生成物に 18 トークンが揃っていることを確認する（各 grep は単独で実行し、件数が 1 以上であること）:

   ```bash
   grep -c -- '--duration-stagger: 40ms' src/styles/design-system/tokens.css
   grep -c -- '--duration-micro: 80ms' src/styles/design-system/tokens.css
   grep -c -- '--duration-emphasis: 500ms' src/styles/design-system/tokens.css
   grep -c -- '--curve-bounce: cubic-bezier(0.34, 1.36, 0.64, 1)' src/styles/design-system/tokens.css
   grep -c -- '--curve-bounce-strong: cubic-bezier(0.34, 3.85, 0.64, 1)' src/styles/design-system/tokens.css
   grep -c -- '--ease-entrance: var(--curve-entrance)' src/styles/design-system/tokens.css
   grep -c -- '--motion-distance-md: 8px' src/styles/design-system/tokens.css
   grep -c -- '--motion-scale-lg: 0.96' src/styles/design-system/tokens.css
   grep -c -- '--motion-blur-sm: 2px' src/styles/design-system/tokens.css
   ```

   既存の値が動いていないことを確認する（件数が 1 以上であること）:

   ```bash
   grep -c -- '--duration-fast: 120ms' src/styles/design-system/tokens.css
   grep -c -- '--curve-entrance: cubic-bezier(0.16, 1, 0.3, 1)' src/styles/design-system/tokens.css
   ```

2. `npm run lint` が exit 0。

3. `node scripts/check-standards.mjs` が exit 0。さらに sensor の self-test として、内容が `export const probe = "duration-999";` だけの一時ファイル `src/components/ui/motion-literal-probe.tsx` を置いて同コマンドを実行し、`motion-literal` が 1 件検出されて exit 1 になることを確認してから、一時ファイルを削除する（一時ファイルを commit しない）。検出された行の出力を報告に写す。

4. Tailwind v4 は走査したソースに現れる utility しか生成せず、本サブプロジェクトは component を変えないため、新設 utility は一時ファイルで参照して生成させる。内容が次の 1 行だけの一時ファイル `src/components/ui/motion-utility-probe.tsx` を置く:

   ```tsx
   export const probe = "duration-instant duration-stagger duration-micro duration-fast duration-base duration-slow duration-slower duration-emphasis ease-standard ease-entrance ease-exit ease-bounce ease-bounce-strong";
   ```

   その状態で `npm run build:site` が exit 0。`ls dist/_astro/global.*.css` で得た CSS ファイルに対して次を実測し（各 grep は単独で実行し、出力を報告に写す）、実測後に一時ファイルを削除して `npm run build:site` をもう一度実行する（一時ファイルを commit しない。証跡は一時ファイル削除後の build で撮る）:

   ```bash
   grep -o '\.ease-entrance{[^}]*}' <css>
   grep -o '\.ease-bounce{[^}]*}' <css>
   grep -o '\.duration-fast{[^}]*}' <css>
   grep -o '\.duration-emphasis{[^}]*}' <css>
   ```

   `.ease-entrance{…}` の中に `transition-timing-function:var(--curve-entrance)` が含まれること（`@theme inline` は theme 変数の値を inline するため、utility には別名 `--curve-*` が現れる。`rounded-lg{border-radius:var(--rounding-lg)}` と同じ）。`.ease-bounce{…}` の中に `var(--curve-bounce)` が含まれること。`.duration-fast{…}` の中に `transition-duration:var(--duration-fast)` と `--tw-duration:var(--duration-fast)` の両方が含まれること。`.duration-emphasis{…}` も同様。いずれかが 0 件なら止めて ask で報告する。

5. Playwright（headless Chromium、viewport 1440×900）で preview server（一時ファイル削除後の build）を開き、`getComputedStyle` を実測して生の文字列を report に表で書く。見た目を変えないことは 4 節 1 項（既存値不変）と 9 項（component 差分が空）で構造的に担保するので、origin/main 側の build は行わない:
   - `/preview/button/` の `[data-slot="button"]` 先頭要素: `transition-duration` が `0.12s`（`.docs/reviews/2026-09-06-geometry-layer/report.md` に記録済みの値）、`transition-timing-function` が `cubic-bezier(0.2, 0, 0, 1)`（`--ease-standard` → `--curve-standard` から導いた値。実測ではない）
   - `/preview/button/` の `document.documentElement` に対する `getComputedStyle(...).getPropertyValue("--curve-entrance")` の trim 後の値が `cubic-bezier(0.16, 1, 0.3, 1)`、`getPropertyValue("--duration-emphasis")` の trim 後の値が `500ms`（トークンが runtime に届いていることの直接照会）
   期待と実測が食い違う場合は止めて ask で報告する（期待値の側が誤っている可能性を含む）。

6. `node --test "scripts/*.test.mjs"` を実行し、失敗した test があれば単独で再実行する。単独再実行でも失敗する test が 0 件であること。全件実行と単独再実行の結果を両方報告する。2.4 の 3 test が含まれ、緑であること。

7. `npm run check:all` が exit 0（約 9 分。`check-evidence` を含む）。typecheck が OOM で落ちた場合はその旨を報告し、PR CI の `Lint, typecheck, test & build` の結果で代替する。

8. 負の検査（各 1 コマンドで実行し、件数 0 を報告する。`design-tokens.html` の決定記録と `.docs/` は説明文なので対象外）:

   ```bash
   grep -rnE '["'"'"' ]t-[a-z]' src/components src/blocks src/styles/global.css
   grep -rnE '\bis-(open|closing)\b' src/components src/blocks src/styles/global.css
   grep -rn -- '--ease-\*: initial' src/styles/global.css
   ```

9. 見た目を変えていないことの直接照会:

   ```bash
   git diff --stat origin/main -- src/components src/blocks src/previews src/pages src/site
   ```

   出力が空であること。

10. `node scripts/check-evidence.mjs`（`check:all` に含まれるが単独でも実行）が exit 0。

11. 実測の範囲を報告に書く: 各項目が「存在」「実行」「動作（computed style）」のどこまでを測ったか。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。fresh context のレビュアーを立てて `lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3 に従う: 最大 3 ラウンド（skill の既定値を上書き）。3 ラウンドで残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」（§3）: 終了宣言時に 4 節 1〜4・6 のコマンドを再実行して exit code を PR 本文へ書く。
- 指摘の正しさと修正の妥当性は別（brain URISK-117）。検査道具が守る対象より複雑になる修正は採らず、採らない理由を PR 本文へ書く。特に `motion-literal` の正規表現は 2.4 に書いたものを正本とし、レビューで拡張を求められても対象（数値 duration / delay、既定 easing 3 種、arbitrary な transition / animation の生値）を広げない。

## 6. 完了条件

- ブランチ `naoto24kawa/motion-token-layer` で PR を作成する（マージしない。human 承認へ落とす）。commit は少なくとも 3 つに分ける: (A) トークン変更（2.1 と 2.2。`design-tokens.html`・再生成した `tokens.css` / `brands.css`・`global.css`）、(B) それ以外の実装（2.3〜2.5）、(C) 証跡（2.6）。`verified_impl_sha` / `targeted_dynamic_sha` は (B) を指す。`check-evidence.mjs` の `strictAncestor` 判定は「証跡 SHA がトークン変更 commit より後」を要求するため、(A) と (B) を 1 つにまとめると (A) 自身を指すことになり通らない（`.docs/reviews/2026-09-06-geometry-layer/report.md` のトークン commit `56abdb7` と検証 commit `cc54767` の関係と同じ）。PR 本文は日本語で、次を含む: 変更概要、4 節の各項目の実測結果（コマンド・exit code・件数・grep 出力）、allowlist の path 数と token 数、レビュー記録（ラウンドごとの指摘と処置）、受容した flag と risk-registry の ID、実装担当識別子（エージェント名とモデル）、`Closes #58`。
- PR 本文はファイルに書いて `--body-file` で渡す（シェルのダブルクォートに直書きしない）。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。

## 7. 制約

- **指示と実態が矛盾したら止めて ask で報告する**（例: 2.1 で build-tokens.mjs が `--curve-*` 参照を拒む、2.2 で `duration-fast` の静的 utility が生成されない、4 節 5 項で origin/main と computed style が食い違う、Playwright が使えない、レビュアーを起動できない）。
- 裁量の範囲: design-tokens.html の用途表と決定記録の文言、DESIGN.md の 1 行の文言、コメント文言、report の表現、テストの fixture 文字列。トークン名・値・正規表現・既存の公開関数のシグネチャ（`staleMotionAllowlist` の新規 export を除く）は変えない。裁量で変えた内容は worker_done と PR 本文に申告する。
- 逆委任は受けない。環境制約（ツール不在・turn 上限等）で担当範囲を遂行できないときは、範囲を司令塔へ戻さず ask で報告して判断を待つ。
- 想定所要時間: 90〜150 分（証跡 28 枚とレビュー 3 ラウンドを含む）。その間 commit が無くても正常。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。
