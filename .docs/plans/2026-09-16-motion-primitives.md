# モーション用の新規プリミティブ 7 種（issue #72、サブプロジェクト 4/4）

司令塔が 2026-09-16 に作成した委任仕様。PR 4-0（受け皿 = scripts）→ 4-1 / 4-2（部品、並列）の 3 本に分ける。各 PR の worker はこの spec の共通節（§1〜§7）と担当節（§A〜§C）を literal に実行する。

## 1. 背景（司令塔が実測済み。再調査不要）

- issue #58 / #60 / #67 で motion トークン層、overlay の開閉統一、既存部品のマイクロインタラクションが main に入っている。用途表（`src/styles/design-system/design-tokens.html` Motion 節）の割り当て: icon swap = `duration-slow`、success check / text reveal / badge appear = `duration-emphasis`、text swap = `duration-fast`、stagger = `--duration-stagger`（40ms）、位置・サイズの微調整 = `duration-base`、skeleton から content への reveal = `duration-slower`。曲線は `ease-standard`（状態色・位置）/ `ease-entrance`（出現）/ `ease-bounce`。幾何は `--motion-distance-sm/md/lg`（4 / 8 / 12px）、`--motion-scale-lg/md/sm`（0.96 / 0.97 / 0.98）。#67 で `transition-state` utility（`--state-transition`）と `animate-shake`、`animate-caret-blink`（input-otp が `h-4 w-px bg-foreground animate-caret-blink` で使用）が `global.css` にある。
- 候補 7 種（IconSwap / SuccessCheck / TextSwap / TextReveal / ThinkingStates / AnimatedNumber / StreamingText）は `src/` に存在しない。
- **自作 component の受け皿が無い。** `scripts/check-completeness.mjs` の `componentProblems`（516 行付近）は `provenance.components[name]` に `PROVENANCE_SPEC`（80 行付近: `sourceUrl` / `upstreamPath` / `upstreamPathSha` / `registry` / `registryUrl` / `registryContentSha256` / `generatedContentSha256` / `addTarget` / `shadcnCliVersion` / `fetchedAt` / `license` / `modified`）を要求し、`origin` は見ていない。block は `BLOCK_ORIGINS`（119 行付近）で `"shadcn/ui registry"` と `"elchika original"` を分岐し、`"elchika original"` は `ORIGINAL_BLOCK_PROVENANCE_SPEC`（`license` / `modified`）+ 上流由来キーの禁止（`forbidden`）で fail-closed。component の `generatedContentSha256` はディスク実体と照合していない（照合は block の 407 行付近だけ）。
- `provenance.json` の `origin` は component 62 件すべて `"shadcn/ui registry"`、block は `"shadcn/ui registry"` と `"elchika original"`（dashboard-table）。
- `scripts/add-component.mjs`: `parseArgs`（65 行付近、`--modified` / `--force` / `--resync` を各 1 回だけ受ける）、`runAddComponent`（1064 行付近、`--resync` なら `resyncBlockHashes` へ直行し、それ以外は上流 registry を fetch して shadcn CLI を実行）、`buildRegistryItem`（752 行付近、`dependencies` = 上流宣言 ∪ `externalImports(source)` ∪ `SHARED_DEPENDENCIES`、`files` = 配布ファイル + `SHARED_REGISTRY_FILES`、`title` は kebab を Title Case、`description` は `${name} component.`）、`registryItemImports(source)`（557 行付近、`@/components/ui/<x>` / `@/hooks/<x>` の import を拾う）、`resyncBlockHashes`（1035 行付近、block 専用）、`shouldSkipRecorded`、`ensureClean`。`externalImports` / `importedModuleSpecifiers` / `dependencyName` は `scripts/import-analysis.mjs`、`localRegistryDependencyName` は `scripts/registry-dependency.mjs`、`SHARED_DEPENDENCIES`（`["shadcn"]`）/ `SHARED_REGISTRY_FILES` は `scripts/registry-policy.mjs`。
- registry item の `cssVars` は `npm run registry:tokens`（`scripts/sync-registry-tokens.mjs`）が全 item に流し込む。scaffold は `cssVars` を書かない。
- 自作 block の前例 dashboard-table（commit 10574aa）は registry.json / provenance.json / preview-selectors.json / `src/catalog/component-categories.mjs` / `src/pages/preview/<name>.astro` と `<name>-dark.astro` / `src/previews/<name>.tsx` を手書きしている。preview の astro は `src/pages/preview/spinner.astro` / `spinner-dark.astro` の形（light は `<html lang="ja" data-theme="light">`、dark は `<html lang="ja" class="dark" data-theme="dark">`、`<Name>Preview client:load`）。
- `src/catalog/preview-manifest.mjs` は `src/previews/<name>.tsx` から末尾が `Preview` の export をちょうど 1 つ要求する。`src/catalog/component-categories.mjs` の `categorizePreviewItems` は未分類の item があると throw する（カテゴリは「アクション / フォーム / データ表示 / ナビゲーション / オーバーレイ / フィードバック / チャット / レイアウト」+ block 用）。`preview-selectors.json` は `"<name>": "<selector>"` の平坦な JSON で、`scripts/check-preview-render.mjs` が宣言の有無を検査する。`src/index.ts` はファイル名順に `export type { XProps } from "./components/ui/x";` と `export { X } from "./components/ui/x";` を並べる。`lib/index.d.ts` の PascalCase value export ごとに同名の `<Name>Props` type export が必要（`check-completeness` の `dtsContractProblems`）。
- CI（`.github/workflows/ci.yml`）の順: lint → typecheck → check:design-tokens → check:contrast → check-standards → registry:build → registry:legal → check-distribution → build:lib → check:props → check-completeness → check-preview-render → check-evidence → build:site。ローカルの `check-completeness` は `lib/index.d.ts` を読むため先に `npm run build:lib` が要る。
- 既存テストは `scripts/check-completeness.test.mjs` / `scripts/add-component.test.mjs` とも main で fail 0 / skip 0。`check-completeness.test.mjs` の `complete` fixture の `provenance.components.button` は `origin` を持たない（`PROVENANCE_SPEC` が `origin` を要求していないため）。自作 block のテストは `check-completeness.test.mjs` 360〜410 行付近（`completeOriginalBlock` fixture）。`--resync` のテストは `add-component.test.mjs` 2180 行付近。
- 部品の記法: `import * as React from "react"`（carousel 等の hook を使う部品）、`cn` は `@/lib/utils`、Base UI の `useRender` は状態を `data-*` 属性へ写す（`badge.tsx`）。Tailwind v4.3.3 は `starting:`（`@starting-style`）、`group-data-<attr>/<name>:`（属性の有無）、`[&>*]:` の arbitrary variant を生成する。sensor `check-standards.mjs` は値系 utility の arbitrary value（`w-[…]` / `h-[…]` / `size-[…]` / `p-[…]` / `m-[…]` / `text-[…]` / `gap-[…]` / `z-[…]` / `top|left|right|bottom|inset-[…]` / `rounded-[…]` / `duration-[…]` / `ring-[…]`（`ring-[3px]` 除く）/ `border|shadow|bg|fill|stroke-[…]`）と、`duration-<数値>` / `ease-in|out|in-out`、`[transition:…]` / `[animation:…]` 内の生 ms / cubic-bezier を検知する。`transition-[stroke-dashoffset]` や `transition-[opacity,translate]` は対象外。inline `style` は走査しない。
- `AGENTS.md` 86 行付近に「カテゴリ別に全 89 件」の記述がある（component 61 + block 28）。7 部品を足すと 96。
- `global.css` の `prefers-reduced-motion` 一括規則は CSS の animation / transition に効く。JS で補間する部品には効かない。
- 期待値の換算: `duration-fast` = `0.12s`、`duration-base` = `0.18s`、`duration-slow` = `0.26s`、`duration-slower` = `0.4s`、`duration-emphasis` = `0.5s`、`--duration-stagger` = `40ms`。`ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`、`ease-entrance` = `cubic-bezier(0.16, 1, 0.3, 1)`、`ease-bounce` = `cubic-bezier(0.34, 1.36, 0.64, 1)`。

