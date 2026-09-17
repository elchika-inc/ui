verified_impl_sha: cabb92826ba51ec998cb288299e2a1ec7e6f1c81

<!-- review-cycle:start 2026-09-18-typography-b2 -->
# 組版 B2 のレビュー記録

- **Cycle ID**: 2026-09-18-typography-b2
- **対象 HEAD**: cabb92826ba51ec998cb288299e2a1ec7e6f1c81
- **対象**: §B.1 / §B.3 の部品7本・blocks9件・preview3本・手順書・来歴、計27ファイル。
- **総ラウンド数**: 2。
- **終了理由**: 真の指摘を修正または明示受容し、クリーンラウンドを通過した。
- **INSPECTION_STATUS**: 実施済み / 未解決 flag 0 / ACCEPTED_RISKS 1件 / optional 2件。
- **判断レンズへの差し戻し**: なし。

## レンズ別結果

| round | Fresh Eyes | Security | Core Logic | Tests | Domain | Ambiguity | Altitude |
|---|---|---|---|---|---|---|---|
| R1 flag（FP判定前） | 0 | 0 | 2 | 0 | 1 | - | - |
| R2 flag | 0 | R1維持 | 0 | R1維持 | 0 | - | - |

R1 の3件は同一の見出し配置問題を Core Logic / Domain がそれぞれ報告した2件と、font競合のFP1件。R2は Fresh Eyes と flag を出した Core Logic / Domain を再適用し、全て LGTM。R1でflag0のSecurity / Testsはスキル規則に従い継続適用せず結果を維持した。

## 実行方式

司令塔指定の次のCLIを、fresh context・読み取り専用で1レンズずつ逐次起動した。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は担当ファイルに限定した `git diff origin/main`、変更ファイル全文、spec §1 / §2 / §4 / §B と司令塔の追加裁定。レビュー対象は実装で、specは参照資料として扱う。確信度80%以上でcorrectness・セキュリティ・明示要件に影響する問題だけをflag、その他をoptionalとした。`ts-review-graph` は未構築だったため指定ファイルとdiffへフォールバックした。

R1はFresh Eyes → Security → Core Logic → Tests → Domain、R2はFresh Eyes → Core Logic → Domain。各CLI自体はexit0。各応答をrole境界・先頭結論・flag件数で検証し、原文をレンズ別に保存した。27ファイルのfingerprintを照合し、レビュアーによる変更が無いことを確認した。

## 形式不正と司令塔裁定

- R1 Core Logicは形式不正2回。初回はコードフェンス、2回目は完全な境界ブロックの前に1文が付いた。2回目の境界内を改変せず採用することを司令塔が明示許可し、3回目の取り直しは行っていない。原文の場所は本記録末尾「Core Logic 2回目の応答原文」、採取時のファイルは `/tmp/typography-b2/review-core-logic.raw`。
- R1 Domainは初回にブロック外の説明があったため1回取り直し、2回目の有効なflag1件の応答を採用した。
- 形式不正をLGTMとして処理していない。Core Logicの解析器は両回exit1、Domainの解析器は初回exit1。司令塔裁定と有効な再取得後に継続した。

## 修正・FP・受容

### 見出しの右揃え

Core Logic / Domainの指摘を受け、司令塔の追加許可で dashboard-table の「目標」「上限」のTableHeadにもnumericを追加した。該当blockを `--resync` し、実装commitを未pushのまま更新、全32ルートを再測定・撮影した。両テーマで数値見出し2件・セル24件はMono / tabular-nums / textAlign=rightとなる。

### FP-001: CardTitleのfont-headingとfont-monoの競合

対象: `["src/blocks/dashboard-01/components/section-cards.tsx"]`。

主張: twMergeがfont-headingを認識しないためfont-monoと共存し、フォントの勝者が不定になる。

棄却根拠: 現行依存の `twMerge('font-heading text-2xl', 'font-mono text-2xl font-semibold tabular-nums')` は `font-mono text-2xl font-semibold tabular-nums` を返した（exit0）。実際のCardTitleのrenderToStaticMarkupでもfont-headingが無くfont-monoのみであることをassertした（exit0）。実ブラウザのCardTitle4件はlight/darkともIBM Plex Mono先頭。司令塔がFPと裁定した。共通CardTitle・cnへの変更は不要。

