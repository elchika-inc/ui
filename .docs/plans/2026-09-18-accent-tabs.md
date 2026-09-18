# 黄アクセントを Tabs line の下線に一点灯す（issue #83、段階 4）

issue #52 の段階計画の 4 番目。design-tokens.html の黄アクセント（`--color-accent-highlight*`）を Tailwind に接続し、Tabs line variant の下線に一点だけ使う。PR は 1 本。

## 1. 背景（実測済み。worker は再調査しない）

- 正本は `src/styles/design-system/design-tokens.html`。「青が構造をつくり、黄色は発見の瞬間だけ灯る。補色関係で強く出るぶん、黄色は面積を絞って使う」「黄色のアクセントはコーポレート固定」「黄色の背景に青文字は使わない（黄の背景には黄系の濃色を乗せる）」「warning は黄ではなく橙」。セマンティックトークンは `--color-accent-highlight: var(--accent-500)`（light。#F2C230 = 242 194 48）/ `var(--accent-400)`（dark。#F5D065 = 245 208 101）、`--color-accent-highlight-bg`（light `--accent-100`、dark `--accent-900`）、`--color-accent-highlight-text`（light `--accent-text` = 133 105 10、dark `--accent-400`）。値は `R G B` の 3 数で、利用側で `rgb(var(--…))` に包む（既存の `--primary: rgb(var(--color-brand-primary))` と同じ）。
- 生成物 `tokens.css` には上記が `:root`（52〜54 行付近）と dark ブロック（258〜260 行付近）に出ている。**global.css の `:root` / `.dark` / `@theme inline` には接続されておらず、`src/` での使用は 0 件**（`grep -rn 'accent-highlight' src/components src/site src/previews src/blocks src/pages` が空）。
- shadcn の `--accent` / `--accent-foreground`（global.css 243〜244 行付近、hover 背景 = `--color-brand-subtle`）と design system の `--accent-*`（黄のプリミティブ）は名前が衝突する。Tailwind の `--color-accent` は shadcn 側を指す。**黄は `highlight` という別名で接続する**。
- `tabs.tsx`: `TabsTrigger`（54〜58 行付近）の line variant の下線は `after:absolute after:bg-foreground after:opacity-0 after:transition-opacity … group-data-[variant=line]/tabs-list:data-active:after:opacity-100`。`TabsIndicator`（66〜80 行付近）の line variant は `group-data-[variant=line]/tabs-list:bg-foreground …`（`-bottom-0.5 h-0.5` / vertical `-right-0.25 w-0.5`）。default variant は `bg-card` の面で、触らない。active の文字色は `data-active:text-foreground`、非 active は `text-muted-foreground`。
- Tabs line variant の使用箇所: `src/previews/tabs.tsx`（`<TabsList variant="line">` + `<TabsIndicator />`）。`src/blocks/dashboard-table` は default variant + TabsIndicator（黄は出ない）。site は Tabs を使わない。
- コントラスト（WCAG 相対輝度で司令塔が計算）: light の accent-500 は surface #FFFFFF に対し 1.68:1、canvas #F6F6F7 に 1.55:1、raised #EDEEF0 に 1.44:1。濃黄 accent-text は surface に 5.22:1。dark の accent-400 は surface #1C1F26 に 11.07:1、canvas 12.03:1。**light の下線は非テキスト 3:1 を満たさない**。ユーザー決定: active は文字色（foreground vs muted-foreground）でも識別できるので、下線はブランドの黄を補助表現として使い、`scripts/contrast-cases.mjs` に `decorative` gate で登録する。
- `scripts/contrast.mjs`（`npm run check:contrast`、CI の Token contrast step）は `scripts/contrast-cases.mjs` の `CONSUMER_CASES` を検査し、gate は `text-aa` 4.5 / `nontext-ui` 3 / `decorative` と `disabled-exempt` は免除。`REQUIRED_CONSUMER_CONTRACT_DIGEST`（51 行付近）は **全 case** の契約（label / gate / theme / paint / source class / risk）の sha256 で、case を 1 件足すと一致しなくなり「必須 consumer case の gate / theme / paint / source class / risk 契約が一致しない」で fail する。digest を出力する手段は無いので、`consumerCaseContract` を export して `node --input-type=module -e` で同じ手順（`CONSUMER_CASES.map(consumerCaseContract)` を label で sort → `JSON.stringify` → sha256）で計算し、定数を更新する。`decorative` gate の既存例は「Switch unchecked surface」「border on card」。contrast.mjs は case の `sourceClasses` が実ファイルに存在することも検査する（無いと「<label>: <path> の <class> が存在しない」）ので、`bg-highlight` を宣言する case は `tabs.tsx` の置換と同じ commit に入れる。digest の不一致は他の問題と併記され、先に打ち切られない。`after:bg-foreground` と `group-data-[variant=line]/tabs-list:bg-foreground` は `src` で `tabs.tsx` にしか無い。`--highlight` という名前は tokens.css / brands.css / Tailwind の theme.css のどれにも無い。global.css の最初の `:root {` は 227 行付近の shadcn 写像ブロック（sync-registry-tokens が読むブロック）。
- `scripts/sync-registry-tokens.mjs`（`npm run registry:tokens`）は global.css の最初の `:root {` と `.dark {` ブロックの `--x: …;` を全部 `registry.json` の各 item の cssVars に写す。`:root` に `--highlight*` を足すと registry.json が 97 item × 3 行変わる（意図どおり。commit に含める）。
- 共有トークン（global.css）を変えると `check-evidence` が共有面証跡を stale と判定する。撮り直しは `SHARED_TOKEN_IMAGE_SUBJECTS` 14 subject（disabled-controls / alert-dialog / attachment / catalog / menubar / select / button / bubble / dialog / drawer / badge / alert / sheet / tabs）× light / dark = 28 枚。report に `verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha`。`verified_impl_sha` はトークン変更 commit より後。書式の見本は `.docs/reviews/2026-09-18-typography-a/report.md`。`tabs.tsx` を変えるので tabs の部品別 report（`<日付>-tabs-preview.md`）も同じディレクトリに要る（画像は共有面の tabs 2 枚を兼用してよい。`.docs/reviews/2026-09-16-micro-interactions-0/` が前例）。
- `scripts/check-standards.mjs` は生の色指定と値系 arbitrary value を弾く。黄は utility（`bg-highlight`）で書く。
- 環境の学び: ローカル配信は `npx astro preview --host ::1 --port <空きポート>` を使ってよい。`gh` / `git push` が失敗したら 60 秒間隔で最大 10 回再試行し、通らなければ escalation。

