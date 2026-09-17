verified_impl_sha: e37090316f1e5b4332a2019276e30f6846e5d49a

<!-- review-cycle:start 2026-09-18-typography-b1 -->
# 組版 B1 のレビュー

- **Cycle ID**: 2026-09-18-typography-b1
- **対象 HEAD**: e37090316f1e5b4332a2019276e30f6846e5d49a
- **対象**: `src/components/ui/{badge,kbd,tooltip,command,menubar,dropdown-menu,context-menu,select,combobox,empty}.tsx`、`src/previews/{badge,combobox,context-menu,dropdown-menu}.tsx`、`scripts/typography-usage.test.mjs` の15ファイル。
- **総ラウンド数**: 1
- **終了理由**: 全レンズ LGTM、flag 0。
- **レンズ別 flag 件数**: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Ambiguity - / Altitude -。
- **INSPECTION_STATUS**: 実施済み / flag 0 / optional 4件（文字列走査の将来の網羅性、ScriptKind固定、許可classの転記確認、非class文字列の誤検知）。
- **ACCEPTED_RISKS**: なし（flagの受容なし）。
- **確定した偽陽性**: なし。
- **判断レンズへの差し戻し**: なし。

## 実行方式と範囲

司令塔指定の次のCLIを、fresh contextで Fresh Eyes → Security → Core Logic → Tests → Domain の順に1レンズずつ起動した。正常な5応答と書式不正の2応答を合わせた7呼び出しはすべてexit 0。モデルはSonnet、ツールはRead / Glob / Grepに制限した。並列起動はしていない。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は担当ファイル限定のdiff・変更15ファイル全文・spec §1 / §2 / §4 / §B と司令塔の追加裁定。specは参照情報であり、レビュー対象はコードのみ。確信度80%以上の correctness / セキュリティ / 明示要件への影響をflag、それ以外をoptionalへ分けた。`ts-review-graph` は未構築だったため、指定ファイルとdiffを直接入力した。

Fresh Eyes初回は境界無しの `LGTM`、Tests初回は境界ブロックの外に前置きがあった。どちらも有効な完了応答とは扱わず、指定の1回だけ取り直した。再取得後は期待roleの境界1個、結論、flag件数の整合を確認し、本文を改変せず保存した。対象15ファイルのfingerprintはレビュー入力時から変わっておらず、レビュアーによる変更は無い。

## R1 の有効な応答原文

### fresh-eyes

LGTM／optional: 概要

- `scripts/typography-usage.test.mjs` の `strings()` は `ts.isStringLiteralLike` のみを見ており、テンプレートリテラルの `${}` を含む断片（TemplateHead/Middle/Tail）を拾わない。現状のコードには該当ケースが無く実害は無いが、「コメントを除いた文字列を走査する」という裁定の意図に対しては網羅性のギャップがある。
- 同ファイルは走査対象すべてを `ts.ScriptKind.TSX` で解析しており、`.ts`/`.js` が混在した場合に `<T>expr` 等の記法で誤パースが起きても例外にならず黙って文字列を取りこぼす可能性がある。現状のroots配下は実質 `.tsx` が中心なので実害の確信度は低い。
- `allowedTextXs` のうち diff に含まれない9件（button/toggle/sidebar/attachment/avatar/item と previews の card/bubble/alert）は今回のレビュー対象ファイルに含まれておらず、転記が実ファイルと一致しているかはこの場では検証できない。`node --test` 実行時にのみ確認できる点であり、指摘ではなく確認事項として記録。

### security

LGTM

### core-logic

LGTM

### tests

LGTM／optional: 概要のみ

optional: `strings()` は className/`cn()` 呼び出しに限定せず全ての文字列リテラル（aria-label 等含む）を走査対象にしている。現状の15ファイルでは英語の "tracking-*"／"text-xs" 相当の文字列が非クラス文脈に存在しないため誤検知は起きていないが、将来的に無関係な文字列（コメント文言・URL等）が偶然パターンに一致すると誤検知になり得る設計。今回のdiff・仕様適合の判断には影響しないためoptionalとする。

### domain

LGTM

## 書式不正だった初回応答の記録