### ACCEPTED_RISKS: SortButtonの内部余白

Domainが提案した目標列のSortButton専用margin/prop追加は行わず、既存の内部余白を維持した。両テーマでボタン外枠右端970.234375pxは数値セル文字右端と一致するが、矢印右端959.234375pxはpadding-right10px＋border1pxにより11px内側にある。

列の右揃えは修正済みで、残る差はボタンの操作領域内の余白に限定される。既存の操作領域を維持し、この表示のための追加APIを増やさない判断をエージェントが行った。PR経由の成果物について受容判断をエージェントに委ねるAGENTS.mdに従い、PR本文とdashboard-table reportにも同じ実測・判断を明記する。flagのoptional格下げではなく明示受容である。

## optional 2件

- Fresh Eyes: dashboard-tableの見出しと数値セルの配置差。後続の真flagと重なるため上記の修正・受容で処理した。
- Tests: SidebarMenuSubButtonのvariant付きtext-xsをB1のusage test許可リストへ含める必要。司令塔は13px役割として維持し、B1の許可対象へ追加済みと裁定している。

## R1 の採用応答原文

### fresh-eyes

LGTM／optional: src/blocks/dashboard-table/components/dashboard-table.tsx で `TableCell numeric` 化により本体テーブルの「目標」「上限」列のデータが右寄せ（`data-numeric:text-right`）になった一方、対応する `TableHead`（SortButton を含む見出し）は左寄せのままで、見出しとデータの縦の揃えが不一致になる。`src/previews/table.tsx` では同種の数値列で `TableHead numeric` も併用して揃えている一方、こちらは仕様上セルのみの置換に限定されており、意図的な範囲限定の可能性もあるため flag ではなく optional として記録する。

### security

LGTM

### core-logic

flag 2件

[ISSUE] src/blocks/dashboard-01/components/section-cards.tsx:18,38,56,74 / 確信度 85% / `font-mono` が `CardTitle` の base class `font-heading`（src/components/ui/card.tsx:45、`font-family` と `font-feature-settings: "palt"` を同時に設定）と共存し、勝者が不定になる / `src/lib/utils.ts` の `cn` は `twMerge(clsx(...))` を `extendTailwindMerge` なしで使っており（リポジトリ全体を grep しても custom 設定は無い）、twMerge の既定 classGroup は `font-sans` / `font-serif` / `font-mono` のみを fontFamily 競合グループとして認識し、独自 theme の `font-heading` は認識しない。そのため `className="font-mono ..."` は base の `font-heading` を除去せず、生成 DOM は `font-heading font-mono` を同時に持つ。両者は同じ詳細度の単一クラスセレクタなので、実際にどちらの `font-family`（延いては `tabular-nums` の等幅数字表示に必要な Mono）が効くかは Tailwind の生成 CSS 内でのユーティリティ出現順に依存し、ソースの class 順序では制御できない。変更前は `CardTitle` に `font-mono` を渡していなかったためこの衝突は存在せず、今回の diff で新規に発生する / `card.tsx` の `CardTitle` に `numeric?: boolean` 相当の data 属性運用を導入するか、`section-cards.tsx` 側で `font-heading` を明示的に打ち消す（例: `not-font-heading` 相当は無いため `className` を `cn` に頼らず `CardTitle` 自体に variant を用意する）、または `cn` を `extendTailwindMerge` で `font-heading` を fontFamily グループに登録して twMerge に解決させる。いずれの対応が妥当かは設計判断のため、司令塔へ question として提起することを推奨。

