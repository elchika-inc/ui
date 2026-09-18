# 一覧ページの絞り込みと install カードの横はみ出し修正（issue #90）

公開一覧 `/components/` に絞り込みを足し、`/components/<name>/` の install カードが狭い画面で横にはみ出すのを直す。PR は 1 本。

## 1. 背景（実測済み。worker は再調査しない）

### 1.1 一覧ページの現状

- `src/site/component-index.tsx`（185 行）が `DocumentationShell`（サイドバー）の中で、`categorizePreviewItems(previewItems)` が返す 11 カテゴリを `categories.map` で描画する。1 カテゴリごとに `<section>`、その中に Mono の eyebrow（`section`）→ h2（カテゴリ名）→ 右端に `{category.items.length} items`（`font-mono text-2xs text-muted-foreground`）→ `grid gap-5 lg:grid-cols-2 xl:grid-cols-3` のカード群。
- カテゴリと件数（main 2f8c5c1 の実測）: アクション 4 / フォーム 14 / データ表示 11 / ナビゲーション 7 / オーバーレイ 9 / フィードバック 6 / モーション 5 / チャット 6 / レイアウト 6 / 認証 10 / アプリシェル 18。合計 96。
- カードは `ComponentIndexCard`（`data-component-index-item="<name>"` と `data-component-index-kind="block|component"`）。component は preview を `aria-hidden="true"` かつ `inert` かつ `pointer-events-none` の器に直接描画し、block は明示ボタンで iframe を読み込む（`loadedBlocks` / `captureScrollPosition` / `restoreScrollAfterLoad` の状態管理がある）。
- 検索に使えるデータは `previewItems` の `name`（`text-reveal`）と `title`（`Text Reveal`）、`categories` のカテゴリ名（「モーション」）、`blockNames` による種別（`block` / `component`）。`PreviewItem` は `{ name, title, Preview }` の 3 つだけで説明文は持たない。
- 使える既存部品: `src/components/ui/input-group.tsx`（`InputGroup` / `InputGroupInput` / `InputGroupAddon` / `InputGroupButton` / `InputGroupText`）、`src/components/ui/empty.tsx`（`Empty` / `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent`）、`src/components/ui/button.tsx`。lucide-react のアイコンは既に依存にある。
- `scripts/catalog-build.test.mjs` には「component一覧がpreview scanの全件を描画する」（`data-component-index-item` の集合が preview 全件と一致）と「component一覧のblock判定がregistry:blockと一致する」がある。**絞り込みはクライアント側の状態なので、SSR の HTML では全件が描画されたままになる**（初期状態が空の検索語なら全件）。したがってこの 2 件は変更不要で、落とさないこと。

### 1.2 install カードの横はみ出し（司令塔が 375×812 で実測）

- 対象は `src/site/component-documentation.tsx` の install 節（126 行付近）の `<div className="grid gap-5 lg:grid-cols-2">` の中にある 2 つの `<article className="flex flex-col gap-3 rounded-xl border border-border p-5">`。
- `/components/text-reveal/` を 375px 幅で開いた実測: `documentElement.scrollWidth` = **641**（`clientWidth` 375）。はみ出しの最上位は `article` で幅 625 / `min-width: auto`。その中の `pre`（`CommandBlock`、`overflow-x-auto` を持つ）は幅 583、`code` は幅 549。
- ブラウザ上で `article` に `min-width: 0` を当てた実測: `scrollWidth` が **375** に収まり、`pre` の幅 301 で `pre.scrollWidth > pre.clientWidth` が true（`overflow-x-auto` が効いて横スクロールになる）。`pre` 側にも `min-width: 0` を当てても値は変わらない（375）。**原因は grid item である `article` の `min-width: auto`**。
- `CommandBlock`（`src/site/documentation-shell.tsx` の 38 行付近）は `<pre className="overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">`。トップページの導入手順でも使われている。

### 1.3 共通の制約

