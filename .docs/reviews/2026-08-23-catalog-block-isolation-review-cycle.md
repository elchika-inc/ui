# catalog の block iframe 隔離 レビューサイクル

verified_impl_sha: 59d5c77282b8416e2ff190733a38841859695cf3

## 対象

- 実装範囲: `src/catalog/verification-catalog.tsx`、`src/catalog/registry-kinds.ts`（新規）、`src/pages/catalog.astro`、`src/pages/catalog-dark.astro`、`scripts/catalog-build.test.mjs`、`scripts/check-evidence.mjs`、`scripts/check-evidence.test.mjs`
- 目的: 本番 `/catalog/` で registry:block の preview を同一 DOM に直接描画していたために起きた重なり（sidebar-13 の dialog overlay がページ全体を覆う、sidebar 系の `position: fixed` が隣カードを覆う）を、block 28 件だけ隔離プレビュー `/preview/<name>/` の `<iframe loading="lazy">` 埋め込みへ切り替えて解消する
- 実装 SHA: `59d5c77282b8416e2ff190733a38841859695cf3`
- 実施者: 実装担当（Claude Code, claude-fable-5）がオーケストレータ。レビュアーはサブエージェント 1 名（sonnet）が各ラウンドでレンズを順に当てた（`parallel-review-cycle` スキルの実行モデル）
- レビュー上限: 3 round（委任仕様 §6）
- 終了判定: Round 3 で全レンズ confidence 80% 以上の flag 0
- 実装担当識別子: Claude Code（claude-fable-5）、worktree `catalog-block-isolation`、ブランチ `naoto24kawa/catalog-block-isolation`

## Round 1（Fresh Eyes → Security → Core Logic → Tests → Domain）

flag 1 件（Domain, 82%）:

- catalog の描画が registry.json の item type に新たに依存するのに、`check-evidence` の catalog 用 stale 対象パス（`evidencePaths()`）に `registry.json` / `src/catalog/registry-kinds.ts` が無い。registry.json の type だけが変わって catalog の見た目が変わっても catalog 証跡が stale にならない

対応:

- `evidencePaths()` の catalog 分岐へ `src/catalog/registry-kinds.ts` と `registry.json` を追加

optional（採用）:

- Tests: block カードの「隔離プレビューを開く」リンク href を検査するアサーションが無い → `catalog-build.test.mjs` の新テストに追加

optional（非採用、理由は末尾）: block preview 28 件の `mode === "catalog"` 分岐が到達不能になる件、`previewRoute` の 2 箇所重複

## Round 2（Fresh Eyes → Domain → Tests）

flag 2 件:

- Domain（82%）: block の iframe が読み込む `src/pages/preview/<name>[-dark].astro` への依存が新設されたのに、catalog 用 stale 対象パスに `src/pages/preview` が無い
- Tests（88%）: `check-evidence.mjs` の変更に対応する回帰テストが無い。既存 fixture は `registry.json` / `registry-kinds.ts` を作らないため、追加した 2 行が削除されてもどのテストも赤にならない

対応:

- `evidencePaths()` の catalog 分岐へ `src/pages/preview` を追加（ディレクトリ粒度。既存の `src/previews` / `src/components/ui` と同じ）
- `check-evidence.test.mjs` に「catalog の block 判別と隔離プレビュー route の変更も catalog 証跡の陳腐化一覧へ出す」を追加。`registry.json` / `src/catalog/registry-kinds.ts` / `src/pages/preview/login-01.astro` を追加コミットし、catalog 証跡だけが 3 パスで stale になることを deepEqual で固定（3 行のいずれを外しても期待文字列が変わり赤になる）

optional（非採用）: block 判別が本番コード 2 箇所（`[name].astro` の Map と `registry-kinds.ts` の一覧）にある件、`registry-kinds.ts` が `block-scan.mjs` の和集合でなく registry.json 単独を走査根にする件

## Round 3（Fresh Eyes → Domain → Tests）

- Fresh Eyes: flag 0
- Domain: flag 0（optional 1: 「隔離プレビューを開く」リンクのアクセシブルネームが 28 件同一）
- Tests: flag 0（新テストの期待値が実装から導けること、3 行削除の mutation で赤になること、既存 deepEqual テストへの副作用が無いことを実装読解で確認）

## 偽陽性

なし。

## テスト結果（最終ラウンド後）

- `node --test scripts/check-evidence.test.mjs`: 89 / 89 pass（回帰テスト 1 件追加）
- `node --test scripts/catalog-build.test.mjs`: 7 / 7 pass（新テスト 1 件追加、build 込み）
- `npm run lint`: exit 0（既存の警告のみ）
- `npm run typecheck`: 0 errors / 0 warnings

## 非採用 optional

- block preview 28 件の `mode === "catalog"` 分岐が catalog から到達不能になる: `src/previews/**` は委任仕様 §3 のスコープ外。分岐を外すかどうかは preview 側の方針（埋め込み時の autofocus 抑止と同時に扱うのが自然）なのでフォローアップへ申し送る
- `previewRoute` の重複（`src/site/component-documentation.tsx` と 2 箇所）: 重複は 3 回目で共通化する既存方針に従い据え置き
- block 判別の本番コード 2 箇所: 用途が異なる（単一ルックアップと一覧）。3 箇所目で集約する
- `registry-kinds.ts` の走査根が registry.json 単独: 委任仕様 §2・§4 が「registry.json の item type を正本にする」と指定。ディスク / 来歴にだけ在る block は `check-completeness` が別途赤にする
- リンクのアクセシブルネーム: component ページの「別ページで開く」と同じパターン。直前の見出し（block 名）から目的が判定できる。block がさらに増えた時点で `aria-label` を検討する

## 既知の制限（レビューで flag にならなかったが申し送る）

隔離プレビューは dialog / popover を開いた状態で描画し、その focus trap が iframe 内の要素へ autofocus する。ブラウザはフォーカスされた iframe が見える位置まで親ページをスクロールするため、遅延ロード時に catalog がジャンプする（1440×900 で sidebar-13 の読み込み時に 2,362px を実測）。iframe の `inert`、親 window の `focusin`、親 window の `blur` の 3 案を実装して実測したが、いずれも防げなかった。根本対処は preview 側で埋め込み時の autofocus を抑止すること（スコープ外）。

## ACCEPTED_RISKS

なし。confidence 80% 以上の flag はすべて修正し、Round 3 で残存 0 を確認した。
