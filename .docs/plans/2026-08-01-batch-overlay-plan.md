# Batch overlay 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 対話・オーバーレイ群12件を指定順で共有UIへ追加し、isolated previewでは前後sentinelと実操作を、catalogではoverlayを閉じた横断描画を保証する。

**Architecture:** 各componentは`.docs/component-addition-procedure.md`どおり、wrapper RED、standards正規化、5公開経路、実装commit、固定SHAのlight/dark実ブラウザ検証、証跡commitの順で1件ずつ追加する。共有sentinelはcatalog scan対象外の`src/catalog/preview-sentinel.tsx`に置き、`mode === "isolated"`だけbuttonを描画する。Portal群はcontext-menuを除き`defaultOpen`でisolated時だけ初期表示し、catalogでは閉じる。context-menuは実際の`contextmenu`イベントで開く。

**Tech Stack:** Astro 7、React 19、TypeScript、Base UI、Tailwind CSS v4、Biome、Node test、Chrome実ブラウザ。

## Global Constraints

- baseは`191e52940e8553ffb9bd92f36f6fa0e32e6e5e9d`、branchは`feat/batch-overlay`。
- standardsリポジトリは読み取り専用。mainへ直接commit/pushしない。
- 対象は`accordion`、`collapsible`、`scroll-area`、`resizable`、`context-menu`、`dropdown-menu`、`drawer`、`hover-card`、`navigation-menu`、`popover`、`select`、`tooltip`の12件だけ。
- 投入順は展開2件、レイアウト2件、Portal 8件の記載順から変えない。
- コミットメッセージ、PR本文、ドキュメント、コードコメントは日本語で書く。
- 各componentは対象名を指定した`node scripts/add-component.mjs`を1回実行し、wrapperが停止したら変更を推測で直さずClaudeへ報告する。
- 既存dependencyの版・section変更、分類不能path、対象外component追加を検出したら停止する。
- 追加npm依存は`resizable`の`react-resizable-panels`だけを許容する。`drawer`の`@base-ui/react`は既存依存を利用する。
- 全PascalCase value exportに、そのexport名と同じ接頭辞を持つProps型を公開し、`types/dts-contract.ts`へ到達性と主要な負の型契約を追加する。
- `provenance.modified`は生成物と最終差分を確認してcomponent固有に書く。
- 対話群12件のpreviewは`mode === "isolated"`のときだけ`data-sentinel="before"`と`data-sentinel="after"`のfocusable buttonを1件ずつ描画し、catalogでは両方0件にする。既存22件は変更しない。
- Portal群はcontext-menuを除きisolatedで`defaultOpen`を使い、catalogでは閉じる。`open={true}`は禁止する。context-menuは閉じたpreviewから実際の`contextmenu`イベントで開く。
- `aria-modal`を仮定しない。ARIA、Portal DOM、inert、focus trap、focus returnはhydration後の実DOMで実測する。
- focus returnの期待値は開き方で決める。click/keyboardでtriggerを操作した場合はtriggerへ戻り、pointerだけの右クリックでは閉じたcontentへ取り残されないことを確認し、hoverではfocusが動かないことを確認する。
- Portal群で`defaultOpen`、hydration後DOM、focus trap/inert/returnのdialog知見が通用しなければ、そのcomponentの作業を止めて都度Claudeへ報告する。
- 各実装commit前に`npm run format`、`npm run lint`、`npm run typecheck`、Props contract単独tsc、scripts tests、`npm run build`、`npm run build:lib`、`npm run check:pre`を通す。
- 各実装commitの固定SHAからcomponent固有実装pathに差分がない状態でlight/darkを実ブラウザ検証し、新規MarkdownとJPEG 2件だけの証跡commitを作る。証跡commit後に`npm run check:all`を通す。
- browser証跡はURL、theme、stable selector、sentinel件数、操作前後、focus移動、ARIA実値、寸法/token、console error、JPEG実体、見た範囲/見ていない範囲を記録する。
- 群の切れ目で対象追加、wrapper停止、分類追加、復元path、dependency、実装/証跡SHA、gate、固有摩擦をClaudeへ報告する。
- 全12件後に最終SHAでcatalog light/darkを1回だけ走査し、scan由来全componentの集合一致、可視矩形、hydration、console error、12件のcatalog sentinel 0、Portal閉状態を記録する。
- 最終レビューサイクルは確信度80%以上のflagが0になるまで自律反復し、branchをpushしてmain向けPRを作る。

---

## 共通ファイル契約

各component taskは、Task本文に列挙したcomponent、preview、light/dark routeを作成し、`src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`を変更する。証跡はTask本文に列挙したMarkdownとlight/dark JPEGを新規作成する。

共通実行順は次のとおり。

