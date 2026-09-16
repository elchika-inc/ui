verified_impl_sha: cb79f3f3b733c08dea5afc9540e9c53c20537eb2

# 状態遷移と Tabs・Badge のレビュー記録（PR 3-1）

<!-- review-cycle:start 2026-09-16-micro-interactions-1 -->
- **Cycle ID**: 2026-09-16-micro-interactions-1
- **対象 HEAD**: cb79f3f3b733c08dea5afc9540e9c53c20537eb2
- **総ラウンド数**: 2
- **終了理由**: Tests の flag に対応後、R2 の5レンズすべて flag 0
- **最終レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -
- **確定した偽陽性**: なし
- **ACCEPTED_RISKS**: なし。flag は修正済み。
- **INSPECTION_STATUS**: flag 0件、optional 延べ13件（原文と扱いを以下に記録）
<!-- review-cycle:end 2026-09-16-micro-interactions-1 -->

## 方法と対象

レビュアーをレンズごとに fresh context で逐次起動した。実行コマンド:

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

適用順は Fresh Eyes → Security → Core Logic → Tests → Domain。入力は `git diff origin/main`、変更ファイル全文、spec §2 / §B / §4。R1 は実装11ファイル、R2 は最終実装11ファイルと部品別 report 8ファイル。司令塔の shadow-none! と座標差1px以内の裁定を実装要件として伝えた。書き込み権限は与えず、返答の保存は実装担当が行った。

`ts-review-graph` は未構築と応答したため、グラフの結果を根拠にせず、指定ファイル全文と差分で確認した。

## ラウンドごとの対応

- R1: Tests の flag 1件は、指定 `grep -c 'data-appear'` が class 名と行数の影響を受けるという検証方法の問題だった。指定コマンドは保持し、属性一致 `grep -o 'data-appear="[^"]*"'` の出力1行と HTMLParser による badge 7要素中の属性数1・既存6要素の属性不在を badge report に記録した。spec は編集していない。
- R1 Core Logic 初回は、境界外に本文を重複出力したため形式検証で無効にし、規定どおり1回だけ再取得した。終了コード0だけでは LGTM と扱わなかった。有効な再取得結果を下記に記録する。
- 実ブラウザで見つけた Trigger の影の競合は、司令塔の `msg_79923fbf8099` 裁定に従い `shadow-none!` へ変更した。R2 はこの最終実装を対象にした。
- R2: Fresh Eyes / Security / Domain の初回は境界外に本文があったため形式検証で無効にし、各1回だけ再取得した。全レンズの有効な応答を確認し、flag 0で収束した。

| round | Fresh Eyes | Security | Core Logic | Tests | Domain |
|---|---:|---:|---:|---:|---:|
| R1 | 0 | 0 | 0 | 1 | 0 |
| R2 | 0 | 0 | 0 | 0 | 0 |

## optional の扱い

- 影の競合は実測し、司令塔裁定による1クラスの変更で対応した。
- Badge の属性検証と TabsTrigger の computed style は部品 report に含めた。
- appear 付き Badge の transition-property が opacity / scale に限定される点は、spec の固定された記法による。状態色との同時遷移を加える設計変更は今回採らない。
- CSP と inline script の運用は今回の検証環境では測定していない。`renderBeforeHydration` は spec の指定に従い保持する。
- それ以外の optional も下記の原文に記録し、終了条件の flag 件数には含めない。確信度80%未満の optional が返った場合も、flag に数えず原文のまま残す。

## findings 原文

### R1 fresh-eyes

