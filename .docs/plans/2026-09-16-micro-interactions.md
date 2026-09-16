# 既存部品の状態遷移とマイクロインタラクション（issue #67、サブプロジェクト 3/4）

司令塔が 2026-09-16 に作成した委任仕様。PR 3-0 / 3-1 / 3-2 の 3 本に分け、3-0 のマージ後に 3-1 と 3-2 を並列で進める。各 PR の worker はこの spec の共通節（§1〜§7）と担当節（§A〜§C）を literal に実行する。

## 1. 背景（司令塔が実測済み。再調査不要）

- issue #58（PR #59）で `duration-<段>` / `ease-<名前>` utility、`--motion-distance/scale/blur-*`、sensor `motion-literal` が入り、issue #60（PR #61〜#65）で overlay 16 部品が Base UI の `data-starting-style` / `data-ending-style` 契約へ移り、tw-animate-css は除去済み、`--ease-*: initial` により Tailwind 既定の `ease-in / ease-out / ease-in-out` は utility として存在しない。`MOTION_LITERAL_ALLOWLIST` は空。#60 の spec 誤記と裁定は `.docs/plans/2026-09-15-overlay-motion.md` §8 にある。
- `src/styles/design-system/tokens.css` に `--state-transition`（`background / border-color / color / box-shadow` を `var(--duration-fast) var(--ease-standard)`）が定義済みだが、`src/` に利用箇所は無い。部品は `transition-all`（Tailwind 既定の `--default-transition-duration` = `--duration-fast`、`--default-transition-timing-function` = `--ease-standard`）で代用している。
- `src/styles/global.css` の `@utility` は `@utility state-hover-overlay { … }` の形式で先頭付近に並び、`@utility duration-emphasis { … }` が最後。`@theme inline` の中に `--animate-caret-blink: caret-blink 1.25s var(--curve-entrance) infinite;` と `@keyframes caret-blink { … }` がある（`--ease-bounce-strong: var(--curve-bounce-strong);` の直後）。Tailwind は `@theme inline` の `--animate-<名前>` から `animate-<名前>` utility を生成する。
- `global.css` の `@media (prefers-reduced-motion: reduce)` は `animation-duration` / `animation-iteration-count` / `transition-duration` を一括で潰す。部品側に reduced-motion の分岐は書かない。
- sensor `scripts/check-standards.mjs` の `motion-literal` は `.tsx` / `.astro` / `.css` を走査し、`duration-<数値>` / `delay-<数値>`、`ease-in` / `ease-out` / `ease-in-out`（語境界）、`[transition:…]` / `[animation:…]` 内の生 `ms` / `cubic-bezier(` を検知する。`@theme` の `--animate-*` 値に書く `calc(var(--duration-micro) * 4)` と `var(--curve-standard)` は検知対象外。
- Base UI の data 属性（`node_modules/@base-ui/react/*/…DataAttributes.d.ts` で確認）: Checkbox.Indicator / Radio.Indicator は `data-starting-style` / `data-ending-style` を出す。Switch.Thumb は `data-checked` / `data-unchecked`。Tabs.Indicator は `span` を描画し `--active-tab-left / top / right / bottom / width / height`（px）を style に出し、`data-orientation` / `data-activation-direction` を持つ。layout が確定するまで `hidden` 属性が付き、`renderBeforeHydration` prop（既定 false）で SSR 時にインラインスクリプトで位置を確定する。NavigationMenu.Icon は `data-popup-open`（open かつ active の item で付く）だけを出す。
- 現状の class（origin/main `e348f4d`）:
  - `transition-all` は `button.tsx` 1、`badge.tsx` 1、`toggle.tsx` 1、`tabs.tsx` 1（Trigger）、`accordion.tsx` 1（Trigger）、`input-otp.tsx` 1（Slot）、`navigation-menu.tsx` 2（Trigger 54 行付近、Link 130 行付近）、`progress.tsx` 1（Indicator）、`switch.tsx` 1（Root）。`sidebar.tsx` 1（rail、`ease-linear` と組）は対象外。
  - `checkbox.tsx`: Root に `transition-colors`、Indicator に `transition-none`（初回コミット由来）。`radio-group.tsx`: transition 指定なし（Root は `border border-input bg-card`、Indicator は `flex size-4 items-center justify-center` の中に `size-2` の丸）。
  - `switch.tsx` Thumb: `transition-transform` のみ。translate は `translate-x-[calc(100%-2px)]` / `translate-x-0`（Tailwind v4 の `translate-x-*` は `translate` プロパティで、`transition-transform` は `transform, translate, scale, rotate` を含む）。
  - `tabs.tsx`（74 行）: `TabsList`（cva、variant `default` = `bg-muted`、`line` = `gap-1 bg-transparent`、`data-variant` を出す、`relative` 無し）、`TabsTrigger`（`relative`、`data-active:bg-card`、default variant の `data-active:shadow-sm` 系、line variant は `after:` 擬似要素の下線 `after:opacity-0` → `group-data-[variant=line]/tabs-list:data-active:after:opacity-100`）、`TabsContent`。export は `Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants`。orientation の分岐は `group-data-horizontal/tabs:` / `group-data-vertical/tabs:` で書いており、Tailwind はこれを `:where([data-orientation=horizontal])` に展開する（生成 CSS で確認済み。Base UI Tabs root は `data-orientation="horizontal"` を出す）。
  - `badge.tsx`: `useRender` で `state: { slot: "badge", variant }` を渡し、build 出力に `data-slot="badge" data-variant="default"` が出る。cva base に `transition-all`。
  - `progress.tsx` Indicator: Base UI が `style` に `width: <n>%` と `insetInlineStart: 0` を書く。class は `h-full bg-primary transition-all`。
  - `field.tsx`: `Field` は plain `div`（`role="group"`、`data-slot="field"`）で cva base に `data-[invalid=true]:text-destructive`。animation 指定なし。`src/previews/field.tsx` に `<Field data-invalid="true">` の例がある。
  - `avatar.tsx` `AvatarGroup`: `group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background`。`AvatarGroupCount` も子として並ぶ。`src/previews/avatar.tsx`（20 行）に AvatarGroup の例は無い。
  - `drawer.tsx` Popup: `… transition-[transform,height,opacity,filter] duration-emphasis ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform …`（1 箇所）。
  - `navigation-menu.tsx` `NavigationMenuIndicator`（Base UI Icon、`data-slot="navigation-menu-indicator"`、class `top-full z-1 flex h-1.5 items-end justify-center overflow-hidden`、中に `relative top-1 h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md` の div）。preview では `NavigationMenuTrigger` の子として置かれ、常時表示。
