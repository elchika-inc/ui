verified_impl_sha: 07c3b5a5c1da0c6af8ba0bb82e6bf4d44135d150

<!-- review-cycle:start 2026-10-01-fix-check-block-icons-bugs -->
# check-block-icons のバグ 3 件のレビュー記録

- **Cycle ID**: 2026-10-01-fix-check-block-icons-bugs
- **対象 HEAD**: 07c3b5a5c1da0c6af8ba0bb82e6bf4d44135d150
- **対象**: `scripts/check-block-icons.mjs`（複数 page の期待値作成、不足報告の期待数、placeholder 残存時の一致数）と `scripts/check-block-icons.test.mjs`（指定の旧 3 件を新 4 件に置換）。差分 `926a740..07c3b5a`。
- **総ラウンド数**: 1（上限 2）。
- **終了理由**: 全レンズ LGTM、確信度 80% 以上の flag 0 件。
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -。
- **確定した偽陽性**: なし。
- **ACCEPTED_RISKS**: なし。
- **optional**: 5 点（fresh-eyes 3 / tests 2）。扱いは下記「optional の扱い」。
- **INSPECTION_STATUS**: レビュー済み、flag 0 件、optional 5 件: skip の二重適用、順序付き比較の重複抑止、冒頭コメントの例外記載、page と component の混在テスト、3 page 以上のテスト。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Codex（Dispatch `ctx_157abc0fe1a6`）。

## 実行方式

`lens-review-cycle` の 5 レンズを、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain の順に当てた。文章仕様はレビュー対象に含めず、Ambiguity Hunter / Altitude Checker は起動していない。司令塔が指定した `claude -p` の経路を使い、ツールを無効にした。

```sh
perl -e 'alarm shift @ARGV; exec @ARGV' 1800 claude --safe-mode -p --model sonnet --tools '' --strict-mcp-config --no-session-persistence < /tmp/fix-cbi-review-input.md > /tmp/fix-cbi-review-r1.md
```

実行は exit 0。入力は `wc -c /tmp/fix-cbi-review-input.md` で 96,678 bytes（上限 200,000 bytes）。対象差分、実装とテストの全文、Issue #103・#104・#105 の本文、5 ロールの定義と共通報告規定・scope フィルタの原文、設計上の事実、テストした条件と外した理由を渡した。code-review-graph の最小コンテキストは任意のため使わず、指定どおり全文を入力した。

最新の既存サイクル（2026-10-01-refactor-check-block-icons）の確定した偽陽性は 0 件で、空の FP レジストリから開始した。応答の境界・role の順序・非空・先頭の結論形式・flag 件数を確認し、5 レンズの本文を改変せず保存した。対象 2 ファイルの `git hash-object` と `git status --porcelain` はレビューの前後で一致した。

| 対象 | レビュー前後の fingerprint |
|---|---|
| `scripts/check-block-icons.mjs` | `a968d8c49d887a71e07fd862d802fd04e7eb1bec` |
| `scripts/check-block-icons.test.mjs` | `50ceb8691b53a787cbbcf3182fec0e0a17ddea6c` |

## optional の扱い

- fresh-eyes の skip 二重適用: 期待の登録と baseline / ordered の付与の両方を抑止する意図を保つ。追加の抽象化やリファクタリングは行わない。
- fresh-eyes の順序付き比較の重複抑止: 既存の `compareInOrder` を変更せず、共通の返却箇所だけで #105 を修正する最小範囲を保つ。
- fresh-eyes の冒頭コメント: Issue #103 の例外は計画・PR と回帰テストに記録する。今回の限定修正にコメント整備を追加しない。
- tests の page と component の混在: skip は page に限定され、component の期待作成は維持されることを静的に確認した。委任仕様が置換するテストの入力と件数を指定しているため追加せず、PR の「外した条件と理由」に記録する。
- tests の 3 page 以上: 2 件で境界を固定し、`pageCount > 1` と件数の埋め込みは静的レビューで確認した。テスト名と入力は指定どおり維持する。

