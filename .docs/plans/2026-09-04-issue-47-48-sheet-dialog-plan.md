# 委任仕様 B: Sheet / Dialog に `modal` と `closeLabel` prop を追加する（Issue #47, #48）

## 1. 背景（実測済み。再調査不要）
- Issue: https://github.com/elchika-inc/ui/issues/47 と https://github.com/elchika-inc/ui/issues/48
- `src/components/ui/sheet.tsx` の `SheetContent` は `<SheetPortal>` 直下で `<SheetOverlay />` を無条件に描く。閉じるボタンの sr-only 文言は `閉じる`。`XIcon` には `aria-hidden="true"` が付いている。
- `src/components/ui/dialog.tsx` の `DialogContent` は `<DialogPortal>` 直下で `<DialogOverlay />` を無条件に描く。sr-only 文言は `Close`。`XIcon` に `aria-hidden` が無い。`DialogFooter` は `showCloseButton` のとき `Close` という表示文言の outline Button を描く。
- Base UI の `Dialog.Root` の `modal={false}` はフォーカストラップ等を解除するが `Backdrop` の描画有無は制御しない。
- `registry.json` の `sheet` / `dialog` item は `registryDependencies: ["@elchika/button"]` を持つ。sheet.tsx と dialog.tsx は別々に配布される独立ファイルなので、両者で共有する定数モジュールは作らない（配布境界を増やさないため。各ファイルに同じ literal を持つ）。
- `provenance.json` の `sheet` / `dialog` は `generatedContentSha256` を持つ。
- `src/previews/sheet.tsx` は isolated モードで `defaultOpen` の Sheet を 1 個描く。`src/previews/dialog.tsx` も同様に Dialog 1 個で `DialogFooter showCloseButton`。`preview-selectors.json`: `sheet` → `[data-slot="sheet-content"]`、`dialog` → `[data-slot="dialog-content"]`。
- `types/dts-contract.ts` には `DialogContentProps` 等の Dialog 型が import されているが、Sheet の型は import されていない。
- 既存証跡: `2026-08-02-sheet-preview.md`、`2026-08-01-dialog-preview.md`。両 component を変えるので新規証跡が必須。

## 2. 実施内容（literal）
### 2.1 `src/components/ui/sheet.tsx`
1. ファイル先頭の import 群の後に `const DEFAULT_CLOSE_LABEL = "閉じる";` を置く。
2. `SheetContentProps` に次の 2 つを追加する（JSDoc は日本語）:
   - `/** false のとき backdrop を描かない。フォーカストラップ等の解除は親 Sheet（Dialog.Root）の modal={false} が担うので、非モーダル用途では両方に false を渡す。既定 true */ modal?: boolean;`
   - `/** 閉じるボタンの accessible name。既定は "閉じる" */ closeLabel?: string;`
3. `SheetContent` の分割代入に `modal = true, closeLabel = DEFAULT_CLOSE_LABEL` を追加し、`<SheetOverlay />` を `{modal && <SheetOverlay />}` に、`<span className="sr-only">閉じる</span>` を `<span className="sr-only">{closeLabel}</span>` にする。

### 2.2 `src/components/ui/dialog.tsx`
1. import 群の後に `const DEFAULT_CLOSE_LABEL = "閉じる";` を置く。
2. `DialogContentProps` に 2.1 と同文の `modal?: boolean` と `closeLabel?: string` を追加する。`DialogFooterProps` に `/** showCloseButton の閉じるボタンの表示文言。既定は "閉じる" */ closeLabel?: string;` を追加する。
3. `DialogContent` の分割代入に `modal = true, closeLabel = DEFAULT_CLOSE_LABEL` を追加し、`<DialogOverlay />` を `{modal && <DialogOverlay />}` に、`<span className="sr-only">Close</span>` を `<span className="sr-only">{closeLabel}</span>` にする。`<XIcon />` を `<XIcon aria-hidden="true" />` にする。
4. `DialogFooter` の分割代入に `closeLabel = DEFAULT_CLOSE_LABEL` を追加し、`>Close</DialogPrimitive.Close>` を `>{closeLabel}</DialogPrimitive.Close>` にする。

### 2.3 `provenance.json`
- `sheet` と `dialog` の `generatedContentSha256` と `modified` を共通節の手順で更新する。

### 2.4 `src/previews/sheet.tsx`
- 既存の `<Sheet defaultOpen=...>` ブロックの直後（`PreviewSentinel position="after"` の前）に、非モーダルの Sheet を追加する:
  `<Sheet modal={false}>` / `<SheetTrigger render={<Button variant="outline" />}>詳細ペインを開く</SheetTrigger>` / `<SheetContent modal={false} side="left" closeLabel="詳細ペインを閉じる">` / `<SheetHeader><SheetTitle>詳細ペイン</SheetTitle><SheetDescription>非モーダルの Sheet です。背景は暗転せず、一覧側の操作を妨げません。</SheetDescription></SheetHeader>` / `</SheetContent>` / `</Sheet>`
- `defaultOpen` は付けない（既定の modal Sheet が isolated で開いたままなので、両方開くと重なるため）。