- 証跡: `scripts/check-evidence.mjs` は `src/styles/global.css` / `tokens.css` の変更で `evidence_scope: shared-token-migration` の report と 14 subject（`disabled-controls / alert-dialog / attachment / catalog / menubar / select / button / bubble / dialog / drawer / badge / alert / sheet / tabs`）× light/dark の 28 枚を **report と同じ commit で** 要求する。部品ごとの証跡は `<日付>-<component 名>-preview.md` と同名の `-preview-light.jpg` / `-preview-dark.jpg` を **同じ commit で** 追加したものを、ファイル名の component 名で対応付ける。同じ画像を共有面 report と部品 report の両方が使ってよい（どちらも「report の追加 commit に含まれる画像」を見る）。`.docs/plans/` は監視対象外。block（`src/blocks/*`）も部品と同じ扱いで `<日付>-<block 名>-preview.md` を要求する。
- preview selector（`preview-selectors.json`）: `tabs` = `[data-slot="tabs"]`、`badge` = `[data-slot="badge"]`、`button` = `[data-slot="button"]`、`field` / `switch` / `checkbox` / `radio-group` / `progress` / `toggle` / `accordion` / `input-otp` は `[data-slot="<名前>-preview"]`、`avatar` = `[data-slot="avatar-preview"]`、`drawer` = `[data-slot="drawer-content"]`、`navigation-menu` = `[data-slot="navigation-menu-content"]`。
- 期待値の換算: `duration-fast` = `0.12s`、`duration-base` = `0.18s`、`duration-slow` = `0.26s`、`duration-emphasis` = `0.5s`、`calc(var(--duration-micro) * 4)` = `0.32s`。`ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`、`ease-entrance` = `cubic-bezier(0.16, 1, 0.3, 1)`、`ease-bounce` = `cubic-bezier(0.34, 1.36, 0.64, 1)`、`ease-bounce-strong` = `cubic-bezier(0.34, 3.85, 0.64, 1)`。