1. wrapper実行と直後の`npm run check:all` REDを記録する。
2. Base UIの実APIを読み、semantic token、非透明3px focus ring、data属性へ正規化する。
3. 全PascalCase value/Props、preview、2 route、selector、provenance、registry、d.ts契約を追加する。
4. 実装gateを全てGREENにし、実装pathだけを日本語件名でcommitする。
5. 固定SHAをbuildし、空き確認した明示portで配信してlight/darkを実ブラウザ検証する。
6. 実装path差分0、画像実体、Browser/server cleanupを確認し、証跡3件だけを日本語件名でcommitする。
7. `npm run check:all`、worktree clean、task reviewのspec/quality承認を確認する。

### Task 1: Accordion

**Files:** Create `src/components/ui/accordion.tsx`、`src/previews/accordion.tsx`、`src/pages/preview/accordion.astro`、`src/pages/preview/accordion-dark.astro`、`src/catalog/preview-sentinel.tsx`、`.docs/reviews/2026-08-01-accordion-preview.md`、`.docs/reviews/accordion-preview-light.jpg`、`.docs/reviews/accordion-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** `PreviewSentinelProps = { mode: PreviewMode; position: "before" | "after" }`を定義し、isolatedだけfocusable buttonを返す。Accordion previewは複数itemを持ち、isolatedだけ1件を`defaultValue`で開く。

- [ ] wrapper REDを確認し、Accordion全slotのvalue/Propsを公開する。
- [ ] light/darkでsentinel各1、trigger/region、`aria-expanded`、click/Space/Enter、ArrowDown/ArrowUp、Tab順、開閉前後を実測する。
- [ ] catalog modeではsentinel 0、初期展開0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 2: Collapsible

**Files:** Create `src/components/ui/collapsible.tsx`、`src/previews/collapsible.tsx`、`src/pages/preview/collapsible.astro`、`src/pages/preview/collapsible-dark.astro`、`.docs/reviews/2026-08-01-collapsible-preview.md`、`.docs/reviews/collapsible-preview-light.jpg`、`.docs/reviews/collapsible-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** Task 1の`PreviewSentinel`を利用する。isolatedだけ`defaultOpen`、catalogでは閉じる。

- [ ] wrapper REDを確認し、Collapsible全slotのvalue/Propsを公開する。
- [ ] light/darkでsentinel各1、trigger/content、`aria-expanded`、click/Space/Enter、Tab順、開閉前後、focus維持を実測する。
- [ ] catalog modeのsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 3: 展開群チェックポイント

- [ ] Accordion/Collapsibleだけが追加されたこと、dependency 0、wrapper停止/分類追加/復元path、SHA、gate、sentinel契約、摩擦を集約してClaudeへ報告する。

### Task 4: Scroll Area

