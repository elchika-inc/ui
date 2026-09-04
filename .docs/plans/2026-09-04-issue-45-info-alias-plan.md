# 委任仕様 C: alias 層に `--info` / `--info-foreground` を追加する（Issue #45）

## 1. 背景（実測済み。再調査不要）
- Issue: https://github.com/elchika-inc/ui/issues/45
- `src/styles/global.css` は `@theme inline` ブロック（46〜49 行付近）に `--color-success` / `--color-success-foreground` / `--color-warning` / `--color-warning-foreground` を、`:root`（103〜106 行付近）と `.dark`（149〜152 行付近）に `--success` / `--success-foreground` / `--warning` / `--warning-foreground` を持つ。`--info` 系は 3 ブロックのどこにも無い。
- 下層の `src/styles/design-system/tokens.css` には `--color-status-info` / `--color-status-info-bg` / `--color-status-info-text` が light（64〜66 行）と dark（259〜261 行）に既にある。**`tokens.css` は生成物で、正本は `design-tokens.html` と `build-tokens.mjs`。今回は下層を変更しない。**
- `scripts/sync-registry-tokens.mjs`（`npm run registry:tokens`）は `global.css` の `:root` / `.dark` を読み、`registry.json` の全 item の `cssVars` へ流し込んで biome format する。alias を足したら実行して `registry.json` をコミットする。
- `scripts/contrast.mjs` は `:root` と `.dark` の alias が両方に在り値が一致することを検査する（片方だけ足すと fail）。`scripts/contrast-cases.mjs` には `warning pair`（`warning-foreground` on `warning`、gate `text-aa`）の consumer case があるが `success` / `info` の pair は無い。`contrast.mjs` の `REQUIRED_CONSUMER_CONTRACT_DIGEST`（49 行付近）は必須 case 集合の契約 SHA-256 で、case を足すと一致しなくなり「必須 consumer case の gate / theme / paint / source class / risk 契約が一致しない」で fail する。digest は `consumerCases.map(consumerCaseContract).sort(label順)` を `JSON.stringify` した SHA-256（88〜90 行付近）。
- `build-tokens.mjs` 278 行付近で `--color-status-info-text` vs `--color-status-info-bg` の 4.5:1 は既に検査され、現行 main で通っている（`check:pre` exit 0）。
- `scripts/check-evidence.mjs` は `SHARED_TOKEN_PATHS = ["src/styles/global.css", "src/styles/design-system/tokens.css"]` の変更を検知し、`evidence_scope: shared-token-migration` の最新証跡が次を満たすことを要求する: ① `verified_impl_sha` と `targeted_dynamic_sha` が 40 桁小文字 SHA で HEAD の祖先 ② `global.css` の最終変更 commit が `verified_impl_sha` の**厳密な祖先**（同一 commit は不可）③ `verified_impl_sha` が `targeted_dynamic_sha` の祖先 ④ `targeted_dynamic_sha` 以降に SHARED_TOKEN_PATHS の変更が無い ⑤ 証跡 Markdown と同じコミットに 14 subject × light/dark = 28 枚の画像が追加されている。
- 28 枚の subject と route（既存の `.docs/reviews/font-unify-ibm-plex/` と同じ）: `alert-dialog` / `attachment` / `menubar` / `select` / `button` / `bubble` / `dialog` / `drawer` / `badge` / `alert` / `sheet` / `tabs` は `/preview/<subject>/` と `/preview/<subject>-dark/`。`catalog` と `disabled-controls` は `/catalog/` と `/catalog-dark/` を全画面で撮り、それぞれ別ファイルとして保存する。ファイル名は `2026-09-04-<subject>-preview-light.jpg` / `-dark.jpg`（`catalog` は `2026-09-04-catalog-preview-light.jpg`、`disabled-controls` は `2026-09-04-disabled-controls-light.jpg` のように既存例と同じ stem）。
- README / DESIGN.md / `src/site/**` に alias 一覧の記述は無い（grep 済み）。ドキュメント追記は不要。
- ui 側の component で `bg-info` 等を使う箇所は無いので、ビルド成果物に `.bg-info` は出ない（Tailwind v4 は使用クラスだけ出力する）。利用側で到達することの実証は 2.5 の probe で行う。