## 2. 実施内容（literal、全 PR 共通の記法）

### 2.1 状態遷移

`transition-all` を語単位で `transition-state` に置き換える（§A〜§C の表にある要素だけ。他の class は動かさない）。`transition-state` は §A で `global.css` に足す utility で、`transition: var(--state-transition)` を書く。段・曲線の utility は併記しない（`--state-transition` が持つ）。

### 2.2 一回性の演出

- shake: `global.css` の `--animate-shake`（§A）を `animate-shake` utility として使う。
- appear: keyframes を使わず Tailwind v4 の `starting:` variant（`@starting-style`）と transition で書く。

### 2.3 触らないもの

- `src/styles/design-system/design-tokens.html` / `tokens.css`（新トークンは足さない）。
- DOM 構造・既存の export 名・props の型（§B の `TabsIndicator` / `appear` の追加を除く）。
- 担当外の部品と block、既存の証跡ディレクトリ、`scripts/`、`registry.json`。
- `sidebar.tsx` の rail（`transition-all ease-linear`）、`accordion.tsx` / `collapsible.tsx` の Panel（height transition）、Tabs Panel。

## 3. スコープ外（全 PR 共通）

- 新トークン・新 curve の追加。Skeleton の reveal、InputGroup の clear、Spinner。Tabs Panel の cross-fade。サブプロジェクト 4。
- TabsIndicator の色の変更（現行の foreground / card に留める。黄アクセントの用途は別 issue）。

## 4. 検証（rubric、全 PR 共通）。結果は worker_done の body に実測値（コマンドと exit code）で含める

各コマンドは単独で実行し、個々の exit code を報告する（`&&` / `;` / pipe で連結しない）。

1. `node scripts/check-standards.mjs` が exit 0（`motion-literal` 0 件）。
2. 負の検査: 次の表の検索式を担当ファイルに対して実行し、「変更後」の件数を報告する。陽性対照として同じコマンドを origin/main の同ファイル（`git show origin/main:<ファイル>` を一時ファイルへ書き出したもの）に対して実行し、「main」の件数と一致することを確認してから一時ファイルを削除する。一致しなければ止めて ask。表に無いファイルと検索式の組合せは N/A（#60 spec §8.2 の裁定）。

   | PR | ファイル | 検索式 | main | 変更後 |
   |---|---|---|---:|---:|
   | 3-0 | `src/components/ui/drawer.tsx` | `grep -c 'cubic-bezier'` | 1 | 0 |
   | 3-0 | `src/components/ui/navigation-menu.tsx` | `grep -c 'transition-all'` | 2 | 0 |
   | 3-1 | `button.tsx` / `badge.tsx` / `toggle.tsx` / `tabs.tsx` / `accordion.tsx` / `input-otp.tsx` / `progress.tsx`（各 `src/components/ui/`） | `grep -c 'transition-all'` | 各 1 | 各 0 |
   | 3-2 | `src/components/ui/switch.tsx` | `grep -c 'transition-all'` | 1 | 0 |
   | 3-2 | `src/components/ui/checkbox.tsx` | `grep -c 'transition-none'` | 1 | 0 |
   | 3-2 | `src/components/ui/checkbox.tsx` | `grep -c 'transition-colors'` | 1 | 0 |