## 採用応答原文

### fresh-eyes

LGTM／optional: 変更は最小で、新規の抽象化や自前の解析器はありません。静的読解のみで、実行はしていません。

根拠:
- `pageCount` は `item.files.filter` による標準の配列処理で数えています。`file?.type` で null 要素にも耐えます。
- ループ内の `file.type` は、直前の `typeof file?.content !== "string"` の continue を通過した後なので、null 参照になりません。
- 差分の範囲は設計上の事実の記述と一致します。変更した 3 バグ分のテストだけが置換・追加され、公開 API・CLI 入口・他の処理は変わっていません。

optional（記録のみ、対応不要）:
- `collectUpstreamFile` で `skipPreviewExpectation` を 2 か所に分けて適用しています（`:145` の continue と `:155` の `expectedFile`）。`expectedFile` は 1 つ目の continue 後、page 分について常に未登録です。そのため 2 つ目の適用は冗長ですが、`filesByTarget.previews` が空であることに暗黙に依存しない防御になっています。
- `compareInOrder` 内の `remainingPlaceholders === 0 ? ... : 0` は、`compareExpectedFile` の共通抑止と重複します。ただし要件は「順序付きの挙動も維持する」なので、残して問題ありません。
- ファイル冒頭の「4 区分」コメントには、「registry:page が複数ある block は preview 期待を作らない」例外が書かれていません。次に触れるときに 1 行足すと読み手が迷いません。

### security

LGTM
根拠（静的読解）:
- 新規の入出力・外部取得・パス結合・コマンド実行はありません。
- 追加した問題文に埋め込むのは `name`（`scanBlockNames` 由来のディレクトリ名）と整数 `pageCount` だけです。出力先は CLI の標準エラーのみです。機密の露出や注入の経路はありません。
- `generatedPath` の prefix 検証（別 block・外部 URL の path を生成物へ対応付けない既存の防御）は変更しておらず、page の skip でも弱まりません。
- 実鍵形式の値も差分にありません。

### core-logic

LGTM
根拠（静的読解。実行はしていません）:

#103
- `pageCount` は `type === "registry:page"` だけで数えるので、content が非文字列の page も含みます。要件どおりです。
- 問題の push 順は、`droppedRelativePaths`（dropped 対応付け失敗）→ page 複数 → 各ファイル（lucide 欠損・対応付け不能）です。要件の順序と一致します。
- `skipPreviewExpectation` は `file.type === "registry:page" && pageCount > 1` のときだけ true になります。複数 page の block でも、component（blocks 側）の期待値・baseline・ordered は従来どおり作られます。
- skip 時は、lucide 欠損の問題を出す分岐（`:142` 付近）が `continue` より前にあります。そのため path と `#N` 付きの検出が全ファイルで維持されます。`placeholderIcons` は `collected` から無条件に返るので、stats（placeholderCount、uniqueIconCount、missingLucideCount、blocksWithPlaceholders）も維持されます。
- skip 時は `filesByTarget.previews` に何も積まないので、previews の期待・baseline・ordered は作られません。`blocks` が空なら `expectedByTarget` に key も出ません。
- page 1 件のときは `pageCount > 1` が偽なので従来経路です。
- 3 件以上でも `${pageCount}` に整数が入り、件数は正しく出ます。
- page が複数あっても片方が非文字列 content のときは、その page だけ loop の先頭で外れ、件数には数えます。要件どおりです。

#104
- 期待 N は `occurrences + (baselineOccurrences ?? [])` のうち同じアイコンの数です。M は従来どおり `candidates` 全体の総数です。
- baseline なし（旧形式・未設定）では `?? []` により N は従来と同値です。
- 報告に至る条件（`actual` に残りが無い）と問題文の形は不変です。

#105
- `compareExpectedFile` の共通返却で `remainingPlaceholders > 0` なら 0 にします。`candidates` は `path` で絞った後の合計なので、旧形式（path なし）でも全生成物の合計で判定されます。
- 空の `candidates` は先頭で 0 を返す既存経路のままです。
- `problems` の組み立ては変わっていません。
- 順序付きの挙動も同値です。不一致時は 0、一致かつ placeholder 残存なしなら `occurrences.length`、残存ありなら 0 です。

