verified_impl_sha: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3

<!-- review-cycle:start 2026-09-16-micro-interactions-0 -->
# マイクロインタラクション PR 3-0 レビュー

- Cycle ID: 2026-09-16-micro-interactions-0
- 対象HEAD: 096fbc8b01d5fbbf232b5af2a99e13332e8fa6d3
- 実施日: 2026-09-16（JST）
- 総ラウンド数: 1（上限3）
- 終了理由: 初回から全5レンズLGTM、flag 0件
- レンズ別flag: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- INSPECTION_STATUS: 実施済み、flag 0件、optional 2件: drawerの記録終了時刻の説明、navigation-menuの要素別生値
- 確定した偽陽性: なし
- ACCEPTED_RISKS: なし（flag受容なし）

## 起動と入力

司令塔の明示指示に従い、Fresh Eyes → Security → Core Logic → Tests → Domainの順に1レンズ1呼出しのfresh contextで逐次起動した。前のレンズのfindingsは次へ渡していない。モデルはsonnet、ツールはRead / Glob / Grepだけに限定した。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-role.txt > result-role.json
```

全5呼出しはexit 0 / is_error=false。modelUsageの主モデルはclaude-sonnet-5で、補助処理にclaude-haiku-4-5-20251001 / claude-fable-5-1を含む。

入力はorigin/main `e348f4dd94a1c194c70c0e5de2a7be92d02bf6b9` に対する担当3実装ファイルのdiff、3実装ファイルと新規report 3件の全文、spec §2 / §A / §4、司令塔裁定に限定した。先頭の司令塔spec追加自体と画像のバイナリはレビュー対象外。`.ts-review-graph/graph.db` は存在せず、入力制限にも従ってグラフを利用していない。レビュー前後の6ファイルのSHA256を照合し全件一致した。

レビューは静的な整合性確認であり、ブラウザ実測・コマンド実行の代替ではない。

## ラウンド結果とoptional

| R | Fresh Eyes | Security | Core Logic | Tests | Domain | 処置 |
|---|---|---|---|---|---|---|
| 1 | flag 0 / optional 0 | flag 0 / optional 0 | flag 0 / optional 0 | flag 0 / optional 2 | flag 0 / optional 0 | 実装・reportの修正なし、補足を以下へ記録 |

1. drawerのclose全sample数は実測値53 / 52を維持する。停止は `locator.waitFor({ state: "detached" })` の完了後に40ms待つ手順であり、16msポーリングが最初の不在を観測した時点とwaitForが完了する時点は同期しない。実測の最初の不在はlight 496.6ms / dark 449.0ms、最後のsampleはlight 898.2ms / dark 849.9msだった。16msはsetIntervalの指定周期で、実際の取得間隔を保証しない。durationはsample数から推定せず、getAnimationsの400msを根拠としている。
2. navigation-menuの要素別生値は実測JSONに保存して検算し、reportには全件一致の集計を載せた。各テーマのTrigger「製品」「ガイド」とLink「更新履歴」「コンポーネント」「デザイントークン」の全5要素が、property `background, border-color, color, box-shadow`、duration `0.12s, 0.12s, 0.12s, 0.12s`、easing `cubic-bezier(0.2, 0, 0, 1)` ×4と一致した。

Tests原文の§4.7への言及は、ローカル検査の実施責務を移す判断には使っていない。check-evidenceはこのworkerがreport直後と証跡commit後の2回をローカル実行し、その結果をPR本文に記録する。PR CIへ代替するのは明示指示どおり全件テスト・typecheck・check:allである。

flagの棄却・格下げ・受容は行っていない。固定された段・曲線・色などの設計変更を求めるflagはなかった。裁量は長いcn呼出しの改行、一時ファイル名、reportの表現に限った。

## 収束後の検証

§4.1〜4.4を再実行した。standardsは248ファイル・motion-literal 0件・exit 0。負の検査はdrawer cubic-bezier / navigation-menu transition-allが各0件・exit 1、origin/mainの陽性対照は1件 / 2件・各exit 0。

lintはexit 0（486ファイル、201 warnings / 3 infos、修正なし）、build:siteはexit 0（271ページ）。生成CSSは `dist/_astro/global.BPAn7D1u.css` のまま。transition-state 1ルール、@starting-style 1行、animate-shake 1ルール、@keyframes shake 1行、元CSSのkeyframes / --animate-shake各1行で、6コマンドすべてexit 0。

standards単体テストは72/72 pass、fail / skipped 0、exit 0。全件テスト・typecheck・check:allはローカル未実行。report作成直後のcheck-evidenceはexit 0、454.92秒、証跡形式OK（既存shared stale表示3項目、過去履歴91件を含む）。証跡commit後の再実行とPR CIの結果はPR本文へ記録する。

## レビュアー原文

### fresh-eyes

LGTM

根拠:
- drawer.tsx: `ease-[cubic-bezier(0.22,1,0.36,1)]` → `ease-entrance` の1箇所のみ変更されており、spec §A.3と逐語一致。他のclassは無変更。
- navigation-menu.tsx: Trigger/Linkの`transition-all`→`transition-state`（2箇所）、Indicatorのclass文字列がspec §A.4の指定と完全一致（内側divは無変更）。
- global.css: `transition-state` utility（§A.1）と `--animate-shake` / `@keyframes shake`（§A.2）の追加位置・内容がspecの指示（`duration-emphasis`直後 / `caret-blink`直後）と一致。
- report.mdの負の検査（drawer cubic-bezier 1→0、navigation-menu transition-all 2→0）、生成CSSの`.transition-state`/`.animate-shake`実測値がspec §4.2・§4.4の期待値と一致。
- 部品別reportの実測値（drawer: 0.5s / cubic-bezier(0.16,1,0.3,1)、navigation-menu: 0.12s / cubic-bezier(0.2,0,0,1)、Indicator: 260ms / cubic-bezier(0.16,1,0.3,1)）がspec §A観測列の期待値と一致し、report内のsample数・時間窓も相互に整合（例: drawerのending window ≈380msはduration-slower 400msと符合、open側のsample数×16ms≈650msは記載の観測窓と符合）。
- 証跡30枚・SHA系譜（共有CSS commit → 部品commitの子孫関係）に矛盾なし。
- `transition-state`のshorthandおよび`--animate-shake`は、既存の`prefers-reduced-motion`ブロックが`!important`でlonghand（duration）を上書きするため、reduced-motion時の抑制は従来通り機能する。
- Indicatorが`data-popup-open`のみを参照し`data-open`を見ない点はspec §A.4が指定した文字列そのままであり、spec自体はレビュー対象外のためflag/optionalいずれにも該当しない。
- ChevronDownIconの`ease-standard`とIndicatorの`ease-entrance`の不揃いは§Aの変更対象一覧に含まれない既存差異であり、本PRと無関係な既存問題として対象外。

### security

LGTM

根拠:
- 注入: 追加されたCSS値は静的リテラルまたはdesign systemトークンへの `var()` 参照のみ（`--state-transition` / `--duration-micro` / `--curve-standard` / `--motion-distance-sm`）。実行時の文字列補間・外部入力の混入経路なし。TSX側は既存 `cn()` 呼び出し内のクラス文字列編集にとどまり、Base UI primitiveへの `{...props}` spread は既存実装のまま変更なし。
- 秘密漏えい: reportにcredential・token・メールアドレス・ホームディレクトリの絶対パスは含まれない（リンクは相対パス、preview配信先は `127.0.0.1`）。Chromium/Astroのバージョンやビルド後CSSの内容ハッシュは機微情報ではない。
- データ破壊: 証跡ファイルはすべて新規（`git status` で `??`）であり、既存ファイルの上書きなし。`scripts/` ・`registry.json` ・`tokens.css` への変更なし。report.md内のコマンド片はドキュメントであり実行されない。
- 信頼境界: 新たなデータフローの導入なし。`transition-state` / `--animate-shake` は純粋な表示用CSSであり、`prefers-reduced-motion` の抑制ルールは既存のまま。

### core-logic

LGTM

根拠:
- Indicator: `opacity-0` ベース + `data-popup-open:opacity-100` は属性スコープ変体がベースに勝つため状態対応は正しい。navigation-menu-preview.md実測（popup-open false/true/false ↔ opacity 0/1/0、両テーマ）が裏付ける。
- `transition-state`（shorthand）はTrigger/Linkでduration/ease utilityと併記されておらず（仕様§2.1どおり）、カスケード競合なし。ChevronDownIconの`transition duration-slow`は別要素。reduced-motion側はlonghand `!important`のため引き続き優先される。
- 負の検査: drawer.tsxに`cubic-bezier`残存なし、navigation-menu.tsxに`transition-all`残存なし。report.mdの0/0の実測と一致。
- `--animate-shake`は既存`caret-blink`と同じ`@theme inline`内パターンを踏襲し、生成CSSでも`var()`が解決されずに残っており意図通り。
- diffの各行が仕様§Aのliteral文字列（配置位置・コメント含む）と一致し、drawer/navigation-menuのreport実測値も§4.5・§Aの観測項目と整合。

### tests

LGTM／optional: 実測値と期待値（§A・司令塔裁定）は整合しており、flag相当の齟齬はありません。

- §4.2の負の検査（drawer `cubic-bezier` main1→変更後0、navigation-menu `transition-all` main2→変更後0）はexit 0/1で`grep -c`の挙動と一致し、diff実装（`ease-entrance`置換、Trigger/Link 2箇所の`transition-state`化、Chevronは`transition`のみ）とも整合しています。
- §Aの観測列（drawer-popupの`0.5s`/`cubic-bezier(0.16,1,0.3,1)`、Indicatorの`opacity 0→1→0`・`data-popup-open`連動・260ms/entrance、Trigger/Linkの4プロパティ・0.12s・`cubic-bezier(0.2,0,0,1)`で`all`を含まない）はいずれも各previewファイルの実測値と一致します。
- §4.4のshake 1件検出は司令塔裁定どおりPR記録対象であり、report.md側もこれと矛盾しない記載です。
- §4.7（check-evidence）・全件テスト/typecheckはPR CI・司令塔判定へ明示的に委譲されており、report.mdに実行記録が無いこと自体は今回のレンズでの指摘事項ではありません。

optional（監査容易性の観点のみ、修正不要）:
1. drawer-preview.mdの「close全sample」件数（light 53 / dark 52）が、記載された16ms間隔・記録終了条件（DOM消失後40ms）から逆算した期待サンプル数（約30〜33件）と一致しません。ending側25サンプル（≈400ms、close durationと整合）自体は矛盾しませんが、close全体の「記録開始からの相対時刻」と実サンプル数の対応関係の説明がopen側・navigation-menu側と比べてやや不正確です。結論に影響する数値ではないため任意コメントに留めます。
2. navigation-menu-preview.mdはTrigger全2件・Link全3件を「全件同じ値だった」と集計のみで報告しており、要素別の生値は記載されていません。仕様が要求するのはcomputed styleの一致確認のみなので現状でも要件は満たしますが、個別値があれば監査性が上がります。

### domain

LGTM

根拠:
- §A.1〜4のliteral一致: `transition-state` utilityの追加位置(`duration-emphasis`直後)、`--animate-shake`/`@keyframes shake`の追加位置(`caret-blink`直後)、コメント文言、`NavigationMenuIndicator`のclass文字列まで仕様と字句一致。drawer Popupはeasing tokenのみの差し替えで他classは不動。
- §4.2負の検査を全文で確認: `drawer.tsx`に`cubic-bezier` 0件、`navigation-menu.tsx`に`transition-all` 0件（ChevronDownの`transition duration-slow`は元々`transition-all`ではないため対象外）。
- §Aの観測表とreportの実測が一致: drawer開くtransformが`0.5s`/`cubic-bezier(0.16,1,0.3,1)`、navigation-menu Indicatorが`data-popup-open`付与・解除に応じてopacity 0→1→0、260ms/entrance。Base UIの`data-popup-open`挙動を推測でなくreport実測で裏付けている。
- reduced-motion: `transition-state`/`animate-shake`はshorthandだが、既存の`@media (prefers-reduced-motion: reduce)`ブロックがlonghandの`transition-duration`/`animation-duration`を`!important`で上書きするため、優先度上reduce時は抑制される。WCAG 2.3.3の観点で矛盾なし。
- §2.1「段・曲線utilityは併記しない」を遵守: Trigger/Linkに`duration-*`/`ease-*`の併記なし。
- §4.4のshake出力については司令塔裁定どおり実測1件（specの`animate-shake`文字列がTailwind走査に拾われた結果）で合格として扱い、追加のflag対象としない。

<!-- review-cycle:end 2026-09-16-micro-interactions-0 -->
