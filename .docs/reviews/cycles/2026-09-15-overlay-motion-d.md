verified_impl_sha: 9f86ac173db171442c56e50763205bd0211c1cc5

<!-- review-cycle:start 2026-09-15-overlay-motion-d -->
# toast / disclosure の開閉モーション統一 PR D レビュー

- Cycle ID: 2026-09-15-overlay-motion-d
- 対象 HEAD: 9f86ac173db171442c56e50763205bd0211c1cc5
- 実施日: 2026-09-16（JST）
- 総ラウンド数: 1（上限3）
- 終了理由: 初回から全5レンズ LGTM、flag 0件
- レンズ別 flag: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- INSPECTION_STATUS: 実施済み、flag 0件、optional 6件: duration等価表記・クラス順・生成CSSの対象・accordionの既存クラス配置
- 確定した偽陽性: なし
- ACCEPTED_RISKS: なし（flag受容なし）

## 起動と独立性

司令塔の既出裁定に従い、以下の read-only CLI を Fresh Eyes → Security → Core Logic → Tests → Domain の順に1レンズずつ、5回独立して起動した。前レンズの結果を次レンズへ混ぜていない。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-<role>.txt > result-<role>.json
```

全5呼び出しで exit 0 / is_error=false。CLI のモデル指定は sonnet で、modelUsage に claude-sonnet-5 を確認した（CLI の補助処理として claude-haiku-4-5-20251001 / claude-fable-5-1 も集計されている）。利用可能 tools は Read / Glob / Grep に限定し、Write / Edit / Bash は提供していない。実装4ファイルのレビュー前後の SHA256 は全件一致した。

入力はレビュー開始時の `git diff origin/main`（base 22769b1）、担当3部品全文、spec §2 / §D / §4。証跡を別commitへ追加する前の実装をレビューした。ts-review-graph は未構築だったため、差分と指定ソースを起点にした。flag は確信度80%以上で correctness・セキュリティ・明示要件への影響があるものに限定し、optional と分離する指示を渡した。

## ラウンドと処置

| R | Fresh Eyes | Security | Core Logic | Tests | Domain | 処置 |
|---|---|---|---|---|---|---|
| 1 | flag 0 / optional 1 | flag 0 / optional 0 | flag 0 / optional 0 | flag 0 / optional 3 | flag 0 / optional 2 | コード修正不要、下記の実測・司令塔裁定と対応付けた |

- duration の値数（Fresh Eyes #1 / Tests #1 / Domain #1）: [toast report](../2026-09-15-overlay-motion-d/2026-09-16-toast-preview.md) に CSSOM の生値 `0.4s` を記録した。4プロパティへ共通適用される等価表記であり、原文の「4値になる想定」は実測と区別する。
- クラス順（Tests #2）: `npm run lint` を実行し exit 0。クラスの並び順を理由とするエラーはなかった。
- duration-slower の生成（Tests #3）: toast の computed style で `0.4s`、transition-property で `transform, opacity, height, filter` を直接確認した。
- accordion の「既存」表記（Domain #2）: spec 編集は禁止されているため、司令塔の裁定に従って PR 本文へ誤記と Panel への移設を記録する。正本自体は変更していない。
- レビューが未実行と明記した runtime / test 項目: worker が独立に実測した。部品別 report と [browser-results.json](../2026-09-15-overlay-motion-d/browser-results.json) に保存し、§4 全項目の exit code を PR 本文へ記録する。

optional は終了条件へ数えていない。flag の棄却・格下げ・受容は行っていない。固定された段・曲線・side offset の設計変更を求める flag はなかった。

## 収束後の確認

main e34c71f（PR A / B を含む）へ merge commit 582fdbe で追随した。conflict はなく、担当3部品の内容は実装commitから不変。standards の差分も担当 toast エントリの削除だけとなった。

§4.1〜4.4 を追随後に独立再実行し、standards exit 0（248ファイル、motion-literal / stale 各0）、負の検査9本は各0件 / exit 1、lint exit 0（既存201 warnings / 3 infos）、build:site exit 0（271ページ）、生成CSSの3検査は各1件 / exit 0 を確認した。

## 原文（境界行だけを除去）

### fresh-eyes

LGTM
根拠:
- toast.tsx: Root/Content の transition 文字列は §D の指定と逐語一致（`transition-[transform,opacity,height,filter] duration-slower ease-entrance`、`transition-opacity duration-slower ease-entrance`）。`filter` を含める理由（blur を transition させるため）も仕様通り。stack 用 `[transform:…]` と swipe 別 ending transform、`data-limited`/`data-expanded` 系は無変更。通常状態 `blur-none`、starting/ending に `blur-(--motion-blur-sm)` の追加も一致。
- accordion.tsx: `h-(--accordion-panel-height)` と `data-starting-style:h-0 data-ending-style:h-0` を内側 div から Panel 自体へ移動している。Base UI は `data-starting-style` / `data-ending-style` と `--accordion-panel-height` を Panel 要素自身に付与するため、旧コードの内側 div 上のそれらのクラスは無効（だからこそ旧実装は Panel 側の keyframe `animate-accordion-*` に依存していた）。`transition-[height]` 方式を機能させるには height・data-*-style・transition を同一要素（Panel）に揃える必要があり、実装後の Panel クラス集合は §D の目標文字列と逐語一致する。仕様の「(既存)」という表記は位置について曖昧だが、結果は正しい。
- collapsible.tsx も同一パターンで §D の置き換え後文字列と逐語一致。
- allowlist: `check-standards.mjs` から削除されたのは `src/components/ui/toast.tsx` の複数行エントリのみで、他 path は無変更（§2.2 準拠）。削除された3リテラル（旧 transition 値、`duration-250`、`ease-out`）は toast.tsx 内に残存していない。`animate-spin`（Loader2Icon、既存）は §4-2 の否定検査 3 コマンドいずれにも該当しない（`animate-in|…|animate-accordion` は `animate-spin` に不一致、`\bease-(in|out|in-out)\b` は `ease-entrance` に不一致、`duration-[0-9]+` は `duration-slow(er)` に不一致）。
- §2.3 の触らないもの規定：差分は担当3ファイル＋`check-standards.mjs`（allowlist行削除のみ）のみで、global.css・registry.json・previews 等への越境なし。
- `check-standards.mjs` 実行、`duration-slower`/`duration-slow`/`ease-entrance`/`--motion-blur-sm` トークンの存在、実ブラウザでの computed style・filter transition の挙動は本レンズの入力（差分・部品全文・spec）だけでは裏取りできないため未確認（実行したとは主張しない）。

optional:
1. §D の期待値注記は toast の `transition-duration` を「0.4s, 0.4s, 0.4s」としているが、`transition-[transform,opacity,height,filter]` はプロパティ4つのため computed `transition-duration` は4値になる想定。実装の不備ではなく、後続の §4-5 証跡記録者が誤って不一致と誤読しないよう申し送り。

### security

LGTM
根拠:
1. 変更されたclassNameはすべて静的リテラルで、動的データや外部入力がCSS/classNameに流入する経路はない。`cn()`によるconsumer className合成は既存どおり（accordion Panelは従来からclassNameを受け取っていない）。`blur-(--motion-blur-sm)`や`h-(--accordion-panel-height)`等のCSS変数名もBase UI由来／design tokenで、ユーザー制御値ではない。
2. `MOTION_LITERAL_ALLOWLIST`からの削除はlintバイパスを狭める方向の変更のみで、緩和は発生していない。削除対象の3リテラル（`[transition:transform_500ms_cubic-bezier(...)...]`、`duration-250`、`ease-out`）は toast.tsx 全文から実際に除去済みで、代わりに数値literal（`duration-[0-9]+`、`ease-(in|out|in-out)`）は新規に混入していない（`duration-slower`/`duration-slow`/`ease-entrance`はトークンclass、`150%`はtransform値でduration/easeパターンに該当しない）。
3. `check-standards.mjs`の正規表現・判定ロジックには手が入っておらず、Mapエントリ削除のみ（§2.3準拠）。
4. 差分範囲は担当3部品ファイル＋allowlist行削除のみで、global.css/registry.json/package.jsonなど触ってはならないファイルへの越境はない。

未確認: `node scripts/check-standards.mjs`の実行、global.css内のトークン定義の存在、ブラウザcomputed styleの実測（§4のrubric項目）は、提示資料のみでは裏取りできないため未実施として記録する。これらはセキュリティ上の懸念点ではない。

### core-logic

LGTM
根拠:
- toast.tsx: Root の transition 置換（`[transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]` → `transition-[transform,opacity,height,filter] duration-slower ease-entrance` ＋ `blur-none`/`data-starting-style:blur-(--motion-blur-sm)`/`data-ending-style:blur-(--motion-blur-sm)`）と ToastContent の `transition-opacity duration-250 ease-out` → `transition-opacity duration-slower ease-entrance` は §D の表の literal と完全一致（目視照合）。height/transform/opacity の duration が単一値に統合される点も §D の literal がそう指定しており、正本の固定設計として妥当。
- accordion.tsx: `data-open:animate-accordion-down data-closed:animate-accordion-up` を除去し、`h-(--accordion-panel-height) transition-[height] duration-slow ease-entrance data-starting-style:h-0 data-ending-style:h-0` を Panel 側へ移設。origin/main では該当クラスが内側の素の `<div>` に付いていたため、Base UI が `data-starting-style`/`data-ending-style` と `--accordion-panel-height` を実際に設定する Panel DOM ノードとは一致しておらず、実質デッドコードだった。今回 Panel へ統合したことで collapsible.tsx と同一パターンになり、動作上正しい修正（内側 div から height 系クラスが消え、二重適用にもなっていない）。
- collapsible.tsx: `data-open:animate-accordion-down data-closed:animate-accordion-up` → `h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-slow ease-entrance data-starting-style:h-0 data-ending-style:h-0` は §D 表の literal と完全一致。
- check-standards.mjs: toast.tsx のエントリを丸ごと削除。置換後の toast.tsx に `duration-250`/`ease-out`/該当ブラケット literal が残存しないことを目視確認済みで、`motion-literal-allowlist-stale` を誘発しない。Map リテラルの前後（48〜71行）を確認し、カンマ・括弧の構文崩れなし。accordion/collapsible は元々 allowlist 未掲載で変更不要、diff もそのように扱っている。
- §4.2 の否定検査パターンを3ファイルに対して目視で静的照合: `\b(duration|delay)-[0-9]+\b`（`duration-slow`/`duration-slower` は数値でないため非該当）、`\bease-(in|out|in-out)\b`（`ease-entrance` は非該当）、`animate-in|animate-out|...|animate-accordion|delayed-open`（ToastIcon の `animate-spin` は対象パターンに非該当）はいずれも 0 件と読める。`MOTION_ARBITRARY_LITERAL`（`\[(?:transition|animation)...`）も `transition-[transform,opacity,height,filter]` の `[` は `transition` の直後ではなく値側にあるため非該当と読める。
- §4.1/4.3/4.4/4.5/4.6（check-standards実行、lint、build、Playwright実測、check-standards.test.mjs実行）はコマンド実行環境がなく未確認。上記はすべてコード読解による静的照合であり、実行結果ではない。
optional: なし

### tests

LGTM
根拠:
- allowlist 削除は spec §2.2 / §D と一致。`scripts/check-standards.mjs` から `src/components/ui/toast.tsx` の複数行エントリが全行削除され、他 path の行・Map 構文は無変更。旧エントリの3値（`[transition:transform_500ms...]` / `duration-250` / `ease-out`）はいずれも新 toast.tsx に残っていない。accordion.tsx / collapsible.tsx は元々 allowlist に無く、§D 記載通り変更なし。
- spec §4-2 の3正規表現（`animate-in|...|delayed-open`、`\b(duration|delay)-[0-9]+\b`、`\bease-(in|out|in-out)\b`）を担当3ファイル全文に机上適用すると全て0件（例: toast.tsx の `animate-spin` は `animate-in` に不一致、`duration-slow(er)` は数値サフィックスでないため regex2 に不一致、`ease-entrance` は regex3 の候補語と別物）。陽性対照として origin/main 版は toast=`duration-250`/`ease-out`、accordion/collapsible=`animate-accordion` を含み1件以上ヒットする構図であることも確認できる。
- `check-standards.mjs` の正規表現・判定ロジック本体は不変（allowlist 行削除のみ）で spec §2.3 に準拠。

未確認（提示資料だけでは実行・裏取り不可、実行したとは主張しない）:
- spec §4-1（`node scripts/check-standards.mjs` の exit 0）、§4-3（lint）、§4-6（`check-standards.test.mjs`）は未実行。特に `check-standards.test.mjs` が allowlist の toast 固有エントリに依存するフィクスチャを持つかは差分に含まれず判定不能。

optional:
1. spec §D の期待値記述例（`transition-duration` が `0.4s, 0.4s, 0.4s` の3値）は旧3プロパティ transition 前提の書き方。新 toast は `transition-[transform,opacity,height,filter]` の4プロパティなので computed は4値になりうる。証跡フェーズで「含む」照合にする旨の申し送りが望ましい。
2. accordion.tsx:59 の class 並び `overflow-hidden text-sm h-(...) transition-[height] duration-slow ease-entrance ...` が collapsible.tsx:36 の `h-(...) overflow-hidden text-sm transition-[height] ...` と語順が異なる。Tailwind class sorter 系の lint がある場合 §4-3 で引っかかる可能性があるが、lint 設定は提示資料に無く未確認。
3. spec §4-4 の grep 例は `.duration-slow{` のみを見ており `.duration-slower{`（toast 用）は含まれない。toast の 0.4s 系は §4-5 の computed style 実測のみが証拠になる点を証跡担当へ申し送るとよい。

### domain

LGTM
根拠:
- §D 表の置き換え指示（toast: `filter` を含む transition + blur starting/ending + blur-none、ToastContent: duration-slower/ease-entrance、accordion/collapsible: `data-open/closed:animate-accordion-*` 削除→`transition-[height] duration-slow ease-entrance overflow-hidden` + `data-starting/ending-style:h-0`）は3ファイル全文と一致。
- accordion.tsx は spec が「(既存)」と書く `h-(--accordion-panel-height)` / `data-starting-style:h-0` / `data-ending-style:h-0` を内側 div から Panel（`data-slot="accordion-content"`）へ移動しているが、これは正しい修正である。Base UI は `data-starting-style` / `data-ending-style` を Panel 要素自身に付与するため、内側 div に置いたままでは自要素に属性が付かず不発（origin/main では実質効いていなかった疑いがある）。Panel へ移すことで §D の実測 selector と transition 保持要素が一致し、動作要件を満たす。「足す」という spec 文言との字面差はあるが、意図（テンプレを Panel に適用）を正しく実現しており correctness 上の問題ではない。
- collapsible.tsx は元々 Panel 自体に対象クラスが無く、今回 Panel に一括追加。構造的な矛盾なし。
- allowlist: toast.tsx のエントリを丸ごと削除。新コードに生値（`transition:transform_500ms…` / `duration-250` / `ease-out`）が残っていないことを3ファイル全文で確認。accordion/collapsible はもともと allowlist に無く、diff も変更なし。§2.3「触らないもの」（check-standards.mjs のロジック・他 path・global.css 等）への抵触なし。
- §2.1 の popup 用テンプレ（`data-ending-style:duration-fast` / `data-instant:transition-none`）は Dialog/Popover 系限定であり、§D 表は toast/accordion/collapsible にこれを要求していないため、今回不足していても要件逸脱ではない。
- §4-2 負の検査対象パターン（`animate-in|animate-out|...|animate-accordion|delayed-open`、`duration-[0-9]+`、`ease-(in|out|in-out)`）は3ファイル全文の静的読み取りで該当なし（grep は未実行、目視のみ）。

未確認（提示資料だけでは裏取り不可、実行したとは主張しない）:
- `node scripts/check-standards.mjs` / lint / build / Playwright実測 / check-evidence（§4-1,3,4,5,7）は未実行。
- `duration-slow` / `duration-slower` / `ease-entrance` / `--motion-blur-sm` の実トークン値は global.css（PR E 担当、入力外）依存のため未確認。

optional:
1. §D 本文の期待値例示「`0.4s, 0.4s, 0.4s`」は旧3プロパティ時代の表記。今回 `filter` が加わり4プロパティになるため実際は `0.4s×4` になる可能性が高い。実装側の問題ではなく証跡記録時の期待値文言の追従を検討。
2. §D accordion 行の「(既存)」という表現は、origin/main では該当クラスが内側 div にあった実態と食い違う。spec 文言側の微修正候補（実装は正しい）。

<!-- review-cycle:end 2026-09-15-overlay-motion-d -->