- `global.css` は触らない（共有トークンを変えると共有面証跡 28 枚が必要になる。`--tracking-*: initial` は issue #89 で別 PR が並走している）。
- 生の色指定と値系 arbitrary value を使わない。`max-w-[…]` や `w-[…]` は `scripts/check-standards.mjs` の ARBITRARY 正規表現に当たる。`min-w-0` は Tailwind の既定 utility なのでそのまま使える。
- `scripts/typography-usage.test.mjs` が `src/site` も走査し、`text-xs` の使用を裁定済みの 12 箇所に限定し、`tracking-(tighter|tight|wide|wider|widest)` と数値 `leading-N` を 0 件に縛る。新しい UI で `text-xs` と旧 tracking 名・数値 leading を使わない（`text-2xs` / `text-3xs` / `tracking-heading` / `tracking-label` / `leading-*` の段を使う）。
- `src/site/` の変更に対して `check-evidence` は証跡を強制しないが、見た目が変わるので自主的に残す。**置き場は `.docs/reviews/` 直下のフラット形式**。ただし `<日付>-index-page.md` という名前は **PR #87 が 2026-09-18 付で既に作っており（`.docs/reviews/2026-09-18-index-page.md`）、証跡は immutable なので同名で上書きできない**。本 PR の report は `<日付>-index-search.md` にする（`inspectMarkdown` は先頭の `verified_impl_sha` を必須とし、`evidencePaths` が認識しない stem でも証跡として通る）。**既存の `2026-09-18-index-page.md` とその画像 2 枚は触らない**。書式の見本としてだけ読む。
- 環境: ローカル配信は `npx astro preview --host ::1 --port <空きポート>`。`gh` / `git push` が「can't assign requested address」で失敗したら 60 秒間隔で最大 10 回再試行し、通らなければ escalation。

## 2. 記法

- 変更してよいのは `src/site/component-index.tsx`、`src/site/component-documentation.tsx`、`src/site/documentation-shell.tsx`（`CommandBlock` を触る場合のみ）、`.docs/reviews/` の新規証跡、手順書の 1 節だけ。
- `src/components/ui/*`・`src/blocks/*`・`src/previews/*`・`src/styles/*`・`registry.json`・`provenance.json`・`scripts/*` は触らない（必要だと判断したら question）。
- 文言は日本語。Mono の uppercase ラベルだけ英語。
- commit 末尾に `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`、PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。

## 3. スコープ外

- `/catalog/` と `/preview/*` の変更。
- 検索結果の並び替え、タグ付け、URL クエリへの検索語の反映、キーボードショートカット（`/` や Esc）。
- サイドバーのナビの絞り込み。
- `global.css` の変更。
- `block` の iframe 読み込みの挙動（`loadedBlocks` の状態管理）を変えること。

## 4. 検証（rubric。結果は PR 本文と worker_done に実測値で書く）