## 2. 実施内容（literal）
### 2.1 `src/styles/global.css`（コミット 1: これだけを単独コミットにする）
1. `@theme inline` の `--color-warning-foreground: var(--warning-foreground);` の直後に 2 行追加:
   `--color-info: var(--info);`
   `--color-info-foreground: var(--info-foreground);`
2. `:root` の `--warning-foreground: rgb(var(--color-status-warning-text));` の直後に 2 行追加:
   `--info: rgb(var(--color-status-info-bg));`
   `--info-foreground: rgb(var(--color-status-info-text));`
3. `.dark` の同じ行の直後に、2 と同一の 2 行を追加する（light / dark で式を完全一致させる）。
4. インデントは前後の行に揃える。他の行を変更しない。

### 2.2 `registry.json`（コミット 2 に含める）
- `npm run registry:tokens` を実行し、生成された `registry.json` の差分をそのままコミットする。手で編集しない。

### 2.3 `scripts/contrast-cases.mjs` と `scripts/contrast.mjs`（コミット 2 に含める）
1. `contrast-cases.mjs` の `warning pair` の `foregroundOn({...})` の直後に追加する:
   `foregroundOn({ label: "info pair", foreground: "info-foreground", background: "info", reason: "info の本文 pair は通常テキストとして AA を満たす必要がある" }),`
   （`risk` は付けない。`gate` は省略して既定の `text-aa` に任せる。`warning pair` が `gate` を明示していればそれと同じ値を書く。）
2. `contrast.mjs` の必須 label 集合（`"warning pair",` を含む `Set` の初期化配列）に `"info pair",` を追加する。
3. `REQUIRED_CONSUMER_CONTRACT_DIGEST` を新しい値へ更新する。手順: 88〜90 行付近の `digest` 計算の直後に一時的に `console.error(digest)` を挿入して `npm run check:contrast` を実行し、出力された 64 桁を定数へ写してから一時行を削除する。**旧 digest と新 digest の両方を PR 本文へ記録する。**
4. `scripts/contrast.test.mjs` が digest や必須 label 数を固定している箇所があれば、その期待値だけを追随させる（テストの構造は変えない）。無ければ触らない。

### 2.4 `.docs/plans/2026-09-04-issue-45-info-alias-plan.md`（コミット 2 に含める）
- この委任仕様の全文をそのまま保存する。

### 2.5 利用側到達の probe（コミットしない。結果だけ記録する）
1. worktree 配下の `.playwright-mcp/probe/` に `info.html` を作り、`<span class="bg-info text-info-foreground">info</span>` を含める。
2. worktree ルートで `npx --yes @tailwindcss/cli@4 -i src/styles/global.css -o .playwright-mcp/probe/out.css` を実行する（Tailwind v4 の CLI は cwd 配下のソースを自動走査する）。npx がネットワーク不通で失敗したら、その旨を記録して本 probe を省略する（他の検証は続ける）。
3. `grep -c '\.bg-info' .playwright-mcp/probe/out.css` と `grep -c -- '--color-info:' .playwright-mcp/probe/out.css` の値を記録する（期待: いずれも 1 以上）。
4. `.playwright-mcp/` は終了時に削除する。

### 2.6 コミット構成（順序を守る。理由は背景の ②）
- コミット 1: `global.css` のみ。
- コミット 2: `registry.json` / `contrast-cases.mjs` / `contrast.mjs` /（あれば `contrast.test.mjs`）/ `.docs/plans/...-plan.md`。**この SHA を `verified_impl_sha` と `targeted_dynamic_sha` の両方に使う。**
- コミット 3: 証跡（2.7）。
- レビューサイクルの修正で `global.css` を再度変更した場合は、その後に必ず別コミットを 1 つ以上置いてから証跡を撮り直し、`verified_impl_sha` / `targeted_dynamic_sha` をその新しい commit にする（既に作った証跡ファイルは編集せず、新しい日付付きディレクトリで作り直す）。

