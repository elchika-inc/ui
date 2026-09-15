[Issue #60](https://github.com/elchika-inc/ui/issues/60)

# 委任仕様: overlay の開閉モーションを Base UI 標準の transition とトークン参照へ統一する（issue #60、サブプロジェクト 2/4）

この仕様は 1 ファイルで 5 本の PR（A〜E）を扱う。worker は司令塔の brief で指定された PR の節（§A〜§E）と、共通節（§1〜§7）だけを実行する。他の PR の節は読んでよいが実行しない。

## 1. 背景（司令塔が実測済み。再調査不要）

- 前提となる main の状態: PR #59（issue #58）のマージ後（merge commit `94a79dfdbf977440bcc1790c7db457834283cb33`）。`src/styles/global.css` に `@utility duration-instant / stagger / micro / fast / base / slow / slower / emphasis` と `@theme inline` の `--ease-standard / entrance / exit / bounce / bounce-strong` があり、`ease-<名前>` と `duration-<段>` の utility が使える。`design-tokens.html` の Motion 節に用途表がある（段は数値でなく用途で選ぶ）。
- 幾何トークン `--motion-distance-sm/md/lg`（4 / 8 / 12px）、`--motion-scale-lg/md/sm`（0.96 / 0.97 / 0.98）、`--motion-blur-sm/lg`（2 / 8px）は `tokens.css` にあり、Tailwind の custom-property 記法（`scale-(--motion-scale-md)` / `translate-y-(--motion-distance-md)` / `blur-(--motion-blur-sm)`）で参照する。utility は作らない。
- `scripts/check-standards.mjs` の `motion-literal` ルールは、Tailwind 既定の `duration-<数値>` / `delay-<数値>`、`ease-in / ease-out / ease-in-out`、`[transition:…]` / `[animation:…]` 内の生 `ms` / `cubic-bezier` を検知する。既存箇所は同ファイルの `MOTION_LITERAL_ALLOWLIST`（`Map<path, token[]>`）で許容され、**allowlist にあるのに実在しない token は `motion-literal-allowlist-stale` として exit 1 になる**（ratchet）。したがって生値を消したファイルは allowlist の行も消す。
- Base UI の transition 契約（`node_modules/@base-ui/react`、docs 2026-09-15 取得）: popup 要素は open 中の最初のフレームで `data-starting-style`、close 中に `data-ending-style` を持つ。transition を止めるべき場面（tooltip の trigger 間移動、dismiss 等）では `data-instant` が付く。anchor 付き popup は `--transform-origin` を持つ。Accordion / Collapsible の Panel は `--accordion-panel-height` / `--collapsible-panel-height` を持ち、`height` の transition で開閉する。
- tw-animate-css の `animate-in` / `animate-out` は keyframes で、`--tw-duration` / `--tw-ease` を読む。今回はこれを使わず CSS transition に統一する。tw-animate-css 固有の utility を使うのは overlay 14 部品と `input-otp.tsx` の `animate-caret-blink` だけ（2026-09-15 実測）。
- 証跡の規定: component ファイルを変えると `scripts/check-evidence.mjs` がその component の新しい light / dark 証跡と report を要求する（`verified_impl_sha` は実装 commit を指す）。`global.css` / `tokens.css` を変えると 14 subject × light / dark = 28 枚の共有面証跡を要求する（PR E だけが該当）。書式の見本は `.docs/reviews/2026-09-15-motion-token-layer/report.md`（共有面）、`.docs/reviews/2026-09-06-geometry-components/`（複数 component の固有証跡を 1 ディレクトリに置く例。check-evidence は `<日付>-<component 名>-preview.md` というファイル名で component を割り当てるので、report は部品ごとに 1 ファイルとし、同名の `-light.jpg` / `-dark.jpg` を並べる）、`.docs/component-addition-procedure.md` §4（手順）。
- ベースライン（main `94a79df`、2026-09-15 実測）: `node scripts/check-standards.mjs` exit 0、`npm run lint` exit 0（warning 201 件は既存）、`npm run typecheck` はローカルで OOM になることが既知（CI で代替）、`node --test "scripts/*.test.mjs"` は全件で約 15 分、`check-evidence.test.mjs` 単独で約 17 分、`check-preview-render.test.mjs` 単独で約 6 分かかる（無応答ではない）。`check-evidence.mjs` 単独は約 12 分。
- 並列運用: 同じ wave の 2 本の PR は `MOTION_LITERAL_ALLOWLIST` の隣接行を削除するため、後からマージする側は base 追随（`git merge origin/main`）で conflict する。解消は「両方の削除を採る」（残すべき行は自分の PR で触らない path の行だけ）。rebase は使わない（`.docs/reviews/` の `verified_impl_sha` が履歴から消えるため）。

## 2. 実施内容（literal、全 PR 共通の記法）

### 2.1 開閉 transition のテンプレ

popup 要素（Dialog / AlertDialog の Popup、Popover / HoverCard / Tooltip / Menu / Select / Combobox の Popup）の className から、tw-animate-css 由来の class（`data-open:animate-in`、`data-open:fade-in-0`、`data-open:zoom-in-95`、`data-closed:animate-out`、`data-closed:fade-out-0`、`data-closed:zoom-out-95`、`data-[side=…]:slide-in-from-…-2`、`data-[state=delayed-open]:…`）と Tailwind 既定の `duration-<数値>` / `ease-<既定>` をすべて取り除き、代わりに次を足す。既存の `origin-(--transform-origin)` は残す。

```
transition-[opacity,scale] duration-slow ease-entrance
data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md)
data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast
data-instant:transition-none
```

- open の duration は `duration-slow`、close は `data-ending-style:duration-fast`（非対称）。曲線は両方 `ease-entrance`。
- `scale-(…)` の段は §A〜§D の表で部品ごとに指定する（modal は lg、menu / popover は md、tooltip は sm。close は 1 段小さい）。
- backdrop / overlay 要素は `transition-opacity duration-slow ease-entrance data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-fast`（scale は付けない）。
- `prefers-reduced-motion` は `global.css` が全体で処理済みなので、`motion-safe:` は付けない。

### 2.2 allowlist の更新

担当部品のファイルから生値が消えたら、`scripts/check-standards.mjs` の `MOTION_LITERAL_ALLOWLIST` からその path の行（複数行のエントリは全行）を削除する。他の path の行は触らない。

### 2.3 触らないもの

- `src/styles/global.css` / `tokens.css` / `design-tokens.html`（PR E の §E だけが global.css を触る）。
- `registry.json` / `package.json` / `provenance.json`（PR E の §E だけが registry.json と package.json を触る）。
- 担当外の部品ファイル、`src/previews/**`、`src/pages/**`、`src/site/**`。
- `.docs/reviews/` の既存 report と画像。
- `check-standards.mjs` の正規表現・判定ロジック（allowlist の行削除だけ）。
- `main` へのマージ、`gh pr merge`、ruleset の変更。

## 3. スコープ外（全 PR 共通）

- tabs の Indicator（別 issue）。command（生値も tw-animate-css も無い）。
- 開閉以外のモーション（hover 状態色は `--state-transition` のまま。サブプロジェクト 3 の範囲）。
- Base UI の props（`delay`、`closeDelay`、`sideOffset` 等）の変更。開閉の見た目は CSS だけで変える。
- 部品の DOM 構造・export・props 型の変更。

## 4. 検証（rubric、全 PR 共通）。結果は worker_done の body に実測値（コマンドと exit code）で含める

各コマンドは単独で実行し、個々の exit code を報告する（`&&` / `;` / pipe で連結しない）。

1. `node scripts/check-standards.mjs` が exit 0（担当 path の allowlist 行を削除済みの状態で。`motion-literal` と `motion-literal-allowlist-stale` が 0 件）。
2. 負の検査（担当部品のファイルそれぞれに対して各 1 コマンド、件数 0 を報告する。PR E は §E の追加条件も見る）:

   ```bash
   grep -cE 'animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from|animate-accordion|delayed-open' <担当ファイル>
   grep -cE '\b(duration|delay)-[0-9]+\b' <担当ファイル>
   grep -cE '\bease-(in|out|in-out)\b' <担当ファイル>
   ```

   陽性対照として、同じ 3 コマンドを origin/main の同ファイル（`git show origin/main:<担当ファイル>` を一時ファイルへ書き出したもの）に対して実行し、1 件以上ヒットすることを確認してから一時ファイルを削除する。
3. `npm run lint` が exit 0。
4. `npm run build:site` が exit 0。`ls dist/_astro/global.*.css` で得た CSS に対して次を実測し、出力を報告に写す（担当部品が参照するので一時ファイルは不要）:

   ```bash
   grep -o '\.duration-slow{[^}]*}' <css>
   grep -o '\.ease-entrance{[^}]*}' <css>
   grep -c 'data-starting-style' <css>
   ```

   前 2 つが 1 件以上、3 つ目が 1 以上であること。
5. Playwright（headless Chromium、viewport 1440×900、`npm run build:site` の成果物を `npx astro preview` で配信、空きポートを明示）で担当部品の preview を light / dark で開き、次を実測して report に書く:
   - console error 0 件（favicon 404 は別記）、`preview-selectors.json` の selector が 1 件以上。
   - popup 要素（§A〜§D の表の「実測対象 selector」）の `getComputedStyle` で `transition-duration` と `transition-timing-function` を取り、期待値（表の open 側の段。例 `duration-slow` なら `0.26s`、`ease-entrance` なら `cubic-bezier(0.16, 1, 0.3, 1)`）と一致すること。minify で `0.26s` が `.26s` になるような等価表記は数値等価として合格にし、生値をそのまま記録する。
   - 閉じる操作（表の「開閉操作」）で `data-ending-style` が付いてから要素が消えることを属性のポーリング（16ms 間隔）で観測して記録する（必須。close の transition 中ずっと付いている）。開く側は computed style の一致を証拠とし、`data-starting-style`（1 フレームしか付かない）の観測は best-effort でよい。観測できたか否かを report に書く。
   - 開く操作の直後に popup 要素の `data-instant` 属性の有無も記録する（§B の分岐に使う）。
   - 担当部品ごとに light / dark を撮影し、`.docs/reviews/<日付>-<PR 名>/` に新規保存する（既存証跡を上書きしない）。report の `verified_impl_sha` は実装 commit を指す。ファイル構成は `.docs/reviews/2026-09-06-geometry-components/` を見本にする。report は部品ごとに `<日付>-<component 名>-preview.md`（例: `2026-09-16-dialog-preview.md`）とし、画像は `<日付>-<component 名>-preview-light.jpg` / `-dark.jpg`。check-evidence はこのファイル名で component を割り当てるため、部品名を誤ると別 component の証跡として扱われる。
6. `node --test scripts/check-standards.test.mjs` が exit 0。全件テスト（`node --test "scripts/*.test.mjs"`）はローカルで実行しない（同じマシンで 2 worker が並走するため。PR #59 の司令塔裁定と同じく PR CI の `Lint, typecheck, test & build` で代替する）。
7. `node scripts/check-evidence.mjs` が exit 0（約 12 分）。**report を書いた直後、証跡 commit を作る前に 1 回実行し**、証跡の形式・関連付けの誤りをその時点で直す。証跡 commit 後にもう 1 回実行して最終結果を報告する。
8. `git diff --stat origin/main` の変更ファイルが「担当部品のファイル + `scripts/check-standards.mjs`（allowlist 行の削除だけ）+ 新規証跡」だけであること（PR E は §E の一覧）。
9. 実測の範囲を報告に書く: 各項目が「存在」「実行」「動作（computed style / 属性遷移）」のどこまでを測ったか。

`npm run check:all` は実行しなくてよい（PR CI の `Lint, typecheck, test & build` と 7 の単独 check-evidence で代替する）。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。fresh context のレビュアー 1 名（read-only 権限）を立てて `lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3 に従う: 最大 3 ラウンド（skill の既定値を上書き）。3 ラウンドで残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」: 終了宣言時に 4 節 1〜4 を再実行して exit code を PR 本文へ書く。
- レビューで「slide-in の side 別オフセットを戻すべき」「duration の段を変えるべき」等、§2 / §A〜§E で固定した設計の変更を求められても採らない（採らない理由を PR 本文へ書く）。設計変更が必要と判断したら ask で司令塔へ。

## 6. 完了条件（全 PR 共通）

- 担当 PR のブランチ（brief で指定）で PR を作成する（マージしない）。commit は「実装 + allowlist」と「証跡」の 2 つ以上に分ける（証跡 report の `verified_impl_sha` は実装 commit を指す）。
- PR 本文は日本語で、次を含む: 変更概要、§A〜§E の表に対する部品ごとの対応表（何を何に置き換えたか）、4 節の各項目の実測結果、レビュー記録（ラウンドごとの指摘と処置）、受容した flag と risk-registry の ID、実装担当識別子、`Part of #60`（PR E だけ `Closes #60`）。
- PR 本文はファイルに書いて `--body-file` で渡す。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。
- **base 追随**: 司令塔から「origin/main が進んだので追随せよ」と指示が来たら、`git merge origin/main` で追随し（rebase しない）、`MOTION_LITERAL_ALLOWLIST` の conflict は両方の削除を採って解消し、4 節 1・3・4 を再実行して結果を PR 本文に追記し、push する。指示が worker_done の前に来た場合はその場で行い、worker_done の body に新 head を書く。worker_done の後に来た場合は司令塔からの follow-up dispatch として扱い、完了時に再度 worker_done を送る。
- **この spec ファイル（`.docs/plans/2026-09-15-overlay-motion.md`）は編集しない**。裁定や申告は PR 本文に書く（A と B の両ブランチに同一内容で入っており、片方を編集するとマージ時に add/add conflict になる）。

## 7. 制約（全 PR 共通）

- **指示と実態が矛盾したら止めて ask で報告する**（例: 表に書かれた class が担当ファイルに無い、`data-starting-style` が Base UI 側で付かない部品がある、期待値と computed style が食い違う、Playwright が使えない、レビュアーを起動できない）。
- 裁量の範囲: 表に無い class の並び順、コメント文言、report の表現、負の検査の一時ファイル名。段（duration / scale の選択）・曲線・記法・触るファイルの範囲は変えない。裁量で変えた内容は worker_done と PR 本文に申告する。
- 逆委任は受けない。環境制約で担当範囲を遂行できないときは ask で報告して判断を待つ。
- 想定所要時間: A / C は 90〜150 分、B / D は 60〜120 分、E は 120〜180 分（証跡 28 枚を含む）。その間 commit が無くても正常。同じマシンで別の worker が並走しているので、ビルドやテストが普段より遅いことがある。「無応答」と判断する前に、所要時間の目安（1.2 の値）を超えているかを確かめる。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。

---

## A. PR A: modal 系（dialog / alert-dialog / sheet / drawer）

ブランチ `naoto24kawa/overlay-motion-a`。証跡ディレクトリ `.docs/reviews/2026-09-15-overlay-motion-a/`。

| 部品 | ファイル | 置き換え | 実測対象 selector | 開閉操作 |
|---|---|---|---|---|
| dialog | `src/components/ui/dialog.tsx` | Backdrop（`bg-overlay` を持つ要素）: `duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0` → 2.1 の backdrop テンプレ。Popup（`data-slot="dialog-content"`）: `duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95` → 2.1 のテンプレで scale は open `lg`、close `lg` | `[data-slot="dialog-content"]` | preview は初期 open。閉じるボタンまたは Escape で閉じ、`data-ending-style` を観測。再度 trigger で開き `data-starting-style` を観測 |
| alert-dialog | `src/components/ui/alert-dialog.tsx` | dialog と同じ置き換え（Backdrop と Popup） | `[data-slot="alert-dialog-content"]` | dialog と同じ |
| sheet | `src/components/ui/sheet.tsx` | Backdrop: `transition-opacity duration-150` → `transition-opacity duration-slower ease-entrance`（starting / ending の `opacity-0` は既存のまま）。Popup: `transition duration-200 ease-in-out` → `transition-[opacity,translate] duration-slower ease-entrance`。side 別の `translate-*-10` は既存のまま | `[data-slot="sheet-content"]` | preview の操作方法は `src/previews/sheet.tsx` を読んで決める。閉じる→開くで両属性を観測 |
| drawer | `src/components/ui/drawer.tsx` | 生値を段へ写像するだけで構造は変えない: `duration-300` → `duration-slower`、`duration-200` → `duration-base`、`duration-450` → `duration-emphasis`、`duration-0` → `duration-instant`、`ease-out` → `ease-entrance`。variant 付き（`data-swiping:duration-0`、`data-ending-style:duration-300` 等）は variant を残して段だけ替える | `[data-slot="drawer-content"]` | sheet と同じ |

allowlist から削除する行: `src/components/ui/alert-dialog.tsx`、`src/components/ui/dialog.tsx`、`src/components/ui/drawer.tsx`（複数行）、`src/components/ui/sheet.tsx`。

期待値（4 節 5 項）: dialog / alert-dialog の popup は `transition-duration` `0.26s`、sheet / drawer の popup は `0.4s`。`transition-timing-function` はいずれも `cubic-bezier(0.16, 1, 0.3, 1)`。

## B. PR B: popover 系（popover / hover-card / tooltip）

ブランチ `naoto24kawa/overlay-motion-b`。証跡ディレクトリ `.docs/reviews/2026-09-15-overlay-motion-b/`。

| 部品 | ファイル | 置き換え | 実測対象 selector | 開閉操作 |
|---|---|---|---|---|
| popover | `src/components/ui/popover.tsx` | Popup: `duration-100`、`data-[side=…]:slide-in-from-…-2` 5 個、`data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95` → 2.1 のテンプレ（scale open `md`、close `sm`）。`origin-(--transform-origin)` は残す | `[data-slot="popover-content"]` | trigger click で開閉 |
| hover-card | `src/components/ui/hover-card.tsx` | popover と同じ置き換え | `[data-slot="hover-card-content"]` | trigger hover で開き、pointer を外して閉じる |
| tooltip | `src/components/ui/tooltip.tsx` | Popup: `data-[side=…]:slide-in-from-…-2` 5 個、`data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95`、`data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95` → `transition-[opacity,scale] duration-fast ease-entrance data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-sm) data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-micro data-instant:transition-none`。`origin-(--transform-origin)` は残す | `[data-slot="tooltip-content"]` | trigger hover で開き、pointer を外して閉じる。preview の selector は `preview-selectors.json` を正本にする |

allowlist から削除する行: `src/components/ui/popover.tsx`、`src/components/ui/hover-card.tsx`（tooltip は allowlist に無い）。

`data-instant:transition-none` の分岐: popover / hover-card では、通常の開く操作（trigger click / hover）の直後に popup 要素へ `data-instant` が付くかを 4 節 5 項で記録する。**付く場合はその部品では `data-instant:transition-none` を付けない**（付けると通常の開閉から transition が消える）。付かない場合はテンプレどおり付ける。どちらにしたかと観測値を PR 本文に書く。tooltip は Base UI の公式例に倣い無条件に付ける。

期待値（4 節 5 項）: popover / hover-card の popup は `transition-duration` `0.26s`、tooltip は `0.12s`。`transition-timing-function` はいずれも `cubic-bezier(0.16, 1, 0.3, 1)`。

## C. PR C: menu 系（dropdown-menu / context-menu / menubar / select / combobox / navigation-menu）

ブランチ `naoto24kawa/overlay-motion-c`。証跡ディレクトリ `.docs/reviews/2026-09-15-overlay-motion-c/`。

| 部品 | ファイル | 置き換え | 実測対象 selector | 開閉操作 |
|---|---|---|---|---|
| dropdown-menu | `src/components/ui/dropdown-menu.tsx` | Popup: popover と同じ置き換え（scale open `md`、close `sm`）。SubmenuPopup があれば同じ | `[data-slot="dropdown-menu-content"]` | trigger click |
| context-menu | `src/components/ui/context-menu.tsx` | 同上 | `[data-slot="context-menu-content"]` | trigger 要素で `contextmenu` イベント |
| menubar | `src/components/ui/menubar.tsx` | 同上（Popup 2 箇所） | `[data-slot="menubar-content"]` | menu trigger click |
| select | `src/components/ui/select.tsx` | 同上 | `[data-slot="select-content"]` | trigger click |
| combobox | `src/components/ui/combobox.tsx` | 同上 | `[data-slot="combobox-content"]` | input focus または trigger click |
| navigation-menu | `src/components/ui/navigation-menu.tsx` | 生値を段へ写像し、`animate-in / animate-out / fade-in-0 / fade-out-0 / zoom-in-95 / zoom-out-95 / slide-in-from-*-52` を `data-starting-style` / `data-ending-style` の transition へ置き換える: `duration-300` → `duration-slow`、`duration-150` → `duration-fast`、`ease-out` → `ease-entrance`。viewport の `data-[activation-direction=…]` 別 translate は既存構造を維持し、`slide-in-from-left-52` / `-right-52` は `data-starting-style:-translate-x-(--motion-distance-lg)` 相当へ。distance の段は lg | `[data-slot="navigation-menu-content"]` | trigger hover / click |

allowlist から削除する行: `src/components/ui/dropdown-menu.tsx`、`src/components/ui/context-menu.tsx`、`src/components/ui/menubar.tsx`、`src/components/ui/select.tsx`、`src/components/ui/combobox.tsx`、`src/components/ui/navigation-menu.tsx`。

期待値（4 節 5 項）: popup の `transition-duration` `0.26s`、`transition-timing-function` `cubic-bezier(0.16, 1, 0.3, 1)`。

## D. PR D: toast + disclosure（toast / accordion / collapsible）

ブランチ `naoto24kawa/overlay-motion-d`。証跡ディレクトリ `.docs/reviews/2026-09-15-overlay-motion-d/`。

| 部品 | ファイル | 置き換え | 実測対象 selector | 開閉操作 |
|---|---|---|---|---|
| toast | `src/components/ui/toast.tsx` | `[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]` → `transition-[transform,opacity,height,filter] duration-slower ease-entrance`（blur を transition させるため `filter` を含める）。`transition-opacity duration-250 ease-out` → `transition-opacity duration-slower ease-entrance`。stack 用の `[transform:…]` と swipe 別の ending transform は既存のまま。starting / ending に `blur-(--motion-blur-sm)` を足し、通常状態は `blur-none` | `[data-slot="toast"]`（無ければ `preview-selectors.json` の値） | preview の操作で toast を出し、閉じる |
| accordion | `src/components/ui/accordion.tsx` | Panel: `data-open:animate-accordion-down data-closed:animate-accordion-up` を削除し、`h-(--accordion-panel-height) data-starting-style:h-0 data-ending-style:h-0`（既存）に `transition-[height] duration-slow ease-entrance overflow-hidden` を足す | `[data-slot="accordion-content"]` | trigger click で開閉 |
| collapsible | `src/components/ui/collapsible.tsx` | Panel: `data-open:animate-accordion-down data-closed:animate-accordion-up` → `h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-slow ease-entrance data-starting-style:h-0 data-ending-style:h-0` | `[data-slot="collapsible-content"]` | trigger click で開閉 |

allowlist から削除する行: `src/components/ui/toast.tsx`（複数行）。accordion / collapsible は allowlist に無い。

期待値（4 節 5 項）: toast は `transition-duration` に `0.4s` を含む（複数プロパティなので `0.4s, 0.4s, 0.4s` の形）、accordion / collapsible の panel は `0.26s`。`transition-timing-function` は `cubic-bezier(0.16, 1, 0.3, 1)`。

## E. PR E: 仕上げ（非 overlay の生値、tw-animate-css の除去、`--ease-*: initial`）

ブランチ `naoto24kawa/overlay-motion-e`。証跡ディレクトリ `.docs/reviews/2026-09-15-overlay-motion-e/`（共有面 28 枚 + report。`evidence_scope: shared-token-migration`）。**A〜D がすべて main にマージされてから着手する**（司令塔が brief で main の SHA を渡す）。

1. 生値の置換: `src/components/ui/item.tsx` の `duration-100` → `duration-fast`。`src/components/ui/message-scroller.tsx` の `duration-200` → `duration-base`、`duration-400` → `duration-slower`、`ease-in` → `ease-standard`、`ease-out` → `ease-entrance`。`src/components/ui/sidebar.tsx`、`src/blocks/sidebar-07/components/nav-main.tsx`、`src/blocks/dashboard-01/components/nav-main.tsx` の `duration-200` → `duration-base`。
2. `src/components/ui/input-otp.tsx` の `animate-caret-blink` はそのまま使い、定義を `src/styles/global.css` の `@theme inline` に移す: `--animate-caret-blink: caret-blink 1.25s ease-out infinite;` と `@keyframes caret-blink { 0%, 70%, 100% { opacity: 1; } 20%, 50% { opacity: 0; } }`（tw-animate-css の定義と同じ値。design system に caret の段は無いため、この 1.25s は global.css にコメント付きで置く）。`input-otp.tsx` の `duration-1000` は `duration-emphasis` へ。
3. `src/styles/global.css` から `@import "tw-animate-css";` を削除する。`npm uninstall tw-animate-css` で `package.json` と lockfile から削除する（他の版を動かさない）。`registry.json` の各 item の `dependencies` から `"tw-animate-css"` を削除する（90 箇所。手で消さず `node -e` または `sed` で機械的に消し、`git diff --stat registry.json` を報告する）。`npm run registry:build` で `public/r/*.json` を再生成する。
4. `global.css` の `@theme inline` に `--ease-*: initial;` を、既存の `--ease-standard: var(--curve-standard);` の**直前**に足す（Tailwind 既定の `ease-in / ease-out / ease-in-out` の utility を消す。`ease-linear` は静的 utility なので残る）。
5. `MOTION_LITERAL_ALLOWLIST` を空の `Map([])` にする（機構は残す）。
6. §E の追加検証: `grep -rn 'tw-animate' src package.json registry.json public/r` が 0 件。`grep -rnE '\b(duration|delay)-[0-9]+\b|\bease-(in|out|in-out)\b|animate-in|animate-out' src --include='*.tsx' --include='*.astro'` が 0 件（陽性対照は origin/main の `item.tsx` で 1 件以上）。`npm run build:site` 後の CSS に `.ease-out{` が 0 件、`.ease-linear{` が 1 件以上、`.animate-caret-blink{` が 1 件以上。`npm run build:lib` exit 0。`node scripts/check-distribution.mjs` exit 0。
7. 共有面証跡 28 枚 + report を撮る（`global.css` 変更のため）。

期待値（4 節 5 項）: `/preview/input-otp/` の caret 要素の `animation-name` が `caret-blink`。`/preview/item/` の item の `transition-duration` が `0.12s`。