## 2. 実施内容（literal、全 PR 共通の記法）

- 新トークン・新 curve・新 npm 依存は足さない。`design-tokens.html` / `tokens.css` / `global.css` は触らない。
- 部品は `src/components/ui/<name>.tsx` に 1 ファイル、`data-slot="<name>"` を root に出す。状態は `data-*` 属性（真のとき `""`、偽のとき属性なし）で出し、CSS はその属性で分岐する。
- 一回性の演出は Tailwind の `starting:` と transition で書く。delay は inline `style` の `transitionDelay: \`calc(var(--duration-stagger) * ${index})\`` で書く（class の arbitrary value を使わない）。
- JS で補間する部品は `matchMedia("(prefers-reduced-motion: reduce)").matches` のとき即座に最終状態へ移る。
- preview は `src/previews/<name>.tsx` に `<Name>Preview` を export し、root に `data-slot="<name>-preview"` を出す。Playwright が操作できる button を置く（`PreviewSentinel` は不要）。
- 各部品の登録: `src/index.ts`（値と `<Name>Props` 型、ファイル名順の位置）、`preview-selectors.json`（`"<name>": "[data-slot=\"<name>-preview\"]"`、キー順を崩さず挿入）、`src/catalog/component-categories.mjs`（§B / §C の指定カテゴリ）、`src/pages/preview/<name>.astro` / `<name>-dark.astro`、`registry.json` と `provenance.json`（§A の scaffold で生成し `npm run registry:tokens` で `cssVars` を載せる）。