```text
LGTM／optional: 2件
[OPTIONAL] src/components/ui/tabs.tsx:57 / 確信度60% / `group-data-[variant=default]/tabs-list:data-active:shadow-sm`（既存, specificity (0,3,0)）と新規追加の `group-has-data-[slot=tabs-indicator]/tabs-list:data-active:shadow-none`（同じ (0,3,0)）が同点specificityのため、Tailwind v4の生成CSS出力順次第で `shadow-sm` が勝ち、indicator併用時のdefault variant activeトリガーに影が残る可能性がある。`bg-transparent`/`dark:border-transparent` は上位specificityで問題ないがshadowのみ懸念。修正案：class列はspec固定なので自己判断で変更せず、§4.5実測でindicator付きdefault Tabsのactive triggerのcomputed `box-shadow` が `none` であることを確認し、崩れていればaskする。
[OPTIONAL] src/components/ui/badge.tsx:8 / 確信度70% / spec §Bの検証手順にある `grep -c 'data-appear'`（期待値1）は、cva base文字列 `data-appear:transition-[opacity,scale]...` が全badgeのclass属性に含まれるため、build後のHTMLで属性の有無を判定する検証として機能しない（1行HTMLなら常に1、複数行なら該当なし）。diff自体の欠陥ではなくspecの検証記述側の問題。修正案：検証時は `grep -o 'data-appear=""'` のように実属性値でカウントする、またはこの点を確認できないままreportに実測値のみ記載し、齟齬があれば止めてask。
```

### R1 security

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/tabs.tsx:71 / 確信度60% / `TabsIndicator` の `renderBeforeHydration` は Base UI が hydration 前の位置計算用に inline script を SSR 出力へ埋め込む機構であり、`unsafe-inline`/nonce を許可しない厳格な CSP 配信環境では当該 script がブロックされ indicator が `hidden` のまま残る可能性がある（ユーザー入力を反映しないため注入経路ではなく、spec §B が明示指定した実装なので設計変更ではない） / 該当 PR の証跡 report に、CSP を運用する場合は script-src への nonce 付与が必要になる旨を一言記録しておく
```

### R1 core-logic

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/badge.tsx:8 / 確信度60% / `data-appear:transition-[opacity,scale] data-appear:duration-emphasis data-appear:ease-bounce ...` は longhand 指定のためベースの `.transition-state`（bg/border/color/shadow の遷移）より詳細度が高く、`data-appear` は要素に恒久的に残るため、`appear` 付き Badge はマウント後もホバー/フォーカス時に bg・border・color・shadow の状態遷移を失い、opacity/scale のみが遷移する副作用がある。これは §B の記法どおりの実装であり §4 の検証対象も opacity/scale のみなので仕様違反ではないが、設計上の副作用として実装者に共有する価値はある（変更提案ではなく設計固定事項に対するメモ）。
```

### R1 tests

```text
flag 1件
[ISSUE] src/components/ui/badge.tsx:8 / 確信度95% / §B の検証手順は build 後の `dist/preview/badge/index.html` に対して `grep -c 'data-appear'`（期待値=1）で「appear の badge にだけ data-appear 属性が付く」ことを確認する設計だが、本差分で追加した cva base クラス文字列自体に `data-appear:transition-[opacity,scale] data-appear:duration-emphasis data-appear:ease-bounce data-appear:starting:opacity-0 data-appear:starting:scale-75` と `data-appear` の文字列が複数回含まれる。この文字列はビルド後も各 badge の `class` 属性値としてそのまま出力されるため、appear を渡していない他の badge にも `data-appear` の一致が生じる。Astro の `compressHTML`（既定 true）で body が 1 行に折り畳まれれば `grep -c` は行数基準なので偶然 1 になり実質何も検証しない偽陽性 pass となり、折り畳まれない場合は 7 前後になり「一致しなければ止めて ask」に該当してしまう（実装自体は正しく、`appear || undefined` により属性は出ない）。検証対象（属性の有無）と検証経路（単純な文字列 grep）が一致していない。
修正案: 属性値そのものにマッチする検索式に変更する。例えば単独実行で `grep -o 'data-appear="[^"]*"' dist/preview/badge/index.html` を用い、出力が `data-appear=""` の1行のみであることを report に写す（クラス名側は `data-appear:` とコロン付きのため `="` を含むこの記法には一致しない）。実装コードの変更は不要。