以下の2応答は判定に用いず、同じレンズを1回ずつ取り直した。書式不正は内容のflagを棄却する理由にはしておらず、初回にもflagは無い。

### Fresh Eyes 初回

LGTM

### Tests 初回

advisorの見解も一致した。テストの構造(allowlist 12箇所の内訳、5/6 pass・1 fail、境界正規表現、陽性対照の隔離)はspec・司令塔裁定と整合しており、correctness/security/明示要件に影響するflag対象は見つからなかった。軽微な設計上の余地(ScriptKindの固定、テンプレートリテラル未走査)はoptionalに留める。

<<<LENS_FINDINGS role="tests">>>
LGTM／optional: readSources が拡張子に関わらず常に ScriptKind.TSX でパースしているため、`.ts` 内の型アサーション記法(`<T>x`)がJSXと誤解釈された場合に以降の文字列走査が乱れる可能性がある(対象ファイルは全て `.tsx` で実害なし)。また `ts.isStringLiteralLike` はテンプレートリテラル式(`` `...${x}...` ``)の断片を拾わないため、将来 class 文字列がテンプレートリテラル化されると検知漏れになり得る(現状の担当15ファイルには該当箇所なし)。いずれも確信度80%未満・現時点で実害なしのため参考情報。
<<<END_LENS_FINDINGS>>>

## optional の扱い

- テンプレート式の断片とScriptKind固定は将来の構文に対する改善案であり、今回の実ファイルに検知漏れが生じる指摘ではない。既定の検査仕様を増やす修正は行っていない。
- 許可classの実体との一致は独立した実行で12箇所それぞれ1回の存在を確認した。許可外38箇所はすべてB2所有であり、想定どおりusageテストだけが1件失敗している。
- 非class文字列の誤検知は将来の入力に関する改善案。現在の走査結果では発生せず、終了条件外として記録した。AST走査はコメント自体を含めない。
- Tests初回のoptional 2件はFresh Eyesと同じ論点で、重複した指摘として原文を保持した。

## 司令塔裁定と実測

- 固定高さの badge / kbd / combobox chip にleading-noneを追加する指示を適用した。
- usageの許可対象は既定6箇所、variant付きの密度UI3箇所、preview注釈3箇所の計12箇所。SidebarMenuSubButtonは実体の `data-[size=sm]:text-xs` に一致させた。
- command group headingも12px役割として再タグ付けした。既存previewに存在しなかったshortcutと複数選択chipは、担当preview3本の最小例追加として裁定された。
- フォント確認は、500 weightが表示に使われるページの初期checkと、指定の400 weightを明示loadした後のcheckを分けて記録した。
- Combobox chipの文字行は12px、既存の削除ボタンは24pxで、scrollHeight 23 / clientHeight 21を観測した。指定された全件合格条件のBadge/Kbdは両テーマ全件通過した。chipの寸法変更は担当指示に含まれないため行わず、観測を部品reportとPR本文へ残した。

## 検証との対応

指定の既存テストは95/95、93/93、18/18、2/2 pass（各exit 0、fail / skip 0）。usageは5/6 pass・1 fail・skip 0（B2未移行の想定RED）、陽性対照だけの実行は2/2 pass。standards 262ファイル・lint 516ファイルは各exit 0。library build、props契約、completeness（component 68 / block 28）、preview selector、registry build、distribution、registry.json不変は各exit 0。

実ブラウザは20ルートHTTP 200、console error / pageerror 0（favicon404 1件別記）、Mono対象24要素のcomputed family一致、数値Badge4要素はtabular-nums。Badgeは各テーマ9/9で18 <= 18、Kbdは各テーマ3/3で20 <= 20。292ページのbuild成果物から20枚の1440×900 JPEGを撮影し、部品別reportへ記録した。

report作成直後のcheck-evidenceはexit 0（既存shared stale診断「3件」・過去履歴91件、形式・immutability通過）。証跡commit後の再検証、PR CIの全件テスト・typecheck等はPR本文へ終了結果を記録する。全件テスト・typecheck・check:allは指定どおりローカル実行していない。

<!-- review-cycle:end 2026-09-18-typography-b1 -->
