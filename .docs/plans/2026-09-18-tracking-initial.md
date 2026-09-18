# 旧 tracking utility を theme から外す（issue #89）

段階 3（issue #78）の §8.2 で持ち越した `--tracking-*: initial` を入れて回収する。PR は 1 本。

## 1. 背景（実測済み。worker は再調査しない）

- `src/styles/global.css` の非 inline `@theme` ブロック（191 行付近から）は段階 3 で作られ、`--text-*: initial`（191 行付近）と `--leading-*: initial`（216 行付近）は入っているが `--tracking-*: initial` は入っていない。`--tracking-display` / `--tracking-heading` / `--tracking-normal` / `--tracking-label` の 4 つを直書きしているだけで、**Tailwind 既定の `--tracking-tight` / `wider` / `widest` などが名前空間に残っている**。
- main 2f8c5c1 の生成 CSS（`npm run build:site` → `dist/_astro/global.*.css`）を司令塔が実測したベースライン:

| 検査 | 実測（before） |
|---|---|
| `.tracking-tight{` / `.tracking-wider{` / `.tracking-widest{` | 各 1 件 |
| `.tracking-tighter{` / `.tracking-wide{` | 各 0 件 |
| `.tracking-display{` / `.tracking-heading{` / `.tracking-normal{` / `.tracking-label{` | 各 1 件 |
| `--tracking-tight:` / `--tracking-wider:` / `--tracking-widest:` | 各 1 件 |

  旧名の utility が残っているのは、Tailwind が `.docs/plans/*.md`（過去の spec 本文に旧 class 名が書かれている）も走査するため（段階 4 の spec §8.1 で確定した現象）。`src/` での使用は 0 件で、`scripts/typography-usage.test.mjs` が `src/components/ui` / `src/blocks` / `src/site` / `src/previews` を走査して 0 件に縛っている。
- `scripts/theme-typography.test.mjs` の `declarations()` は `/--([\w-]+):\s*([^;]+);/g` で宣言を拾うので、`--tracking-*: initial` の `*` は `[\w-]` にマッチせず**既存の突合テストには影響しない**（`--text-*` と `--leading-*` の initial が既に共存できている理由も同じ）。同テストの「サイズと行間の既定値を解除し、移行中の字間 utility は残す」（75 行付近）は次の 4 つを検査しており、**3 行目が `--tracking-*:` の不在を要求している**（司令塔が実物で確認）。この PR はその assert を反転させる必要がある。

