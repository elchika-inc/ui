verified_impl_sha: 276a7d7e0814acd1fe72beee5aa047880c97f708

# issue #90 一覧の絞り込み・横はみ出し修正 レビュー記録

- 実施日: 2026-09-18
- 対象実装: `276a7d7e0814acd1fe72beee5aa047880c97f708`。レビュー開始時の HEAD は `81e2c0da489f1ec0b9f66920031f6a3e9d35fa58` で、未コミット差分の fingerprint と実装commit後のファイルが一致することを確認した。
- 対象: `src/site/component-index.tsx`、`src/site/component-documentation.tsx`、`.docs/component-addition-procedure.md`。
- 正本: `.docs/plans/2026-09-18-index-search.md` §5 と司令塔の既出裁定。指定された5レンズを別々の fresh context で順番に実行した。
- 入力: 担当3ファイルの diff と全文、spec §1 / §2 / §4 / §A のみ。他ファイル・他セッションを調べないよう指示した。
- レビュアー: Claude Sonnet。定義されたツールは Read / Glob / Grep のみ、外部MCPを無効化、safe-mode、dontAsk、no-session-persistence。指定手順のため code-review-graph や追加レンズは使用していない。
- scope: 確信度80%以上の correctness・セキュリティ・明示要件への影響だけを flag とし、それ以外は optional。全レンズの原文を以下に保存する。
- `INSPECTION_STATUS: CLEAN` — flag 0件、optional 8件。初回から flag 0件のため1ラウンドで終了。
- 修正ループ: なし。ACCEPTED_RISKS: なし。偽陽性登録・棄却・flagの格下げ: なし。

## 実行方法

各レンズに対して次のコマンドを新たに起動し、入力をstdinから与えた。1回1レンズ、同時起動なし。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

| 順序 | レンズ | 試行 | exit | 秒 | 結果 |
|---|---|---:|---:|---:|---|
| 1 | fresh-eyes | 1 | 0 | 196.83 | LGTM |
| 2 | security | 1 | 0 | 83.99 | LGTM |
| 3 | core-logic | 1 | 0 | 191.18 | LGTM |
| 4 | tests | 1 | 0 | 148.54 | LGTM |
| 5 | domain | 1 | 0 | 233.86 | LGTM |

全応答の境界マーカーと先頭の結論を検査してから、境界行だけを除いた本文を改変せず保存した。再取得・形式fallbackは不要だった。

## 任意指摘の扱い

任意指摘は要件外として修正を増やさず、以下の原文に残した。検索typeのPR申告など提出時の確認事項はPR本文に反映する。入力が空白だけの場合もクリアできること、0件statusの文言、既存のblockスクロール復元は指定要件を維持した。

## Round 1 の原文

### fresh-eyes

LGTM

根拠:
- 絞り込みロジック（`normalizeSearch` による小文字化＋空白/ハイフン除去での部分一致）は name / title / カテゴリ名 / 種別の4項目に対して正しく機能する。「Text Reveal」「TEXTREVEAL」「モーション」「block」いずれの検索語でも仕様どおりの一致結果になることをロジック上確認した。JS の `\s` は全角スペース（U+3000）にもマッチするため、日本語の空白入力も正しく正規化される。
- 初期状態（`search === ""`）では `"x".includes("")` が常に true になるため、SSR/初期描画時は全カテゴリ・全96件が描画され続ける。`scripts/catalog-build.test.mjs` の既存アサーション（全件描画・block判定一致）はそのまま通る設計になっている。
- サイドバー用 `categories` は絞り込みの影響を受けず `DocumentationShell` にそのまま渡されており、A.1 の要件を満たす。
- `clearSearch` は `setSearch("")` の直後に同期的に `searchInput.current?.focus()` を呼んでおり、クリックされたボタン（InputGroupButton か Empty 内 Button のどちらか）が次の再描画で消えても、フォーカスは検索欄に正しく移る。
- `Empty` 内のクリアボタンに `data-index-search-clear` を付けていない設計は、Playwright の strict mode で同一属性が複数要素にマッチしてエラーになることを避けており、むしろ妥当な選択。
- install カードの `min-w-0` 追加は §1.2 の実測（641→375）に対応する最小限の修正で、過剰実装は見られない。既存の `InputGroup` / `Empty` 部品をそのまま利用しており、新規の抽象化や独自コンポーネントを持ち込んでいない。