[OPTIONAL] §4-5 の状態遷移 computed 検証（2つ目の箇条書き）は 2.1 で置換した全要素が対象のはずだが、§B の表の「実測対象 selector」列に tabs 行では `[data-slot="tabs-indicator"]` のみが挙がっており、`transition-all`→`transition-state` に置換した `[data-slot="tabs-trigger"]` 自体の computed 検証対象が明記されていない。spec 側の記載漏れの可能性があり、実装差分自体の問題ではないため flag ではなく参考記載。report 作成時に tabs-trigger の computed も併記すると取りこぼしを防げる。
```

### R1 domain

```text
LGTM／optional: 2件
[OPTIONAL] src/components/ui/badge.tsx:5 / 確信度70% / `data-appear` 付き Badge は `transition-property` が `opacity, scale` に置き換わるため、その Badge では hover/focus 時の色・ring の遷移が効かなくなる（`transition-state` の対象外になる） / 意図した設計であれば証跡・PR説明に理由を明記。副作用が想定外なら `transition-[opacity,scale]` ではなく複数プロパティを保持する形に見直す設計変更として別途検討
[OPTIONAL] src/components/ui/badge.tsx:5 / 確信度65% / spec §4 検証手順の `grep -c 'data-appear'`（期待値1）は、`class` 属性内に文字列 `data-appear:transition-…` が全 Badge に含まれるため過大カウントになり得る（検証コマンド自体の問題でコード欠陥ではない） / 検証時は `grep -o 'data-appear=""'` のような属性一致に寄せることをworkerに申し添える
```

### R2 fresh-eyes

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/badge.tsx:8 / 確信度70% / `data-appear:transition-[opacity,scale]` は `data-appear` 属性が残存する限り恒久的に `transition-property` を `opacity, scale` に固定するため、`<Badge appear>` は appear アニメーション完了後も hover 等の状態遷移（background/color/box-shadow）が transition しなくなる。spec §B のコードブロック通りの実装であり実装側の逸脱ではないため flag ではなく設計上の論点として記録する。 / 修正案: 恒久的な挙動でよいか司令塔に確認し、意図通りなら対応不要。
```

### R2 security

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/tabs.tsx:67 / 確信度50% / `TabsPrimitive.Indicator` の `renderBeforeHydration` は Base UI 内部で `--active-tab-*` 設定用の inline script（`dangerouslySetInnerHTML` 相当）を SSR HTML に出す実装のため、`script-src` に `'unsafe-inline'`/nonce を許可していない厳格な CSP 環境では当該 script がブロックされ得る。script の中身はライブラリ生成でユーザー入力は介在せず注入経路ではないため flag 対象外。§B のコードブロックに明記された仕様固定要素であり、除去は設計変更にあたる。修正案: CSP を運用する場合は nonce/hash 対応を別途検討する旨を記録するに留める。
```

### R2 core-logic

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/badge.tsx:8 / 確信度85% / `data-appear=""` は演出完了後も属性として残り続けるため、`data-appear:transition-[opacity,scale]` が `transition-state` の transition-property を恒久的に上書きし、appear 付き badge はその後の hover/focus-visible の背景・border-color・color・box-shadow 遷移がアニメーションしなくなる / 対応するなら `data-appear` を演出完了後に外す、または `data-appear:` バリアントに state 系 property を併記する必要があるが、これは §B が固定したclass記法自体の変更にあたるため設計変更として司令塔判断に委ねる
```

### R2 tests