### 2.7 証跡（コミット 3）
- ディレクトリ `.docs/reviews/2026-09-04-info-alias/` を作り、`report.md` と 28 枚の JPEG を同じコミットで追加する。
- `report.md` の先頭 3 行: `verified_impl_sha: <コミット 2 の 40 桁>` / `evidence_scope: shared-token-migration` / `targeted_dynamic_sha: <コミット 2 の 40 桁>`。各フィールドは 1 回だけ書く。
- 記録する実測: ① 配信方法と実ポート ② 28 route それぞれの console error 件数（favicon 404 は除外して件数を分けて書く）③ 各 subject の `preview-selectors.json` selector の件数 ④ `/preview/button/` と `/preview/button-dark/` で `getComputedStyle(document.documentElement).getPropertyValue("--info")` と `--info-foreground` の値（light / dark で異なること）⑤ `--success` / `--warning` と `--info` の値が、それぞれ `tokens.css` の対応 token を rgb 展開した値であること ⑥ 2.5 の probe の結果 ⑦ 28 枚それぞれの幅・高さ・magic bytes ⑧ レイアウト崩れ・オーバーフローの有無（目視で観測した事実だけを書く）。
- 形式の見本: `.docs/reviews/font-unify-ibm-plex/report.md`。

## 3. スコープ外
- `src/styles/design-system/**`（`tokens.css` / `brands.css` / `design-tokens.html` / `build-tokens.mjs`）を変更しない。
- `src/components/**`・`src/previews/**`・`src/pages/**` を変更しない（alias を使う component を足さない）。
- 既存の証跡（`.docs/reviews/` 配下の既存ファイル）を編集・削除しない。
- `package.json` / `package-lock.json` / CI を変更しない。
- Issue #46 / #47 / #48 の内容に着手しない。

## 4. 検証（rubric）— `worker_done` に実測値で書く
- 共通節のローカル検証ゲート 1〜7 の exit code（各行）。加えて `npm run check:contrast` → exit 0、`npm run check:design-tokens` → exit 0。
- `grep -c -- '--info: rgb(var(--color-status-info-bg));' src/styles/global.css` が 2、`grep -c -- '--color-info: var(--info);' src/styles/global.css` が 1。
- `node -e 'const r=require("./registry.json");const n=r.items.filter(i=>i.cssVars.light.info&&i.cssVars.dark["info-foreground"]).length;console.log(n, r.items.length)'` の 2 値が一致。
- 旧 / 新の `REQUIRED_CONSUMER_CONTRACT_DIGEST`。
- コミット 1・2・3 の SHA と、`git merge-base --is-ancestor <コミット1> <コミット2>` の exit 0、`<コミット1> != <コミット2>`。
- `.docs/reviews/2026-09-04-info-alias/` の JPEG が 28 枚（`ls .docs/reviews/2026-09-04-info-alias/*.jpg` の件数）。
- 証跡コミット後の `npm run check:all` → exit 0（共通節 9）。
- 想定所要時間: 120〜240 分（28 枚の撮影とレビュー 3 ラウンドを含む）。

## 5. レビューサイクル
共通節のとおり（最大 3 ラウンド、cycle-id `2026-09-04-issue-45-info-alias`）。レビュー対象: `global.css` / `registry.json` の差分 / `contrast-cases.mjs` / `contrast.mjs` / `report.md`。

## 6. 完了条件
共通節の PR 要件を満たした PR が open で、`Closes #45` を含む。PR 本文に「manako 側の alias 2 行は、この PR のマージ後に削除して registry へ一本化する」旨を利用側への申し送りとして書く。

## 7. 制約
共通節のとおり。

## 共通の前提と規律（全タスク共通）