## 3. スコープ外（全 PR 共通）

- `record-provenance.mjs`（上流専用のまま）。上流 shadcn の同名部品との API 互換。Message / Bubble の DOM 変更。TabsIndicator の色。`types/dts-contract.ts` への追記（任意、足さない）。

## 4. 検証（rubric、全 PR 共通）。結果は worker_done の body に実測値（コマンドと exit code）で含める

各コマンドは単独で実行し、個々の exit code を報告する（`&&` / `;` / pipe で連結しない）。

1. `node scripts/check-standards.mjs` が exit 0（`arbitrary-value` / `motion-literal` 0 件）。
2. `npm run lint` が exit 0。
3. `node --test scripts/check-completeness.test.mjs` と `node --test scripts/add-component.test.mjs` が exit 0 で fail 0 / skip 0、かつ `git diff origin/main -- scripts/check-completeness.test.mjs scripts/add-component.test.mjs` に既存 `test(` の削除行が無い（fixture の補完は可、テストの削除・skip 化は不可）。
4. `npm run build:lib` exit 0 → `npm run check:props` exit 0 → `node scripts/check-completeness.mjs` exit 0 → `node scripts/check-preview-render.mjs` exit 0（この順）。
5. `npm run registry:build` exit 0 → `node scripts/check-distribution.mjs` exit 0。§B / §C では `ls public/r/<name>.json` が担当部品ぶん存在する。
6. `npm run build:site` exit 0（§B / §C）。`ls dist/_astro/global.*.css` の CSS で `grep -c '@starting-style'` が 1 以上。
7. Playwright（headless Chromium、viewport 1440×900、`npm run build:site` の成果物を `npx astro preview` で配信、空きポートを明示）で担当部品の preview を light / dark で開き（§B / §C）: console error 0 件（favicon 404 は別記）、selector 1 件以上、各節の表の「観測」列の操作を行って `getComputedStyle` と `element.getAnimations()`（`transitionProperty` / `animationName`、`effect.getTiming()` の `duration` / `easing`）を記録する。担当部品ごとに light / dark を撮影し `.docs/reviews/<日付>-motion-primitives-<PR 名>/` に新規保存、report は `<日付>-<component 名>-preview.md`、画像は `-preview-light.jpg` / `-dark.jpg`、`verified_impl_sha` は実装 commit。見本は `.docs/reviews/2026-09-16-micro-interactions-2/`。
8. `node scripts/check-evidence.mjs` が exit 0（§B / §C。report を書いた直後と証跡 commit 後の 2 回。証跡は 1 commit にまとめる）。
9. `git diff --stat origin/main` の変更ファイルが担当節の一覧 + 新規証跡だけであること（司令塔の spec 追加 commit は 4-0 ブランチだけに含まれ、明記した例外）。
10. 実測の範囲を報告に書く（存在 / 実行 / 動作）。全件テストと typecheck はローカルで実行せず PR CI で代替する。

## 5. レビューサイクル（委譲先で完結）

- 実施者: この worker。レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を 1 レンズ 1 呼び出しの fresh context で逐次起動する。`lens-review-cycle` の既定 5 ロール（Security / Core Logic / Tests / Domain / Fresh Eyes）を順に当てる。並列起動しない。出力が形式不正なら同じレンズを 1 回だけ再取得する。
- 収束規律は standards `AI_FIRST.md` §3 に従う: 最大 3 ラウンド。残った flag は `.docs/risk-registry.md` に受容記録を書き、即日決める。
- 「収束の対」: 終了宣言時に 4 節 1〜5 を再実行して exit code を PR 本文へ書く。
- レビューで API の追加・段の変更・トークンの追加を求められても採らない（採らない理由を PR 本文へ書く）。設計変更が必要と判断したら ask で司令塔へ。