### 2.5 `src/previews/dialog.tsx`
- 既存の `<Dialog defaultOpen=...>` ブロックの直後に、非モーダルの Dialog を追加する:
  `<Dialog modal={false}>` / `<DialogTrigger render={<Button variant="outline" />}>補足を開く</DialogTrigger>` / `<DialogContent modal={false} closeLabel="補足を閉じる">` / `<DialogHeader><DialogTitle>補足</DialogTitle><DialogDescription>非モーダルの Dialog です。背景は暗転しません。</DialogDescription></DialogHeader>` / `<DialogFooter showCloseButton closeLabel="補足を閉じる" />` / `</DialogContent>` / `</Dialog>`
- 2 つのトリガーが並ぶよう、外側の `<div className="p-6">` を `<div className="flex flex-wrap gap-3 p-6">` にする。

### 2.6 `types/dts-contract.ts`
- `DialogContentProps` の import と同じ経路で `SheetContentProps` を import に追加する。`ButtonProps["variant"]` の検査と同じ形式で次の正例を追加する: `DialogContentProps["modal"]` に `false`、`DialogContentProps["closeLabel"]` に `"閉じる"`、`DialogFooterProps["closeLabel"]` に `"閉じる"`、`SheetContentProps["modal"]` に `false`、`SheetContentProps["closeLabel"]` に `"閉じる"`。負例は `// @ts-expect-error` 付きで `SheetContentProps["modal"]` に `"yes"` を 1 つ。

### 2.7 `.docs/plans/2026-09-04-issue-47-48-sheet-dialog-plan.md`
- この委任仕様の全文をそのまま保存する（実装コミットに含める）。

### 2.8 証跡（実装コミット後。component ごとに証跡コミットを分ける）
- `.docs/reviews/2026-09-04-sheet-preview.md` + `2026-09-04-sheet-preview-light.jpg` / `-dark.jpg`。
- `.docs/reviews/2026-09-04-dialog-preview.md` + `2026-09-04-dialog-preview-light.jpg` / `-dark.jpg`。
- 各 route（`/preview/sheet/`, `/preview/sheet-dark/`, `/preview/dialog/`, `/preview/dialog-dark/`）で記録する実測:
  ① console error 件数 ② 初期状態で `[data-slot="sheet-content"]`（dialog は `dialog-content`）が 1 件、`[data-slot="sheet-overlay"]`（`dialog-overlay`）が 1 件（modal 既定の実証）③ 既定の閉じるボタン（`[data-slot="sheet-close"]` 内 / dialog は `[data-slot="dialog-close"]` 内）の `.sr-only` の textContent が `閉じる`、dialog の footer 閉じるボタンの表示文言が `閉じる` ④ Escape で既定の modal を閉じたあと、非モーダルのトリガーをクリックし、content が 1 件・overlay が **0 件**であること ⑤ 非モーダルが開いた状態で、既定側のトリガー（`設定を開く` / `ダイアログを開く`）が `document.elementFromPoint` でそのトリガー自身を返す（overlay に遮られていない実証）⑥ 非モーダルの閉じるボタンの `.sr-only` textContent が `詳細ペインを閉じる` / `補足を閉じる`。
  スクリーンショットは ② の初期状態（modal が開いた状態）で撮る。

## 3. スコープ外
- `src/components/ui/button.tsx`・`alert-dialog.tsx`・`drawer.tsx` を変更しない（同型の構造があっても Issue のスコープ外）。
- sheet / dialog 以外の preview・証跡を変更しない。`src/styles/**` を変更しない。
- `scripts/**`・CI・`package.json`・`package-lock.json`・`registry.json` を変更しない。
- Issue #45 / #46 の内容に着手しない。

## 4. 検証（rubric）— `worker_done` に実測値で書く
- 共通節のローカル検証ゲート 1〜7 の exit code（各行）。
- `grep -c 'modal && <SheetOverlay />' src/components/ui/sheet.tsx` が 1、`grep -c 'modal && <DialogOverlay />' src/components/ui/dialog.tsx` が 1。
- `grep -c '"Close"' src/components/ui/dialog.tsx` が 0、`grep -c '>Close<' src/components/ui/dialog.tsx` が 0。
- `shasum -a 256` の値が `provenance.json` の `sheet` / `dialog` の `generatedContentSha256` と一致。
- 2 つの証跡 Markdown の `verified_impl_sha` が実装コミットの SHA と一致し、祖先判定 exit 0。
- 証跡コミット後の `npm run check:all` の exit code。
- 想定所要時間: 90〜180 分。

## 5. レビューサイクル
共通節のとおり（最大 3 ラウンド、cycle-id `2026-09-04-issue-47-48-sheet-dialog`）。レビュー対象: `sheet.tsx` / `dialog.tsx` / `provenance.json` / 2 つの preview / `types/dts-contract.ts` / 2 つの証跡 Markdown。

## 6. 完了条件
共通節の PR 要件を満たした PR が open で、`Closes #47` と `Closes #48` の両方を含む。

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