### 環境
- リポジトリ: `elchika-inc/ui`（`AGENTS.md` を最初に読む）。パッケージマネージャは npm。worktree の setup は `npm ci` が自動で走る。作業開始前に `node_modules/.package-lock.json` が存在することを確認する。無ければ `npm ci` を実行する。`pnpm-lock.yaml` が現れたら削除し、コミットに含めない。
- base は `origin/main`（2026-09-04 時点 `7e8f77d86785140c75020d86e5ea6f44a7c1d991`）。ブランチ名は `git branch --show-current` で確認して報告する。
- `main` へ直接コミットしない。PR は作るがマージしない（マージは human 承認後に司令塔が行う）。
- コミットメッセージ・PR 本文・コード内コメント・ドキュメントは日本語（技術用語と識別子は原語のまま）。
- 生の色指定と値系 arbitrary value（`text-[#fff]`, `w-[13px]` 等）を使わない。フォーカスリングに透明度合成を使わない。

### ローカル検証ゲート（実装コミットの前に全部通す）
次を **1 行ずつ別々に実行し、それぞれの exit code を記録する**（pipe・`&&`・`;` で連結しない。`| tail` のような加工も付けない。出力はファイルへリダイレクトして読む）。
1. `npm run format`（実行後 `git status --short` を取り、意図したファイル以外が変わっていないことを確認する。変わっていたら元に戻して報告する）
2. `npm run lint` → exit 0（ベースライン 2026-09-04 main: exit 0、warnings 200 / infos 3。warning 数は成功条件にしない）
3. `node --test "scripts/*.test.mjs"` → 全件 pass。**このスイートは全件実行で不定期に 1 件落ちる既知事象がある。** 1 件落ちたら即修正に入らず、落ちたファイルを単独実行（`node --test scripts/<file>.test.mjs`）して切り分ける。単独で通れば flaky として記録し、全件を再実行する。変更ファイルと無関係なテストの失敗を直さない。
4. `npm run build` → exit 0
5. `npm run build:lib` → exit 0
6. `npm run check:pre` → exit 0（ベースライン main: exit 0）
7. `npm run check:props` → exit 0
8. `npm run typecheck` は **ローカル macOS で必ず OOM（exit 134）する既知事象**。実行しない。失敗として報告しない。直そうとしない（`NODE_OPTIONS` や `package.json` を触らない）。型検査は CI に委ねる。
9. 証跡コミットの後に `npm run check:all` → exit 0（約 10〜15 分かかる。timeout を 30 分以上にする。`npm run build` と並行実行しない）。

### provenance の更新（`src/components/ui/*.tsx` を変更したとき必須）
`scripts/check-completeness.mjs` は `provenance.json` の各 component の `generatedContentSha256` を現在のファイルの SHA-256 と突き合わせる。変更した component ごとに:
- `generatedContentSha256` を `shasum -a 256 src/components/ui/<name>.tsx` の値へ更新する。
- `modified` の末尾に「。2026-09-04: <変更の 1 行要約>（Issue #<N>）」を追記する。他のフィールドは触らない。

### 証跡（実ブラウザ検証）の規約
- 正本は `.docs/component-addition-procedure.md` §3〜§4 と `scripts/check-evidence.mjs`。
- **実装コミット → その SHA の実ブラウザ検証 → 証跡コミット** の順を守る。証跡 Markdown の `verified_impl_sha: <40桁>` は実装コミットの SHA（証跡コミット自身ではない）。1 ファイルに 1 回だけ書く。
- component 証跡のファイル名は `.docs/reviews/2026-09-04-<name>-preview.md`（この正規表現にしか一致しない: `^\d{4}-\d{2}-\d{2}-(.+)-preview\.md$`）。画像は `2026-09-04-<name>-preview-light.jpg` / `2026-09-04-<name>-preview-dark.jpg` を **証跡 Markdown と同じコミット**に入れる（別コミットの画像は数えられない）。既存の証跡・画像を編集・削除・上書きしない（immutable）。
- 撮影は dev server ではなく `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port <空きポート>` で配信して行う（dev では toolbar が写り込む）。接続前に `curl -sI http://127.0.0.1:<port>/` で実ポートを確認する。
- ブラウザは Playwright MCP を使う。保存先は worktree 配下に限られる。作業用ファイルは `<worktree>/.playwright-mcp/` に置き、終了時に削除して `git add` に混ぜない。
- 各 route で console error が 0 件であること、`preview-selectors.json` の selector が hydrated 後に 1 件以上存在することを確認し、実測値（件数・属性値・computed style）を Markdown に表で記録する。画像は JPEG（magic `FF D8 FF`）で、幅・高さ・magic を Markdown に記す。
- 参考にする既存証跡: `.docs/reviews/2026-08-31-input-group-preview.md`（形式の見本）。

