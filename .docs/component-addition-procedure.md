# component 追加手順

この手順は、残りの shadcn/ui component を1件ずつ追加するときの正本である。複数件をまとめず、**実装 commit → その HEAD の実ブラウザ検証 → 新規証跡 commit** の順を守る。対象件数は文書へ固定せず、実行時に上流 registry から求める。

## 1. 生成と副作用確認

1. `main` から feature branch を作り、`npm ci` 後の worktree が clean であることを確認する。
2. `https://ui.shadcn.com/r/index.json` の `registry:ui` から `files` を持つ item だけを抽出し、投入済みを除いて作業キューを作る。`form` のような空 item は対象にしない。`registryDependencies` が未投入だと上流版も同時生成されるため、相互依存なしの層0、層0へ依存する層1、層2（`combobox` / `command` / `sidebar`）の順に進める。層内は並べ替えてよい。
3. 元 registry と生成予定コードを確認し、standards 正規化で実際に行う変更を言語化する。`bubble` / `message` / `message-scroller` / `attachment` / `marker` はチャット・AI UI 向けだが、製品判断で除外しない限り対象に含める。
4. 次を実行する。

   ```bash
   node scripts/add-component.mjs <name> --modified "実際に行う変更内容"
   ```

   wrapper は `.shadcn-cli-version` の exact version で `npx shadcn add` を実行し、対象 component、追加 dependency manifest、`registry.json`、`provenance.json` を残す。CLI が変更した既存の別 component は `HEAD` へ復元する。既存 dependency の version / section の変更・削除、または分類不能な path を検出したら復元せず停止する。原因を確認して wrapper の分類規則か実装計画を直し、推測で続行しない。

   追加 npm dependency を持つことが実測済みなのは `calendar`（`react-day-picker@latest` / `date-fns`）、`carousel`（`embla-carousel-react`）、`chart`（`recharts@3.8.0`）、`command`（`cmdk`）、`input-otp`（`input-otp`）、`message-scroller`（`@shadcn/react`）、`resizable`（`react-resizable-panels`）。`react-day-picker@latest` は install 時点の解決版が変わりうるため、wrapper の出力と lockfile で実際の版を確認する。

   `calendar` の実測では `button.tsx` も変更されるが、wrapper がそれを復元する。`sidebar` は `src/hooks/use-mobile.ts` を生成するため、現行分類では unknown として正しく停止する。その停止を確認した時点で hook 用の分類規則と負の unit test を追加してから再実行する。

5. 出力された復元 path、追加 dependency、2種類の SHA-256 を読む。`provenance.json` の `modified` が最終的な差分を正しく説明するか人が確認し、正しくなければ実装 commit 前に修正する。既存記録を意図的に再生成するときだけ `--force` を使う。

## 2. standards 正規化と公開契約

1. 生成コードを Base UI、semantic token、focus ring などリポジトリの規約へ合わせる。`node scripts/check-standards.mjs` の指摘ごとに、実装修正するか `.docs/risk-registry.md` へ明示受容するかを人が判断する。checker を通すためだけに規約を弱めない。shadcn/ui base-nova には、props を destructure したまま primitive へ転送し忘れる形のバグが複数ある。キーボード操作・focus 移動が期待どおりでないときは、まず props の転送を疑う。
2. `src/index.ts` から値と `export type <Name>Props` を公開する。
3. `src/previews/<name>.tsx` と light / dark の2 route を作る。isolated preview route は Layout を経由せず `<html>` を直書きする構造なので、light は `data-theme="light"`、dark は `class="dark" data-theme="dark"` を同じ要素へ必ず併記する。Provider が必要な component は、その責務を library、preview、利用側のどこへ置くか人が決める。`direction` は描画を持たない `DirectionProvider` + `useDirection` なので、検証用 consumer と selector を人が設計する。Dialog など overlay は、初期 open にして描画を常時検証するか、操作後だけ開くかを人が決める。
4. hydrated 後に必ず1件以上存在する安定 selector を `preview-selectors.json` に追加する。Portal や操作後 DOM の selector でもよいが、実ブラウザで同じ操作を再現できるようにする。
   Context Menu は pointer 座標を anchor にするため、`defaultOpen` では位置検証が成立しない。閉じた preview で trigger の `contextmenu` を実行してから Portal content を検証する。
   focus return の期待値は開き方で決める。click / keyboard で trigger を操作した場合は trigger へ戻ること、pointer だけの右クリックでは閉じた content に focus が取り残されないこと、hover では focus が移動しないことを確認する。Context Menu の右クリックは trigger を focus しないため、Escape 後に返す先がなく `BODY` へ戻るのは正常である。

