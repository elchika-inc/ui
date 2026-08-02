# バッチ4 UI component 実装計画

> 実行時は `.docs/component-addition-procedure.md` と `2026-08-02-batch-final-design.md` を併読する。チェックを省略せず、上から順に進める。

## Global Constraints

- 作業 branch は `feat/batch-final`、起点は main `e47382a` とする。main へ直接 commit / push しない。
- `standards` repository は読み取り専用とする。
- 対象 UI は本計画に列挙したものだけとする。`use-mobile` は Claude 裁定により sidebar が必要とする独立 `registry:hook` として追加する。
- commit message、PR、文書、コードコメントは日本語にする。
- 既存 component を変更しない。CLI が変更した既存 component は wrapper で HEAD へ復元する。
- `provenance.modified` は予定でなく実差分を記録する。
- 全 PascalCase value export に同名の `<Name>Props` を公開する。
- 別定義から導かれる件数を Expected に書かない。空走だけは「0件でない」で検出する。
- 検証 command に pipe を挟まない。
- stage は明示 path だけを指定し、`git add -A` を使わない。
- component ごとに「実装 commit → 固定 SHA の browser 検証 → 新規証跡 commit」を守る。
- 仕様・scope の矛盾、wrapper の unknown 停止、既存 dependency の版・区分変更を検出したら、影響範囲を止めて Claude へ `agmsg` で報告する。
- correctness、security、明示要件の review flag がゼロになるまで修正と clean round を反復する。

## 共通手順 C: UI component 1件

各 Task の `<name>` を対象名へ置き換え、次を literal に実行する。

### C1. 上流事実の確認

- [ ] `https://ui.shadcn.com/r/styles/base-nova/<name>.json` を取得する。
- [ ] `type`、`files`、`dependencies`、`registryDependencies`、全 export を読む。
- [ ] Provider、Portal、keyboard、focus、live region、自動変化など、実在する挙動だけを列挙する。
- [ ] 追加 dependency の有無を `package.json` の現状と照合する。

Expected: registry 応答と実装から、生成後に測る内容が説明できる。名前だけから期待値を作らない。

### C2. wrapper 生成

Run:

```bash
node scripts/add-component.mjs <name> --modified "生成後に実際に行う正規化"
```

- [ ] wrapper が停止した場合は、そのまま Claude へ報告する。
- [ ] 復元 path、追加 dependency、生成直後 hash、registry hash を確認する。
- [ ] `git diff --name-only` で対象外 component が残っていないことを確認する。

Expected: 対象 component、必要な dependency manifest、`registry.json`、`provenance.json` だけが意図どおり変更される。

### C3. standards 正規化と公開

- [ ] Base UI、semantic token、focus ring、ARIA、コメント言語をリポジトリ規約へ合わせる。
- [ ] 全 PascalCase value export に `<Name>Props` を定義する。
- [ ] `src/index.ts` から値と Props 型を export する。
- [ ] `src/previews/<name>.tsx` を追加する。
- [ ] `src/pages/preview/<name>.astro` と `<name>-dark.astro` を追加する。
- [ ] `preview-selectors.json` に hydration 後に実在する selector を追加する。
- [ ] `provenance.modified` を最終差分へ合わせる。

### C4. 実装 gate と commit

Run:

```bash
npm run format
npm run lint
npm run typecheck
node --test scripts/*.test.mjs
npm run build
npm run build:lib
npm run check:pre
git diff --check
```

Expected: すべて exit 0。warning がある場合は新規差分か既存 baseline かを判定する。

- [ ] `git diff --name-only` と `git status --short` を確認する。
- [ ] Task 所有 path だけを明示 stage する。
- [ ] 日本語の実装 commit を作る。
- [ ] `git rev-parse HEAD` で `IMPL_SHA` を固定する。

### C5. 固定 SHA の実ブラウザ検証

- [ ] 空き候補ポートを確認し、明示ポートで preview server を起動する。
- [ ] 起動ログの URL と実際の接続先が一致することを確認する。
- [ ] `verification-documenter` に light / dark route、起動方法、非破壊操作、上流から導出した観測項目を渡す。
- [ ] light / dark の両 route で selector が hydration 後に実在することを確認する。
- [ ] console error、主要 interaction、keyboard / focus / live region のうち実在する経路を確認する。
- [ ] focus 表示の有無は checker では判定せず、keyboard focus 後の computed style をブラウザで確認する。
- [ ] screenshot API の format、返却 bytes の magic、`.jpg` 拡張子が一致することを確認する。
- [ ] `verified_impl_sha: <IMPL_SHA>` を一意に含む Markdown と light / dark JPEG を新規作成する。
- [ ] agent の検証可能な主張を main agent が SHA、status、selector、ファイル実在で裏取りする。
- [ ] `.docs/reviews/<name>/` の Markdown と画像実体を確認する。

### C6. 証跡 gate と commit

Run:

