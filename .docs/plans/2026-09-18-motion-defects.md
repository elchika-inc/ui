# 実行時に動いていないモーション 2 件の修正（issue #94 / #95）

司令塔が 2026-09-18 に作成した委任仕様。PR は 1 本。worker は §1〜§7 と §A を literal に実行する。

## 1. 背景（司令塔が実ブラウザで実測済み。worker は再調査しない）

きっかけは、モーションの一覧が「コードを読んだだけ」で作られていたこと。公開サイト（main 8cb38a6）の各プレビューを headless Chromium で開き、Web Animations API の `document.getAnimations()` で実際に走っているアニメーションを拾って設計値と突き合わせた結果、2 件が実行時に動いていないことが分かった。

### 1.1 issue #94 — Message Scroller のスクロールボタン

- 対象は `src/components/ui/message-scroller.tsx` の `MessageScrollerButton`（104 行付近の `className`）。
- `data-active` は `false` → `true` → `false` と正しく切り替わる。出現の瞬間を 20ms 間隔で 30 回サンプリングしても computed `opacity` は `0` から `1` へ一段で飛び、**中間値が 1 つも観測されない**。
- computed の `transition-property` は `background, border-color, color, box-shadow`。`translate` も `scale` も `opacity` も含まれない。
- DOM 上の class には `transition-state` と `transition-[translate,scale,opacity]` の**両方**が載っている。`render={render ?? <Button variant={variant} size={size} />}` で付く `buttonVariants` の base（`src/components/ui/button.tsx:8`）が `transition-state` を持ち、Base UI の `render` は className を連結するだけで重複を解決しない。
- 生成 CSS では `.transition-state{transition:var(--state-transition)}` が **transition の一括指定**で、`transition-[translate,scale,opacity]` より後ろに出力される（公開中の CSS で位置 74630 対 66752）。詳細度はどちらも 0,1,0 なので後勝ちとなり、一括指定が `transition-property` ごと上書きしている。
- **手本が同じリポジトリにある。** Badge（`src/components/ui/badge.tsx:8`）は同じ 2 重指定を持ちながら正しく動く。出現のモーションを `data-appear:transition-[opacity,scale]` のように `data-*` 変種へ入れているため、生成される選択子が `.data-\[…\]\:…[data-…]` となり詳細度 0,2,0 で一括指定に勝つ。実測でも `appear` を付けた Badge だけ `transition-property` が `opacity, scale` になっている。
- 影響範囲は調査済み。`/components/`（全 96 件のプレビューを同時描画）で `transition-state` と自前の `transition-[…]` が同居する要素を走査したところ、該当は Badge 9 件（意図どおり動く）とこのボタン 1 件だけ。**他の部品に同じ修正を広げる必要はない。**

### 1.2 issue #95 — sidebar-11 の chevron

- 対象は `src/blocks/sidebar-11/components/app-sidebar.tsx`（106 行付近の Collapsible の className と 110 行付近の `ChevronRightIcon`）。
- クリックで Collapsible root の属性は `data-closed` → `data-open` と正しく切り替わるが、アイコンの computed `rotate` は `none` のまま変化しない。
- 原因は Collapsible に付いた `[&[data-state=open]>button>svg:first-child]:rotate-90`。Base UI の Collapsible が出すのは root の `data-open` / `data-closed` と trigger の `data-panel-open` で、`data-state="open"` は出さない。選択子が永久に一致しない。
- 参照実装は `src/blocks/sidebar-02/components/app-sidebar.tsx:182`。アイコン側に `group-data-open/collapsible:rotate-90` を付けており、実測で `rotate` が `90deg` と `none` を行き来する。`sidebar-11` の Collapsible には既に `group/collapsible` が付いている。
- `data-state=open` を含むのは 28 ブロック中この 1 ファイルのみ（grep 実測）。

### 1.3 共通の制約

- `src/styles/global.css` と `src/styles/design-system/` は**触らない**。共有トークンを変えると共有面証跡 28 枚の撮り直しが必要になる。
- `scripts/check-standards.mjs` の値系 arbitrary value 検査は `<token>-[…]` の形を見る。`transition-[…]` は対象外（既存コードにも多数ある）。角括弧の**中**に `-[` を作らないこと。
- 生の ms・cubic-bezier を書かない。duration と easing はトークンの段（`duration-base` / `duration-slower` / `ease-standard` / `ease-entrance` 等）だけを使う。
- ローカル配信は `npx astro preview --host ::1 --port <空きポート>`。`gh` / `git push` が「can't assign requested address」で失敗したら 60 秒間隔で最大 10 回再試行し、通らなければ escalation。

## 2. 記法

- 変更してよいのは `src/components/ui/message-scroller.tsx`、`src/blocks/sidebar-11/components/app-sidebar.tsx`、`provenance.json`（§A.3 の再同期でハッシュだけが変わる）、`.docs/reviews/` の新規証跡だけ。
- 文言は日本語。commit 末尾に `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`、PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。
- **commit は 2 分割**: (1) 実装 2 ファイル、(2) 証跡。report の `verified_impl_sha` は (1)。

