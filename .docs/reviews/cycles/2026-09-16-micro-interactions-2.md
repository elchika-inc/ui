verified_impl_sha: 1e4ab738edc86a2a46f168769ed75e3f07e51b35

<!-- review-cycle:start 2026-09-16-micro-interactions-2 -->
# 選択系と一回性マイクロインタラクションのレビュー

- **Cycle ID**: 2026-09-16-micro-interactions-2
- **対象 HEAD**: 1e4ab738edc86a2a46f168769ed75e3f07e51b35
- **対象**: `src/components/ui/{switch,checkbox,radio-group,field,avatar}.tsx` と `src/previews/avatar.tsx` の6ファイル。
- **総ラウンド数**: 1
- **終了理由**: 全レンズ LGTM、flag 0。
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -。
- **INSPECTION_STATUS**: 実施済み / flag 0 / optional 1。
- **ACCEPTED_RISKS**: なし。
- **確定した偽陽性**: なし。
- **判断レンズへの差し戻し**: なし。

## 実行方式と範囲

司令塔指定の下記 CLI を fresh context で Fresh Eyes → Security → Core Logic → Tests → Domain の順に1レンズずつ起動した。5呼び出しとも exit 0。入力は `git diff origin/main`、変更6ファイル全文、spec §2 / §C / §4。spec は参照情報でありレビュー対象はコードのみ。確信度80%以上の correctness / セキュリティ / 明示要件に影響する指摘を flag、それ以外を optional として分離した。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

読み取り専用の静的レビューであり、ブラウザ実測や CI の代替ではない。各応答の role 境界が1個であること、先頭の結論と flag 件数が一致することを検証してから保存した。レビュー前後の実装6ファイルは実装コミットと一致し、レビュアーによる変更は無い。

`ts-review-graph` は未構築を返したため、指定6ファイルと diff を直接入力した。レビューの起動失敗・欠落レンズ・再試行は無い。

## R1 の応答原文

### fresh-eyes

LGTM

### security

LGTM

### core-logic

LGTM

### tests

LGTM／optional: avatar の getAnimations() は `*:transition-[margin]` が shorthand のため `margin-right`/`margin-left` 等の longhand で返る可能性が高い。§4.5 の「ブラウザが展開して返す場合はそのまま記録する」に該当するため、report では `margin-inline-start`/`margin-inline-end` に固執せず実測値をそのまま記録すればよい。

### domain

LGTM

## optional の扱いと裁定

Tests の1件は実測値をそのまま記録する提案。Avatar report に `margin-right` と computed `margin-inline-end` の -8px → -2px → -8px を記録済み。司令塔も物理 longhand 表現として合格と裁定した。追加の実装変更は不要。

Field は effect 全体の easing が linear、computed / keyframes の区間 easing が standard になる実測を司令塔へ報告し、生値を併記して合格とする裁定を取得した。両裁定は部品 report と PR 本文へ残し、spec 自体は変更しない。

段・曲線・トークン・色の変更を要求する flag は無い。受容した flag と risk-registry ID は無し。

## 検証との対応

担当単体テストは72/72 pass、fail / skipped 0。10ルートの実測は console error / pageerror 0、selector 各1件。computed style / getAnimations / ending 属性から DOM 不在への遷移は部品別 report に記録した。全件テスト・typecheck・check:all は指定どおりローカルでは実行せず PR CI で代替し、その結果は PR 本文で報告する。収束後の §4.1〜4.4 と証跡コミット後の check-evidence も PR 本文へ記録する。

<!-- review-cycle:end 2026-09-16-micro-interactions-2 -->