[ISSUE] src/blocks/dashboard-table/components/dashboard-table.tsx:253,257 / 確信度 85% / `目標`・`上限` 列の `TableHead`（253, 257 行）に `numeric` prop が付与されておらず、対応する `TableCell`（200-201 行）だけが `numeric` で `data-numeric:text-right` を得るため、ヘッダーが左寄せのままボディだけ右寄せになる / `TableCell` に `numeric` を渡すと新規に `text-right` が乗る（旧 class `font-mono tabular-nums` には `text-right` が無かった）。同じ PR 内の `src/previews/table.tsx` では同じ数値列パターンで `TableHead scope="col" numeric` と `TableCell numeric` を対で使っており、これが意図された整合パターンだと確認できる。dashboard-table.tsx だけ `TableHead` 側が対応していないため、変更起因でヘッダーとボディの水平位置がずれる / 253, 257 行の `TableHead` にも `numeric` を付与して `previews/table.tsx` と同型にする。ただし仕様 §B.3 の dashboard-table 行は「数値セル（`font-mono tabular-nums` ×2）を `TableCell numeric` に置き換える」とセルのみを明記しており、`TableHead` は一覧外のため、修正と合わせて司令塔へ question も添える。「目標」列の `TableHead` は `SortButton`（ghost Button、`-ml-2`）を内包するため、`numeric` 付与時に `text-right` とボタンの負マージン・パディングでセル本体の右端とわずかにずれないか実ブラウザでの確認が必要。

### tests

LGTM／optional: B1 への引き継ぎ事項
optional: `sidebar.tsx` の `SidebarMenuSubButton`（`data-[size=sm]:text-xs`、13px 役割として維持）は B.1 の許容リスト6箇所に含まれていない。spec の grep パターン `(^|[ \"'])text-xs([ \"'/]|$)` なら `:` 前置により除外され B1 が spec どおり実装すれば緑になるが、B1 が緩い境界（`\btext-xs\b` 等）で `typography-usage.test.mjs` を実装すると sidebar.tsx で誤検出し赤くなる可能性がある。B2 の変更範囲外・B1 の実装依存の懸念であり、B1 実装時に allowlist へ `SidebarMenuSubButton` 行を追加するか `:` 前置を除外する境界にするよう引き継ぐことを推奨。

### domain

flag 1件
[ISSUE] src/blocks/dashboard-table/components/dashboard-table.tsx:253,257,151 / 確信度85% / TableCell に numeric prop を付けたことで数値列（目標・上限）のセルが右揃え（data-numeric:text-right）になったが、対応する TableHead（253行目の目標＝SortButton入り th、257行目の上限＝プレーン th）は numeric 未指定のまま左揃えに残り、header と data の列揃えが変更前（両方左揃えで一致）から不一致になった / 変更前は `TableCell className="font-mono tabular-nums"` に text-right が無く header・cell とも左揃えで一致していた。変更後は `TableCell numeric` により data-numeric:text-right が効き cell だけ右揃えになる。同一 PR の src/previews/table.tsx では TableHead numeric と TableCell numeric を対で付けており、設計意図が「numeric 列は header も右揃え」であることを示している。dashboard-table.tsx だけこの対応が欠けている / 修正案: 上限列は `<TableHead numeric>上限</TableHead>` に変更するだけでよい。目標列は `<TableHead numeric>` を付けるだけでは不十分で、中の SortButton が151行目で `className="-ml-2"`（左揃え前提の負マージン）を持つため、th が text-right になると Button が右へ寄っても余白の向きが cell padding と揃わない。SortButton は他の左揃え列（文書・状態・担当者）とも共用されているため、目標列だけ向きを反転させる prop か className 上書きの追加が必要。この列自体は spec §B.3 の変更対象一覧（TableCell numeric 化 ×2 のみ）に明記が無いため、独断で変更範囲を広げず司令塔へ question として報告する経路が spec §2 の規則に沿う

## R2 の応答原文

### fresh-eyes

LGTM

### core-logic

LGTM

### domain

LGTM

## 実行時間と試行回数

| round | role | CLI試行数 | 最終CLI exit | 最終試行秒数 |
|---|---|---:|---:|---:|
| R1 | fresh-eyes | 1 | 0 | 170.29 |
| R1 | security | 1 | 0 | 36.02 |
| R1 | core-logic | 2 | 0 | 302.84 |
| R1 | tests | 1 | 0 | 104.07 |
| R1 | domain | 2 | 0 | 210.93 |
| R2 | fresh-eyes | 1 | 0 | 274.72 |
| R2 | core-logic | 1 | 0 | 186.64 |
| R2 | domain | 1 | 0 | 71.43 |

## 検証との対応