1. `node scripts/check-standards.mjs` exit 0。`npm run lint` exit 0（error 0）。
2. `node --test scripts/catalog-build.test.mjs`、`node --test scripts/docs-site.test.mjs`、`node --test scripts/site-delivery.test.mjs`、`node --test scripts/typography-usage.test.mjs`、`node --test scripts/check-completeness.test.mjs`、`node --test scripts/contrast.test.mjs` がそれぞれ exit 0 で fail 0 / skip 0。既存 `test(` の削除行が無い。
3. `npm run build:lib` → `npm run check:props` → `node scripts/check-completeness.mjs` → `node scripts/check-preview-render.mjs` を 1 つずつ実行し全部 exit 0。
4. `npm run registry:build` → `node scripts/check-distribution.mjs` exit 0。`git diff --exit-code registry.json` exit 0。
5. `npm run build:site` exit 0。ページ数を記録する。
6. Playwright（headless Chromium、`npx astro preview --host ::1 --port <空きポート>`）で次を実測する。console error 0（favicon 404 は別記）、pageerror 0 を全ケースで確認する。
   - **絞り込み（viewport 1440×900、`/components/` の light / dark）**:
     - 初期状態で `[data-component-index-item]` が 96 件、カテゴリ見出し（`section` 要素）が 11 件。
     - 検索欄（`[data-index-search]`）に `text` と入力 → 残るカードの `data-component-index-item` の一覧と件数を記録（`text-reveal` / `text-swap` / `textarea` を含むこと）。
     - `モーション` と入力 → モーションカテゴリの 5 件（animated-number / icon-swap / success-check / text-reveal / text-swap）だけが残り、他のカテゴリ見出しが 0 件になること。
     - `Text Reveal` と入力（表示名・空白・大文字を含む）→ `text-reveal` が残ること。`TEXTREVEAL` と入力（大文字・ハイフン無し）→ 同じく残ること。
     - `block` と入力 → 残るカードがすべて `data-component-index-kind="block"` で 28 件であること。
     - 各カテゴリ見出しの件数表示が、絞り込み後に残ったカードの数と一致すること（少なくとも 3 カテゴリで突合）。
     - 該当 0 件になる語（`zzzz`）→ `[data-index-search-empty]` が 1 件表示され、カードが 0 件、カテゴリ見出しが 0 件。クリア操作（`[data-index-search-clear]`）を押すと 96 件に戻ること。
     - 検索欄の `input` に `type="search"` 相当の役割と、スクリーンリーダー向けのラベル（`aria-label` か `<label>`）があること。絞り込み結果の件数が `aria-live` で読み上げられること（`[data-index-search-status]`）。
   - **横はみ出し（viewport 375×812）**: `/components/text-reveal/`、`/components/button/`、`/components/login-01/`（block）と `/`（トップ）と `/components/`（一覧）を light で開き、`documentElement.scrollWidth === clientWidth` であること（before は `/components/text-reveal/` で 641 対 375）。install カードの `pre` で `scrollWidth > clientWidth` かつ横スクロールできること（`pre.scrollLeft` を動かして確認）。
   - **1440px の回帰**: `/components/button/` で install カードが 2 列（`lg:grid-cols-2`）のまま、`scrollWidth === clientWidth` であること。
7. 証跡は `.docs/reviews/` 直下にフラットで置く: report は `<日付>-index-search.md`（先頭に `verified_impl_sha`。絞り込みと横はみ出しの実測を 1 本にまとめる。既存の `2026-09-18-index-page.md` は触らない）、画像は `<日付>-index-search-light.jpg` / `-dark.jpg`（一覧の絞り込み後の状態）、`<日付>-index-search-empty-light.jpg`（0 件案内）、`<日付>-component-page-375-light.jpg`（375px の個別ページ）の 4 枚（1440×900、375px のものは 375×812）。`node scripts/check-evidence.mjs` を report 直後と証跡 commit 後に実行し、どちらも exit 0。**名前を受け付けない診断が出たら止めて question で報告する**。
8. `git diff --stat origin/main` の変更ファイルが §A の一覧 + 新規証跡だけであること（先頭 commit の spec は司令塔が入れた明記済みの例外）。

## 5. レビューサイクル（委譲先で完結）

- レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を fresh context で 1 回 1 レンズずつ順に起動する（Fresh Eyes → Security → Core Logic → Tests → Domain）。入力は担当ファイルに絞った diff・変更ファイル全文・spec §1 / §2 / §4 / §A のみ。最大 3 ラウンド。出力が壊れていたら同じレンズを 1 回だけ取り直し、2 回目も壊れていれば 2 回目の全文を改変せず採用する。記録は `.docs/reviews/cycles/<日付>-index-search.md`（先頭に `verified_impl_sha:` 行）。
- flag（確信度 80% 以上）が 0 になるまで修正 → 再レビュー。上限に達したら残りを PR 本文に ACCEPTED_RISKS として書く。

## 6. 完了条件

