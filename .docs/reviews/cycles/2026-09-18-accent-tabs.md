verified_impl_sha: c4a28708f5ffef05282383bc4e5a1194204d2059

<!-- review-cycle:start 2026-09-18-accent-tabs -->
# 黄アクセント Tabs line のレビューサイクル

- Cycle ID: 2026-09-18-accent-tabs
- 対象 HEAD: c4a28708f5ffef05282383bc4e5a1194204d2059
- 総ラウンド数: 1
- 終了理由: 初回ラウンドの全5レンズでflag 0
- レンズ別flag件数: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- 確定した偽陽性: なし
- INSPECTION_STATUS: inspected — flag 0、optional 2件（下記に原文を保存）

## 実行方法

委任仕様§5の裁定に従い、Sonnetをfresh contextで1回1レンズ、Fresh Eyes → Security → Core Logic → Tests → Domainの順に起動した。書き込み権限は渡していない。指定の5レンズを用い、最大3ラウンドのうち初回で終了した。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は担当8ファイルのdiff・変更ファイル全文とspec §1 / §2 / §4 / §Aだけ。spec自体はレビュー対象外。対象はglobal.css、registry.json、tabs.tsx、contrast-cases.mjs、contrast.mjs、手順書、共有面report、Tabs個別report。画像は実ブラウザ検証で別途確認した。ts-review-graphは未構築で利用できず、指定のファイル範囲へ限定した。

flagは確信度80%以上かつcorrectness・セキュリティ・明示要件に影響する指摘に限り、任意改善をoptionalへ分離するよう入口で指示した。実装者によるflagの格下げは行っていない。静的レビューを動作確認の代替にはしていない。

| レンズ | 試行数 | 最終exit | 秒（最終試行） | flag |
|---|---:|---:|---:|---:|
| fresh-eyes | 1 | 0 | 224.07 | 0 |
| security | 1 | 0 | 62.82 | 0 |
| core-logic | 2 | 0 | 233.96 | 0 |
| tests | 1 | 0 | 242.07 | 0 |
| domain | 1 | 0 | 127.34 | 0 |

## core-logic 初回の形式不備

指定境界がなかったため採用せず、仕様に従って同レンズを1回取り直した。初回原文:

```text
LGTM
```

## R1 fresh-eyes（境界内の原文）

LGTM／optional: report.md は §4.9 check-evidence（report直後・証跡commit後の2回）と check:all の実行結果を「PR CIで代替」として記録のみで済ませている。コード自体の欠陥ではなく実施計画上の先送りだが、明記済み検証手順の実測値がPR本文に載ることを確認しておくとよい。

## R1 security（境界内の原文）

LGTM

境界マーカー無しの応答が2回続いたため、司令塔裁定で2回目の全文を採用した。原文の場所: `/tmp/review-cycle-accent-tabs/round-1/core-logic-attempt-2.txt`。3回目は起動していない。以下の本文は一字も変更していない。

## R1 core-logic（全文原文・司令塔裁定により採用）

advisorの助言を踏まえ、LGTMと判定します。

LGTM

対象diffをトークン写像・class・contrast契約の観点で確認しました。

- `global.css`: `:root` / `.dark` に同一文字列の `--highlight` / `--highlight-bg` / `--highlight-text` を追加。値の実切り替えは既存の `tokens.css` dark ブロック側の責務であり、`inspectThemeAliasParity`（`:root` と `.dark` の値一致検査）は通る形。`--highlight: rgb(var(--color-accent-highlight))` は `contrast.mjs` の `resolveToken` の `rgbAlias` 正規表現に一致する形で、既存の `--primary: rgb(var(--color-brand-primary))` と同じ alias 構造。`@theme inline` の追加位置は `--color-info-foreground` の直後で spec 通り、`--color-highlight` という名前も shadcn の `--accent` / `--color-accent` と衝突しない。
- `tabs.tsx`: 変更は `after:bg-foreground` → `after:bg-highlight`、`group-data-[variant=line]/tabs-list:bg-foreground` → `...bg-highlight` の2語のみ。両文字列とも空白区切りトークンとして実ファイルに存在し、`contrast.mjs` の `extractClassTokens` / `isSemanticAlphaUtility` の判定とも整合する（アルファ付き utility ではないため誤検知なし）。default variant の `bg-card` Indicator や非 line-variant の active 状態には影響しない（`after:opacity-0` は line-variant 以外では non-active のまま）。
- `contrast-cases.mjs` / `contrast.mjs`: 追加した2 case の `foreground: highlight` / `background: background|card` はそれぞれ canvas（`1.55:1` / `12.03:1`）・surface（`1.68:1` / `11.07:1`）に対応し、spec §1 の実測値と正しく対応している（§4.4 に書かれた「1.68:1」という記述と `background` case の reason 文言に不一致があるが、`--background` = canvas、`--card` = surface という実際のトークン定義に基づけば diff 側の値が正しく、`reason` は `consumerCaseContract` の digest 対象外なので契約への影響もない）。`REQUIRED_CONSUMER_CASE_LABELS` への2 label 追加は `CONSUMER_CASES` の件数と1:1で対応している。`consumerCaseContract` の `export` 化以外の関数本体は変更なし。
- `REQUIRED_CONSUMER_CONTRACT_DIGEST` の新しい値自体の正しさ（sha256 の再計算結果と一致するか）は静的レビューでは検証できない。report.md には `check:contrast` の実行結果（陽性対照での意図的 FAIL 含む）が記録されているが、これは実行結果の記録であって、本レビューで動作検証したものではない。
- `registry.json`: 各 item の light/dark に `highlight` 系3行が `info-foreground` の直後に挿入されており、`global.css` の並びと整合。
- `.docs/component-addition-procedure.md` の追記は spec §A.5 の指定文言そのままで、記載の「1.68:1」は spec 側の選択であり本diffの問題ではない。

