verified_impl_sha: 59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f

<!-- review-cycle:start 2026-09-15-overlay-motion-e -->
# overlay モーション統一 PR E レビュー

- Cycle ID: 2026-09-15-overlay-motion-e
- 対象 HEAD: 59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f
- 実施日: 2026-09-16（JST）
- 総ラウンド数: 1（上限3）
- 終了理由: 初回から全5レンズ LGTM、flag 0件
- レンズ別 flag: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- INSPECTION_STATUS: 実施済み、flag 0件、optional 14件: コメント位置、検証の補足、来歴説明、依存と旧utilityの追加確認
- 確定した偽陽性: なし
- ACCEPTED_RISKS: なし（flag受容なし）

## 起動と入力

司令塔裁定に従い、Fresh Eyes → Security → Core Logic → Tests → Domain の順で1レンズずつfresh contextを起動した。モデルはsonnet、利用可能ツールはRead / Glob / Grepのみ。前レンズの指摘は次へ渡していない。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-role.txt > result-role.json
```

全5呼出しはexit 0 / is_error=false。modelUsageはclaude-sonnet-5（補助処理claude-fable-5-1を含む）。入力はorigin/main dc34935との差分、変更15ファイル全文（lockfile/public/rはstatのみ）、spec §2 / §E / §4、司令塔裁定。実装16ファイルのSHA256をレビュー前後で照合し全件一致。証跡は後続commitへ追加する構成で、レビュー対象は実装差分。

司令塔がレビュー入力を差分・変更ファイル全文・spec抜粋・裁定に限定しているため、ts-review-graphは使用していない。レビューは存在・コードの整合を確認するもので、ブラウザやコマンド実行の代替にはしていない。

## ラウンド結果とoptionalの扱い

| R | Fresh Eyes | Security | Core Logic | Tests | Domain | 処置 |
|---|---|---|---|---|---|---|
| 1 | flag 0 / optional 2 | flag 0 / optional 4 | flag 0 / optional 4 | flag 0 / optional 2 | flag 0 / optional 2 | 実装修正なし。検証補足は下記へ対応付け |

- コメント位置・allowlist直上の既存コメント: 動作に影響せず、固定された挿入位置・機構不変のスコープを保った。
- 旧utilityの追加検索: animate-accordion / slide-out-to / fade / zoom / spin / fill-mode の検索はsrcで0件 / exit 1。人工陽性対照は1行 / exit 0、確認後削除した。
- CSSとcaret: 生成CSSのcaretルールにvar(--curve-entrance)を確認し、@keyframes caret-blinkも1行 / exit 0。実測したanimation-nameはcaret-blink、animation-durationは1.25s、animation-timing-functionはcubic-bezier(0.16, 1, 0.3, 1)。duration-emphasisが設定するtransition-durationは0.5sで、animation-durationとは別物として記録した。
- 広域検索・配布・ハッシュ: §E指定のsrc（tsx/astro）と依存の横断grep、build:lib / build:site、check-distribution / check-completenessを独立実行済み。registryのsemantic diffは依存90件削除だけ、provenanceは指定2hashだけを別途計算して照合した。
- テスト強化案: dependencies=[]は司令塔が明示した契約。新しいフィクスチャや判定ロジックを追加していない。既存standards単体72件はexit 0。
- 来歴のmodified更新案: 指定どおり既存説明を保持し、正規の--resyncが更新するhashのみを同期した。
- .playwright-mcpの混入注意: 検証作業領域でありcommit対象外。証跡追加は指定された2パスへ限定する。

flagの棄却・格下げ・受容は行っていない。固定されたduration段・曲線の設計変更を求めるflagはなかった。

Core Logicの初回回答にブロック外の前置きがあり、全応答に対するfullmatch検証が一度拒否した。スキルのdurable-stateが定める有効性（唯一の完全ブロック、非空、先頭LGTM、flag件数整合）へ検査を合わせ、全条件を確認した。ブロック内は変更せず保存し、前置きも下に原文を残した。再起動や内容の書き換えはしていない。

## 収束後の確認

§4.1〜4.4を再実行。standardsは248ファイル・exit 0、負の検査18本は各0件 / exit 1、lintはexit 0（486ファイル、既存201 warnings / 3 infos）、build:siteはexit 0（271ページ）。生成CSSのduration-slow / ease-entranceは各1ルール・exit 0、data-starting-styleは1行・exit 0。追加でease-outは0行 / exit 1、ease-linearは1行 / exit 0、caretルールとkeyframesは各1件 / exit 0。

共有report作成直後のcheck-evidenceはexit 0（過去共有面stale表示3項目を含む、形式OK）。証跡commit後の再実行とPR CIの結果はPR本文へ記録する。

## レビュアー原文

### fresh-eyes

LGTM

flag 0件。確認した根拠は以下のとおり。

- §E.1〜§E.6 の置換仕様（item.tsx: duration-100→duration-fast、message-scroller.tsx: duration-200→duration-base／duration-400→duration-slower／ease-in→ease-standard／ease-out→ease-entrance、sidebar.tsx・sidebar-07/nav-main.tsx・dashboard-01/nav-main.tsx: duration-200→duration-base、input-otp.tsx: duration-1000→duration-emphasis）を全箇所で照合し、全一致を確認した。DOM・props の変更は無く、className トークンの置換のみ。
- global.css の `@theme inline` 内 `--animate-caret-blink: caret-blink 1.25s var(--curve-entrance) infinite;` は仕様の逐語（ease-out）と異なるが、司令塔裁定 #5 が「check-standards.mjs が css も走査するため ease-out は standards 違反になる」ことを理由に curve-entrance へのマッピングを明示的に承認しており、周期 1.25s の維持・コメント付与も仕様どおり。`@keyframes` を `@theme inline` 内に置く構文は shadcn 公式の Tailwind v4 テンプレートで採用されている既知パターンであり問題ない。
- `--ease-*: initial;` は `--ease-standard` の直前という指定位置どおりに追加されている。`ease-linear` は静的 utility として意図的に温存されている（仕様どおり）。
- `tw-animate-css` は package.json・global.css の `@import`・registry.json 全 90 箇所・scripts/registry-policy.mjs の `SHARED_DEPENDENCIES` から一貫して除去されている。除去漏れの再出現は見当たらない。
- `MOTION_LITERAL_ALLOWLIST` を空 `Map([])` にした変更は、直前に削除された 6 エントリ（input-otp.tsx / item.tsx / message-scroller.tsx ×4 / sidebar.tsx / sidebar-07 nav-main.tsx / dashboard-01 nav-main.tsx）が今回の置換で全て解消されたことと整合する。機構（Map クラス自体）は温存されており、仕様「allowlist の行削除だけ」の制約を満たす。
- registry-policy.mjs と 3 テストファイル 6 箇所（add-component.test.mjs ×3、check-completeness.test.mjs ×1、dashboard-blocks.test.mjs ×2）の同期は司令塔裁定 #1 で承認済みの範囲と一致する。check-completeness.test.mjs の負のテストは `dependencies=[]` から `shadcn` 欠落を検出する形に変わっており、裁定の記述と一致する。
- provenance.json の更新は sidebar-07/dashboard-01 の block 2 件の `generatedContentSha256` のみで、item.tsx・message-scroller.tsx・sidebar.tsx・input-otp.tsx という 4 つの component ファイルの内容変更に対応する hash 更新は含まれない。これは見落としではなく、provenance.json の component 側 notes に「generatedContentSha256 は CLI 生成直後の手元の生成物の錨であり、standards 正規化後は生成直後 hash と一致しない」と明記されている一方、block 側だけは check-completeness がディスク実体と突合するため更新必須という設計上の非対称性によるもので、司令塔裁定 #2 の「block 2件の --resync による provenance の hash 同期を承認」と一致する。
- 変更ファイル集合（package.json・provenance.json・registry.json・scripts/check-standards.mjs（allowlist 行削除のみ）・scripts/registry-policy.mjs・3 テストファイル・src/styles/global.css・担当 6 部品ファイル）は §E の一覧および「触らないもの」節（tokens.css・design-tokens.html・src/previews/**・src/pages/**・src/site/** は不変）と矛盾しない。

optional（flag外、参考情報）:
1. global.css で `/* design system の曲線 --curve-standard へ接続する。 */` というコメントが `--ease-*: initial;` の直前に来ており、直後の `--ease-standard` の説明としては位置がややずれている（スタイルの問題）。
2. check-standards.mjs の `MOTION_LITERAL_ALLOWLIST` 直上コメント「エントリは issue #58 のサブプロジェクト 2〜4 で減らす」は、今回空になった後も文言が変わっておらず古い記述のままである（動作に影響なし）。

### security

LGTM

根拠（提供された diff・全文からの確認のみ、他ファイル参照なし）:

1. `tw-animate` 文字列の残存: 提供された `registry.json` 全文・`package.json`・`global.css`・`registry-policy.mjs` を走査した限り出現 0 件。生成側 `registry-policy.mjs` の `SHARED_DEPENDENCIES = ["shadcn"]`、常設チェック `check-completeness.test.mjs` の期待値、依存固定テスト3ファイル6箇所（`add-component.test.mjs` 3箇所、`dashboard-blocks.test.mjs` 2箇所、それぞれの `dependencies` 配列）が同じ値（`tw-animate-css` 削除・`shadcn` のみ）で一致しており、司令塔裁定1の「registry-policy.mjs と依存固定テスト3ファイル6箇所の同期」と符合する。
2. `package-lock.json` の stat（`1 insertion(+), 11 deletions(-)`）は `tw-animate-css` の node_modules エントリ丸ごとの削除に相当する規模で、他パッケージの記述行が変化していない＝leaf 依存であり `shadcn` 側の transitive 依存として再導入されていないことを示唆する（uninstall による依存グラフ破壊のリスクは低い）。
3. 6 部品ファイル全文で `\b(duration|delay)-\d+\b` ／ `\bease-(in|out|in-out)\b` ／ `animate-in|animate-out|fade-|zoom-|slide-in-from|delayed-open` を目視走査したが該当なし。sidebar.tsx の3箇所の `duration-200`（sidebar-gap／sidebar-container／group-label）はすべて `duration-base` に置換済み。message-scroller.tsx の `duration-200→duration-base`、`duration-400→duration-slower`、`ease-in→ease-standard`、`ease-out→ease-entrance` は仕様 §E.1 の対応表と逐語一致。
4. `global.css` の `--animate-caret-blink` は `caret-blink 1.25s var(--curve-entrance) infinite` であり、司令塔裁定5（`ease-out` は誤記であり `var(--curve-entrance)` へ写像、周期 1.25s 維持）と一致。値が静的リテラルのみで構成されており、ユーザー入力や動的生成物を含まないため注入面は無い。`--ease-*: initial` は `--ease-standard` の直前に置かれており §E.4 の指定順と一致。`--default-transition-timing-function` は `--ease-*` 変数自体ではないため影響を受けず、`ease-linear` は静的 utility なので sidebar / nav-main の該当箇所は残存して機能する。
5. `check-standards.mjs` の diff は `MOTION_LITERAL_ALLOWLIST` を空の `Map([])` にしただけで、正規表現・判定ロジック本体・コメントの注記（「エントリは...で減らす」）は不変。§2.3「触らないもの」の制約と一致。
6. 6 部品ファイルの変更箇所はすべて `className` 文字列リテラル内のトークン置換のみで、DOM 構造・props・要素種別・イベントハンドラの変更は無い（担当外部品・DOM・props 変更禁止の制約に適合）。
7. `provenance.json` の変更は sidebar-07/nav-main・dashboard-01/nav-main の `generatedContentSha256` 2 箇所のみで、`modified` / `notes` 文言は不変。これは `--modified` を伴わない `--resync`（add-component.mjs の機構、司令塔裁定2）の挙動と一致し、来歴記述の書き換えや情報の追加・削除は無い。URL・パス・個人情報等の新規混入も無い。

未検証（optional・flag外）:

1. 6 部品ファイル以外（`.astro` を含む src 全体）に tw-animate-css 由来クラスや生値が残っていないかは、提供入力の範囲外であり確認できない。`check-standards.mjs` の `SOURCE_GLOB` は `.astro` を含まないため、`--ease-*: initial` 化の効果（未知クラスは黙って既定 easing にフォールバックし、ビルドエラーにならない）と合わせて、§E.6 の `grep -rnE '...' src --include='*.astro'` と `.ease-out{}` 0件確認が実効的なガードになる。この実測はレビュー対象の diff 外（CI 代替、司令塔裁定6）。
2. `shadcn/tailwind.css` 内部が `tw-animate-css` や `ease-out` を参照していないかは提供物からは判断できない。`npm run build:lib` / `build:site` 後の `.animate-caret-blink{}` ≥1 件・`.ease-out{}` 0件の実測（§E.6）で閉じる想定。
3. 2 件の `generatedContentSha256` の値自体の正しさ（実ファイルとの一致）は `check-completeness` の仕組みに依存し、本レビューの入力だけでは再計算できない。
4. `.playwright-mcp/`（git status に見える未追跡ディレクトリ）は本 diff に含まれないが、司令塔裁定4 の証跡 commit 作成時に誤って含めないよう留意する必要がある（情報漏洩の観点での注意事項）。

### core-logic

LGTM

flag 0件。以下を確認した。

- `registry.json` 全文で `tw-animate-css` の出現が 0 件であることを確認。裁定1「90箇所」に対して、item数の内訳（ui components 64 + login 5 + sidebar 16 + signup 5 = 90）と一致する。
- §E.1 の生値置換は各ファイルで spec の対応表と逐語一致: `item.tsx` の `duration-100→duration-fast`、`message-scroller.tsx` の `duration-200→duration-base`／`duration-400→duration-slower`／`ease-in→ease-standard`／`ease-out→ease-entrance`、`sidebar.tsx`（3箇所）・`sidebar-07/nav-main.tsx`・`dashboard-01/nav-main.tsx` の `duration-200→duration-base`、`input-otp.tsx` の `duration-1000→duration-emphasis`。
- `global.css` の `--ease-*: initial;` は指示通り `--ease-standard` の直前に配置され、以降で `--ease-standard`〜`--ease-bounce-strong` を再定義する順序も正しい。
- `--animate-caret-blink` は裁定5どおり `var(--curve-entrance)` を用いており、周期 1.25s・keyframes の値は tw-animate-css 由来のものと同一。
- `MOTION_LITERAL_ALLOWLIST` は空 `Map([])` になり、allowlist にあった6 path 分の生値が全ファイルから消えていることをdiffで確認。機構（`staleMotionAllowlist`）自体は温存されている。
- `SHARED_DEPENDENCIES` を `["shadcn"]` に変更したのに合わせ、`registry-policy.mjs`・`check-completeness.test.mjs`・`add-component.test.mjs`・`dashboard-blocks.test.mjs` の期待値がすべて整合的に更新されている。completeness 負テストが `dependencies = []` に変わったのは、共有依存が1要素になったため「shadcn欠落」を検出するには空配列にする必要があるという論理的必然であり正しい。
- component 4件（`item`／`message-scroller`／`input-otp`／`sidebar`）の `provenance.json` の `generatedContentSha256` が今回未更新である点は、当該エントリの `notes` に「CLI 生成直後の手元の生成物の錨であり、standards 正規化後は生成直後 hash と一致しない」と明記された既知の設計（記録アンカーであり実体追随を意図しない）であるため、flag対象ではない。対照的に block 2件（`sidebar-07/nav-main.tsx`、`dashboard-01/nav-main.tsx`）は `notes` に「check-completeness がディスク実体と突合するため、ずれたままにはできない」とあり、実際に `--resync` でハッシュが更新されている。裁定2の「block 2件」という範囲指定と完全に一致する。

optional（番号付き、flagにはしない）:

1. §E.6 の追加検証コマンド（grep）は `duration-N`／`ease-(in|out|in-out)`／`animate-in`／`animate-out` のみを対象とし、tw-animate-css 由来の他 utility（`animate-accordion-down/up`、`slide-out-to-*`、`fade-(in|out)-*`、`zoom-(in|out)-*`、`spin-(in|out)`、`fill-mode-*`）を対象外としている。A〜D担当外の部品にこれらが残存していれば、Tailwind v4 は未知classを黙って無視するため無音の表示崩れになり得る。担当外ファイルは参照できないため確認不能だが、収束確認の際に `grep -rnE 'animate-accordion|slide-out-to|fade-(in|out)-|zoom-(in|out)-|spin-(in|out)|fill-mode-' src` の追加実測を推奨する。
2. `global.css` の「design system の曲線 --curve-standard へ接続する」というコメントが、`--ease-*: initial;` の挿入により指している行との位置関係がやや読みにくくなっている（スタイルの範疇）。
3. `input-otp.tsx` の `duration-emphasis` utility は `transition-duration` と `--tw-duration` のみを設定し、Tailwind の `animate-*` は `--tw-duration` を参照しないため caret の `animation-duration` には効かない（`--animate-caret-blink` の `1.25s` 固定値がそのまま使われる）。これは元の `duration-1000` でも同様の挙動であり spec 通りの置換なのでflagにしないが、裁定5の追加実測項目（`computed animation-timing-function`）と合わせて `animation-duration` も実測記録に含めるとよい。
4. component 4件・block 2件とも `modified` フィールドに今回のmotion token移行に関する記述が追加されていない。`--resync` は `modified` を保持する設計（テストでも確認済み）で spec も要求していないため任意。

### tests

LGTM

flag 0件。確認した根拠は以下のとおり。

- 司令塔裁定1「registry-policy.mjs と依存固定テスト3ファイル6箇所の同期は承認済み」と一致することを確認した。内訳は scripts/add-component.test.mjs の3箇所（`assert.deepEqual(registry.items[0].dependencies, ...)`／`result.registryItem.dependencies`／`item.dependencies`）、scripts/check-completeness.test.mjs の1箇所（「共有配布物を持つ registry item は共有 npm 依存を宣言する」）、scripts/dashboard-blocks.test.mjs の2箇所（`dashboard.dependencies`／`table.dependencies`）で、合計6箇所が裁定の件数と一致する。
- 上記3テストファイル全文を確認し、`tw-animate` への参照が残存していないことを確認した。
- dashboard-blocks.test.mjs の期待配列（`["lucide-react","recharts","shadcn"]`・`["shadcn"]`）は、diff 後の registry.json 実体の dashboard-01／dashboard-table item の `dependencies` と sorted 一致している。
- check-completeness.test.mjs の負のテストは、`registry-policy.mjs` の `SHARED_DEPENDENCIES` が `["shadcn"]` 単一要素になったことに伴い、`dependencies = ["shadcn"]`（tw-animate-css 欠落検出）から `dependencies = []`（shadcn 欠落検出）へ書き換えられている。メッセージ雛形「共有配布物が要求する X が dependencies に無い」を維持したまま単一メッセージへの `deepEqual` で検証しており、司令塔裁定1の「completeness負のテストは dependencies=[] で shadcn 欠落を検出」と一致する。実装が `SHARED_DEPENDENCIES` を走査するロジック自体は本diffで変更されておらず、テストは実装変更に追随しているだけと判断できる。
- 各テストは `mkdtempSync` による独立 tmpdir と `structuredClone` によるフィクスチャ複製で隔離されており、テスト間の共有状態は見当たらない。
- `scripts/check-standards.mjs` の `MOTION_LITERAL_ALLOWLIST` を空の `Map([])` にする変更は仕様§E.5の指示どおりで、`staleMotionAllowlist` は allowlist が空なら何も検査しない（vacuous）。この影響を受ける可能性のある `scripts/check-standards.test.mjs` は本diff・全文提供の対象外のため、感度低下の有無は確認不能（flag化はしない）。
- `input-otp.tsx` の `animate-caret-blink duration-emphasis` と `global.css` の `--animate-caret-blink: caret-blink 1.25s ...` は、`check-standards.mjs` の `MOTION_ARBITRARY_LITERAL`（`[transition:...]`/`[animation:...]` 形式のみ対象）にも `MOTION_DURATION_LITERAL`（`duration-\d+` 形式のみ対象）にも該当せず、standards 検査を回避する意図的な抜け道にはなっていない。

optional（confidence不足、または方針が司令塔裁定範囲内のため flag 対象外）:
1. check-completeness.test.mjs の負のテストで `dependencies = []` を使う代わりに `dependencies = ["何か共有外の値"]` を残す形にすれば、「実装が `SHARED_DEPENDENCIES` の各要素を個別に走査している」ことをより強く証明できる（空配列は「共有依存が1つも無ければ丸ごと検出する」実装でも通ってしまう）。ただし司令塔裁定1が `dependencies=[]` を明示承認しているため、これは指摘に留め、裁定を覆す提案はしない。
2. `src/styles/global.css` の `@theme inline` 内、`--ease-*: initial;` の直上にある既存コメント「design system の曲線 --curve-standard へ接続する。」が、位置的には `--ease-standard` ではなく新設の `--ease-*: initial;` の直前に来ており、説明対象がやや読み取りにくくなっている。動作に影響はないスタイル上の指摘。

### domain

LGTM

flag 0件。以下、diff から直接確認できる根拠。

- §E.1 の生値置換は、旧 `MOTION_LITERAL_ALLOWLIST` の6 path×token（`input-otp.tsx`: duration-1000／`item.tsx`: duration-100／`message-scroller.tsx`: duration-200・duration-400・ease-in・ease-out／`sidebar.tsx`: duration-200（3箇所）／`sidebar-07/nav-main.tsx`・`dashboard-01/nav-main.tsx`: duration-200）が、diff 内の置換（duration-fast／duration-base／duration-slower／ease-standard／ease-entrance／duration-emphasis）と1:1で対応し、allowlist を空 `Map([])` にする変更と整合している。`ease-linear`（sidebar.tsx）は spec が明示的に静的 utility として残置対象としており、置換対象から除外されている。
- §E.2 の caret-blink 定義は、spec 原文の `ease-out` ではなく司令塔裁定どおり `var(--curve-entrance)` へ写像され、周期 `1.25s` は維持されている。コード中のコメント「caret の段は design system に無いため、既存の点滅周期 1.25s を維持する。」で理由も明記されており、自前実装への降格に対する説明義務（reasoning）を満たしている。
- §E.3 は `@import "tw-animate-css";` の削除、`package.json` からの依存削除、`registry.json` の各 item から `"tw-animate-css"` を機械的に削除（サンプル箇所はいずれも他の dependency 要素を保ったまま除去）、`scripts/registry-policy.mjs` の `SHARED_DEPENDENCIES` を `["shadcn"]` へ、対応する3テストファイル（add-component.test.mjs / check-completeness.test.mjs / dashboard-blocks.test.mjs）の期待値更新まで一貫している。司令塔裁定1（registry-policy.mjs と依存固定テストの同期は承認済み）と一致。
- §E.4 の `--ease-*: initial;` は、同じ `@theme inline` ブロック内の既存パターン（`--shadow-*: initial;` → `--shadow-xs: ...`、`--font-weight-*: initial;` → `--font-weight-normal: ...`）と同型で、`--ease-standard: var(--curve-standard);` の直前に置かれており spec の位置指定と一致する。以降の `--ease-standard`/`--ease-entrance`/`--ease-exit`/`--ease-bounce`/`--ease-bounce-strong` は reset 直後に個別再定義されているため、CSS cascade 上ワイプされない。
- §E.5 の `MOTION_LITERAL_ALLOWLIST` は空 `Map([])` に変更され、機構（`staleMotionAllowlist` の参照ロジック）自体は手を付けていない。
- provenance.json のハッシュ更新は `sidebar-07/nav-main.tsx` と `dashboard-01/nav-main.tsx` の block 2 件のみで、司令塔裁定2（--resync による同期承認）の範囲と一致する。component 側（badge, button 等）のハッシュは不変で、今回変更していない component ファイルと符合する。
- DOM・props・担当外部品への変更は無く、確認した7ファイル（item.tsx / message-scroller.tsx / sidebar.tsx / nav-main.tsx ×2 / input-otp.tsx）はすべて className のトークン文字列置換のみで、要素構造・属性・ロジックの変更は見られない。

optional（flag にはしない）:
1. 4節5項の期待値（`animation-name` が `caret-blink`）と司令塔裁定5の「computed animation-timing-function を追加実測する」は、いずれも `@keyframes caret-blink` の定義自体が実際に build CSS へ emit されたかまでは判別できない（emit されなくても animation-name の指定値だけは同じになりうる）。収束確認で `grep -c '@keyframes caret-blink' dist/_astro/global.*.css` を追加実測することを提案する。
2. `/* design system の曲線 --curve-standard へ接続する。 */` というコメントが `--ease-*: initial;` の直上に来る形になり、対象の `--ease-standard: var(--curve-standard);` から1行離れている。`--shadow-*: initial;` のように reset 行専用の説明コメントを付けたうえで既存コメントを `--ease-standard` 直上に戻すと読みやすい（§E.4 の「直前に足す」制約とは両立する）。

### Core Logicのブロック外前置き（原文）

advisorの指摘に基づき、provenance.jsonのハッシュ未更新はcomponent側の設計上正当（notesに明記された既知の仕様）であることを確認しました。


<!-- review-cycle:end 2026-09-15-overlay-motion-e -->