3. `npm run lint` が exit 0。
4. `npm run build:site` が exit 0。`ls dist/_astro/global.*.css` で得た CSS に対して次を実測し、出力を報告に写す:

   ```bash
   grep -o '\.transition-state{[^}]*}' <css>
   grep -c '@starting-style' <css>
   grep -o '\.animate-shake{[^}]*}' <css>
   grep -c '@keyframes shake' <css>
   ```

   §A では 1 が 1 以上。3・4 は 3-0 の時点では `animate-shake` を使う部品が無く Tailwind が keyframes を出力しないため 0 でよく、代わりに `grep -c '@keyframes shake' src/styles/global.css` と `grep -c -- '--animate-shake' src/styles/global.css` が各 1 であることを確認する。§B では 1 と 2 が 1 以上。§C では 1・3・4 が 1 以上。担当外の値は報告だけする。
5. Playwright（headless Chromium、viewport 1440×900、`npm run build:site` の成果物を `npx astro preview` で配信、空きポートを明示）で担当部品の preview を light / dark で開き、次を実測して report に書く:
   - console error 0 件（favicon 404 は別記）、`preview-selectors.json` の selector が 1 件以上。
   - 状態遷移（2.1）の要素: `getComputedStyle` の `transition-property` が `background, border-color, color, box-shadow` 相当（`all` を含まない）で、`transition-duration` が `0.12s` 系、`transition-timing-function` が `cubic-bezier(0.2, 0, 0, 1)` 系であること（複数プロパティなので同じ値の列で返る。ブラウザが `background` を `background-color` 等へ展開して返す場合はそのまま記録する）。
   - 一回性の演出と移動: 各節の表の「観測」列に書いた操作を行い、`element.getAnimations()`（transition は `CSSTransition.transitionProperty`、animation は `CSSAnimation.animationName`）と `effect.getTiming()` の `duration` / `easing` を記録する。screenshot では測れないので、これを必須の証拠にする。starting-style 系は 1 フレームしか付かないため best-effort、ending-style 系は 16ms ポーリングで「付いてから消える」までを必須で観測する（#60 spec §4.5 と同じ）。
   - 担当部品ごとに light / dark を撮影し、`.docs/reviews/<日付>-micro-interactions-<PR 名>/` に新規保存する（既存証跡を上書きしない）。report は部品ごとに `<日付>-<component 名>-preview.md`、画像は `<日付>-<component 名>-preview-light.jpg` / `-dark.jpg`。`verified_impl_sha` は実装 commit を指す。ファイル構成は `.docs/reviews/2026-09-15-overlay-motion-a/` を見本にする。
6. `node --test scripts/check-standards.test.mjs` が exit 0。全件テスト（`node --test "scripts/*.test.mjs"`）と typecheck はローカルで実行せず PR CI の `Lint, typecheck, test & build` で代替する。
7. `node scripts/check-evidence.mjs` が exit 0（約 12 分）。**report と画像を書いた直後、証跡 commit を作る前に 1 回実行し**、形式・関連付けの誤りをその時点で直す。証跡 commit 後にもう 1 回実行して最終結果を報告する。証跡（report と画像すべて）は 1 つの commit にまとめる。
8. `git diff --stat origin/main` の変更ファイルが「担当節の一覧 + 新規証跡」だけであること。司令塔が入れた spec 追加 commit（`.docs/plans/2026-09-16-micro-interactions.md`）は 3-0 のブランチにだけ含まれ、明記した例外とする。
9. 実測の範囲を報告に書く: 各項目が「存在」「実行」「動作（computed style / getAnimations / 属性遷移）」のどこまでを測ったか。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を 1 レンズ 1 呼び出しの fresh context で逐次起動する（`orca orchestration worker-start` は worker から使えない。#60 spec §8.3）。`lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3 に従う: 最大 3 ラウンド。3 ラウンドで残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」: 終了宣言時に 4 節 1〜4 を再実行して exit code を PR 本文へ書く。
- レビューで「段を変えるべき」「トークンを足すべき」「色を変えるべき」等、§2 / §A〜§C で固定した設計の変更を求められても採らない（採らない理由を PR 本文へ書く）。設計変更が必要と判断したら ask で司令塔へ。