optional:
- 0件時、`data-index-search-status` の文言「0 件：該当するコンポーネントがありません」と `EmptyTitle` の「該当するコンポーネントがありません」が画面上で意味的に重複する。要件は満たしているが、`status` 側を「0 件」だけに短縮すると視覚的重複が減る。
- 空白のみを入力した場合、`query` が空文字列になり絞り込みは効かない（全件表示のまま）が、`search` 自体は truthy なためクリアボタンだけが表示される。実害はないが、`{search.trim() && (...)}` のように揃えるとボタン表示と絞り込み状態の整合が取れる。
- `type="search"` と `[&::-webkit-search-cancel-button]:hidden` の組み合わせは spec A.1 が認めた選択肢の一つであり、この diff 単体では問題ないが、PR 本文でどちらを選んだか申告することを忘れないこと（レビュー対象外の確認事項）。

### security

LGTM
- 検索語の流れ先は React 制御の `<InputGroupInput value>` と in-memory の `filter`（`normalizeSearch`）のみ。`dangerouslySetInnerHTML`・URL 構築・`iframe src`・`href`・外部送信のいずれにも渡らず、注入経路が無い。URL / hash から検索語を読み込む処理も無く反射型の経路も無い。
- `normalizeSearch` の `/[\s-]/g` は固定・線形の正規表現で ReDoS の余地なし。
- 画面に描画される文字列（`name` / `title` / `category.name` / `resultCount`）はすべて build-time データと数値・定数で、SSR 時点で元々 96 件全部が HTML に含まれているため、絞り込み機能の追加によって新たに露出する情報は無い（信頼境界・情報漏洩の観点で変化なし）。
- `iframe` の `src`（`previewRoute`）は props 由来の固定文字列（`name`）から組み立てられ、検索語など利用者入力は関与しない。
- `component-documentation.tsx` の差分は `min-w-0` クラスの追加2箇所のみで、セキュリティに関係する変更なし。

### core-logic

LGTM

根拠:
- 件数表示: `{category.items.length} items` と `resultCount` はいずれも同一の `filteredCategories`（`categories.map` でフィルタ後 items を持つ新オブジェクトを生成し `.filter(items.length > 0)` した結果）から派生しており、二重管理がないため件数とカード実数の乖離は構造的に発生しない。
- 絞り込み照合: `normalizeSearch`（小文字化＋空白/ハイフン除去）を検索語・`name`・`title`・`category.name`・種別（`block`/`component`）双方に適用し `includes` で部分一致。検索語が空文字のときは常に true となり全件表示になるため、SSR 初期 HTML が全件描画される前提（`scripts/catalog-build.test.mjs` の既存2テスト）と矛盾しない。
- サイドバー用 `categories` は `DocumentationShell` へそのまま渡され、フィルタは `{...category, items: [...]}` で新オブジェクトを作るだけなので元配列・元カテゴリは変更されない。サイドバーが絞り込みの影響を受けない要件を満たす。
- 状態保持: `loadedBlocks`（Set）と `scrollPositions`（ref の Map）は `ComponentIndex` 側の state/ref であり、フィルタでカードが一時的に描画から外れても消えない。再表示時は `loaded={loadedBlocks.has(name)}` が再評価されるため、block の読み込み済み状態は自然に保たれる。
- 種別検索（`block`）で name/title に偶然 "block" を含むコンポーネントが混入する可能性は理論上あるが、検証項目6の「残るカードが全て `data-component-index-kind="block"` で28件」という機械検査が直接検出するため、flag対象としない。

optional:
- block の「プレビューを読み込む」を押してから `onLoad` 発火（または `restoreScrollAfterLoad` の24フレーム消化）が完了する前に検索語を入力してそのカードを隠し、後で検索をクリアして再表示させると、`scrollPositions` に残った古い scrollY へ向けて iframe 再ロード後に強制スクロールが走る可能性がある。発生条件が限定的で確信度は80%未満のため flag にはしないが、A.1 の実測項目に「絞り込みでカードを隠す→戻す往復時にスクロール位置が意図せず変化しないこと」を加えておくと安全。

### tests

LGTM

