# 委任仕様 A: Button に `loading` prop を追加する（Issue #46）

## 1. 背景（実測済み。再調査不要）
- Issue: https://github.com/elchika-inc/ui/issues/46
- `src/components/ui/button.tsx` に `loading` / `aria-busy` は存在しない。`ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`。
- `src/components/ui/spinner.tsx` は存在する。`Spinner` は `Loader2Icon` を `role="status"` `aria-label="Loading"` `className="size-4 animate-spin text-primary"` で描画し、`className` は `cn(base, className)` で後勝ちマージされる（`size-3` を渡せば `size-4` を上書きできる）。
- `registry.json` の `button` item は `registryDependencies` を持たない。`scripts/check-completeness.mjs` は配布ファイルが import する `@/components/ui/<X>` が `registryDependencies` に無いと fail する（`@elchika/<X>` 形式）。
- `provenance.json` の `button` は `generatedContentSha256` を持ち、現在のファイル hash と一致していないと completeness が fail する。
- `src/previews/button.tsx` は variant 7 種と muted 面の 2 個を並べる。`preview-selectors.json` の `button` は `[data-slot="button"]`。
- `types/dts-contract.ts` の 275〜284 行付近に `ButtonProps["variant"]` の到達性検査（正例 + `@ts-expect-error` の負例）がある。
- 既存の button 証跡は `2026-07-31-button-preview.md`。preview と component を変えるので新規証跡が必須。

## 2. 実施内容（literal）
### 2.1 `src/components/ui/button.tsx`
1. `import { Spinner } from "@/components/ui/spinner";` を `cn` の import の直前に追加する。
2. `ButtonProps` を次にする:
   `export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { /** true のとき disabled を強制し、children の前に Spinner を描画して aria-busy を付ける。既定 false */ loading?: boolean };`
3. `Button` の分割代入に `loading = false, disabled, children` を追加し、`ButtonPrimitive` へ次を渡す:
   - `disabled={disabled || loading}`
   - `aria-busy={loading || undefined}`
   - `data-loading={loading || undefined}`
   - children: `{loading && <Spinner aria-hidden="true" className={cn("text-current", spinnerSize)} />}{children}`
   - `spinnerSize` は `size` から決める定数マップ: `xs` と `icon-xs` → `"size-3"`、`sm` → `"size-3.5"`、それ以外 → `undefined`（Spinner 既定の `size-4`）。マップは component 内の `const` で定義する。
4. `data-slot="button"` と既存の className 合成は変えない。`{...props}` の展開位置は現状どおり最後。

### 2.2 `registry.json`
- `button` item に `"registryDependencies": ["@elchika/spinner"]` を追加する（`sheet` item の `"registryDependencies": ["@elchika/button"]` と同じ位置・形式）。`dependencies` は変えない。

### 2.3 `provenance.json`
- `button` の `generatedContentSha256` と `modified` を共通節の手順で更新する。

### 2.4 `src/previews/button.tsx`
- 最初の `flex-wrap` 行の `<Button disabled>送信中</Button>` の直後に次の 2 行を追加する:
  `<Button loading>保存中</Button>`
  `<Button variant="outline" loading>読み込み中</Button>`

### 2.5 `types/dts-contract.ts`
- `ButtonProps["variant"]` の検査の直後に同じ形式で追加する: 正例 `const loading: ButtonProps["loading"] = true;` と `// @ts-expect-error` 付きの負例 `const invalidLoading: ButtonProps["loading"] = "yes";`。

### 2.6 `.docs/plans/2026-09-04-issue-46-button-loading-plan.md`
- この委任仕様の全文をそのまま保存する（実装コミットに含める）。

### 2.7 証跡（実装コミット後）
- `.docs/reviews/2026-09-04-button-preview.md` + `2026-09-04-button-preview-light.jpg` / `-dark.jpg`。
- 記録する実測: 各 route（`/preview/button/`, `/preview/button-dark/`）で ① console error 件数 ② `[data-slot="button"]` の件数 ③ `[data-slot="button"][aria-busy="true"]` の件数（期待 2） ④ その 2 要素それぞれの `disabled` property が true ⑤ その 2 要素それぞれの中に `[data-slot="spinner"][aria-hidden="true"]` が 1 個ずつ ⑥ spinner の computed `color` と親 button の computed `color` が一致（`text-current` の実証） ⑦ `<Button loading>` の computed `opacity`（既存の `disabled:opacity-50` の実証）。

## 3. スコープ外
- `src/components/ui/spinner.tsx` を変更しない。
- button 以外の component・preview・証跡を変更しない。`src/styles/**` を変更しない。
- `scripts/**`・CI・`package.json`・`package-lock.json` を変更しない。
- Issue #45 / #47 / #48 の内容に着手しない。

## 4. 検証（rubric）— `worker_done` に実測値で書く
- 共通節のローカル検証ゲート 1〜7 の exit code（各行）。
- `node -e 'const r=require("./registry.json");console.log(JSON.stringify(r.items.find(i=>i.name==="button").registryDependencies))'` の出力が `["@elchika/spinner"]`。
- `shasum -a 256 src/components/ui/button.tsx` の値と `provenance.json` の `button.generatedContentSha256` が一致。
- `grep -c 'aria-busy' src/components/ui/button.tsx` が 1 以上。
- 証跡 Markdown の `verified_impl_sha` が実装コミットの SHA と一致し、`git merge-base --is-ancestor <その SHA> HEAD` が exit 0。
- 証跡コミット後の `npm run check:all` の exit code（共通節 9）。
- 想定所要時間: 60〜120 分（実ブラウザ撮影とレビュー 3 ラウンドを含む）。

## 5. レビューサイクル
共通節のとおり（最大 3 ラウンド、cycle-id `2026-09-04-issue-46-button-loading`）。レビュー対象: `button.tsx` / `registry.json` / `provenance.json` / `src/previews/button.tsx` / `types/dts-contract.ts` / 証跡 Markdown。

## 6. 完了条件
共通節の PR 要件を満たした PR が open で、`Closes #46` を含む。

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