- PR は base `main`、本文に `Closes #90`。本文の節: 関連 Issue / エージェント実装の来歴 / 変更内容と §A の対応 / 検証結果（§4 の各項目の実測値）/ レビュー記録 / 変更範囲（§4.8）と base 確認 / 裁量で決めた内容の申告 / ACCEPTED_RISKS。
- base 追随: 司令塔から指示が来たら `git merge origin/main`（rebase しない）で追随し、§4.1〜6 を再実行して結果を PR 本文に追記し、push する。issue #89（`--tracking-*: initial`）が並走しており、先にマージされた場合は追随が要る（conflict は想定しない。触るファイルが素）。
- マージは司令塔が行う。worker_done は PR 作成と CI 完走を確認してから 1 回だけ送る。
- spec ファイル自体は編集しない。裁定・申告の記録は PR 本文に書く。

## 7. 制約

- **指示と実態が矛盾したら止めて question で報告する**（例: `min-w-0` で横はみ出しが解消しない、既存テストが落ちる、`InputGroup` の API が spec の想定と違う、check-evidence が別の証跡を要求する）。担当範囲を戻す逆委任はしない。
- 裁量の範囲: 検索の照合アルゴリズムの実装（正規化の書き方）、React の状態管理の構成、検索欄の配置（ヘッダー直下の固定位置か本文の先頭か）、プレースホルダと 0 件案内の文言、report の表現、一時ファイル名、Playwright スクリプトの構成。**`data-index-search*` の属性名・検索対象（名前 / 表示名 / カテゴリ名 / 種別）・件数表示と 0 件案内を出す方針・`min-w-0` による修正方針は変えない**。裁量で決めた内容は PR 本文に申告する。
- 全件テスト・typecheck・check:all はローカルで実行せず PR CI で代替する。応答が遅いコマンドは打ち切らずに待つ。1 コマンドが 15 分を超えて返らない場合だけ報告する。
- 想定所要時間: 150〜240 分。その間 commit が無くても正常。

## A. 実施内容（ブランチ `naoto24kawa/index-search`）

証跡は `.docs/reviews/` 直下にフラットで置く。**commit は 2 分割**: (1) 実装（`component-index.tsx`・`component-documentation.tsx`・必要なら `documentation-shell.tsx`・手順書）、(2) 証跡とレビュー記録。report の `verified_impl_sha` は (1)。

### A.1 一覧ページの絞り込み（`src/site/component-index.tsx`）

- ヘッダー（`Component index` の eyebrow と h1 と説明文）の直後に検索欄を置く。`InputGroup` + `InputGroupAddon`（lucide の `SearchIcon`、`aria-hidden`）+ `InputGroupInput`（`data-index-search`、`aria-label="コンポーネントを絞り込む"`、プレースホルダは名前・表示名・カテゴリで引けることが伝わる日本語）。`type` は裁量でよいが、`type="search"` にすると Chromium が独自の ✕ を出して `data-index-search-clear` と二重になるので、`type="text"` にするか `[&::-webkit-search-cancel-button]:hidden`（arbitrary *variant* なので check-standards の値系検査には当たらない）でネイティブ側を隠す。どちらにしたか PR 本文に申告する。入力があるときだけ `InputGroupButton`（`data-index-search-clear`、`aria-label="絞り込みを消す"`、lucide の `XIcon`）を出す。
- 絞り込みの照合: 検索語とデータの両方を「小文字化 + 空白とハイフンを除去」した文字列で部分一致させる。対象は `name` / `title` / カテゴリ名 / 種別（`block` または `component`）の 4 つで、いずれかに当たれば残す。検索語が空なら全件。
- カテゴリの描画: 残ったカードが 0 件のカテゴリは `<section>` ごと出さない。件数表示（`{n} items`）は**残った数**にする。
- 件数の読み上げ: 検索欄の近くに `data-index-search-status` を持つ要素を置き、`aria-live="polite"` で「N 件」（0 件のときはその旨）を出す。視覚的にも件数が分かるようにする。
- 全体で 0 件のとき: `Empty` + `EmptyHeader` + `EmptyMedia`（`variant="icon"` に lucide の `SearchXIcon` 等）+ `EmptyTitle`（「該当する component がありません」相当）+ `EmptyDescription`（名前・表示名・カテゴリで引けることの案内）+ `EmptyContent`（クリアの `Button`）を `data-index-search-empty` を持つ器に出す。
- 既存の block 読み込み（`loadedBlocks` / スクロール位置の復元）の挙動は変えない。絞り込みで一度隠れた block が再表示されたとき、読み込み済みの状態が保たれること（`loadedBlocks` は name の集合なので自然に保たれるはず。実測で確認する）。
- `DocumentationShell` に渡す `categories`（サイドバー用）は絞り込みの影響を受けない（サイドバーは常に全件）。