## 6. 完了条件（全 PR 共通）

- 担当 PR のブランチ（brief で指定）で PR を作成する（マージしない）。§B / §C は commit を「実装」と「証跡」に分ける。
- PR 本文は日本語で、変更概要、担当節の表に対する対応表、4 節の各項目の実測結果、レビュー記録、実装担当識別子、`Part of #72`（PR 4-2 だけ `Closes #72`）を含める。`--body-file` で渡す。
- worker_done の body に PR の URL、最終 commit SHA、4 節の実測値を含める。
- **base 追随**: 司令塔から指示が来たら `git merge origin/main` で追随し（rebase しない）、`registry.json` / `provenance.json` / `src/index.ts` / `preview-selectors.json` / `src/catalog/component-categories.mjs` の conflict は両方の追加を採って解消し（JSON はキー順、index.ts はファイル名順を保つ。`component-categories.mjs` で同名カテゴリが 2 つになったら 1 つに統合して `items` を和集合にする——`checkComponentCategories` は同名カテゴリを弾かないので、放置すると `/components/` に同じ見出しが 2 回出る）、4 節 1〜5 を再実行して結果を PR 本文に追記し、push する。
- **この spec ファイル（`.docs/plans/2026-09-16-motion-primitives.md`）は編集しない**。裁定や申告は PR 本文に書く。

## 7. 制約（全 PR 共通）

- **指示と実態が矛盾したら止めて ask で報告する**（例: 節に書いた関数名・行番号付近に該当箇所が無い、テストの baseline と件数が違う、Tailwind が variant を生成しない、期待値と computed style が食い違う、レビュアーを起動できない）。
- 裁量の範囲: 関数内部の実装の詳細、JS の補間ロジックの書き方、preview の文言、report の表現、一時ファイル名。API（export 名・props 名と型）・`data-slot` / `data-*` 属性名・段・曲線・カテゴリ・触るファイルの範囲は変えない。裁量で決めた内容は PR 本文に申告する。
- 逆委任は受けない。環境制約で担当範囲を遂行できないときは ask で報告して判断を待つ。
- 想定所要時間: 4-0 は 90〜150 分、4-1 は 150〜240 分（5 部品）、4-2 は 120〜180 分（2 部品 + 文書）。その間 commit が無くても正常。4-1 と 4-2 は同じマシンで並走する。
- 作成・編集するファイルに口語の語尾や絵文字を入れない。日本語で書く（技術用語・識別子は原語）。

---

## A. PR 4-0: 受け皿（scripts + テスト + 手順書）

ブランチ `naoto24kawa/motion-primitives-0`。証跡不要（`src/components` / `src/previews` / 共有面を変えない）。

1. `scripts/check-completeness.mjs`:
   - `PROVENANCE_SPEC` の直後に `ORIGINAL_COMPONENT_PROVENANCE_SPEC = { generatedContentSha256: /^[0-9a-f]{64}$/, license: /^\S+$/, modified: /\S/ }` と `COMPONENT_ORIGINS = { "shadcn/ui registry": { spec: PROVENANCE_SPEC, forbidden: [] }, "elchika original": { spec: ORIGINAL_COMPONENT_PROVENANCE_SPEC, forbidden: ["sourceUrl", "upstreamPath", "upstreamPathSha", "registry", "registryUrl", "registryPath", "registryContentSha256", "addTarget", "upstreamRepo", "style", "shadcnCliVersion", "shadcnVersion", "shadcnRange", "fetchedAt"] } }` を足す。
   - `componentProblems` の `if (!p)` の後を、block と同じ分岐にする: `origin` が無ければ `${name}: provenance の origin が無い`、未知なら `${name}: provenance の origin が未対応: ${p.origin}` を push して return。既知なら `provenanceMetaProblems(name, p, origin.spec)` と、`forbidden` のキーを持っていれば `${name}: 自作 component は ${key} を持たない` を push する。