## 6. 完了条件（全 PR 共通）

- 担当 PR のブランチ（brief で指定）で PR を作成する（マージしない）。commit は「実装」と「証跡」の 2 つ以上に分ける（§A は「共有面（global.css）」「部品」「証跡」の 3 つ。証跡 report の `verified_impl_sha` / `targeted_dynamic_sha` は共有面 commit より後の部品 commit を指す）。
- PR 本文は日本語で、次を含む: 変更概要、担当節の表に対する部品ごとの対応表、4 節の各項目の実測結果、レビュー記録、受容した flag と risk-registry の ID、実装担当識別子、`Part of #67`（PR 3-2 だけ `Closes #67`）。
- PR 本文はファイルに書いて `--body-file` で渡す。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。
- **base 追随**: 司令塔から「origin/main が進んだので追随せよ」と指示が来たら `git merge origin/main` で追随し（rebase しない）、4 節 1・3・4 を再実行して結果を PR 本文に追記し、push する。
- **この spec ファイル（`.docs/plans/2026-09-16-micro-interactions.md`）は編集しない**。裁定や申告は PR 本文に書く。

## 7. 制約（全 PR 共通）

- **指示と実態が矛盾したら止めて ask で報告する**（例: 表に書かれた class が担当ファイルに無い、件数が §1 と違う、Base UI が期待した属性を出さない、Tailwind が variant を生成しない、期待値と computed style が食い違う、Playwright が使えない、レビュアーを起動できない）。
- 裁量の範囲: 表に無い class の並び順、コメント文言、report の表現、負の検査の一時ファイル名、preview に足す例の文言。段・曲線・記法・触るファイルの範囲・色は変えない。裁量で変えた内容は worker_done と PR 本文に申告する。
- 逆委任は受けない。環境制約で担当範囲を遂行できないときは ask で報告して判断を待つ。
- 想定所要時間: 3-0 は 120〜180 分（証跡 28 枚 + 2 部品を含む）、3-1 は 120〜180 分、3-2 は 90〜150 分。その間 commit が無くても正常。3-1 と 3-2 は同じマシンで並走する。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。

---

## A. PR 3-0: 共有面 + 残課題（global.css / drawer / navigation-menu）

ブランチ `naoto24kawa/micro-interactions-0`。証跡ディレクトリ `.docs/reviews/2026-09-16-micro-interactions-0/`（共有面 28 枚 + `report.md`（`evidence_scope: shared-token-migration`、`verified_impl_sha` / `targeted_dynamic_sha` は部品 commit）+ drawer / navigation-menu の部品別 report。drawer の画像は共有面の 28 枚に含まれるので同じ 2 枚を部品 report からも使う。navigation-menu は 2 枚を追加する。合計 30 枚）。

1. `src/styles/global.css` の `@utility duration-emphasis { … }` ブロックの直後に次を足す:

   ```css
   /* 状態色の遷移。design system の --state-transition（fast + standard）をそのまま流す。 */
   @utility transition-state {
     transition: var(--state-transition);
   }
   ```

2. `src/styles/global.css` の `@theme inline` 内、`@keyframes caret-blink { … }` ブロックの直後に次を足す:

   ```css
   /* Field の invalid shake。micro × 4 セグメント、振幅は --motion-distance-sm。 */
   --animate-shake: shake calc(var(--duration-micro) * 4) var(--curve-standard);
   @keyframes shake {
     0%, 100% { translate: 0 0; }
     25%, 75% { translate: calc(-1 * var(--motion-distance-sm)) 0; }
     50% { translate: var(--motion-distance-sm) 0; }
   }
   ```