## 3. 実装 commit のゲート

```bash
npm run format
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
npm run build
npm run build:lib
npm run check:pre
```

`check:pre` は evidence を除く常設 checker を fail-fast で実行する。現行の構成と順序は `scripts/check-all.mjs` の `PRE_FLIGHT_CHECKS` を正本とする。すべて通ったら component 実装だけを明示パスで stage して commit する。CIと証跡commit後の最終検査は、evidenceを含む`check:all`を維持する。

証跡の鮮度検査は、Markdown内に一意に置く`verified_impl_sha: <40桁SHA>`を正本とし、検証SHAが現在のHEADの祖先であることを確認してから、`git diff <検証SHA> -- <paths>`と`git ls-files --others --exclude-standard -- <paths>`で検証SHA、作業ツリー、未追跡ファイルを比較する。構造化欄の欠落・重複・実在しないcommit・HEAD非祖先commitは、古い証跡を含む全証跡でhard failureにする。同じcomponentに複数の証跡がある場合、他候補の祖先ではないGit DAG上のmaximal候補が一意なら、その1件だけをcomponent固有pathの鮮度hard gate対象とする。相互に比較不能なmaximal候補が複数残る場合は、HEADからのcommit距離で選ばずhard failureにする。

集約証跡の鮮度はhard gateにせずadvisoryとして一覧に出す。ただし、catalog / indexページ自身の表示内容を変更した場合は、gateが成功しても最終実装SHAで集約証跡を作り直す。共有面が変わって単に古くなった場合は、証跡に書いた具体的な観測が現在の実装でも再現するかを確認する。要素名・属性・挙動・数値など、記述内容が現在の実装と食い違う場合もadvisoryで済ませず、最終実装SHAで集約証跡を作り直す。

## 4. 実ブラウザ検証と証跡 commit

### 4.1 component 固有の light / dark 検証

1. 実装 commit の SHA を固定して preview site を起動する。空きポートを明示的に選び、起動ログと実際の URL が一致することを確認する。
2. component 固有の light route と dark route を実ブラウザで開く。console 検証の listener は navigation 前に登録する。操作後の log 取得だけでは hydration 時例外を見逃す。各 route で console error がなく、`preview-selectors.json` の selector が hydrated 後に1件以上存在することを確認する。Provider と overlay の設計に応じた操作も行う。
3. light / dark をそれぞれ撮影する。取得API名から形式を推測せず、指定した`format`、返却bytesのmagic、拡張子が一致することを検査し、既存証跡を上書きせず `.docs/reviews/` に新規保存する。`format`を省略したAPIでは返却bytesのmagicを正本にする。
   サブエージェントへ証跡の保存先を指定するときも`.docs/reviews/<slug>/`を使い、別の証跡レイヤーを作らない。
   長寿命のサブエージェント席は起動時点の定義を保持する。skill / エージェント定義を更新しても既に走っている席には反映されないため、重要な指定は呼び出しごとに明示するか、席を作り直す。
4. 検証 route、テーマ、操作、selector の件数、console 結果と、一意な`verified_impl_sha: <実装commitの40桁SHA>`を新規 Markdown に記録し、catalog 横断確認はバッチ末尾で実施することも記録する。
   component 追加ごとの恒常証跡は、結論 Markdown と light / dark screenshot だけを既定で commit する。console、DOM、Accessibility tree、network、server log は再実行時に生成する一時データとし、特定の correctness、security、明示要件を簡潔な証跡だけでは再現できない場合に限り、理由をレポートに書いて必要最小限を `.docs/reviews/` 配下に commit する。