```bash
node scripts/check-evidence.mjs
npm run check:all
git diff --check
```

Expected: すべて exit 0。aggregate / shared stale は advisory として読み、証跡本文との実矛盾があれば再撮影する。

- [ ] 新規証跡 path だけを明示 stage する。
- [ ] 日本語の証跡 commit を作る。
- [ ] `npm run check:all` を再実行する。

## Task 0: 基線と設計

- [x] main `e47382a` から `feat/batch-final` を作る。
- [x] `npm ci`、script tests、`check:all`、build を実行する。
- [x] 上流 registry の対象、dependency、registry dependency、export を確認する。
- [x] dependency の事前件数と `toast` の誤分類を Claude へ報告し、裁定を受ける。
- [x] `use-mobile` の独立 `registry:hook` 裁定を受ける。
- [x] `.docs/plans/2026-08-02-batch-final-design.md` を commit する。

## Task 1: 層1 前半

次の順で各件に C1〜C6 を適用する。

### Task 1.1 `alert-dialog`

- [ ] 上流 primitive から modal / focus / dismiss 経路を導出する。
- [ ] C1〜C6 を完了する。

### Task 1.2 `attachment`

- [ ] attachment 表示と操作可能要素の経路を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 1.3 `button-group`

- [ ] group orientation、separator、keyboard 到達を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 1.4 `calendar`

- [ ] `react-day-picker@latest` と `date-fns` の実解決版を wrapper 出力と lockfile で記録する。
- [ ] 日付選択、月移動、keyboard 経路を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 1.5 `carousel`

- [ ] `embla-carousel-react` の実解決版を記録する。
- [ ] 前後移動、境界状態、keyboard 経路を上流から導出する。
- [ ] C1〜C6 を完了する。

- [ ] Task 1.1〜1.5 の component 名、実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 2: 層1 中盤

### Task 2.1 `chart`

- [ ] `recharts` の実解決版を記録する。
- [ ] SVG、tooltip、legend、theme token の到達を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 2.2 `field`

- [ ] label、description、error、disabled の関連付けを上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 2.3 `input-group`

- [ ] prefix / suffix、button、focus-visible の経路を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 2.4 `item`

- [ ] media、content、actions、separator の構造を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 2.5 `menubar`

- [ ] menu open、submenu、keyboard navigation、focus return を上流から導出する。
- [ ] C1〜C6 を完了する。

- [ ] Task 2.1〜2.5 の component 名、実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 3: 層1 後半

### Task 3.1 `message-scroller`

- [ ] `@shadcn/react` の実解決版を記録する。
- [ ] scroll 追従、最下部移動 button、追加 message の経路を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 3.2 `pagination`

- [ ] current page、前後 link、無効境界、accessible name を上流から導出する。
- [ ] C1〜C6 を完了する。

### Task 3.3 `sheet`

- [ ] 上流 primitive と hydrated DOM から open / close、dismiss、focus、背景の扱いを導出する。
- [ ] C1〜C6 を完了する。

### Task 3.4 `toast`

- [ ] modal として扱わず、live notification の追加・自動消滅・読み上げ経路・Action / Close・複数通知・hover pause・背景到達を測る。
- [ ] C1〜C6 を完了する。

### Task 3.5 `toggle-group`

- [ ] single / multiple、pressed state、keyboard 到達を上流から導出する。
- [ ] C1〜C6 を完了する。

- [ ] Task 3.1〜3.5 の component 名、実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 4: 層2 `combobox`

- [ ] `button` と `input-group` が registry と source に存在することを確認する。
- [ ] option open、filter、keyboard selection、clear、focus return を上流から導出する。
- [ ] C1〜C6 を完了する。
- [ ] 実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 5: 層2 `command`

- [ ] `dialog` と `input-group` が registry と source に存在することを確認する。
- [ ] `cmdk` の追加と実解決版を wrapper 出力と lockfile で記録する。
- [ ] inline command と dialog command の filter、keyboard selection、empty state を上流から導出する。
- [ ] C1〜C6 を完了する。
- [ ] 実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 6: `registry:hook` と層2 `sidebar`

### Task 6.1 wrapper の RED

- [ ] 現行 wrapper で `use-mobile` を追加し、`src/hooks/use-mobile.ts` が unknown として停止することを確認する。
- [ ] 停止直後の変更 path を記録し、復元せず停止したことを Claude へ報告する。
- [ ] 作業ツリーを安全に clean へ戻し、対象 path を再確認する。
- [ ] unit test に `registry:hook` target が未対応で失敗するケースを追加して RED を確認する。

Expected: unknown path が surface され、テストは対応前に失敗する。

### Task 6.2 wrapper の GREEN