**Files:** Create `src/components/ui/scroll-area.tsx`、`src/previews/scroll-area.tsx`、`src/pages/preview/scroll-area.astro`、`src/pages/preview/scroll-area-dark.astro`、`.docs/reviews/2026-08-01-scroll-area-preview.md`、`.docs/reviews/scroll-area-preview-light.jpg`、`.docs/reviews/scroll-area-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** `PreviewSentinel`を利用し、縦横overflow、viewport、scrollbar、thumbを描画する。

- [ ] wrapper REDを確認し、ScrollArea全slotのvalue/Propsを公開する。
- [ ] light/darkでsentinel各1、viewportのscrollWidth/clientWidth/scrollHeight/clientHeight、wheel/keyboard後のscrollTop/scrollLeft、thumb矩形、Tab順を実測する。
- [ ] catalog modeのsentinel 0と静的描画を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 5: Resizable

**Files:** Create `src/components/ui/resizable.tsx`、`src/previews/resizable.tsx`、`src/pages/preview/resizable.astro`、`src/pages/preview/resizable-dark.astro`、`.docs/reviews/2026-08-01-resizable-preview.md`、`.docs/reviews/resizable-preview-light.jpg`、`.docs/reviews/resizable-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`、`package.json`、`package-lock.json`。

**Interfaces:** `react-resizable-panels`の実解決版をlockfileで確認し、水平2panelとkeyboard操作可能なhandleをpreviewする。

- [ ] wrapper REDと追加dependencyだけを確認し、既存dependency変更があれば停止する。
- [ ] Resizable全slotのvalue/Propsを公開し、light/darkでsentinel各1、separator role/orientation/value、pointer drag、ArrowLeft/ArrowRight、panel寸法変化、Tab順を実測する。
- [ ] catalog modeのsentinel 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 6: レイアウト群チェックポイント

- [ ] ScrollArea/Resizableだけが追加されたこと、`react-resizable-panels`だけのdependency、wrapper停止/分類追加/復元path、SHA、gate、摩擦を集約してClaudeへ報告する。

### Task 7: Context Menu

**Files:** Create `src/components/ui/context-menu.tsx`、`src/previews/context-menu.tsx`、`src/pages/preview/context-menu.astro`、`src/pages/preview/context-menu-dark.astro`、`.docs/reviews/2026-08-01-context-menu-preview.md`、`.docs/reviews/context-menu-preview-light.jpg`、`.docs/reviews/context-menu-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`、`scripts/check-preview-render.mjs`、`scripts/check-preview-render.test.mjs`、`.docs/component-addition-procedure.md`。

**Interfaces:** previewはisolated/catalogとも閉じた状態で描画し、context trigger、Portal content、item、checkbox/radio/submenuを最小previewへ含める。`preview-selectors.json`は既存の文字列宣言を維持し、context-menuだけ`selector`と`setup`を持つobjectで、trigger中央への`contextmenu`操作を宣言する。静的checkerはobjectの非空`selector`だけを検査し、setup実行やDOM matchを行わない。

- [ ] wrapper REDを確認し、全slot value/Propsを公開する。
- [ ] trigger中央で`contextmenu`イベントを発火し、hydration後のcontentが発火座標近傍に表示されることを確認する。context-menuはpointer座標にanchorするため`defaultOpen`で位置検証が成立しない実測事実を手順書へ記録する。
- [ ] light/darkでsentinel各1、Portal DOM、実ARIA、background inert、focus trap、Escape close後にfocusが閉じたcontentへ取り残されないこと、再度contextmenu open、typeaheadを含むkeyboard item移動、consoleを実測する。右クリックではtriggerがfocusされないため、BODYへ移る実値を正常として理由とともに記録する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 8: Dropdown Menu

**Files:** Create `src/components/ui/dropdown-menu.tsx`、`src/previews/dropdown-menu.tsx`、`src/pages/preview/dropdown-menu.astro`、`src/pages/preview/dropdown-menu-dark.astro`、`.docs/reviews/2026-08-01-dropdown-menu-preview.md`、`.docs/reviews/dropdown-menu-preview-light.jpg`、`.docs/reviews/dropdown-menu-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** isolatedだけ`defaultOpen`、catalogでは閉じる。trigger、Portal content、item、checkbox/radio/submenuを含める。

- [ ] wrapper REDと全slot value/Props公開を完了する。
- [ ] light/darkでsentinel各1、Portal、実ARIA、inert、focus trap/return、Escape、trigger click再開、Arrow navigation/選択、状態変化を実測する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 9: Drawer

**Files:** Create `src/components/ui/drawer.tsx`、`src/previews/drawer.tsx`、`src/pages/preview/drawer.astro`、`src/pages/preview/drawer-dark.astro`、`.docs/reviews/2026-08-01-drawer-preview.md`、`.docs/reviews/drawer-preview-light.jpg`、`.docs/reviews/drawer-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** 既存`@base-ui/react`を使い、isolatedだけ`defaultOpen`。overlay/content/header/footer/title/description/closeを含める。

- [ ] wrapper REDで追加dependency 0と既存dependency不変を確認し、全slot value/Propsを公開する。
- [ ] light/darkでsentinel各1、Portal/overlay、実ARIA、inert、focus trap、Escape/close、trigger return、再open、寸法を実測する。
- [ ] catalogでsentinel/overlay/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 10: Hover Card

**Files:** Create `src/components/ui/hover-card.tsx`、`src/previews/hover-card.tsx`、`src/pages/preview/hover-card.astro`、`src/pages/preview/hover-card-dark.astro`、`.docs/reviews/2026-08-01-hover-card-preview.md`、`.docs/reviews/hover-card-preview-light.jpg`、`.docs/reviews/hover-card-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** isolatedだけ`defaultOpen`、catalogでは閉じる。link triggerとPortal contentを含める。

- [ ] wrapper REDと全slot value/Props公開を完了する。
- [ ] light/darkでsentinel各1、Portal/実ARIA、hover/focus open、pointer leave/blur close、Escape、focus移動、非modal背景操作を実測する。Base UI実態がtrap/inertを持たなければ値をそのまま記録する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 11: Navigation Menu