2. `scripts/add-component.mjs`:
   - `parseArgs` に `--original`（boolean、1 回だけ。`--force` / `--resync` と同時指定はエラー、`--modified` 必須）を足し、戻り値に `original` を足す。
   - 新しい export `scaffoldOriginalComponent({ root, name, modified, log = console.log })`: 前提 = `src/components/ui/<name>.tsx` が存在する（無ければ `${name}: src/components/ui/${name}.tsx が無い（先に部品を書く）` で throw）、`provenance.components[name]` / `provenance.blocks[name]` / `registry.json` の同名 item / `src/blocks/<name>` のいずれも無い（あれば throw。文言は既存の同名衝突と同じ）。`ensureClean` は呼ばない。処理 = (a) `registry.json` の `items` に `{ $schema, name, type: "registry:ui", title（buildRegistryItem と同じ Title Case）, description: "<name> component.", files: [{ path: "src/components/ui/<name>.tsx", type: "registry:ui" }, ...SHARED_REGISTRY_FILES], dependencies: [...externalImports(source) ∪ SHARED_DEPENDENCIES].sort(), registryDependencies: registryItemImports(source) を `@elchika/<x>` に写したもの（0 件なら省略。参照先が registry.json に無ければ throw） }` を足して name 順に sort、(b) `provenance.components[name] = { origin: "elchika original", generatedContentSha256: sha256(source), license: "MIT", modified, notes: "上流を持たない自作 component。generatedContentSha256 は記録時点の手元のファイルの錨で、変更後は --resync で取り直す。" }`、(c) `src/pages/preview/<name>.astro` と `<name>-dark.astro` を `spinner.astro` / `spinner-dark.astro` と同じ形（import 名は `<Name>Preview`、title は Title Case）で書く（既に在れば上書きしない）、(d) `writeJson` で provenance.json と registry.json を書く。`cssVars` は書かない（`npm run registry:tokens` の担当）。
   - 新しい export `resyncComponentHash({ root, name, modified, provenance, log })`: `provenance.components[name]` が無ければ throw、`origin !== "elchika original"` なら `${name}: shadcn 由来の component は --resync の対象外（generatedContentSha256 は CLI 生成直後の錨）` で throw、実体の sha256 で `generatedContentSha256` を更新し、`modified` は渡されたときだけ上書き、`writeJson`。
   - `runAddComponent` の `if (resync)` を、`provenance.blocks[name]` があれば `resyncBlockHashes`、`provenance.components[name]` があれば `resyncComponentHash`、どちらも無ければ throw に変える。`original` なら `scaffoldOriginalComponent` を呼んで return（`ensureClean` / fetch / CLI は通らない）。
3. テスト:
   - `scripts/check-completeness.test.mjs`: 既存 `complete` fixture の `provenance.components.button` に `origin: "shadcn/ui registry"` を補完する（origin 必須化で既存テストが落ちるのを防ぐ。テストの削除・skip 化はしない）。`completeOriginalComponent` fixture（`provenance.components["zz-probe"]` が `elchika original`、他は既存の complete fixture と同じ）を足し、「自作 component は上流由来キーを要求されない」「自作 component は上流由来のメタを持たない（forbidden 全キー）」「未知の origin は fail-closed で弾く」「origin が無ければ検出する」「既存の shadcn 由来 component は従来どおり PROVENANCE_SPEC で検査される（陽性対照: `upstreamPathSha` を消すと検出）」の 5 件。
   - `scripts/add-component.test.mjs`: 「`--original` は `--modified` 必須」「`--original` と `--force` / `--resync` は同時指定できない」「`scaffoldOriginalComponent` は registry item（files に SHARED_REGISTRY_FILES、dependencies に shadcn、import からの registryDependencies）と provenance（elchika original）と astro 2 枚を書く」「参照先が registry に無い import は停止する」「`--resync` は自作 component のハッシュを実体へ揃える」「`--resync` は shadcn 由来の component を拒む」の 6 件。既存テストの流儀（tmp dir に fixture リポジトリを作る）に合わせる。