担当単体テストは95 + 93 + 18 + 2 = 208件すべてpass、fail/skip0。numericの6ケースとCardTitleの実際のrenderもexit0。32ルートはHTTP200、selector各1件、pageerror0、console error0（favicon404計2件を別記）。新SHAのreport直後のcheck-evidenceはexit0。共有面staleの既存表示3件・履歴91件は新規証跡の形式失敗とは区別した。

全件テスト・typecheck・check:allは指定どおりローカル実行せずPR CIで代替する。CI実測値と証跡commit後のcheck-evidenceの終了結果はPR本文へ記録する。B1担当のtypography-usage.test.mjsはbaseに存在せず、B1がB2追随後に検証する裁定をPRへ明記する。

## Core Logic 2回目の応答原文

以下は形式不正を含む完全な原文。境界外の1文も残す。

```text
2件の高確信度な指摘を確認しました。境界ブロックで報告します。

<<<LENS_FINDINGS role="core-logic">>>
flag 2件

[ISSUE] src/blocks/dashboard-01/components/section-cards.tsx:18,38,56,74 / 確信度 85% / `font-mono` が `CardTitle` の base class `font-heading`（src/components/ui/card.tsx:45、`font-family` と `font-feature-settings: "palt"` を同時に設定）と共存し、勝者が不定になる / `src/lib/utils.ts` の `cn` は `twMerge(clsx(...))` を `extendTailwindMerge` なしで使っており（リポジトリ全体を grep しても custom 設定は無い）、twMerge の既定 classGroup は `font-sans` / `font-serif` / `font-mono` のみを fontFamily 競合グループとして認識し、独自 theme の `font-heading` は認識しない。そのため `className="font-mono ..."` は base の `font-heading` を除去せず、生成 DOM は `font-heading font-mono` を同時に持つ。両者は同じ詳細度の単一クラスセレクタなので、実際にどちらの `font-family`（延いては `tabular-nums` の等幅数字表示に必要な Mono）が効くかは Tailwind の生成 CSS 内でのユーティリティ出現順に依存し、ソースの class 順序では制御できない。変更前は `CardTitle` に `font-mono` を渡していなかったためこの衝突は存在せず、今回の diff で新規に発生する / `card.tsx` の `CardTitle` に `numeric?: boolean` 相当の data 属性運用を導入するか、`section-cards.tsx` 側で `font-heading` を明示的に打ち消す（例: `not-font-heading` 相当は無いため `className` を `cn` に頼らず `CardTitle` 自体に variant を用意する）、または `cn` を `extendTailwindMerge` で `font-heading` を fontFamily グループに登録して twMerge に解決させる。いずれの対応が妥当かは設計判断のため、司令塔へ question として提起することを推奨。

[ISSUE] src/blocks/dashboard-table/components/dashboard-table.tsx:253,257 / 確信度 85% / `目標`・`上限` 列の `TableHead`（253, 257 行）に `numeric` prop が付与されておらず、対応する `TableCell`（200-201 行）だけが `numeric` で `data-numeric:text-right` を得るため、ヘッダーが左寄せのままボディだけ右寄せになる / `TableCell` に `numeric` を渡すと新規に `text-right` が乗る（旧 class `font-mono tabular-nums` には `text-right` が無かった）。同じ PR 内の `src/previews/table.tsx` では同じ数値列パターンで `TableHead scope="col" numeric` と `TableCell numeric` を対で使っており、これが意図された整合パターンだと確認できる。dashboard-table.tsx だけ `TableHead` 側が対応していないため、変更起因でヘッダーとボディの水平位置がずれる / 253, 257 行の `TableHead` にも `numeric` を付与して `previews/table.tsx` と同型にする。ただし仕様 §B.3 の dashboard-table 行は「数値セル（`font-mono tabular-nums` ×2）を `TableCell numeric` に置き換える」とセルのみを明記しており、`TableHead` は一覧外のため、修正と合わせて司令塔へ question も添える。「目標」列の `TableHead` は `SortButton`（ghost Button、`-ml-2`）を内包するため、`numeric` 付与時に `text-right` とボタンの負マージン・パディングでセル本体の右端とわずかにずれないか実ブラウザでの確認が必要。
<<<END_LENS_FINDINGS>>>
```

<!-- review-cycle:end 2026-09-18-typography-b2 -->