- [ ] upstream item を CLI 実行前に取得し、`registry:ui` / `registry:hook` の一次 file と生成先を決める。
- [ ] target path 分類、registry item type / files、provenance upstream path を item type に対応させる。
- [ ] unknown path と既存 dependency 変更の fail-closed を維持する。
- [ ] hook item の正の unit testと、未対応 type / path の負の unit testを追加する。
- [ ] `node --test scripts/add-component.test.mjs` を実行し GREEN を確認する。
- [ ] 全 script tests、format、lint、typecheck、build、library build、`check:pre` を実行する。
- [ ] wrapper 変更だけを明示 stage し、日本語 commit を作る。

### Task 6.3 `use-mobile`

- [ ] `node scripts/add-component.mjs use-mobile --modified "実差分"` を実行する。
- [ ] `src/hooks/use-mobile.ts`、provenance、独立 `registry:hook` item を確認する。
- [ ] `registry:build` 後の `public/r/use-mobile.json` に hook content があることを確認する。
- [ ] fresh probe で `@elchika/use-mobile` が `src/hooks/use-mobile.ts` を書き出すことを確認する。
- [ ] format、lint、typecheck、script tests、build、library build、`check:pre` を実行する。
- [ ] hook と registry / provenance 変更だけを明示 stage し、日本語 commit を作る。

### Task 6.4 `sidebar`

- [ ] `button`、`input`、`separator`、`sheet`、`skeleton`、`tooltip`、`use-mobile` が registry に存在することを確認する。
- [ ] layout、collapse、mobile sheet、keyboard shortcut、focus、cookie side effect を上流から導出する。
- [ ] C1〜C6 を完了する。
- [ ] `public/r/sidebar.json` の `registryDependencies` に `@elchika/use-mobile` があり、hook を files へ重複同梱していないことを確認する。
- [ ] fresh probe で sidebar と hook が両方 install され、import が解決することを確認する。
- [ ] wrapper SHA、hook SHA、sidebar 実装 SHA、証跡 SHA、gate 結果を Claude へ1通報告する。

## Task 7: `direction`

### Task 7.1 方針報告

- [ ] 上流 `direction` item と Base UI API を読む。
- [ ] Provider 配下の consumer、selector、light / dark の観測項目を決める。
- [ ] 実装前に方針を Claude へ報告する。

### Task 7.2 実装と検証

- [ ] `DirectionProvider` と `useDirection` の値・Props 型を公開する。
- [ ] consumer が LTR / RTL の属性と hook 解決値を可視化する preview を作る。
- [ ] C1〜C6 を、描画本体ではなく consumer の実 DOM に対して完了する。
- [ ] 実装 SHA、証跡 SHA、gate 結果を Claude へ報告する。

## Task 8: バッチ末尾 catalog 横断検証

- [ ] 最終 component 証跡 commit の SHA を固定する。
- [ ] catalog light / dark を同じ SHA の preview server で開く。
- [ ] 動的 manifest が列挙する全 preview 名を取得し、0件でないことを確認する。
- [ ] 各 `data-catalog-preview` が hydration 後に実在し、console error がないことを確認する。
- [ ] overlay / 自動通知が catalog mode で横断表示を妨げないことを確認する。
- [ ] 対象名、固定 SHA、再現手順、console 結果を新規 Markdown に記録し、light / dark JPEG を保存する。
- [ ] `node scripts/check-evidence.mjs` と `npm run check:all` を実行する。
- [ ] catalog 証跡だけを明示 stage し、日本語 commit を作る。

## Task 9: レビューサイクル

- [ ] scope を main `e47382a..HEAD` に固定する。
- [ ] correctness / requirements、security / altitude、tests / fresh-eyes のレビューを独立 context で実施する。
- [ ] 各レビューで `INSPECTION_STATUS: flag=<n> optional=<n>` を記録する。
- [ ] flag が出たら全件修正し、影響 component の実装 SHA と browser 証跡を更新する。
- [ ] 修正後に clean round を1回通し、flag 0 を確認する。
- [ ] review 記録を `.docs/reviews/` に保存する。

## Task 10: 最終 gate、push、PR、総括

Run:

```bash
npm run format
npm run lint
npm run typecheck
node --test scripts/*.test.mjs
npm run build
npm run build:lib
npm run check:props
npm run check:all
git diff --check e47382a..HEAD
git status --short
```

Expected: command はすべて exit 0、worktree は clean。warning / advisory は内容を読み、明示要件との実矛盾がないことを確認する。

- [ ] `git diff --name-only e47382a..HEAD` を対象 queue と設計・計画・証跡・wrapper の許可範囲へ照合する。
- [ ] `git push -u origin feat/batch-final` を実行する。
- [ ] 日本語の PR title / body を作り、base main、head `feat/batch-final` で PR を作成する。
- [ ] PR body の Summary、Tests、追加 dependency の実解決、`registry:hook`、browser 証跡、review flag 0、既知 risk を readback する。
- [ ] 61 component 総括として、投入した名前、依存、実装と検証で得た知見、残存 advisory、PR URL を Claude へ報告する。
