verified_impl_sha: 1706a07dde2e757b4db58a1d33129b349d75c905

<!-- review-cycle:start 2026-10-01-check-block-icons-allowlist -->
# check-block-icons の意図的な属性差分の許可リスト追加レビュー記録

- **Cycle ID**: 2026-10-01-check-block-icons-allowlist
- **対象 HEAD**: 1706a07dde2e757b4db58a1d33129b349d75c905
- **対象**: `scripts/check-block-icons.mjs`（許可リスト・期待属性補正・CLI 配線）、`scripts/check-block-icons.test.mjs`（末尾へ指定の 5 テストを追加）、`.docs/component-addition-procedure.md`（指定の段落とゲート表の 1 行）。差分 `a2216e0..1706a07`。
- **総ラウンド数**: 1（上限 2）。
- **終了理由**: 全レンズ LGTM、確信度 80% 以上の flag 0 件。
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity 0 / Altitude 0。
- **確定した偽陽性**: なし。
- **ACCEPTED_RISKS**: なし。
- **optional**: 5 点（fresh-eyes 1 / core-logic 1 / domain 1 / ambiguity-hunter 2）。扱いは下記「optional の扱い」。
- **INSPECTION_STATUS**: レビュー済み、flag 0 件、optional 5 件: no-op エントリ、属性の正規化順、stale の診断見出し、上流属性変更時の手順、属性記法の説明。
- **判断レンズへの差し戻し**: なし。
- **実装担当**: Codex（Dispatch `ctx_59d7029bbf8a`）。

## 実行方式

`lens-review-cycle` の 7 レンズを、fresh context のレビュアー 1 名が fresh-eyes → security → core-logic → tests → domain → ambiguity-hunter → altitude-checker の順に当てた。手順書という文章仕様を含むため、Ambiguity Hunter / Altitude Checker も適用した。司令塔が指定した `claude -p` の経路を使い、ツールを無効にした。

```sh
perl -e 'alarm shift @ARGV; exec @ARGV' 1800 claude --safe-mode -p --model sonnet --tools '' --strict-mcp-config --no-session-persistence < /tmp/cbi-allowlist-review-input.md > /tmp/cbi-allowlist-review-r1.md
```

実行は exit 0。入力は `wc -c /tmp/cbi-allowlist-review-input.md` で 142,404 bytes（上限 200,000 bytes）。対象差分、実装・テスト・手順書の全文、7 レンズの定義と共通報告規定・scope フィルタの原文、設計上の事実、テストした条件と外した理由を渡した。code-review-graph の最小コンテキストは任意のため使わず、指定どおり全文を入力した。

既存サイクルの確定した偽陽性は 0 件で、空の FP レジストリから開始した。応答の境界・role の順序・非空・先頭の結論形式・flag 件数を確認し、7 レンズの本文を改変せず保存した。対象 3 ファイルの `git hash-object` と `git status --porcelain` はレビューの前後で一致した。

| 対象 | レビュー前後の fingerprint |
|---|---|
| `scripts/check-block-icons.mjs` | `fe350d7c1690b25ade2c9015940488f32685a546` |
| `scripts/check-block-icons.test.mjs` | `ef1f41a14837d0f1df105a09b39a10b8783a3210` |
| `.docs/component-addition-procedure.md` | `a96959850be72d6f0b7980b1cff409ff984a24c4` |

## optional の扱い

- fresh-eyes の no-op エントリ: 現在の 2 件は上流属性と手元属性が異なる。要件は上流の期待との一致を使用判定にするため、同一属性を拒否する追加仕様は導入しない。
- core-logic の属性の正規化順: 指定された JSON.stringify による比較を維持する。正規化と違う並びは stale として検出される。
- domain の stale 診断見出し: 既存の出力行を変えず、指定の「許可リスト: 」接頭辞で区別する。
- ambiguity-hunter の上流属性変更時の手順: 指定の手順書文言を維持する。エントリ削除後も差分が残れば生成物の突合が失敗するため、黙って通る経路はない。
- ambiguity-hunter の属性記法: 指定の文言と定数内の実例を維持する。正規化された期待属性と一致しないエントリは stale で失敗する。