## R1 tests（境界内の原文）

LGTM／optional: PR本文の記載事項として、§4.9のcheck-evidence実行結果(report直後・証跡commit後の2回)と§4.4の陽性対照(gate一時変更によるfail確認と復元)の実測ログが、report.mdでは「PR本文に書く」と先送りされている。入力(diff・全文・spec)からは実行結果そのものを確認できないため、PR本文に実測値で記載されることを確認してほしい(現状gitStatusではcommit (3)未作成のため、これは指摘ではなく確認事項)。

以下は確認済みで問題なし:
- `REQUIRED_CONSUMER_CASE_LABELS`への2 label追加とdigest更新は、`contrast-cases.mjs`の新規2 caseの追加と同一commitで対になっており、`consumerCaseContract`が`reason`を含まないため、reason文言の数値表現(spec §A.2の「1.68/11.07」から実装の「background=canvas 1.55/12.03、card=surface 1.68/11.07」への訂正)はdigestに影響しない。この訂正はspec §1の実測表と整合し、report.mdに司令塔裁定として記録済み。
- 新規2 caseの`sourceClasses`(`group-data-[variant=line]/tabs-list:bg-highlight`、`after:bg-highlight`)は`tabs.tsx`の空白区切りトークンと完全一致し、`inspectSourceCoverage`の検査を通る。削除された`after:bg-foreground`等を`sourceClasses`として参照する既存caseは無いため、この置換による既存test coverageの破壊は無い。
- `global.css`の`:root`/`.dark`ブロックに追加した`--highlight`系3行は値が文字列同一であり、`inspectThemeAliasParity`のparity検査を通る。新規コメント行は`stripCssComments`で除去されるためphantom宣言にはならない。
- `registry.json`の97 item×light/dark×3行(582行)は`global.css`の`:root`/`.dark`ブロックの追加位置・内容と一致しており、`registry:tokens`同期の正しさをdiff上で確認できる。
- `tabs.tsx`はshadcn由来コンポーネントであり、手順書上`generatedContentSha256`はCLI生成時点の錨のため、今回のclass文字列置換のみの編集はcompletenessチェックに影響しない。
- digestの値自体(64桁hex)は形式として妥当であり、report.mdが`node --test`18 pass、`check:contrast`exit 0を記録しているが、計算・実行結果そのものは本diff入力からは実行確認できない(静的レビューの限界として記載)。

## R1 domain（境界内の原文）

LGTM

対象diff（global.css のトークン接続、registry.json への highlight 系 cssVars 追加、tabs.tsx の `after:bg-foreground`→`after:bg-highlight` および `group-data-[variant=line]/tabs-list:bg-foreground`→`...bg-highlight` の2語置換、contrast-cases.mjs / contrast.mjs への decorative gate ケース追加、手順書追記）を確認した。

- tabs.tsx の置換は指定された2箇所のみで、default variant・文字色・motion・Indicator の可視化ロジック（`group-has-data-[slot=tabs-indicator]/tabs-list:after:hidden` 等）は変更されていない。`after:bg-highlight` と `group-data-[variant=line]/tabs-list:bg-highlight` は contrast-cases.mjs の `sourceClasses` が要求するトークン文字列と厳密に一致しており、`inspectSourceCoverage` の突合は成立する。
- global.css の `--highlight` / `--highlight-bg` / `--highlight-text` は `:root` と `.dark` の両方に同じ挿入位置（`--info-foreground` 直後）で追加されており、`@theme inline` 側の `--color-highlight*` も同じ位置関係で追加されている。既存の `--accent` / `--accent-foreground`（shadcn 由来）と名前が衝突しない設計は維持されている。値は既存パターン（`rgb(var(--color-accent-highlight))`）に倣っており、raw color literal ではないため `check-standards.mjs` の禁則には抵触しない。
- contrast-cases.mjs の新規2ケースは `background`（canvas）→light 1.55:1、`card`（surface）→light 1.68:1 という §1 記載の実測値と正しく対応しており、spec §A.2 本文の例示（両ケースとも同一値のように読める記述）ではなく §1 の正しい測定値が採用されている。decorative gate の受容根拠（active は文字色でも識別可能）は既に確定済みの裁定であり、本レビューでは変更提案しない。
- registry.json は97 item × light/dark × 3トークンの機械的追加のみで、既存キーの削除・変更は見当たらない。

correctness・セキュリティ・明示要件に影響する問題は見つからなかった。

## 検証との対応

指定単体119件はfail 0 / skip 0、buildと整合検査は各exit 0。共有面28枚とTabsのcomputed値は[共有面report](../2026-09-18-accent-tabs/report.md)に保存した。report直後のcheck-evidenceはexit 0。証跡commit後の再実行とPR CIの結果はPR本文へ記録する。Fresh Eyes / Testsのoptionalはこの最終実測値の追記で対応する。

ユーザーが受容したlight下線の非テキスト3:1未達は、decorative gateの根拠とともにreportとPR本文へ明記する。司令塔裁定（必須label追加、背景別比率、CSS検査の補正、手順書のcommit配置）もreportとPR本文に保存した。
<!-- review-cycle:end 2026-09-18-accent-tabs -->