```text
LGTM／optional: 2件
[OPTIONAL] .docs/reviews/2026-09-16-micro-interactions-1/2026-09-16-accordion-preview.md:11, 2026-09-16-toggle-preview.md:11, 2026-09-16-input-otp-preview.md:11, 2026-09-16-progress-preview.md:11, 2026-09-16-tabs-preview.md:11, 2026-09-16-dashboard-table-preview.md:11 / 確信度60% / 各report の「selector: `[data-slot="xxx-preview"]`（または `[data-slot="tabs"]`）」は `preview-selectors.json` の存在確認用であり、続く「computed style は担当要素の先頭を測った」がspec §B表の実測対象selector（例: `[data-slot="accordion-trigger"]` 等）を指す別記述だと読めるが、report内に両者を明示的に区別する記載がないため、初見の読者が実測対象を追跡しにくい。実測値自体（progressのみ `width`/`0.26s` 等）は担当要素固有の値であり、正しい要素を測ったことは値から推認できるため correctness には影響しない。修正案: 各reportの該当行に「computed style 対象: `[data-slot="..."]`」のように実測selectorを明記する。
[OPTIONAL] .docs/reviews/2026-09-16-micro-interactions-1/2026-09-16-tabs-preview.md および 2026-09-16-dashboard-table-preview.md（Indicator の移動 節）/ 確信度60% / `renderBeforeHydration` は「静的HTMLでindicatorがhiddenのまま出るのを防ぐ」ためのpropsだが、reportの `hidden=false` はhydration完了後の計測であり、静的HTML時点での効果を直接証拠づけていない。spec自体は「screenshotで確認」と定めているため実装は要件を満たしているが、`dist/preview/tabs/index.html` などビルド成果物のHTMLで `data-slot="tabs-indicator"` 要素に `hidden` 属性が無いことをgrepで一行添えると、renderBeforeHydrationの実装経路により直結した証跡になる。
```

### R2 domain

```text
LGTM／optional: 1件
[OPTIONAL] src/components/ui/tabs.tsx等（transition-state採用箇所全般） / 確信度70% / `transition-state` は tailwind-merge の既定 `transition` クラスグループに未登録と見られ、利用側が `className="transition-none"` 等を渡しても `cn()` によるデデュープが効かず、CSS の記述順で優劣が決まる可能性がある。この定義自体は §A/PR 3-0 側にあり、本レンズの許可入力（差分・変更ファイル全文・spec §2/§B/§4）だけでは `lib/utils.ts` の tailwind-merge 設定を確認できないため確信度80%未満で optional とする。 / 修正案: tailwind-merge の設定（`extendTailwindMerge` 等）で `transition-state` を `transition` グループに登録できているか、PR 3-0 側の証跡で確認する。
```

## 検証の関連付け

成功基準は `.docs/plans/2026-09-16-micro-interactions.md` §4 / §B。部品別 report と16枚の画像は `.docs/reviews/2026-09-16-micro-interactions-1/` に保存した。最終レビュー後の §4.1〜4.4、証跡 commit 後の check-evidence、PR CI の実測結果は PR 本文に記録する。

## レンズ別の実行時間

| round | lens | attempt | 秒 | exit code | 出力形式 |
|---|---|---:|---:|---:|---|
| R1 | fresh-eyes | 1 | 225.9 | 0 | 有効 |
| R1 | security | 1 | 79.1 | 0 | 有効 |
| R1 | core-logic | 1 | 364.0 | 0 | 無効・1回再取得 |
| R1 | core-logic | 2 | 368.1 | 0 | 有効 |
| R1 | tests | 1 | 213.3 | 0 | 有効 |
| R1 | domain | 1 | 364.0 | 0 | 有効 |
| R2 | fresh-eyes | 1 | 191.8 | 0 | 無効・1回再取得 |
| R2 | fresh-eyes | 2 | 259.6 | 0 | 有効 |
| R2 | security | 1 | 129.4 | 0 | 無効・1回再取得 |
| R2 | security | 2 | 226.0 | 0 | 有効 |
| R2 | core-logic | 1 | 409.2 | 0 | 有効 |
| R2 | tests | 1 | 252.1 | 0 | 有効 |
| R2 | domain | 1 | 253.1 | 0 | 無効・1回再取得 |
| R2 | domain | 2 | 311.4 | 0 | 有効 |