## 採用応答原文

### fresh-eyes

LGTM／optional: 過剰実装は見当たらない。`reason` は実装内で参照されないが、仕様で必須のフィールドであり、ドキュメント用途として妥当。
- 許可エントリの `upstreamAttributes` と `localAttributes` が同一の no-op エントリでも `applied` が true になり、stale 扱いにならない。現行の2件には当てはまらず、起きるのは将来の誤記だけ。記録のみとし、flag にはしない。
- `replaceExpectedAttributes` は `file[key]` に代入するが、`file` は `applyIntentionalIconChanges` 内で浅いコピーに限られる。入力の配列や要素は変更されず、静的に読む限り非破壊性は成り立つ。
- この判断は静的な読解によるもので、実行はしていない。

### security

LGTM
- 追加コードは、コード内の定数 Map と上流 JSON から導出した期待値だけを扱う。新たなファイル I/O、ネットワーク、コマンド実行、パス結合は加えていない。
- 診断文に埋め込む値は、コード内の許可エントリの文字列だけ。外部入力の注入面は広がらない。
- 診断文は `console.error` に出るだけで、秘密情報は含まない。

### core-logic

LGTM／optional: 意図どおりの動きに読める。`flag` に当たる欠陥は確認できなかった。
- 3つのリスト（`occurrences`・`orderedOccurrences`・`baselineOccurrences`）は、存在するキーだけを全要素処理する。`if (!file[key]) continue` で無いリストにはキーを作らない。
- 一致判定は `icon` の厳密一致と `sameAttributes`（JSON.stringify）の両方で行う。属性は `preservedAttributes` がソート済みで返すので、上流側の並びは安定している。
- `files.map(...)` は短絡しないため、同 path の複数ファイルや複数リストへ漏れなく適用される。`includes(true)` で未使用の判定もできる。
- 外側が Map の挿入順、内側が配列順のループなので、問題の出力順は仕様どおり。
- 同 path の複数エントリは、前のエントリの置換結果を後のエントリが見る連鎖になる。仕様は「各エントリを全要素へ順に適用」で、既定の2件は別 path のため影響しない。
- `JSON.stringify` 比較は並び順に敏感で、許可エントリの複数属性はソート済みの正規化形で書く必要がある。違えば stale として検知されるので、誤って通ることはなく、診断も出る。optional。
- 静的な読解であり、実行はしていない。

### tests

LGTM
- 追加5件は指定の契約どおりで、すべて独自の Map を使い、既存の `INTENTIONAL_ICON_CHANGES` に依存しない。
- 正常系は blocks / previews と3リストの同期を確認している。
- 境界は、アイコンだけ一致する要素と属性だけ一致する要素を同一テストで同時に検証している。`deepEqual` は厳密比較なので、`baselineOccurrences` が無いときにキーを作らないことも担保される。空の上流属性の「属性なし」文言と、stale 2件の配列順も固定している。
- 非破壊性は `structuredClone` との比較で確認している。ファイル I/O や時刻を使わず、テスト隔離上の問題は無い。
- 「外した条件と理由」は、不正な入力・量・並行などの類型ごとに理由が書かれている。関わる類型が欠けている状態ではない。
- CLI 統合部分（`if (import.meta.url ...)` 内）は単体テスト対象外。これは実測（exit 0 と、一時改変での exit 1）で補われている。静的レビューでは確認できないため、実行した結果とは扱わない。

### domain

LGTM／optional: CLI としての exit code・診断・既存検査との統合は整合している。
- 上流に問題があるときは、従来どおり exit 1 で、許可リストは適用しない（仕様どおり）。
- 許可リストの stale は `generatedProblems` の先頭に「許可リスト: 」付きで加わる。既存の `if (generatedProblems.length > 0)` で `process.exitCode = 1` になる。既存の catch と exit 判定は変えていない。
- stats の出力行は維持されており、補正後の期待値で `matched` が計算される。
- stale の診断は「CLI の lucide 展開実体の検査に失敗」という見出しの下に出る。生成物の不一致ではなく許可リストの問題だが、「許可リスト: 」接頭辞で区別できる。仕様で固定済みのため optional。
- ライブ上流が将来 `duration-base` や回転クラスを取り込むと、該当エントリは stale になり exit 1 になる。これは ratchet の意図どおり。
- 静的な読解であり、実行はしていない。