```js
assert.match(theme, /--text-\*:\s*initial;/);
assert.match(theme, /--leading-\*:\s*initial;/);
assert.doesNotMatch(theme, /--tracking-\*:/);
assert.doesNotMatch(globalCss, /--text-(?:[7-9]|\d{2,})xl\b|--leading-loose\b/);
```
- 共有トークン（global.css）を変えると `check-evidence` が共有面証跡を stale と判定する。撮り直しは `SHARED_TOKEN_IMAGE_SUBJECTS` の 14 subject（disabled-controls / alert-dialog / attachment / catalog / menubar / select / button / bubble / dialog / drawer / badge / alert / sheet / tabs）× light / dark = 28 枚。report に `verified_impl_sha` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha` を付け、`verified_impl_sha` はトークン変更 commit より後を指す。書式の見本は `.docs/reviews/2026-09-18-accent-tabs/report.md`。
- `scripts/sync-registry-tokens.mjs` は global.css の最初の `:root {` と `.dark {` だけを読む。`@theme` は対象外なので `registry.json` は変わらない。
- 環境: ローカル配信は `npx astro preview --host ::1 --port <空きポート>`。`gh` / `git push` が「can't assign requested address」で失敗したら 60 秒間隔で最大 10 回再試行し、通らなければ escalation。

## 2. 記法

- 変更してよいのは `src/styles/global.css`、`scripts/theme-typography.test.mjs`、`.docs/reviews/` の新規証跡だけ。
- 部品・block・site・preview・`design-tokens.html` / `build-tokens.mjs` / `tokens.css` / `registry.json` / `provenance.json` は触らない。
- コミットメッセージ・PR 本文・レビュー記録・report は日本語。commit 末尾に `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`、PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。

## 3. スコープ外

- 旧 tracking 名を使っている箇所の置換（すでに 0 件）。
- `.docs/plans/*.md` の過去 spec から旧 class 名を消すこと（履歴なので触らない）。
- `--text-*` / `--leading-*` の値の変更、`:lang(en)` の再調整（段階 3 の持ち越し）。

## 4. 検証（rubric。結果は PR 本文と worker_done に実測値で書く）

1. `node scripts/check-standards.mjs` exit 0。`npm run lint` exit 0（error 0）。
2. `node --test scripts/theme-typography.test.mjs`、`node --test scripts/typography-usage.test.mjs`、`node --test scripts/contrast.test.mjs`、`node --test scripts/check-completeness.test.mjs`、`node --test scripts/catalog-build.test.mjs`、`node --test scripts/docs-site.test.mjs` がそれぞれ exit 0 で fail 0 / skip 0。既存 `test(` の削除行が無い。
3. `npm run build:lib` → `npm run check:props` → `node scripts/check-completeness.mjs` → `node scripts/check-preview-render.mjs` を 1 つずつ実行し全部 exit 0。
4. `npm run registry:build` → `node scripts/check-distribution.mjs` exit 0。`git diff --exit-code registry.json` exit 0（`@theme` は cssVars に載らない）。
5. `npm run build:site` exit 0。生成 CSS `dist/_astro/global.*.css` で次を実測し、§1 の before と並べて記録する:
   - `grep -c '\.tracking-tight{'`、`'\.tracking-wider{'`、`'\.tracking-widest{'`、`'\.tracking-tighter{'`、`'\.tracking-wide{'` がすべて **0**（before は 1 / 1 / 1 / 0 / 0）。
   - `grep -c '\.tracking-display{'`、`'\.tracking-heading{'`、`'\.tracking-normal{'`、`'\.tracking-label{'` がすべて **1**（before と同じ）。
   - `grep -c -- '--tracking-tight:'`、`'--tracking-wider:'`、`'--tracking-widest:'` がすべて **0**（before は各 1）。`grep -o -- '--tracking-[a-z]*:' | sort -u` の出力が `--tracking-display:` / `--tracking-heading:` / `--tracking-label:` / `--tracking-normal:` の 4 つだけであること（値で照合しない。minify で `0.05em` が `.05em` になり、値の文字列一致は前後どちらでもマッチせず偽の通過になる）。
6. Playwright（headless Chromium、viewport 1440×900、`npx astro preview --host ::1 --port <空きポート>`）で `/`、`/components/`、`/components/button/` を light / dark で開き、次を確認する:
   - HTTP 200、console error 0（favicon 404 は別記）、pageerror 0。
   - `[data-site-eyebrow]` の computed `letterSpacing` が `0.88px`（`tracking-label` が生きている）、masthead の wordmark の `letterSpacing` が負（`tracking-heading`）、`body` の `letterSpacing` が `0.32px`（`tracking-normal`）。
   - `document.documentElement.scrollWidth === clientWidth`（字間の変化で横 overflow が出ていないこと）。
7. `node scripts/check-evidence.mjs` exit 0（report を書いた直後と証跡 commit 後の 2 回）。
8. `git diff --stat origin/main` の変更ファイルが §A の一覧 + 新規証跡だけであること（先頭 commit の spec は司令塔が入れた明記済みの例外）。

## 5. レビューサイクル（委譲先で完結）

- レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を fresh context で 1 回 1 レンズずつ順に起動する（Fresh Eyes → Security → Core Logic → Tests → Domain）。入力は担当ファイルに絞った diff・変更ファイル全文・spec §1 / §2 / §4 / §A のみ。最大 3 ラウンド。出力が壊れていたら同じレンズを 1 回だけ取り直し、2 回目も壊れていれば 2 回目の全文を改変せず採用する（境界マーカーが無くても本文が LGTM を明示していれば flag 0）。記録は `.docs/reviews/cycles/<日付>-tracking-initial.md`（先頭に `verified_impl_sha:` 行）。
- flag（確信度 80% 以上）が 0 になるまで修正 → 再レビュー。上限に達したら残りを PR 本文に ACCEPTED_RISKS として書く。

## 6. 完了条件

- PR は base `main`、本文に `Closes #89`。本文の節: 関連 Issue / エージェント実装の来歴 / 変更内容 / 検証結果（§4 の各項目の実測値。§5 の before / after 表を含む）/ レビュー記録 / 変更範囲（§4.8）と base 確認 / 裁量で決めた内容の申告。
- base 追随: 司令塔から指示が来たら `git merge origin/main`（rebase しない）で追随し、§4.1〜6 を再実行して結果を PR 本文に追記し、push する。issue #90（一覧の絞り込みと横はみ出し修正）が並走しており、先にマージされた場合は追随が要る（触るファイルが素なので conflict は想定しない）。
- マージは司令塔が行う。worker_done は PR 作成と CI 完走を確認してから 1 回だけ送る。
- spec ファイル自体は編集しない。裁定・申告の記録は PR 本文に書く。

## 7. 制約

- **指示と実態が矛盾したら止めて question で報告する**（例: initial を入れると既存テストが落ちる、生成 CSS の件数が想定と違う、check-evidence が別の証跡を要求する）。担当範囲を戻す逆委任はしない。
- 裁量の範囲: テストに足す assert の書き方、report の表現、一時ファイル名、Playwright スクリプトの構成。トークンの値・`initial` を置く位置の方針・証跡の枚数は変えない。裁量で決めた内容は PR 本文に申告する。
- 全件テスト・typecheck・check:all はローカルで実行せず PR CI で代替する。応答が遅いコマンドは打ち切らずに待つ。1 コマンドが 15 分を超えて返らない場合だけ報告する。
- 想定所要時間: 90〜150 分（global.css 1 行 + テスト + 証跡 28 枚）。その間 commit が無くても正常。

## A. 実施内容（ブランチ `naoto24kawa/tracking-initial`）

証跡ディレクトリ `.docs/reviews/<日付>-tracking-initial/`（共有面 report.md + 28 枚）。**commit は 2 分割**: (1) `global.css` + `scripts/theme-typography.test.mjs`、(2) 証跡とレビュー記録。report の `verified_impl_sha` / `targeted_dynamic_sha` は (1)。

### A.1 global.css

非 inline `@theme` ブロックの `--tracking-display: -0.02em;` の**直前**に 1 行足す（コメント 1 行つき: Tailwind 既定の tracking を解除し、design system の 4 段だけを残す）:

```css
  --tracking-*: initial;
```

`--tracking-display` 以下の 4 行は現状のまま（`initial` の後に再定義される順序であることを確認する）。他の行は変えない。

### A.2 突合テストの追記（`scripts/theme-typography.test.mjs`）

既存のテスト「サイズと行間の既定値を解除し、移行中の字間 utility は残す」（75 行付近）の 3 行目 `assert.doesNotMatch(theme, /--tracking-\*:/)` を **`assert.match(theme, /--tracking-\*:\s*initial;/)` に反転**させ、テスト名を実態へ合わせる（例: 「サイズ・行間・字間の既定値を解除する」）。他の 3 つの assert は変えない。`test(` の数は減らさない。陽性対照として、`--tracking-*: initial` を取り除いた文字列に対して fail することを 1 件のテストで確認する（ファイルは触らず文字列で。既存の陽性対照テストと同じ書き方）。

### A.3 証跡（commit 2）

- `.docs/reviews/<日付>-tracking-initial/report.md`（先頭 3 行: `verified_impl_sha: <commit 1>`、`evidence_scope: shared-token-migration`、`targeted_dynamic_sha: <commit 1>`）。内容: §4.5 の before / after 表、§4.6 の computed style、14 subject × light / dark の HTTP / console / pageerror 表、画像一覧。
- 画像 28 枚（`<日付>-<subject>-preview-light.jpg` / `-dark.jpg`、1440×900 JPEG、新規撮影）。
- レビュー記録 `.docs/reviews/cycles/<日付>-tracking-initial.md`。

## 8. 実装後の裁定一覧（PR #92）

### 8.1 spec の誤記・書き漏れ

1. §A の commit 分割が誤っていた。`src/styles/global.css` と `scripts/theme-typography.test.mjs` を 1 commit にまとめ、その commit を report の `verified_impl_sha` / `targeted_dynamic_sha` に指定していたが、`scripts/check-evidence.mjs` の `sharedTokenReportProblems` は `SHARED_TOKEN_PATHS` の最終変更 commit が `report.sha` の**厳密な**祖先であることを要求するため、必ず失敗する。worker が着手前の question で指摘し、司令塔が同スクリプトを読んで裏を取ったうえで **(1) global.css のみ / (2) theme-typography.test.mjs のみ / (3) 証跡とレビュー記録** の 3 commit に分け、report の両 SHA を (2) に向ける裁定を返した。空 commit で祖先を作る代替案は採らなかった（履歴に意味のある commit だけを残すため）。
2. 1 の一般化: **共有トークンを変える委任仕様は、トークンファイルを単独 commit に切り出す指示を最初から書く**。AGENTS.md は「`verified_impl_sha` はトークン変更コミットより後」とだけ書いており、commit をどう割ればその条件を満たせるかまでは書いていないため、brief を書く側が同じ誤りを繰り返す。

### 8.2 運用

- worker の裁量で陽性対照テストを 1 件足した（`--tracking-*: initial;` を削った文字列に対して `assert.throws` が `ERR_ASSERTION` を投げることを確かめる）。負の検査が沈黙していないことを確かめる方針に合致するので採用した。既存テストは削除・skip せず、名前だけ実態へ合わせて改名している（件数 6 → 7、削除 0）。
- 生成 CSS の検査は**名前ベース**で行う（`.tracking-tight{` の有無）。値で突合すると minify で `0.05em` が `.05em` になり偽の通過を作る。負の検査は、存在すべき `.tracking-display{` 等が 1 件ヒットすることを陽性対照にして健全性を確かめる。
- 司令塔の完了ゲートも実体で測った。生成 CSS の旧 utility 5 種が 0 件、design system の 4 種が各 1 件、実ブラウザの computed letterSpacing が 4 段に対応、`check-evidence` exit 0、`git merge-base --is-ancestor` による祖先関係の検算まで独立に実施した。

### 8.3 持ち越し

- 段階 3 からの持ち越しだった `--tracking-*: initial` は本 PR で解消した。
- `check-evidence` が出す既存の shared stale 2 件と過去履歴 92 件は本 PR の範囲外で、そのまま残る。