## 2. 記法

- 新しい依存は足さない。`design-tokens.html` / `build-tokens.mjs` / `tokens.css` / `brands.css` / `DESIGN.md` は編集しない。
- 生の色指定と値系 arbitrary value を使わない。黄は `bg-highlight` / `bg-highlight-bg` / `text-highlight-text` で書く。
- 部品の変更は class 文字列の置換に限る（API は変えない）。
- コミットメッセージ・PR 本文・レビュー記録・report は日本語。commit 末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`、PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。

## 3. スコープ外

- Sidebar の active レール、Progress の充填、Badge / Alert など他の部品への黄の適用（正本の「面積を絞る」に従い一点だけ）。
- default variant の TabsIndicator（`bg-card` のまま）。
- light の 3:1 未達を解消するための濃黄への変更（ユーザー決定で不採用）。
- ドキュメントサイトの意匠（段階 5）。

## 4. 検証（rubric。結果は PR 本文と worker_done に実測値で書く）

1. `node scripts/check-standards.mjs` exit 0。
2. `npm run lint` exit 0（error 0）。
3. `node --test scripts/contrast.test.mjs`、`node --test scripts/check-completeness.test.mjs`、`node --test scripts/theme-typography.test.mjs` がそれぞれ exit 0 で fail 0 / skip 0。既存 `test(` の削除行が無い。
4. `npm run check:contrast` exit 0（digest 更新後）。陽性対照: 追加した case の gate を一時的に `nontext-ui` にして実行し、light で比率不足の fail 行（「Tabs line indicator on background」の 1.68 が 3 未満）が出ることを 1 回確認して戻す。gate を変えると digest も一致しなくなるので「契約が一致しない」も同時に出るが、比率の fail 行が出ていれば陽性対照は成立（commit に含めない。両方の出力を PR 本文に書く）。
5. `npm run build:lib` → `npm run check:props` → `node scripts/check-completeness.mjs` → `node scripts/check-preview-render.mjs` を 1 つずつ実行し全部 exit 0。
6. `npm run registry:build` → `node scripts/check-distribution.mjs` exit 0。`git diff --stat origin/main -- registry.json` が 1 file changed で、追加行は 97 item × light / dark × 3 = 582 行前後（削除 0）。`node -e` で `registry.json` の任意の item の `cssVars.light.highlight` と `cssVars.dark.highlight` が `rgb(var(--color-accent-highlight))` であることを確認する。
7. `npm run build:site` exit 0。生成 CSS `dist/_astro/global.*.css` で `grep -o -- '--color-highlight:[^;]*;'` が `var(--highlight)`、`grep -o -- '--highlight:[^;]*;'` が `rgb(var(--color-accent-highlight))` を 2 回（`:root` と `.dark`）、`grep -c '\.bg-highlight{'` が 1 以上、`grep -c 'after\\:bg-foreground'` が 0、`grep -c 'after\\:bg-highlight'` が 1 以上、`grep -c 'tabs-list\\]\\:bg-highlight'` が 1 以上（陽性対照: main の生成 CSS では `after\\:bg-foreground` が 1 以上、`after\\:bg-highlight` が 0。前後の件数を記録）。
8. Playwright（headless Chromium、viewport 1440×900、`npm run build:site` の成果物を `npx astro preview --host ::1 --port <空きポート>` で配信）: `/preview/tabs/` と `/preview/tabs-dark/` で line variant の `[data-slot="tabs-indicator"]`（2 つ目の TabsList 内）の computed `backgroundColor` が light `rgb(242, 194, 48)`、dark `rgb(245, 208, 101)`（陽性対照: main では light `rgb(26, 28, 33)`）。active な TabsTrigger の `::after` の computed `backgroundColor` も同じ値。default variant の TabsIndicator の `backgroundColor` は不変（light `rgb(255, 255, 255)` 相当の card 色を記録）。console error 0（favicon 404 は別記）、pageerror 0。
9. `node scripts/check-evidence.mjs` exit 0（report を書いた直後と証跡 commit 後の 2 回。証跡は 1 commit にまとめる）。
10. `git diff --stat origin/main` の変更ファイルが §A の一覧 + 新規証跡だけであること（先頭 commit の spec は司令塔が入れた明記済みの例外）。

## 5. レビューサイクル（委譲先で完結）

- レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を fresh context で 1 回 1 レンズずつ順に起動する（Fresh Eyes → Security → Core Logic → Tests → Domain）。入力は担当ファイルに絞った diff・変更ファイル全文・spec §1 / §2 / §4 / §A のみ（先頭 commit の spec は含めない）。最大 3 ラウンド。出力が壊れていたら同じレンズを 1 回だけ取り直し、2 回目も壊れていれば 2 回目の境界内を改変せず採用する。記録は `.docs/reviews/cycles/<日付>-accent-tabs.md`（先頭に `verified_impl_sha:` 行）。
- flag（確信度 80% 以上）が 0 になるまで修正 → 再レビュー。上限に達したら残りを PR 本文に ACCEPTED_RISKS として書く。

## 6. 完了条件

- PR は base `main`、本文に `Closes #83`。本文の節: 関連 Issue / エージェント実装の来歴 / 変更内容と §A の対応 / 検証結果（§4 の各項目の実測値）/ レビュー記録 / 変更範囲（§4.10）と base 確認 / 裁量で決めた内容の申告 / ACCEPTED_RISKS（light の下線 1.68:1 を decorative として登録した理由）。
- base 追随: 司令塔から指示が来たら `git merge origin/main` で追随し（rebase しない）、§4.1〜7 を再実行して結果を PR 本文に追記し、push する。
- マージは司令塔が行う。worker_done は PR 作成と CI 完走を確認してから 1 回だけ送る。
- spec ファイル自体は編集しない。裁定・申告の記録は PR 本文に書く。

## 7. 制約

- **指示と実態が矛盾したら止めて question で報告する**（例: tokens.css に `--color-accent-highlight` が無い、digest の計算が一致しない、check-evidence が別の証跡を要求する、Playwright の computed 値が期待と違う）。担当範囲を戻す逆委任はしない。
- 裁量の範囲: case の label と reason の文言、report の表現、一時ファイル名、Playwright スクリプトの構成、`consumerCaseContract` の export の書き方。トークン名・utility 名・置換対象・gate（decorative）は変えない。裁量で決めた内容は PR 本文に申告する。
- 全件テスト・typecheck・check:all はローカルで実行せず PR CI で代替する。応答が遅いコマンドは打ち切らずに待つ。1 コマンドが 15 分を超えて返らない場合だけ報告する。
- 想定所要時間: 120〜180 分（global.css + contrast + tabs + 証跡 28 枚 + tabs report）。その間 commit が無くても正常。

## A. 実施内容（ブランチ `naoto24kawa/accent-tabs`）

証跡ディレクトリ `.docs/reviews/<日付>-accent-tabs/`（共有面 report.md + 28 枚 + `<日付>-tabs-preview.md`）。**commit は 3 分割**: (1) global.css + `registry.json`（registry:tokens）、(2) `tabs.tsx` + `scripts/contrast-cases.mjs` + `scripts/contrast.mjs`（digest と export。case の sourceClasses が tabs.tsx の新 class を指すため同じ commit にする）、(3) 証跡とレビュー記録。commit (1) の時点では `npm run check:contrast` は変更なしで exit 0、§4.4 は commit (2) の後に実行する。report の `verified_impl_sha` / `targeted_dynamic_sha` は (2) を指す。

### A.1 global.css

- `:root` ブロックの `--info-foreground: rgb(var(--color-status-info-text));` の直後に 3 行を足す（コメント 1 行: design system の黄アクセント `--color-accent-highlight*` へ接続する。shadcn の `--accent` と名前が衝突するため `highlight` で出す）:
  ```css
  --highlight: rgb(var(--color-accent-highlight));
  --highlight-bg: rgb(var(--color-accent-highlight-bg));
  --highlight-text: rgb(var(--color-accent-highlight-text));
  ```
- `.dark` ブロックの同じ位置（`--info-foreground` の直後）にも同じ 3 行を足す（tokens.css の dark ブロックが `--color-accent-highlight*` を 400 / 900 / 400 に切り替えるので、参照は light と同じ文字列でよい）。
- `@theme inline` の `--color-info-foreground: var(--info-foreground);` の直後に `--color-highlight: var(--highlight);`、`--color-highlight-bg: var(--highlight-bg);`、`--color-highlight-text: var(--highlight-text);` を足す。
- `npm run registry:tokens` を実行し、`registry.json` の変更を commit (1) に含める（`biome format --write registry.json` が同時に走る）。

### A.2 contrast

- `scripts/contrast.mjs` の `consumerCaseContract` を `export` にする（他は変えない）。
- `scripts/contrast-cases.mjs` の Tabs の case の直後に 2 件足す:
  - label `Tabs line indicator on background`、foreground `highlight`、background `background`、gate `decorative`、reason: 「line variant の下線はブランドの黄（light 500 / dark 400）を補助表現として使う。active は文字色（foreground vs muted-foreground）でも識別できるため非テキスト 3:1 の対象外とする。light の実測 1.68:1、dark 11.07:1」、sourceClasses `source("tabs", ["group-data-[variant=line]/tabs-list:bg-highlight", "after:bg-highlight"])`。
  - label `Tabs line indicator on card`、background `card`、他は同じ。
- 新しい digest を計算して `REQUIRED_CONSUMER_CONTRACT_DIGEST` を更新する。計算は `node --input-type=module -e` で `./scripts/contrast-cases.mjs` の `CONSUMER_CASES` と `./scripts/contrast.mjs` の `consumerCaseContract` を import し、`JSON.stringify(CONSUMER_CASES.map(consumerCaseContract).sort((a, b) => a.label.localeCompare(b.label)))` の sha256 hex を出す。計算コマンドと値を PR 本文に書く。
- `node --test scripts/contrast.test.mjs` が既存テストを落とさないこと（digest を参照するテストがあれば、その期待値も同じ手順で更新し、更新した箇所を PR 本文に書く）。

### A.3 tabs.tsx

- `TabsIndicator` の `group-data-[variant=line]/tabs-list:bg-foreground` → `group-data-[variant=line]/tabs-list:bg-highlight`。
- `TabsTrigger` の `after:bg-foreground` → `after:bg-highlight`。
- 他の class（default variant、文字色、motion）は不変。`git diff origin/main -- src/components/ui/tabs.tsx` が上の 2 語の置換だけであることを PR 本文に貼る。

### A.4 証跡（commit 3）

- `.docs/reviews/<日付>-accent-tabs/report.md`（先頭 3 行: `verified_impl_sha: <commit 2>`、`evidence_scope: shared-token-migration`、`targeted_dynamic_sha: <commit 2>`）。内容: §4.6〜8 の実測、14 subject × light / dark の HTTP / console / pageerror 表、画像一覧。
- 画像 28 枚（`<日付>-<subject>-preview-light.jpg` / `-dark.jpg`、1440×900 JPEG、新規撮影）。
- `<日付>-tabs-preview.md`（tabs の部品別 report。先頭に `verified_impl_sha: <commit 2>`。§4.8 の computed 値と、light の 1.68:1 を補助表現として受け入れた根拠）。画像は共有面の tabs 2 枚を兼用する。
- レビュー記録 `.docs/reviews/cycles/<日付>-accent-tabs.md`。

### A.5 手順書

`.docs/component-addition-procedure.md` の「組版 utility の使い方」節の末尾に「黄アクセント（`bg-highlight` / `bg-highlight-bg` / `text-highlight-text`）は Tabs line の下線にだけ使う。他の部品へ広げるときは issue で合意し、light のコントラスト（500 は 1.68:1）を contrast-cases に登録する」を 3 行以内で足す。

## 8. 実装後の裁定一覧（PR #84）

### 8.1 spec の誤記・書き漏れ

1. §A.2: case を足すと `scripts/contrast.test.mjs` の「全 case 削除」テストが新 label を必須扱いで要求する。`REQUIRED_CONSUMER_CASE_LABELS` にも 2 label を登録した（テストは変えない）。
2. §1 / §4.4: 「background 1.68」は surface（card）の値。background（canvas）は light 1.55 / dark 12.03、card は light 1.68 / dark 11.07。case の reason は実測値で書いた。陽性対照は 2 case の light FAIL と digest 不一致の両方を記録した。
3. §4.7: 生成 CSS の `after\:bg-foreground` は Tailwind が spec 本文（`.docs/plans/*.md`）も走査するため残る（#67 §8 と同じ現象）。probe は `tabs.tsx` 上の不在（0 件）と computed 色に置き換えた。`tabs-list\]\:bg-highlight` の grep 式は実 selector（`]` 無し）に補正した。
4. §A.5: 手順書の追記は commit (3) に同居でよい。

### 8.2 運用

- レビュアーが境界マーカー無しの LGTM を 2 回返した場合は、2 回目の全文を改変せず採用して flag 0 とする（3 回目は起動しない）。
- 司令塔の完了ゲートで Playwright MCP を使う場合、worktree に Playwright は入っていないので `npx astro preview --host ::1` で配信し MCP のブラウザで computed 値を測る。

### 8.3 持ち越し

- light の下線はブランドの黄 500 で 1.55〜1.68:1。非テキスト 3:1 は満たさず、active の文字色を主表現とみなして decorative gate で受容している。文字色の差だけで active を識別しにくいという指摘が出たら、濃黄 accent-text（5.22:1）への切り替えを再検討する。
- Sidebar active レール / Progress 充填への黄の展開はしない（正本の「面積を絞る」）。