### A.2 install カードの横はみ出し（`src/site/component-documentation.tsx`）

- install 節の 2 つの `<article className="flex flex-col gap-3 rounded-xl border border-border p-5">` に `min-w-0` を足す（§1.2 の実測で `scrollWidth` 641 → 375 になることを確認済み）。
- 同じ形の grid + `CommandBlock` の組みが他にもあれば（トップの導入手順など）、375px で実測して同様にはみ出すなら同じ修正を当てる。**実測してから直す**（推測で広げない）。修正した箇所を PR 本文に列挙する。
- `CommandBlock` 自体（`documentation-shell.tsx`）を変える必要が実測で出たら、`min-w-0` の追加だけに留める。

### A.3 手順書

`.docs/component-addition-procedure.md` の「ドキュメントサイトの意匠」節の末尾に、一覧の絞り込みで使う属性（`data-index-search` / `-clear` / `-status` / `-empty`）と「grid / flex の item に長いコードブロックを置くときは `min-w-0` を付ける」を 5 行以内で足す。

## 8. 実装後の裁定一覧（PR #91）

### 8.1 spec の誤記・書き漏れ

1. 検索対象を §A.1 で「名前 / 表示名 / カテゴリ名 / 種別（block・component）」の 4 つと定めたが、起票時にユーザーが選んだのは「名前・表示名・カテゴリ名」の 3 つだった。**種別は spec を書く段階で司令塔が足したもの**で、worker は spec どおりに実装している。非破壊だが選択を広げた事実として記録する（不要なら別 PR で外す）。
2. report の命名は spec の時点で `<日付>-index-search.md` に直してあり実装で問題は起きなかった。`2026-09-18-index-page.md` は PR #87 が作成済みで証跡は immutable なので、同名で上書きできない。**証跡を追加する仕様を書くときは、既存の同名 stem の有無を先に確かめる**。

### 8.2 運用

- 検索欄の `type` は spec が選択を委ね、worker は `type="search"` と `[&::-webkit-search-cancel-button]:hidden` の併用を選んだ（Chromium のネイティブ ✕ が `data-index-search-clear` と二重になるのを避けるため）。arbitrary *variant* なので `check-standards` の値系検査には当たらない。
- base 追随は**司令塔が `gh pr update-branch` で実行する**。worker_done 済みの dispatch には status を送れず、追随のためだけに新しい Dispatch を立てるのは割に合わない。追随後は新しい head で verdict を投稿し直し、`--match-head-commit` に新 head を渡す。
- 共有トークンを変える PR と並走する場合、**併合後の木で `check-evidence` を 1 回回す**。各ブランチ単独の実行は、トークン変更と site 変更が同居する状態を検査していない。本 PR では追随後の head でこれを実施して exit 0 を確認した（CI の Evidence check step も同じ状態を検査する）。
- `## 解説（eli5）` は N/A にした。プラグインは `~/.claude/plugins/cache/claude-community/eli5` にキャッシュされているが、本セッションの skill 一覧に載らず起動できなかった。
- Orca のメッセージ待ちは `--types question,escalation,worker_done,status` で絞る。無指定だと heartbeat が届くたびに司令塔が起こされ、往復だけが増える。

### 8.3 持ち越し

- issue #52 の持ち越し 2 件（`--tracking-*: initial` と 375px の install カード overflow）は PR #92 と本 PR で解消した。
- スコープ外のまま残す: 検索結果の並び替え、タグ付け、URL クエリへの検索語の反映、キーボードショートカット（`/` や Esc）、サイドバーのナビの絞り込み。