- `catalog-build.test.mjs` の既存2件（`data-component-index-item` が preview 全件と一致／`data-component-index-kind` が `registry:block` と一致）は保持される: `useState("")` により初期 `search === ""`、`normalizeSearch("") === ""` で `String.prototype.includes("")` は常に true となるため、SSR 時の `filteredCategories` は `categories` を `.map(spread).filter(length>0)` しただけで items の集合・順序が変化しない。`kind = blocks.has(name) ? "block" : "component"` のロジックも無変更。
- server/client とも初期 `search=""` のため clear ボタン・`Empty` は双方非描画で、hydration mismatch は構造上発生しない（spec §4.6 の pageerror 0 の要件と整合）。
- `typography-usage.test.mjs` が縛る `text-xs`／旧 `tracking-*`／数値 `leading-N` の新規使用は無し。`[&::-webkit-search-cancel-button]:hidden` は arbitrary *variant* であり check-standards の値系検査対象外（spec §A.1 が明示許可）。
- rubric 2「既存 `test(` の削除行が無い」は diff に `scripts/*.test.mjs` の変更が含まれないため自明に満たす。新規テストファイルの追加も範囲外通り行われていない。
- spec §4.6 の各ケース（`Text Reveal`/`TEXTREVEAL` 正規化一致、`モーション` カテゴリ一致、`block` 種別フィルタ、`resultCount===0` 時の `Empty`/`data-index-search-status`/`section` 0件、件数表示 `category.items.length` の整合）は diff の実装ロジックで判別可能であり、spec の実測で検証できる構造になっている。

optional: `InputGroupInput`/`Empty` への `data-*` 属性・`ref` 転送は範囲外ファイル（`input-group.tsx`/`empty.tsx`）のため本diffからは確認できないが、spec §4.6 のPlaywright実測（`[data-index-search]` 操作・`[data-index-search-empty]` 件数）が直接検出するため flag とはしない。

### domain

LGTM

flag に該当する correctness / セキュリティ / 明示要件違反は確認できませんでした。§A.1・§A.2 の明示要件（絞り込みロジック、`min-w-0` の付与、`DocumentationShell` へ渡す `categories` が絞り込みの影響を受けないこと、`type="search"` + webkit clear button 非表示の申告事項、`aria-label` / `aria-live` の設置）はいずれもコード上で満たされています。

optional:
- `src/site/component-index.tsx` の `data-index-search-status` 要素（190行台）は `{resultCount} 件{resultCount === 0 ? "：該当するコンポーネントがありません" : ""}` という複数テキストノードで構成されており、`aria-atomic="true"` が付いていません。件数変化時にスクリーンリーダーが変化したテキストノード（数字部分のみ）だけを読み上げ、「件」が省略される可能性があります。`aria-atomic="true"` を付けるか単一のテンプレート文字列にまとめると、読み上げが安定します。
- 0 件時、`data-index-search-status` の文言（「0 件：該当するコンポーネントがありません」）と `EmptyTitle`（「該当するコンポーネントがありません」）の文言が重複表示されます。誤りではありませんが、視覚的な冗長さがあります。
- 絞り込みで一度非表示になった block カード（`loadedBlocks` に含まれるもの）が再表示されると、セクションごと DOM から外れていたため iframe が再マウントされます。この際 `restoreScrollAfterLoad` の `scrollPositions` にはエントリが無く早期 return するため、既存のスクロール固定ロジックが働きません。iframe 内 preview が mount 時に focus/scroll を動かす実装だと、クリア操作後に検索欄からフォーカスが奪われたりスクロール位置がずれたりする可能性があります。実ブラウザ検証で「block をロード → 別語で絞り込み非表示 → クリアで再表示」のケースを明示的に確認することを推奨します。


## 独立検証との突合

- 指定6テストは合計143件成功、fail / skip 0。全件テスト・typecheck・check:all は指定に従いPR CIで確認する。
- ブラウザはPlaywrightの独立したheadless Chromiumでlight / darkの検索全ケース、0件とクリア、Sidebar不変、block読み込み状態の保持を確認した。
- 375pxの指定5ページでdocument横はみ出し0、個別ページのpre横スクロール成功、1440pxでinstallの2列を保持した。
- 実測値と画像は `../2026-09-18-index-search.md`。レビュー応答が示す推論上の確認と、実ブラウザで観測した事実を分けて保存している。