3. `src/components/ui/drawer.tsx` Popup: `ease-[cubic-bezier(0.22,1,0.36,1)]` → `ease-entrance`（他の class は動かさない）。
4. `src/components/ui/navigation-menu.tsx`: Trigger と Link の `transition-all` → `transition-state`（2 箇所）。`NavigationMenuIndicator` の class を `top-full z-1 flex h-1.5 items-end justify-center overflow-hidden opacity-0 transition-opacity duration-slow ease-entrance data-popup-open:opacity-100` にする（内側の div は動かさない）。

| 部品 | 実測対象 selector | 観測 |
|---|---|---|
| drawer | `[data-slot="drawer-popup"]` | preview の操作で開き、Popup の `transition-timing-function` が `cubic-bezier(0.16, 1, 0.3, 1)`、`transition-duration` に `0.5s` を含む |
| navigation-menu | `[data-slot="navigation-menu-indicator"]` | 閉じた状態で `opacity` = 0、trigger を開いて `data-popup-open` が付き `opacity` = 1 へ遷移（`getAnimations()` に `opacity` の transition、duration 260ms、easing `cubic-bezier(0.16, 1, 0.3, 1)`）。閉じると属性が外れ 0 へ戻る |

共有面 28 枚の撮り方は `.docs/reviews/2026-09-15-overlay-motion-e/report.md` の手順を踏襲する（catalog / disabled-controls のタイル撮影を含む）。

## B. PR 3-1: 状態遷移 + Tabs + Badge

ブランチ `naoto24kawa/micro-interactions-1`。証跡ディレクトリ `.docs/reviews/2026-09-16-micro-interactions-1/`。**3-0 が main にマージされてから着手する**（司令塔が brief で main の SHA を渡す）。

| 部品 | ファイル | 置き換え | 実測対象 selector | 観測 |
|---|---|---|---|---|
| button | `src/components/ui/button.tsx` | cva base の `transition-all` → `transition-state` | `[data-slot="button"]`（先頭） | computed の transition-property / duration / timing-function |
| badge | `src/components/ui/badge.tsx` | cva base の `transition-all` → `transition-state`。`appear` prop を追加（下記） | `[data-slot="badge"]`（先頭）と `[data-appear]` | 先頭 badge は computed。`[data-appear]` は読込直後（navigation 完了から 100ms 以内）に `getAnimations()` で `opacity` / `scale` の transition（duration 500ms、easing `cubic-bezier(0.34, 1.36, 0.64, 1)`）を best-effort で観測し、取れなければ生成 CSS の `@starting-style` ルールと computed の transition-property を証拠にする |
| toggle | `src/components/ui/toggle.tsx` | cva base の `transition-all` → `transition-state` | `[data-slot="toggle"]`（先頭） | computed |
| accordion | `src/components/ui/accordion.tsx` | Trigger の `transition-all` → `transition-state` | `[data-slot="accordion-trigger"]`（先頭） | computed |
| input-otp | `src/components/ui/input-otp.tsx` | Slot の `transition-all` → `transition-state` | `[data-slot="input-otp-slot"]`（先頭） | computed |
| progress | `src/components/ui/progress.tsx` | Indicator の `transition-all` → `transition-[width] duration-slow ease-entrance` | `[data-slot="progress-indicator"]`（先頭） | computed の transition-property = `width`、duration `0.26s`、timing `cubic-bezier(0.16, 1, 0.3, 1)` |
| tabs | `src/components/ui/tabs.tsx`、`src/previews/tabs.tsx`、`src/blocks/dashboard-table/components/dashboard-table.tsx` | Trigger の `transition-all` → `transition-state`。`TabsIndicator` part を追加（下記）。preview と block に `<TabsIndicator />` を `TabsList` の最後の子として足す。preview には `variant="line"` の Tabs をもう 1 組足す | `[data-slot="tabs-indicator"]` | 2 番目の trigger を click し、`getAnimations()` に `left` または `width` の transition（duration 260ms、easing `cubic-bezier(0.16, 1, 0.3, 1)`）、遷移後の `--active-tab-left` が 2 番目の trigger の offsetLeft と一致。screenshot に indicator が写っている（`hidden` が外れている）こと |