## 3. スコープ外

- Badge の 2 重指定（意図どおり動くので触らない）。
- `button.tsx` / `buttonVariants` の変更。全部品に波及する。
- 他の sidebar 系ブロック。
- `MessageScroller` の `render` の仕組み自体の作り替え。
- 一覧で観測された「開いた状態で描画されるプレビュー」の挙動（Tooltip / Alert Dialog の開く側が実測できない件）。別途扱う。

## 4. 検証（rubric。結果は PR 本文と worker_done に実測値で書く）

各コマンドは単独で実行し、個々の exit code を報告する（`&&` / `;` / pipe で連結しない）。

1. `node scripts/check-standards.mjs` exit 0。`npm run lint` exit 0（error 0）。
2. `node --test scripts/catalog-build.test.mjs` exit 0。`node --test scripts/check-completeness.test.mjs` exit 0。いずれも fail 0 / skip 0 で既存 `test(` の削除行が無い。
3. `npm run build:lib` → `npm run check:props` → `node scripts/check-completeness.mjs` → `node scripts/check-preview-render.mjs` を 1 つずつ実行し全部 exit 0。**`check-completeness` は block の `generatedContentSha256` を実体と照合する（`scripts/check-completeness.mjs:436`）ので、§A.3 の再同期を済ませてから実行する。** 再同期前に 1 回実行して落ちること（＝検査が空走していないこと）も確かめ、その出力を記録する。
4. `npm run registry:build` → `node scripts/check-distribution.mjs` exit 0。`git diff --exit-code registry.json` exit 0。
5. `npm run build:site` exit 0。ページ数を記録する。
6. **実ブラウザ（headless Chromium、`astro preview --host ::1`）。console error 0 と pageerror 0 を全ケースで確認する。**
   - **issue #94**: `/preview/message-scroller/` を 1280×800 で開く。
     - ボタン（`[data-slot="message-scroller-button"]`）の computed `transition-property` に `translate` と `scale` と `opacity` が**含まれる**こと。修正前は `background, border-color, color, box-shadow` だった。
     - 一覧の viewport（`[data-slot="message-scroller-viewport"]`）の `scrollTop` を末尾へ→先頭へ動かし、`data-active` が `false` → `true` に変わる瞬間から 20ms 間隔で 30 回 computed `opacity` を採取し、**0 と 1 以外の中間値が 3 つ以上**現れること（修正前は 0 件）。採取した値の一覧を記録する。
     - `data-active="true"` のときの computed `transition-duration` が `0.18s`、`false` のときが `0.4s` であること。
     - ホバーで背景色が変わる動きが残っていること（`transition-property` に `background` 系が含まれることを値で示す）。
   - **issue #95**: `/preview/sidebar-11/` を 1280×800 で開く。
     - ツリー項目のトリガーを押して Collapsible root の属性が `data-closed` ↔ `data-open` と変わること。
     - その前後でアイコンの computed `rotate` が `none` と `90deg` の間で**変化する**こと（修正前は `none` のまま）。両方の値を記録する。
     - 参照実装 `/preview/sidebar-02/` でも同じ測り方をして同じ挙動になることを示し、2 つの値を並べて記録する。
     - class 文字列に `data-state=open` が**残っていない**こと。
7. 証跡は `.docs/reviews/` 直下にフラットで置く。**名前は `<日付>-<name>-preview.md` の形にすること。** `scripts/check-evidence.mjs:78` の `componentFromEvidence` がこの形の stem を `src/components/ui/<name>.tsx` や registry item のファイルへ紐づけ、`inspectLatestComponentEvidence`（269 行付近）が「最新証跡の検証 SHA 以降に当該 path が変更されていないこと」を**hard な problem として**要求する。したがって本 PR では次の 2 本が必須。
   - `<日付>-message-scroller-preview.md` と `<日付>-message-scroller-preview-light.jpg` / `-dark.jpg`。既存の `2026-08-02-message-scroller-preview.md` とその画像 2 枚は immutable なので**触らない**（新しい日付の証跡が最新として扱われる）。書式はその既存 report を見本にする。
   - `<日付>-sidebar-11-preview.md` と `<日付>-sidebar-11-preview-light.jpg` / `-dark.jpg`。sidebar-11 の既存 report は無い。
   どちらの report も先頭に `verified_impl_sha`（実装 commit）を置き、§4.6 の実測値をすべて表で載せる。画像は 1280×800。`node scripts/check-evidence.mjs` を report を書いた直後と証跡 commit 後に実行し、どちらも exit 0。**名前を受け付けない診断が出たら止めて question で報告する。**
8. `git diff --stat origin/main` の変更ファイルが §2 の一覧 + 新規証跡だけであること（先頭 commit の spec は司令塔が入れた明記済みの例外）。

## 5. レビューサイクル（委譲先で完結）