### レビューサイクル（委譲先で完結。司令塔へ戻さない）
- 実施者: この worker 自身がオーケストレータ。レビュアーは fresh context の `codex exec` を 1 名立て、レンズ（Security / Core Logic / Tests / Domain / Fresh Eyes）を **順に**当てる。`lens-review-cycle` スキルが起動できればその規律（durable state・round-N の findings）に従う。起動できなければ同じレンズ順を `codex exec` で自分で回す。レビュアーを並列起動しない。
- 収束規律は standards `AI_FIRST.md` §3 の値で、スキルの既定値を上書きする: **最大 3 ラウンド**（ラウンド 1 = 実装直後の初回レビュー）。確信度 80% 以上の flag が 0 になったら終了。3 ラウンドで残った flag は `.docs/risk-registry.md` に `status: accepted` + `reason` + `anchor` の書式で記録して即日決める（修正か受容のどちらか。積み残さない）。指摘を消す手段は修正か risk-registry への受容のみ。
- レビュー記録は `.docs/reviews/cycles/<cycle-id>.md`（`lens-review-cycle` の `references/cycle-log-format.md` の形式）。cycle-id は `2026-09-04-<slug>` とし、**末尾を `-preview` にしない**。`.docs/reviews/` 配下の `.md` は全件 `verified_impl_sha: <40桁>` を要求されるので、このファイルの 1 行目にも実装コミットの SHA を書く。legacy の `review-cycle-log.md` には追記しない。
- 各ラウンドのレビュー対象には、この委任仕様のコピー（`.docs/plans/` に保存したもの）を含めない。コード差分と証跡 Markdown を対象にする。

### 完了条件と PR
- PR を `gh pr create` で作る。本文は `.github/PULL_REQUEST_TEMPLATE.md` の全節を埋める。本文は heredoc（`<<'EOF'`）でファイルへ書き、`--body-file` で渡す（シェルのダブルクォートに直書きしない）。
- 本文に必ず含める: `Closes #<N>`／実装計画のパス（`.docs/plans/2026-09-04-<slug>-plan.md`。この委任仕様をそのまま保存したもの）／実装担当識別子（`Codex（<model>）, Orca worktree <name>`）／ローカル検証ゲート各行の exit code／レビューサイクルのラウンド数と最終 flag 数／証跡 Markdown のパスと `verified_impl_sha`／降格理由（インフラ・標準・ライブラリで済ませずコードを書いた箇所があればその理由）。
- PR 作成後、`gh pr checks <番号> --watch` は不要。CI の結果は司令塔が確認する。
- `worker_done` の body に、上記の実測値（exit code・件数・SHA・PR URL・ブランチ名）をすべて書く。「通った」「確認した」だけの報告にしない。可視・存在の確認を「動作する」と書かない。

### 制約（MUST）
- **指示と実態が矛盾したら止めて `orca orchestration ask` で報告する。** 推測で埋めない。例: 指定したファイル・行・識別子が存在しない、既存の検査が仕様どおりの変更を弾く、Issue の記述と現行コードが食い違う。
- 裁量の範囲: 仕様に書いていない細部（変数名・コメント文言・テスト名）は決めてよい。**公開 props の名前・型・既定値、ファイルの追加先、成功基準は変えない。** 裁量で決めた内容は `worker_done` と PR 本文に列挙して申告する。
- 逆委任は受けない: 環境制約（turn 上限・ツール不在・ブラウザが使えない等）で担当範囲を遂行できないときは、司令塔へ範囲を戻さず `ask` で報告して判断を待つ。
- スコープ外のファイルを触らない（各タスクの「スコープ外」節）。リポジトリ外へ書き込まない。`git push --force` を使わない。
- 想定所要時間内に commit が無くても正常。行き詰まったら黙って試行錯誤を続けず `ask` する。