5. `node scripts/check-evidence.mjs` を実行する。同じcomponentを再検証したら新しい証跡を追加し、古い証跡は削除も書き換えもしない。component固有pathの鮮度hard gateはcomponentごとの最新証跡1件だけに適用し、その検証SHAより新しければ証跡を作り直す。古い証跡もSHAと画像形式など鮮度以外の検査対象には残る。catalog / index の集約証跡と shared surface の stale 一覧は自動失敗ではないが、証跡に書いた具体的な観測が再現しない場合は集約証跡を作り直す。`catalog-index-r2/report.md` は一度きりの深い検証として履歴に残し、以後の hard gate 対象にしない。過去の記録は書き換えない。
   レビューを再実施した場合も既存文書のSHAや本文を更新せず、新しい文書を追加する。
6. 証跡だけを明示パスで stage し、新しい証跡 commit を作る。
   証跡commit後は`npm run check:all`がexit 0であることを必須とする。

### 4.2 バッチ末尾の catalog 横断走査

この恒久方針では、catalog 横断走査を component ごとに行わず、バッチ最終 SHA で1回だけ実施する。バッチ最終 SHA を固定して catalog を実ブラウザで開き、console error がなく、scan された全 component が描画されていることを確認する。catalog 証跡には、その走査がカバーする component 名を列挙し、バッチ最終 SHA を記録する。catalog 破損の検出をバッチ末尾まで遅らせることは、component 固有 light / dark route の即時検証を維持しつつ集約証跡の重複撮影を避けるため受容する。最後に `npm run check:all` を再実行してから PR を作る。

## 毎回必要な人間判断

- `provenance.modified` が最終差分の真実になっているか
- standards 違反を実装修正するか、risk として明示受容するか
- Provider wrapper の責務をどこへ置くか
- 描画を持たない Provider の preview consumer と selector をどう作るか
- overlay を初期 open にするか、操作後 open にするか
- shared surface 変更後に、どの既存証跡を再撮影するか

## registry:block を追加する場合の差分

block は部品（`registry:ui`）と同じ手順を使うが、次の点だけ異なる。実装計画
`.docs/plans/2026-08-17-registry-blocks-design.md` は 1 回限りの文書なので、
消化後に頼る手順の正本はここになる。

| 項目 | 部品（`registry:ui`） | block（`registry:block`） |
|---|---|---|
| 配置 | `src/components/ui/<name>.tsx` | `src/blocks/<name>/**` の per-block ディレクトリ |
| barrel（`src/index.ts`） | 載せる | **載せない**。`<Name>Props` も作らない |
| 公開ページの Props 節 | 出す | **出さない**（props 契約が設計上存在しないため） |
| 上流の `registry:page` | 該当なし | **配布しない**。来歴へ `dropped: true` で記録する |
| preview | 部品を並べる | 上流 `page.tsx` のレイアウト枠を再現する。**`mode === "catalog"` では高さを固定する**（`min-h-svh` を catalog へ持ち込むとグリッド行が破綻する。`src/previews/sidebar.tsx` が同じ形の分岐を持つ） |
| カテゴリ | 部品のカテゴリ | block 専用のカテゴリへ入れる（部品のカテゴリに混ぜない） |

### 実行手順の差分

1. `node scripts/add-component.mjs <name> --modified "..."` は共通。block では
   CLI が配布ファイルを `src/components/` 直下へフラットに落とすため、スクリプトが
   `src/blocks/<name>/` へ移設する。移設は `registryPath` の basename から決定的に対応付ける。
2. **移設後に biome の整形や standards 適合の修正を行ったら、`--resync` で来歴の
   `generatedContentSha256` を取り直す。** `check-completeness` がディスク実体と突合するため、
   ずれたままにはできない。

   ```bash
   node scripts/add-component.mjs <name> --resync
   ```

   `--modified` は付けない。付けると既存の `modified`（上流から何を変えたかの唯一の記録）を
   その文字列で**置き換える**。追記したいときだけ、既存の全文へ追記した文字列を渡す。

   **`--force` を使ってはいけない。** `--force` は shadcn CLI を再実行するので、正規化済みの
   ファイルを CLI 生成物で上書きする。その後 lint を直すと今度はハッシュがずれ、
   正規化と来歴を同時に満たす経路が無くなる（循環する）。`--resync` は CLI も通信も行わず、
   ディスク実体からハッシュだけを取り直す。