- レビュアーは `claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence` を fresh context で 1 回 1 レンズずつ順に起動する（Fresh Eyes → Core Logic → Domain）。入力は担当ファイルに絞った diff・変更ファイル全文・spec §1 / §2 / §4 / §A のみ。**最大 2 ラウンド**（修正が小さいため）。出力が壊れていたら同じレンズを 1 回だけ取り直し、2 回目も壊れていれば 2 回目の全文を改変せず採用する。記録は `.docs/reviews/cycles/<日付>-motion-defects.md`（先頭に `verified_impl_sha:` 行）。
- flag（確信度 80% 以上）が 0 になるまで修正 → 再レビュー。上限に達したら残りを PR 本文に ACCEPTED_RISKS として書く。

## 6. 完了条件

- PR は base `main`、本文に `Closes #94` と `Closes #95`。本文の節: 関連 Issue / エージェント実装の来歴 / 変更内容と §A の対応 / 検証結果（§4 の各項目の実測値）/ レビュー記録 / 変更範囲（§4.8）と base 確認 / 裁量で決めた内容の申告 / ACCEPTED_RISKS。
- base 追随が要るときは `git merge origin/main`（rebase しない）。
- マージは司令塔が行う。worker_done は PR 作成と CI 完走を確認してから 1 回だけ送る。
- spec ファイル自体は編集しない。裁定・申告の記録は PR 本文に書く。

## 7. 制約

- **指示と実態が矛盾したら止めて question で報告する**（例: `data-*` 変種にしても computed の `transition-property` が変わらない、`group-data-open/collapsible` が効かない、既存テストが落ちる）。担当範囲を戻す逆委任はしない。
- 裁量の範囲: class の並び順、`transition-[…]` に載せるプロパティの粒度（下記 §A.1 の必須分を満たしたうえでの増減）、report の表現、Playwright スクリプトの構成、一時ファイル名、スクリーンショットの構図。**`data-*` 変種で詳細度を上げるという方針と、触ってよいファイルの範囲は変えない。**
- 全件テスト・typecheck・check:all はローカルで実行せず PR CI で代替する。応答が遅いコマンドは打ち切らずに待つ。1 コマンドが 15 分を超えて返らない場合だけ報告する。
- 想定所要時間: 60〜120 分。その間 commit が無くても正常。

## A. 実施内容（ブランチ `naoto24kawa/motion-defects`）

### A.1 Message Scroller のボタン（`src/components/ui/message-scroller.tsx`）

`MessageScrollerButton` の `cn()` 第 1 引数から `transition-[translate,scale,opacity]` を外し、代わりに `data-[active=true]:` と `data-[active=false]:` の**両方**に同じ transition 指定を置く。`data-active` は常にどちらかが付くので、どの状態でも 1 つは一致する。

- 追加する class は**次の 2 つを一字一句そのまま**書く（プロパティの順序も変えない）。

  ```
  data-[active=true]:transition-[translate,scale,opacity,background,border-color,color,box-shadow]
  data-[active=false]:transition-[translate,scale,opacity,background,border-color,color,box-shadow]
  ```

  `background` は `--state-transition`（`src/styles/design-system/tokens.css:162`）の表記に合わせている。
- **副作用を 1 つ受け入れる。** この指定が勝つと、ホバー時の色変化の速さが `transition-state` の `fast`（120ms）ではなく、この要素の `duration-base`（180ms、`data-active=true` のとき）になる。スクロールボタンの出入りと同じ速さに揃うだけで見た目の破綻は無いため、承知のうえで採用する。レビューでこの点が挙がったら、この段落を根拠に受容としてよい。
- `duration-base` と既存の `data-[active=false]:duration-slower` / `data-[active=false]:ease-standard` / `data-[active=true]:ease-entrance` はそのまま残す。
- `transition-state` を Button から外そうとしないこと（§3）。

### A.2 sidebar-11 の chevron（`src/blocks/sidebar-11/components/app-sidebar.tsx`）

- Collapsible の className から `[&[data-state=open]>button>svg:first-child]:rotate-90` を**削除**する。`group/collapsible` は残す。
- `ChevronRightIcon` の className を `transition-transform` から `transition-transform group-data-open/collapsible:rotate-90` に変える（`src/blocks/sidebar-02/components/app-sidebar.tsx:182` と同じ書き方）。

### A.3 block の来歴ハッシュ再同期（`provenance.json`）

`src/blocks/sidebar-11/components/app-sidebar.tsx` を変えると、`provenance.json` の `blocks.sidebar-11.files[].generatedContentSha256` が実体と食い違い、`check-completeness` が落ちる。A.2 の編集を終えた**後**に次を 1 回実行する。

```
node scripts/add-component.mjs sidebar-11 --resync
```

これは既存の来歴を保ったままハッシュだけ取り直す経路（`resyncBlockHashes`）。`--force` は使わない（CLI を再実行して正規化済みファイルを上書きしてしまう）。実行後、`git diff provenance.json` が `generatedContentSha256` の 1 箇所だけであることを確認し、before / after のハッシュを PR 本文に記録する。実装 commit (1) にこの差分を含める。