`appear` の追加（badge.tsx）: `BadgeProps` に `appear?: boolean` を足し、`Badge` の引数で受けて `useRender` の `state` を `{ slot: "badge", variant, appear: appear || undefined }` にする（Base UI の `getStateAttributesProps` は state の `true` を `data-appear=""` にし、`false` / `undefined` は属性を出さない。`mergeProps` は変えない）。cva base に `data-appear:transition-[opacity,scale] data-appear:duration-emphasis data-appear:ease-bounce data-appear:starting:opacity-0 data-appear:starting:scale-75` を足す（`--motion-scale-*` は overlay 用の段で、20px の badge では 1px 未満になるため標準段 `scale-75` を使う。arbitrary value ではない）。`src/previews/badge.tsx` に `<Badge appear>新着</Badge>` を 1 つ足す。build 後の `dist/preview/badge/index.html` で、その badge に `data-appear=""` が付き、他の badge に `data-appear` 属性が無いことを `grep -c 'data-appear'`（= 1）で確認する。

`TabsIndicator` の追加（tabs.tsx）:

- `TabsList` の cva base に `relative isolate` を足す。
- `TabsTrigger` に次を足す（Indicator を置いた List で trigger 側の active 表示を消す）: `group-has-data-[slot=tabs-indicator]/tabs-list:data-active:bg-transparent group-has-data-[slot=tabs-indicator]/tabs-list:data-active:shadow-none dark:group-has-data-[slot=tabs-indicator]/tabs-list:data-active:border-transparent group-has-data-[slot=tabs-indicator]/tabs-list:after:hidden`。
- 新 part:

  ```tsx
  export type TabsIndicatorProps = TabsPrimitive.Indicator.Props;

  function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
    return (
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        renderBeforeHydration
        className={cn(
          "absolute -z-10 transition-[left,top,width,height] duration-slow ease-entrance",
          "group-data-[variant=default]/tabs-list:top-(--active-tab-top) group-data-[variant=default]/tabs-list:left-(--active-tab-left) group-data-[variant=default]/tabs-list:h-(--active-tab-height) group-data-[variant=default]/tabs-list:w-(--active-tab-width) group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:bg-card group-data-[variant=default]/tabs-list:shadow-sm dark:group-data-[variant=default]/tabs-list:border dark:group-data-[variant=default]/tabs-list:border-input",
          "group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:left-(--active-tab-left) group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:w-(--active-tab-width) group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:-bottom-0.5 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:h-0.5 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:top-(--active-tab-top) group-data-[variant=line]/tabs-list:group-data-vertical/tabs:h-(--active-tab-height) group-data-[variant=line]/tabs-list:group-data-vertical/tabs:-right-0.25 group-data-[variant=line]/tabs-list:group-data-vertical/tabs:w-0.5",
          className,
        )}
        {...props}
      />
    );
  }
  ```

  line variant の位置は List 基準で、旧 `after:` 下線（trigger 基準で `-bottom-1.25` / `-right-1`）と同じ画面位置になるよう List の `p-0.75` ぶんを差し引いた値（`-bottom-0.5` / `-right-0.25`）にしている。`group-data-horizontal/tabs:` は Tailwind が `[data-orientation=horizontal]` に展開する（生成 CSS で確認済み）。
  export に `TabsIndicator` と `TabsIndicatorProps` を足し、`src/index.ts` のバレルにも同じ名前で足す（既存の Tabs の export 行の並びに合わせる）。`renderBeforeHydration` は静的 HTML で indicator が `hidden` のまま出るのを防ぐためで、preview の screenshot に indicator が写ることで確認する。写らなければ止めて ask。