### ambiguity-hunter

LGTM／optional: 手順書の追加段落と表の1行は、仕様で固定された literal として整合している。80%以上の flag には当たらない。
- パターン#1（暗黙の基準）、`.docs/component-addition-procedure.md` の追加段落。「足したエントリが上流の期待に見つからなくなると…そのエントリを外す」は、上流の属性が別の値へ変わっただけで手元の差分がまだ必要なケースを区別していない。その場合は外すのではなく `upstreamAttributes` を更新するのが自然な対応になる。ただし、外せば次回実行で位置不一致の診断が出て収束するため、誤運用に至らず optional。
- パターン#3、同段落。「上流の属性」「手元の属性」の記法が不明。診断に出る正規化形（例: `className="..."`、複数あればソート済み）で書く旨が無い。誤記は stale として検知されるため optional。

### altitude-checker

LGTM
- 手順書の追加は、block 追加手順の「icon 検査」の節に1段落と表の1行だけで、粒度が揃っている。機構の詳細は実装側のコメントと診断文に置かれ、手順書は操作（何を足し、いつ外すか）に絞られている。
- 定数名とファイル path は、既存の `check-block-icons.mjs` への参照と同じ水準の具体値で、脆いハードコードには当たらない。
- 実装側に、要件外の設定項目・抽象レイヤー・入力バリデーションは足されていない（scope excess 無し）。`changes` の引数化は、仕様で指定された export 契約であり、前例の `staleMotionAllowlist` と同じ形。

## 実測範囲

レビューは静的な読解であり、レビュアーはテストを実行していない。実装者は以下を実行した。

- R1: 修正前の対象テストは exit 0、44/44 pass。ライブ CLI は exit 1、block 18 件 / 期待 231 / 一致 226、preview 4 件 / 期待 4 / 一致 4。sidebar-07 と sidebar-11 の位置不一致 2 件。
- R2: 追加した次の 5 件だけが、実装前に `TypeError: applyIntentionalIconChanges is not a function` で失敗した（exit 1、既存 44 件 pass / 新規 5 件 fail）。
  - 意図的な差分として許可した属性は、上流の期待の occurrences・ordered・baseline で手元の属性に置き換える
  - preview の期待にも、意図的な差分を同じように当てる
  - 許可していないアイコンや属性は置き換えない
  - 意図的な差分として許可したエントリが上流の期待に無いとき、使われていないエントリとして問題にする
  - 意図的な差分を当てても、入力の期待値は書き換えない
- R3: 実装後は exit 0、49/49 pass、fail / cancelled / skipped / todo はすべて 0。
- R4: ライブ CLI は exit 0、block 18 件 / 期待 231 / 一致 231、preview 4 件 / 期待 4 / 一致 4。「検査に失敗」の行なし。
- R5: sidebar-07 の許可エントリの上流属性を一時的に `className="no-such-class"` へ変えると、CLI は exit 1、block の一致は 230/231。許可リストの stale が生成物の問題の先頭に出て、sidebar-07 の位置不一致も出た。復元後のバイト一致と `git diff -- scripts/check-block-icons.mjs` で一時変更が残っていないことを確認し、復元後の CLI も R4 と同じ exit 0 になった。

静的確認として、既存 25 関数の宣言全文（TypeScript AST で抽出）と、既存 44 テストを含む元ファイル全バイトの不変を確認した。新規の属性置換は private helper `replaceExpectedAttributes` に分け、例示された定数の長い属性配列は Biome で改行した。定数のデータ形状・値・理由と指定された公開関数・問題文・手順書の文言は変えていない。

全件テスト・lint・typecheck・standards は本記録を含む 3 コミットの後で実行し、変更範囲・CI と各 exit code は PR 本文「前後の実測」に記録する。

<!-- review-cycle:end 2026-10-01-check-block-icons-allowlist -->
