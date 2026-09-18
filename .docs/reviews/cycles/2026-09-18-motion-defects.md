verified_impl_sha: 4e586dd16b86a794197f5a97fd819fa8ee7a468b

# 実行時モーション2件のレビュー記録

<!-- review-cycle:start 2026-09-18-motion-defects -->
## 2026-09-18 issue #94 / #95（後続裁定 B 反映後）

- **Cycle ID**: 2026-09-18-motion-defects
- **対象 HEAD**: 4e586dd16b86a794197f5a97fd819fa8ee7a468b
- **総ラウンド数**: 1（上限2、裁定後に最初から再実施）
- **終了理由**: 全レンズ LGTM
- **レンズ別 flag 件数**: Fresh Eyes 0 / Core Logic 0 / Domain 0
- **optional**: 0件
- **確定した偽陽性**: なし
- **ACCEPTED_RISKS**: §A.1の明示受容（active時のhover色変化120ms→180ms）。未解決flagは0件。
- **INSPECTION_STATUS**: 独立レビュー完了、flag 0件 / optional 0件。
<!-- review-cycle:end 2026-09-18-motion-defects -->

## 司令塔の後続裁定と再実施

元spec §A.2に従う最初の実装は3レンズともLGTMだったが、workerの画像確認と追加実測で、親appがopenなら閉じた子apiもrotate=90degとなることが分かった。静的レビューだけではこの入れ子状態を検出できなかった。

司令塔は元指示の誤りを認め、副作用の受容を却下し、各項目自身のtriggerのdata-panel-openへ結び直す裁定 B を出した。workerは明示許可されたresetにより旧2commitを退避してspec commitまで戻し、実装・実測・画像4枚と本レビューを作り直した。裁定の詳細と実装者の来歴はPR本文へ記録する。spec自体は変更していない。

## 実行方法と入力の境界

Fresh Eyes → Core Logic → Domain を各1回、別のfresh contextで順次起動した。3プロセスともexit 0、境界マーカーあり、再取得なし。以下にstdout全文を変更せず記録する。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は担当3ファイルのdiff・変更ファイル全文・spec §1 / §2 / §4 / §Aと、それを更新する司令塔の後続裁定 B、およびレンズ・scope・出力形式の指示。元指示と競合する点は後続裁定が優先と明記した。実ブラウザ結果や他レンズのfindingsは入力しなかった。

確信度80%以上のcorrectness・セキュリティ・明示要件に影響する指摘をflag、それ以外をoptionalとするよう指示した。書込ツール・MCPは与えていない。固定スナップショットの静的レビューであり、ブラウザ実測はworkerが別途行った。

レビュー開始時のHEADはspec commit `5461412`。入力ファイルと実装commitの内容をSHA-256で照合し、一致を確認した。

| 対象 | 入力・実装commitのSHA-256 |
|---|---|
| `src/components/ui/message-scroller.tsx` | `2edc64d3fd724968d2cc957decfea270e4b8ef3c3b17074264216d905bc2e3bb` |
| `src/blocks/sidebar-11/components/app-sidebar.tsx` | `1a5a218020aaf10804d48258aefb244385c5fc2402253ca83cb834a44b2bcab3` |
| `provenance.json` | `1155844f842103db0666c8d07eeeb99c3c9285ebb1e4ecb3e983c638037a86c7` |

## ラウンド1の応答原文

### fresh-eyes

```text
<<<LENS_FINDINGS role="fresh-eyes">>>
LGTM
<<<END_LENS_FINDINGS>>>
```

### core-logic

```text
<<<LENS_FINDINGS role="core-logic">>>
LGTM
<<<END_LENS_FINDINGS>>>
```

### domain

```text
<<<LENS_FINDINGS role="domain">>>
LGTM
<<<END_LENS_FINDINGS>>>
```

## 検証結果の接続

| 項目 | 実測 |
|---|---|
| standards / lint | exit 0 / exit 0、lint error 0（既存warning 215 / info 3） |
| 対象テスト | catalog-build 10 pass / completeness 95 pass、両者fail 0 / skip 0 |
| 来歴の負例 | 再同期前のgeneratedContentSha256不一致でexit 1 |
| 再同期後 | completeness exit 0、68 component / 28 block |
| build:lib / check:props / preview-render | 各exit 0 |
| registry:build / distribution / registry.json無差分 | 各exit 0 |
| build:site | exit 0、292ページ |
| 実ブラウザ | 6ケース、console error 0 / pageerror 0 |
| opacity中間値 | Light 8件 / Dark 9件 |
| duration | active true 0.18s / false 0.4s |
| sidebar-11親 / sidebar-02 rotate | 両テーマでnone → 90deg → none |
| sidebar-11子api、親open固定 | 両テーマでnone → 90deg → none、子triggerのdata-panel-openは無し→有り→無し |
| report直後check-evidence | exit 0、既存shared stale 2件 / 過去履歴92件 |

実測の全値と追加rubricは `../2026-09-18-message-scroller-preview.md` と `../2026-09-18-sidebar-11-preview.md`。証跡commit後のcheck-evidenceとPR CIの結果はPR本文へ記録する。

## 裁量の申告

必須classを維持し、Message Scrollerの各状態のopacity class直後へtransitionを配置した。sidebarのJSXはformatterに合わせて整形し、整形後に来歴ハッシュを再同期した。MutationObserverと20msタイマーでopacityを採取し、sidebarは親appと子apiを分けて同じ閉→開→閉で測定した。その他の具体的な裁量はPR本文へ記録する。