- `dashboard-table` block を変更するので `<日付>-dashboard-table-preview.md` と light / dark の 2 枚も撮る。

期待値（4 節 5 項）: 状態遷移の要素は `transition-duration` `0.12s`、`transition-timing-function` `cubic-bezier(0.2, 0, 0, 1)`。

## C. PR 3-2: 選択系 + 一回性

ブランチ `naoto24kawa/micro-interactions-2`。証跡ディレクトリ `.docs/reviews/2026-09-16-micro-interactions-2/`。**3-0 が main にマージされてから着手する**。

| 部品 | ファイル | 置き換え | 実測対象 selector | 観測 |
|---|---|---|---|---|
| switch | `src/components/ui/switch.tsx` | Root の `transition-all` → `transition-state`。Thumb の `transition-transform` → `transition-transform duration-base ease-bounce` | `[data-slot="switch-thumb"]`（先頭） | click で `getAnimations()` に `translate` の transition（duration 180ms、easing `cubic-bezier(0.34, 1.36, 0.64, 1)`） |
| checkbox | `src/components/ui/checkbox.tsx` | Root の `transition-colors` → `transition-state`。Indicator の `transition-none` → `transition-[opacity,scale] duration-fast ease-entrance data-starting-style:opacity-0 data-starting-style:scale-50 data-ending-style:opacity-0 data-ending-style:scale-50` | `[data-slot="checkbox-indicator"]` | 未チェックの checkbox を click して Indicator が現れ（`data-starting-style` は best-effort）、再度 click して `data-ending-style` が付いてから消えるまでを 16ms ポーリングで観測。computed は duration `0.12s`、timing `cubic-bezier(0.16, 1, 0.3, 1)` |
| radio-group | `src/components/ui/radio-group.tsx` | Root（`RadioPrimitive.Root`）の class に `transition-state` を足す。Indicator（`RadioPrimitive.Indicator`）の class に `transition-[opacity,scale] duration-fast ease-entrance data-starting-style:opacity-0 data-starting-style:scale-50 data-ending-style:opacity-0 data-ending-style:scale-50` を足す | `[data-slot="radio-group-indicator"]` | 別の radio を click して、前の Indicator の `data-ending-style` → 消失を観測、新しい Indicator の computed を記録 |
| field | `src/components/ui/field.tsx` | `fieldVariants` の cva base に `data-[invalid=true]:animate-shake` を足す | `[data-slot="field"][data-invalid="true"]` | 読込直後に `getAnimations()` で `animationName` = `shake`、duration 320ms、easing `cubic-bezier(0.2, 0, 0, 1)`（読込から 320ms を過ぎると取れないので navigation 完了直後に取る。取れなければ `computed animation-name` = `shake` と `animation-duration` = `0.32s` を証拠にする） |
| avatar | `src/components/ui/avatar.tsx`、`src/previews/avatar.tsx` | `AvatarGroup` の class を `group/avatar-group flex -space-x-2 hover:-space-x-0.5 *:transition-[margin] *:duration-base *:ease-bounce-strong hover:*:ease-standard *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background` にする。preview に `AvatarGroup`（Avatar 3 つ + `AvatarGroupCount`）の例を足す | `[data-slot="avatar-group"]` | hover で子 avatar の `getAnimations()` に `margin-inline-start` または `margin-inline-end` の transition（duration 180ms、easing `cubic-bezier(0.2, 0, 0, 1)`）、pointer を外して easing `cubic-bezier(0.34, 3.85, 0.64, 1)` の transition。生成 CSS（minify 済みで空白なし）から `grep -o '[^{]*hover[^{]*ease-standard[^{]*{' <css>` で selector を取り出して report に写し、`:hover>*` の形（group の hover が子へ効く）であることを確認する。逆（`>*:hover`）になっていれば止めて ask |

期待値（4 節 5 項）: 状態遷移の要素は `transition-duration` `0.12s`、`transition-timing-function` `cubic-bezier(0.2, 0, 0, 1)`。
