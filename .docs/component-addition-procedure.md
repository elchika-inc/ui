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

1. 生成コードを Base UI、semantic token、focus ring などリポジトリの規約へ合わせる。`node scripts/check-standards.mjs` の指摘ごとに、実装修正するか `.docs/risk-registry.md` へ明示受容するかを人が判断する。checker を通すためだけに規約を弱めない。
2. `src/index.ts` から値と `export type <Name>Props` を公開する。
3. `src/previews/<name>.tsx` と light / dark の2 route を作る。Provider が必要な component は、その責務を library、preview、利用側のどこへ置くか人が決める。`direction` は描画を持たない `DirectionProvider` + `useDirection` なので、検証用 consumer と selector を人が設計する。Dialog など overlay は、初期 open にして描画を常時検証するか、操作後だけ開くかを人が決める。
4. hydrated 後に必ず1件以上存在する安定 selector を `preview-selectors.json` に追加する。Portal や操作後 DOM の selector でもよいが、実ブラウザで同じ操作を再現できるようにする。

## 3. 実装 commit のゲート

```bash
npm run format
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
npm run build
npm run build:lib
npm run check:all
```

`check:all` は standards、completeness、distribution、preview selector 宣言、証跡形式を順に検査する。すべて通ったら component 実装だけを明示パスで stage して commit する。

証跡の鮮度検査は `git diff <検証SHA> -- <paths>` で検証 SHA と作業ツリーを比較し、検証済み component 固有 path の未コミット変更も hard failure にする。catalog / index の集約証跡と共有面の変更は component 追加のたびに必然的に古くなりうるため、hard failure ではなく陳腐化一覧として扱う。

## 4. 実ブラウザ検証と証跡 commit

### 4.1 component 固有の light / dark 検証

1. 実装 commit の SHA を固定して preview site を起動する。空きポートを明示的に選び、起動ログと実際の URL が一致することを確認する。
2. component 固有の light route と dark route を実ブラウザで開く。各 route で console error がなく、`preview-selectors.json` の selector が hydrated 後に1件以上存在することを確認する。Provider と overlay の設計に応じた操作も行う。
3. light / dark をそれぞれ撮影する。拡張子と画像実体を一致させ、既存証跡を上書きせず `.docs/reviews/` に新規保存する。Browser の `screenshot` は `Uint8Array` API でも実体が JPEG、CDP `Page.captureScreenshot` は PNG なので、取得方法に対応する拡張子を使う。
4. 検証 route、テーマ、操作、selector の件数、console 結果、実装 commit の40桁 SHA を新規 Markdown に記録し、catalog 横断確認はバッチ末尾で実施することも記録する。
   component 追加ごとの恒常証跡は、結論 Markdown と light / dark screenshot だけを既定で commit する。console、DOM、Accessibility tree、network、server log は再実行時に生成する一時データとし、特定の correctness、security、明示要件を簡潔な証跡だけでは再現できない場合に限り、理由をレポートに書いて必要最小限を `.docs/reviews/` 配下に commit する。
5. `node scripts/check-evidence.mjs` を実行する。component 固有 path が検証 SHA より新しければ証跡を作り直す。catalog / index の集約証跡と shared surface の stale 一覧は自動失敗ではないため、見た目への影響を人が確認し、必要な証跡だけを再撮影する。`catalog-index-r2/report.md` は一度きりの深い検証として履歴に残し、以後の hard gate 対象にしない。過去の記録は書き換えない。
6. 証跡だけを明示パスで stage し、新しい証跡 commit を作る。

### 4.2 バッチ末尾の catalog 横断走査

この恒久方針では、catalog 横断走査を component ごとに行わず、バッチ最終 SHA で1回だけ実施する。バッチ最終 SHA を固定して catalog を実ブラウザで開き、console error がなく、scan された全 component が描画されていることを確認する。catalog 証跡には、その走査がカバーする component 名を列挙し、バッチ最終 SHA を記録する。catalog 破損の検出をバッチ末尾まで遅らせることは、component 固有 light / dark route の即時検証を維持しつつ集約証跡の重複撮影を避けるため受容する。最後に `npm run check:all` を再実行してから PR を作る。

## 毎回必要な人間判断

- `provenance.modified` が最終差分の真実になっているか
- standards 違反を実装修正するか、risk として明示受容するか
- Provider wrapper の責務をどこへ置くか
- 描画を持たない Provider の preview consumer と selector をどう作るか
- overlay を初期 open にするか、操作後 open にするか
- shared surface 変更後に、どの既存証跡を再撮影するか