4. 文書: `.docs/component-addition-procedure.md` に「## 自作 component（elchika original）を追加する場合の差分」を「registry:block を追加する場合の差分」の前に足す。内容 = 手順（部品 → preview tsx → `src/index.ts` → `preview-selectors.json` → categories → `node scripts/add-component.mjs <name> --original --modified "..."` → `npm run registry:tokens` → `npm run registry:build` → `npm run build:lib` → `npm run check:pre` → 実装 commit → 実ブラウザ検証 → 証跡 commit）、`--resync` の使いどころ、`--force` を使わない理由、上流由来キーが禁止される理由。`CONTRIBUTING.md` の 5 項目の provenance 行に「自作 component は `--original` で記録する」を 1 文足す。
5. 検証（4 節に加えて）: 陽性対照として worktree に `src/components/ui/zz-probe.tsx`（`export function ZzProbe()` と `ZzProbeProps`、`cn` を import）を一時的に置き、`node scripts/add-component.mjs zz-probe --original --modified "probe"` を実行して registry.json / provenance.json / astro 2 枚が生成されることを確認し、`node scripts/add-component.mjs zz-probe --resync` が exit 0 で「更新なし」を出すことを確認してから、生成物と probe を `git checkout` / 削除で元に戻す（commit に含めない。`git status` が spec と担当ファイル以外 clean であることを報告）。`node scripts/check-completeness.mjs` は main と同じ 61 component / 28 block で exit 0。

## B. PR 4-1: 状態とテキスト（icon-swap / success-check / text-swap / text-reveal / thinking-states）

ブランチ `naoto24kawa/motion-primitives-1`。証跡ディレクトリ `.docs/reviews/<日付>-motion-primitives-1/`。**4-0 が main にマージされてから着手する**。カテゴリ: `component-categories.mjs` に `{ name: "モーション", items: ["icon-swap", "success-check", "text-reveal", "text-swap"] }` を「フィードバック」の直後に新設し、`thinking-states` は「チャット」の末尾に足す。scaffold（`--original`）は `text-swap` → `thinking-states` の順で実行する（`thinking-states` は `text-swap` を import するので、先に registry item が無いと `registryItemImports` 由来の throw で止まる）。触るファイル: 5 部品 `src/components/ui/<name>.tsx`、5 preview `src/previews/<name>.tsx`、10 astro、`registry.json` / `provenance.json` / `src/index.ts` / `preview-selectors.json` / `src/catalog/component-categories.mjs`、証跡ディレクトリ。