### tests

LGTM／optional: 3 バグ分のテスト置換・追加は仕様どおりで、アサーションも意図を正確に表しています。静的読解のみで、実行はしていません。

根拠:
- #103（2 件）:
  - 1 件目は `deepEqual` で結果全体（problems、`expectedByTarget`、stats 全項目）を固定しています。「preview の期待値を作らない」と「stats 維持」を一度に縛っています。
  - 2 件目は問題順（page 複数 → 欠損）、`#N` 付き path、`missingLucideCount: 1` を固定しています。この入力は修正前なら ERR_ASSERTION になります。
- #104: baseline 1 + 期待 2 + 実測 2 から `期待 3 / 実測 2` を導けます。これは旧実装では 2 / 2 になる区別可能な入力です。baseline なしの N が不変であることは、既存の `期待 2 / 実測 1` テスト（`{SearchIcon: 2}`）が担保しています。
- #105: 順序付きの隣接テストと同形の入力で、結果全体（problems と stats）を固定しています。
- テスト隔離: 追加テストは純関数への入力のみで、tmp ファイル・環境変数・時刻を使いません。後片付けも並行衝突も問題になりません。
- 条件の選択（§5.2）: 「テストした条件」と「外した条件と理由」で、境界・量・不正な入力・失敗・状態・時刻と地域・並行の全類型に、テストまたは理由があります。外した理由は、委任仕様がテスト入力を固定していること、および静的確認の対象（位置・順序・合計条件）を具体的に挙げています。PR 本文用の記述として必要十分です。

optional（flag にしない）:
- 複数 page と component が同じ block にあるケースで、component の blocks 期待が従来どおり作られることを固定するテストがありません。skip は page に限定されているので現状は正しく、「外した条件」の記述にも明示されていません。PR 本文の外した条件に 1 行足すか、後続でテストを足すと回帰に強くなります。
- テスト名「同じ block に registry:page が 2 つ以上あるとき…」は、実際には 2 件の入力だけです。3 件以上は `pageCount > 1` と件数の文字列化を静的に確認する方針で、外した条件に理由が書かれています。

### domain

LGTM
根拠（CLI ツールの観点。静的読解のみ）:
- exit コード: 複数 page の block は `problems` に入るので、上流検査が失敗し `process.exitCode = 1` になります。修正前後とも exit 1 で、出力が byte 同一という報告と整合します。現在の上流 27 件に複数 page の block は無いので、実運用の出力は変わりません。
- fail-closed: 推測で preview を合成せず、誤検出（正しい preview を位置不一致と報告する）を、原因（複数 page）を名指しする 1 件の問題に置き換えています。Issue の方針どおりです。
- UX: 問題文は Issue の指定どおりです（`<block>: registry:page が <N> 件あり、preview（src/previews/<block>.tsx）へ対応付けられない`）。誤検出の連鎖（位置不一致の問題）が出なくなり、原因が 1 件に集約されます。
- 一致数の表示: #105 により、「一致 N 箇所」の意味が比較方式によらず揃います。CLI の実経路は常に順序付きなので、表示は変わりません。
- リソース・I/O: 変更は同期の期待値収集・比較だけです。fetch、ファイル読み取り、終了処理は変更していません。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。実装者は Issue #103 の 2 件、#104・#105 の各 1 件の `ERR_ASSERTION` と各修正後の 44/44 pass を実行で確認した。修正前は 43/43 pass。指定の旧 3 件以外の 40 テストと helper・定数が不変であることは差分比較で確認した。

ライブ CLI は修正前後とも exit 1（対象外の sidebar-07 / sidebar-11 の 2 件）で、出力は `cmp` exit 0 で一致した。全件テスト・lint・typecheck・standards・CI と各コマンドの exit code は PR 本文「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-01-fix-check-block-icons-bugs -->