**Files:** Create `src/components/ui/navigation-menu.tsx`、`src/previews/navigation-menu.tsx`、`src/pages/preview/navigation-menu.astro`、`src/pages/preview/navigation-menu-dark.astro`、`.docs/reviews/2026-08-01-navigation-menu-preview.md`、`.docs/reviews/navigation-menu-preview-light.jpg`、`.docs/reviews/navigation-menu-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** isolatedでは最初のitemを`defaultValue`で開き、catalogではvalueなしで閉じる。list/item/trigger/content/link/viewport/indicatorを含める。

- [ ] wrapper REDと全slot value/Props公開を完了する。
- [ ] hydration後Portal/viewport実態を確認し、dialog知見と異なる場合は停止報告する。
- [ ] light/darkでsentinel各1、実ARIA、keyboard navigation、Escape close、focus return、再open、viewport/indicator寸法を実測する。
- [ ] catalogでsentinel/content/viewport 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 12: Popover

**Files:** Create `src/components/ui/popover.tsx`、`src/previews/popover.tsx`、`src/pages/preview/popover.astro`、`src/pages/preview/popover-dark.astro`、`.docs/reviews/2026-08-01-popover-preview.md`、`.docs/reviews/popover-preview-light.jpg`、`.docs/reviews/popover-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** isolatedだけ`defaultOpen`、catalogでは閉じる。trigger、Portal content、heading、focusable controlを含める。

- [ ] wrapper REDと全slot value/Props公開を完了する。
- [ ] light/darkでsentinel各1、Portal/実ARIA、inert実値、focus trap実値、Escape/外側click close、trigger return、再openを実測する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 13: Select

**Files:** Create `src/components/ui/select.tsx`、`src/previews/select.tsx`、`src/pages/preview/select.astro`、`src/pages/preview/select-dark.astro`、`.docs/reviews/2026-08-01-select-preview.md`、`.docs/reviews/select-preview-light.jpg`、`.docs/reviews/select-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** isolatedだけ`defaultOpen`、catalogでは閉じる。trigger/value/Portal content/group/label/item/separator/scroll buttonsを含め、選択値を観測可能にする。

- [ ] wrapper REDと全slot value/Props公開を完了する。
- [ ] light/darkでsentinel各1、Portal/実ARIA、keyboard item移動/選択、Escape close、trigger return、再open、選択値更新、disabled item不変を実測する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 14: Tooltip

**Files:** Create `src/components/ui/tooltip.tsx`、`src/previews/tooltip.tsx`、`src/pages/preview/tooltip.astro`、`src/pages/preview/tooltip-dark.astro`、`.docs/reviews/2026-08-01-tooltip-preview.md`、`.docs/reviews/tooltip-preview-light.jpg`、`.docs/reviews/tooltip-preview-dark.jpg`。Modify `src/index.ts`、`types/dts-contract.ts`、`preview-selectors.json`、`provenance.json`、`registry.json`。

**Interfaces:** preview内で`TooltipProvider`を所有し、isolatedだけ`defaultOpen`、catalogでは閉じる。triggerとPortal contentを含める。

- [ ] wrapper REDとProvider責務、全slot value/Props公開を完了する。
- [ ] light/darkでsentinel各1、Portal/実ARIA、hover/focus open、pointer leave/blur/Escape close、focus維持、非modal背景操作を実測する。
- [ ] catalogでsentinel/content 0を確認し、実装commit→証跡commit→review cleanを完了する。

### Task 15: Portal群チェックポイント

- [ ] Portal 8件だけが追加されたこと、dependency 0、wrapper停止/分類追加/復元path、実装/証跡SHA、gateを集約する。
- [ ] dialog知見が通用しなかったcomponentと、Portal selector/hydration/focus/inert/returnの固有摩擦をcomponent別にClaudeへ報告する。

### Task 16: バッチ末尾catalog横断検証

- [ ] 最終実装SHAを固定し、fresh build後に空きportでcatalog light/darkを配信する。
- [ ] `src/previews/*.tsx`から期待集合を0件guard付きで導出し、実DOM集合と完全一致、全rect可視、hydrated island、theme、console error 0を確認する。
- [ ] 今回12件のcatalog sectionでbefore/after sentinelが0、Portal content/overlayが0、展開contentが閉じていることを実測する。
- [ ] 12件を列挙した新規Markdownとlight/dark JPEGだけをcommitし、`npm run check:all`を通す。

### Task 17: 最終ゲート・レビュー・PR

- [ ] format、lint、typecheck、Props contract単独tsc、scripts testsの全Run、build、build:lib、check:pre、check:allをfresh実行する。
- [ ] base比較で追加componentが指定12件だけ、追加npm dependencyが`react-resizable-panels`だけ、既存dependency不変、worktree cleanを確認する。
- [ ] Security、Core Logic、Tests、Frontend Domain、Fresh Eyes、文章仕様のAmbiguity/Altitudeでflag 0までレビューサイクルを回し、結果を`.docs/reviews/`へ記録する。
- [ ] `feat/batch-overlay`をpushし、日本語PR本文に12件の来歴、SHA、検証matrix、Portal摩擦、レビュー、再現手順を記録してmain向けPRを作る。mainへのmergeは行わない。