| 部品 | API | 実装 | 観測 |
|---|---|---|---|
| icon-swap | `IconSwap`（`React.ComponentProps<"span"> & { swapped?: boolean }`）、`IconSwapFrom` / `IconSwapTo`（`React.ComponentProps<"span">`） | root: `data-slot="icon-swap"`、`data-swapped={swapped ? "" : undefined}`、class `group/icon-swap relative inline-grid size-4 place-items-center [&>*]:col-start-1 [&>*]:row-start-1`。From: `data-slot="icon-swap-from"`、`transition-[opacity,scale] duration-slow ease-entrance group-data-swapped/icon-swap:scale-(--motion-scale-md) group-data-swapped/icon-swap:opacity-0`。To: `data-slot="icon-swap-to"`、`scale-(--motion-scale-md) opacity-0 transition-[opacity,scale] duration-slow ease-entrance group-data-swapped/icon-swap:scale-100 group-data-swapped/icon-swap:opacity-100` | preview の button で `swapped` を切り替え、To の `getAnimations()` に `opacity` / `scale` の transition（260ms、`cubic-bezier(0.16, 1, 0.3, 1)`）、切替後の computed opacity が 1 / From が 0 |
| success-check | `SuccessCheck`（`React.ComponentProps<"svg"> & { checked?: boolean }`） | `<svg data-slot="success-check" data-checked viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>` に `circle cx=12 cy=12 r=10` と `path d="M8 12.5l2.5 2.5L16 9.5"` を置き、両方に `pathLength={1}` `strokeDasharray={1}` と class `transition-[stroke-dashoffset] duration-emphasis ease-entrance`、`strokeDashoffset` は SVG 属性でなく inline style（circle: `style={{ strokeDashoffset: checked ? 0 : 1 }}`、path: `style={{ strokeDashoffset: checked ? 0 : 1, transitionDelay: "var(--duration-fast)" }}`）で与える（属性経由の transition はエンジン差があるため）。svg の class は `size-4 text-current` | button で `checked` を切り替え、circle と path の `getAnimations()` に `stroke-dashoffset` の transition（500ms、`cubic-bezier(0.16, 1, 0.3, 1)`）、path の delay 120ms |
| text-swap | `TextSwap`（`React.ComponentProps<"span"> & { value: string }`） | root: `data-slot="text-swap"`、`relative inline-grid [&>*]:col-start-1 [&>*]:row-start-1`。現在値は `key={value}` の span（`data-slot="text-swap-value"`、`transition-[opacity,translate] duration-fast ease-standard starting:translate-y-(--motion-distance-sm) starting:opacity-0`）。`value` が変わったら直前の値を `data-slot="text-swap-leaving"` の span（`aria-hidden`、`-translate-y-(--motion-distance-sm) opacity-0 transition-[opacity,translate] duration-fast ease-standard`）として 1 つだけ残し、その `onTransitionEnd` で取り除く（同時に複数変わったら最新だけ残す） | button で値を変え、新しい value の `getAnimations()` に `opacity` / `translate` の transition（120ms、`cubic-bezier(0.2, 0, 0, 1)`）、leaving が transitionend 後に DOM から消える |
| text-reveal | `TextReveal`（`React.ComponentProps<"span"> & { text: string; by?: "word" \| "char" }`、既定 `"word"`） | root: `data-slot="text-reveal"`、`key={text}`、`aria-label={text}`、`whitespace-pre-wrap`。`Intl.Segmenter`（`by === "word"` は granularity `word`、`char` は `grapheme`。`typeof Intl.Segmenter === "function"` で存在を確認し、無い環境では `split(/(\s+)/)` / `Array.from`。typecheck が `Intl.Segmenter` の型を解決できなければ cast で回避せず ask で報告する）で分割し、各単位を `<span data-slot="text-reveal-unit" aria-hidden className="inline-block transition-[opacity,translate] duration-emphasis ease-entrance starting:translate-y-(--motion-distance-sm) starting:opacity-0" style={{ transitionDelay: \`calc(var(--duration-stagger) * ${index})\` }}>`（空白だけの単位は index を進めず `inline` のまま出す） | button で text を変え、先頭と末尾の unit の `getAnimations()` に transition（500ms、`cubic-bezier(0.16, 1, 0.3, 1)`）と `effect.getTiming().delay` が `0` と `40 × (最後の index)` |
| thinking-states | `ThinkingStates`（`React.ComponentProps<"span"> & { states: string[]; active?: number }`、既定 `0`） | `<span data-slot="thinking-states" role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="size-3.5 text-current" /><TextSwap value={states[active] ?? ""} /></span>`（`Spinner` は `@/components/ui/spinner`、`TextSwap` は `@/components/ui/text-swap` から import。scaffold が registryDependencies に写す） | button で `active` を進め、内部 TextSwap の観測と同じ |

各部品の `src/index.ts` への export は値と `<Name>Props`（icon-swap は `IconSwapFromProps` / `IconSwapToProps` も）。scaffold の `--modified` には「transitions.dev の <用途> を参照し、既存トークンと React だけで自作」と書く。

## C. PR 4-2: 数値とチャット（animated-number / streaming-text）+ 文書

ブランチ `naoto24kawa/motion-primitives-2`。証跡ディレクトリ `.docs/reviews/<日付>-motion-primitives-2/`。**4-0 が main にマージされてから着手する**（4-1 と並走）。カテゴリ: `animated-number` を「モーション」（4-1 が新設。着手時点の main に無ければ `{ name: "モーション", items: ["animated-number"] }` を「フィードバック」の直後に自分で新設し、追随時は 6 節の統合ルールで 1 つにする）、`streaming-text` を「チャット」の末尾に足す。`AGENTS.md` の「カテゴリ別に全 89 件」を「全 96 件」に変える（96 は 4-1 と 4-2 の両方がマージされた後の件数。4-2 が先にマージされると一時的に実数 91 と食い違うが、文書上の件数なので許容する——ask 不要）。触るファイル: 2 部品 `src/components/ui/<name>.tsx`、2 preview `src/previews/<name>.tsx`、4 astro、`registry.json` / `provenance.json` / `src/index.ts` / `preview-selectors.json` / `src/catalog/component-categories.mjs`、`AGENTS.md`、証跡ディレクトリ。