3. `preview-selectors.json` の追加は既存キーの順序を崩さず 1 件だけ挿入する。
4. `npm run registry:build` を先に実行してから `npm run check:pre` を走らせる
   （`check-distribution` が `public/r/<name>.json` を要求する）。

### block で追加されたゲート

`npm run check:all` に加えて、次が block へ掛かる。Phase 2 で件数を増やす前に、
**1 度だけ意図的な違反を仕込んで赤くなることを確認する**（緑は検査が働いている証拠にならない）。

| 仕込む違反 | 赤くなる検査 |
|---|---|
| block の tsx に値系 arbitrary value（例 `text-[#ff0000]`）を入れる | standards（**生の色リテラルは検知しない**。`check-standards.mjs` は focus ring の透明度合成と値系 arbitrary value の 2 規定のみ） |
| preview の astro を 1 枚消す | completeness |
| `preview-selectors.json` から宣言を消す | preview render |
| 来歴の `files[]` からエントリを消す | completeness |
| 台帳に載らないファイルを `src/blocks/<name>/` へ置く | completeness |
| registry item から block 自身の配布ファイルを消す | completeness |
| `registryDependencies` から使っている部品を落とす | completeness |
| 来歴の `generatedContentSha256` を書き換える | completeness |
| block の証跡 Markdown を消す | evidence |
| preview の tsx で存在しない export を import する | **typecheck**（`npm run typecheck`）。下記の注記を読むこと |

**最後の行の注記**: この違反を捕まえるのは typecheck であって検査群ではない。
実行手順で先に走らせる `npm run check:pre`（6 検査）は**緑のまま通る**（実測）。
`npm run check:all`（7 検査）は exit 1 になるが、それは import の破損の検出ではなく
evidence が「preview が証跡の検証 SHA より新しい」を見ているためで、
**無害なコメント 1 行を足しただけでも同じく赤くなる**（実測）。
`check:all` が赤いことを「壊れた import を検知した」と読まないこと。

### 未対応（Phase 2 以降で決める）

- 上流 block の `registry:file`（`dashboard-01/data.json`）は CLI が item の `target` へ書くため
  移設が成立せず、`SUPPORTED_BLOCK_FILE_TYPES` が fail-closed で止める。
  `registry:ui` / `registry:hook` も同様に止まる（CLI がそれぞれ `aliases.ui` /
  `aliases.hooks` へ落とすため、`src/components/` 直下からの移設が成立しない）。
  上流 block がこれらの type を持つと「なぜか止まる」形で現れる。
- **18 件の block が、どの registry にも存在しない `@/app/(create)/components/icon-placeholder` を
  import する**（`login-05` / `signup-05` / `sidebar-01〜13,15,16` / `dashboard-01`。実測）。
  上流 shadcn.com のサイト内部コンポーネントで、`https://ui.shadcn.com/r/styles/base-nova/icon-placeholder.json`
  は **404**、当リポジトリの `registry.json` にも無い。`internalDependency` が `unknown` を返して
  completeness が `registry item へ対応付けられない` で赤くなる（fail-closed なので黙って壊れはしない）。
  block ごとに「lucide アイコンへ置換 / placeholder を自作 / 対象から外す」を人が決める。

  **設計 §6-2 の「既存 61 コンポーネントで全 block をまかなえる」は `registryDependencies` の
  宣言だけを突き合わせた結論で、配布ファイルの中身は測っていない。** 宣言側の不足が 0 件なのは
  正しいが、中身は上記のとおり不足する。

  素通しで進められるのは `login-02,03,04` / `signup-01,02,03,04` / `sidebar-14` の 8 件のみ。

- 配布ファイルが**互いを import する** block（sidebar 系の `app-sidebar.tsx` → `nav-main.tsx`）は、
  consumer 側で `src/components/` へフラットに落ちるうえ `shadcn build` が import specifier を
  書き換えないため、解決不能な import が残りうる。**Phase 2 の最初の 1 件で落下先の import を
  目視で確かめてから残りへ進む。**