| 部品 | API | 実装 | 観測 |
|---|---|---|---|
| animated-number | `AnimatedNumber`（`React.ComponentProps<"span"> & { value: number; locale?: string; format?: Intl.NumberFormatOptions }`、`locale` 既定 `"ja-JP"`） | root: `<span data-slot="animated-number" className="tabular-nums" aria-label={最終値の書式化文字列}>` の中に `aria-hidden` の表示 span。初回は `value` を即表示。`value` が変わったら表示中の数値から新しい値へ `requestAnimationFrame` で補間する。所要時間は root の `getComputedStyle(el).getPropertyValue("--duration-slower")` を ms に換算した値（取れなければ 400）、曲線は `getPropertyValue("--curve-entrance")` の `cubic-bezier(a,b,c,d)` を JS で解いた値（取れなければ線形）。`prefers-reduced-motion: reduce` なら補間せず即座に最終値。書式は `new Intl.NumberFormat(locale, format)`、補間中の値は `format.maximumFractionDigits ?? 0` 桁に丸める。unmount 時に rAF を止める | button で値を増減し、16ms ポーリングで表示テキストが単調に変わって 400ms 前後で最終値に到達すること、reduced-motion を emulate（Playwright `emulateMedia({ reducedMotion: "reduce" })`）した route で即座に最終値になること |
| streaming-text | `StreamingText`（`React.ComponentProps<"span"> & { text: string; streaming?: boolean }`） | root: `<span data-slot="streaming-text" aria-busy={streaming || undefined}>`。確定済み文字列 `committed` を state に持ち、`text` が `committed` で始まるなら差分を `<span data-slot="streaming-text-chunk" className="transition-opacity duration-fast ease-standard starting:opacity-0">` として末尾に足し、その `onTransitionEnd` で `committed` に畳む（transitionend が来ない環境のために `text` が更に進んだときも畳む）。始まらないなら全置換して演出なし。`streaming` のとき末尾に `<span data-slot="streaming-text-caret" aria-hidden className="ml-px inline-block h-4 w-px animate-caret-blink bg-current align-text-bottom" />` | button でチャンクを 3 回追記し、各 chunk の `getAnimations()` に `opacity` の transition（120ms、`cubic-bezier(0.2, 0, 0, 1)`）、caret の computed `animation-name` = `caret-blink`、`streaming` を false にすると caret が消える |

各部品の `src/index.ts` への export は値と `<Name>Props`。scaffold の `--modified` の書き方は §B と同じ。

## 8. 実装後の裁定一覧（PR 4-0 / 4-1 / 4-2）

### 8.1 spec の誤記・書き漏れ

1. §A.3 の fixture 補完は `check-completeness.test.mjs` しか挙げていなかったが、`check-cli-smoke.test.mjs` の button fixture にも `origin` が要る（origin 必須化で CI の全件テストが 1 件 fail。PR #74 でスコープ追加）。
2. §B TextReveal / §C AnimatedNumber の root `<span aria-label>` は Biome `lint/a11y/useAriaPropsSupportedByRole` が弾く（generic な span は名前を持てない）。裁定: root に `role="img"` を足す。両部品で統一し、API・`data-slot`・視覚構造は不変（PR #75 / #76）。

### 8.2 運用

- レビュー用 diff は担当ファイルに絞ってよい。先頭 commit の spec は §4.9 の例外でレビュー対象に含めない。
- 1 行の fixture 補完のような追加レビューは Fresh Eyes + Tests の 2 レンズで可（記録に縮めた旨を書く）。
- codex worker を同時に 3 本以上走らせると IPv4 一時ポートが TIME_WAIT で枯渇し、`gh` / `git push` / `127.0.0.1` への接続が失敗する。証跡の配信は `npx astro preview --host ::1` で回避でき、remote 操作は接続回復まで待つ（PR #75 / #76 の「環境障害の記録」）。
- Orca 再起動で worker 端末が失効したら、同じ worktree に「残りの手順だけ」の再開 brief で fresh worker を起動する（`--retry-of` は `--task` が要るので `--spec` で新規 task）。codex の exec_command が無応答になる場合は `--agent claude` に切り替える。ファイルを変更しない remote 手順（push・PR 作成・CI 確認）は司令塔が代行してよく、理由を PR 本文に残す。

### 8.3 持ち越し

- `AGENTS.md` の「全 96 件」は PR 4-2 が先にマージされた場合に一時的に実数と食い違う設計だったが、実際は 4-1 → 4-2 の順でマージされたので食い違いは発生しなかった。
- TextReveal の `Array.from` フォールバック（`Intl.Segmenter` 非搭載環境）では書記素クラスタが分かれる。仕様が明示した互換経路の制約として記録し、追加ライブラリは入れない。
