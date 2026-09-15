verified_impl_sha: 57d2af4df3e4dc51173e9cb14f951c0edd0fb3b8

<!-- review-cycle:start 2026-09-15-overlay-motion-b -->
# overlay モーション統一 PR B レビュー

- Cycle ID: 2026-09-15-overlay-motion-b
- 対象 HEAD: 57d2af4df3e4dc51173e9cb14f951c0edd0fb3b8
- 実施日: 2026-09-16（JST）
- 総ラウンド数: 1（上限3）
- 終了理由: 初回から全5レンズ LGTM、flag 0件
- レンズ別flag: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- INSPECTION_STATUS: 実施済み、flag 0件、optional 8件: data-instant実測・証跡追加時点・既存spec差分・テスト実測の突合
- 確定した偽陽性: なし
- ACCEPTED_RISKS: なし（flag受容なし）

## 起動と独立性

Orcaの `worker-start --worktree current --agent claude --model sonnet` は exit 1 / `consumer_fenced` で失敗した（`worker-start requires the coordinator terminal currently bound to the Task Run`）。成功やレビュー完了には数えていない。

司令塔の承認により、以下をレンズごとに5回、順に独立呼び出しした。前のレンズの出力は次の入力へ混ぜていない。各入力は `git diff origin/main`、担当3ファイル全文、spec §2 / §B / §4。実装のみの差分をレビューし、証跡は別commitとして追加する段階である。

```bash
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-fresh-eyes.txt > result-fresh-eyes.json
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-security.txt > result-security.json
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-core-logic.txt > result-core-logic.json
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-tests.txt > result-tests.json
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence --output-format json < prompt-domain.txt > result-domain.json
```

5呼び出しとも exit 0 / is_error=false。model指定はsonnet、出力のmodelUsageでclaude-sonnet-5を確認した。利用可能toolsはRead/Glob/Grepだけで、MCP・hooks・pluginは無効化し、Write/Edit/Bashは提供していない。レビュー前後の実装4ファイルのGit object hashは一致した。ts-review-graphは未構築のため、入力の差分と対象ソースを起点にした。

## ラウンドと処置

| R | Fresh Eyes | Security | Core Logic | Tests | Domain | 処置 |
|---|---|---|---|---|---|---|
| 1 | flag 0 / optional 1 | flag 0 / optional 0 | flag 0 / optional 1 | flag 0 / optional 5 | flag 0 / optional 1 | コード修正不要、optionalを下記の実測へ対応付けた |

- data-instant観測の参照要求（Fresh Eyes / Core Logic / Tests #1 / Domain）: [検証report](../2026-09-15-overlay-motion-b/report.md)と[生データ](../2026-09-15-overlay-motion-b/browser-results.json)で、通常のポインターclick / hover直後のfalse / nullを全6ケース確認した。transition-propertyも全件opacity, scale。
- closeでのdata-instant懸念（Tests #2）: 生データのcloseポーリング全件でdata-instantなし。ending属性からDOM消失まで観測した。
- 証跡がdiffに無い点（Tests #3）: 実装commit段階の入力による。新規JPEG6枚・部品別report3件をこのレビュー記録と同じ証跡commitへ追加する。追加前check-evidenceはexit 0、追加後結果はPR本文へ記録する。
- spec差分（Tests #4）: 司令塔commit e0467c5の既存spec追加を許容する裁定をPR本文に記録する。spec自体は編集していない。
- standards既存テスト（Tests #5）: 指定テスト72 pass / 0 fail / 0 skip、exit 0。全件テストとtypecheckは指定のPR CIで代替する。
- 入力・原文にある「slide-in 5個」はspecの誤記を引いた記述で、実測は各6個。司令塔裁定に従って全6個を削除した。
- Security原文の「popover/hover-cardでは付けず」は実体と異なる説明。実体は3部品ともdata-instant:transition-noneを付与し、その分岐根拠は上述の6ケース。原文は改変せず下に保存する。

optionalは終了条件に数えていない。flagの棄却・格下げ・受容は行っていない。設計の段・曲線・side offset復帰を求めるflagは無かった。

## 原文（境界行だけを除去）


### fresh-eyes

LGTM

確認根拠:
- popover.tsx / hover-card.tsx の置換後クラス文字列は§2.1テンプレ（`transition-[opacity,scale] duration-slow ease-entrance data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md) data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast data-instant:transition-none`）と文字単位で一致。
- tooltip.tsx は§Bの表に明記された個別文字列（duration-fast / scale-sm開閉 / duration-micro / data-instant無条件付与）と完全一致。
- 除去対象クラス（`data-open:animate-in` 等、`data-[side=…]:slide-in-from-…-2` 5個、`data-[state=delayed-open]:…`、`duration-100`）はいずれの3ファイルからも過不足なく消えている。popover.tsx にのみ存在した `data-closed:overflow-hidden` は削除対象リストに含まれておらず、正しく温存されている。
- `origin-(--transform-origin)` は3ファイルとも保持。backdrop要素はこの3部品に存在せず、backdropテンプレの適用対象外という判断も§2.1と整合。
- check-standards.mjs の allowlist 差分は `hover-card.tsx` と `popover.tsx` の該当行のみ削除しており、tooltip.tsx はallowlistに元々存在しないため触っていない。他pathの行への影響なし。§2.3「他のpathの行は触らない」に整合。
- §4-2の陰性検査（animate-in/animate-out/fade-in-0/zoom-*/slide-in-from/delayed-open、`duration|delay-[0-9]+`、`ease-(in|out|in-out)`）に該当する文字列は3ファイルいずれにも残存せず、目視で0件と確認。
- スコープ外ファイル（global.css/tokens.css/registry.json/他部品/previews等）への変更は差分に含まれていない。

optional:
- §Bは popover / hover-card について「通常操作直後に `data-instant` が実測で付くか」に応じて `data-instant:transition-none` の要否を判定するよう求めているが、今回提示された3ファイル・diffの範囲には report／実測ログが含まれておらず、両部品とも同一に `data-instant:transition-none` を残す判断の実測根拠をこのレンズでは検証できない。コード自体は§Bの文字列指示と一致しており誤りとまでは言えないため flag にはしないが、PR本文に記載される実測値（data-instant の有無）との突合を別レンズ・司令塔側で確認することを推奨する。

### security

LGTM

確認根拠:
- 差分は `popover.tsx` / `hover-card.tsx` / `tooltip.tsx` の `className` 文字列（Tailwind ユーティリティの静的リテラル）置き換えと、`check-standards.mjs` の `MOTION_LITERAL_ALLOWLIST` からの該当行削除のみ。外部入力・ユーザーデータを一切扱わない箇所であり、インジェクション（XSS/HTML injection 等）のベクトルは存在しない。
- 3ファイルとも `className` は `cn()` によるマージのみで、`dangerouslySetInnerHTML` や `eval`、動的な URL/属性生成は無い。`{...props}` によるスプレッドは既存構造のままで今回の変更範囲外（例: `tooltip.tsx` の `render={undefined}` / `role="tooltip"` は diff に含まれず変更なし）。
- 認証・認可・セッション・トークン等に関わるロジックはこの3ファイルに存在しない。
- `data-instant:transition-none` の付与有無（popover/hover-card では付けず、tooltip では付ける）は見た目・挙動上の分岐であり、認可判定や情報開示制御とは無関係。
- allowlist の行削除は静的解析ルールの棚卸しであり、セキュリティ検査ロジック（`motion-literal` 検知の正規表現本体）には手を加えていない（仕様§2.3の禁止事項どおり）。
- 外部リソースの読み込み・ネットワーク呼び出し・ログ出力・機微情報の取り扱いは差分に含まれない。

### core-logic

LGTM

根拠:
- `popover.tsx` / `hover-card.tsx`: Popupのclassnameは§B表どおり `duration-100`・`data-[side=…]:slide-in-from-…-2`（5個）・`data-open:animate-in/fade-in-0/zoom-in-95`・`data-closed:animate-out/fade-out-0/zoom-out-95` を除去し、§2.1テンプレ（open: `duration-slow ease-entrance` + `scale-(--motion-scale-md)`、close: `duration-fast` + `scale-(--motion-scale-sm)`）に一致。`origin-(--transform-origin)` は両ファイルとも保持されている。popoverの `data-closed:overflow-hidden` は除去対象クラス一覧に含まれておらず正しく維持されている。
- `tooltip.tsx`: `data-[state=delayed-open]:…`／`data-open:…`／`data-closed:…`／`slide-in-from-…` をすべて除去し、§B表に literal 指定された置換文字列（`duration-fast` open、`duration-micro` close、scaleは開閉ともsm）と完全一致。`data-instant:transition-none` も「tooltip は無条件に付ける」の指示どおり。
- 3ファイルとも `animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from|delayed-open` および生の `duration-<数値>` / `ease-(in|out|in-out)` は残存しておらず、§4-2の負の検査を満たす想定。
- `check-standards.mjs` は `hover-card.tsx` と `popover.tsx` の allowlist 行のみ削除しており、tooltip（もともと未掲載）や他 path の行は無変更。§2.2・§2.3（担当外ファイル不可侵）に整合。
- DOM構造（Portal/Positioner/Popup/Arrowのネスト）、export、`HoverCardContentProps`／`PopoverContentProps`／`TooltipContentProps` の型定義に変更なし。§3「DOM構造・export・props型の変更禁止」を満たす。

optional（要追加確認、confidence不足のため flag 化せず）:
- §Bは「popover / hover-card で通常の開閉時に `data-instant` が観測された場合は `data-instant:transition-none` を付けない」という条件分岐を要求しているが、diffでは popover・hover-card とも tooltip と同様に無条件で `data-instant:transition-none` が付与されている。これがPlaywright実測（§4-5）の結果「data-instantは付かなかった」に基づく正しい選択なのか、観測を怠って一律テンプレを適用しただけなのかは、本レンズに提供された3ファイル＋diffだけからは判別できない（PR本文・reportの記載を要確認）。HoverCardはTooltipと同じhover遅延ベースのpopup（背景§1で言及される「tooltipのtrigger間移動」でdata-instantが付く挙動）を持つため、trigger間を素早く移動した際にdata-instantが実際に付く可能性はゼロではない。PR本文に観測結果と判断根拠が明記されているか確認することを推奨する。

### tests

LGTM（flag 0件）

確認根拠:
- §4-2 の負の検査（`animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from|animate-accordion|delayed-open`、`\b(duration|delay)-[0-9]+\b`、`\bease-(in|out|in-out)\b`）を popover.tsx / hover-card.tsx / tooltip.tsx の全文に対して手動照合した。tooltip.tsx の Arrow 要素の `data-[side=…]:top-1` 等や `TooltipProvider` の `delay = 0` は `delay-[0-9]+` にマッチしないことも確認済みで、3ファイルとも0件になる。
- allowlist（`scripts/check-standards.mjs`）から `popover.tsx`／`hover-card.tsx` の行が削除され、tooltip.tsx はもともと未掲載であることをdiffで確認した。3ファイルとも生値が消えているため `motion-literal` も `motion-literal-allowlist-stale` も0件になるはず。
- §B の表の値（popover/hover-card: `duration-slow` + `scale-(--motion-scale-md/sm)`、tooltip: `duration-fast` + `scale-(--motion-scale-sm)`固定 + `data-ending-style:duration-micro`）がそれぞれのファイルの className と一致している。tooltip の close scale が §2.1 の「close は1段小さい」原則どおりでなく open/close とも sm 固定なのは §B 表が明示的に上書きしているためで、矛盾ではない。
- §4-5 の期待値（popover/hover-card `0.26s`、tooltip `0.12s`、いずれも `cubic-bezier(0.16, 1, 0.3, 1)`）は選択された utility（duration-slow/fast、ease-entrance）から導出可能で、A節などの他表の同段の数値とも整合している。

optional（flagにはしない）:
1. `data-instant:transition-none` の分岐（§B）は popover/hover-card 両方に付与されており「通常操作で data-instant が付かない」側の判断が反映されているが、この判断の根拠となる Playwright 実測（trigger click/hover 直後の data-instant 有無）は本入力に含まれておらず、diffだけでは検証できない。PR 本文の観測値で実際には open 直後に data-instant が付いていた場合、この2ファイルの分岐は誤りとなり flag に転じる。また観測方法として、Base UI の Popover がキーボード操作由来の open では `data-instant` の付与条件が異なる可能性があるため、§4-5 の観測はポインタークリックで行われているか確認した方がよい。
2. `data-instant` が close 操作でも付く実装であれば `transition-none` により ending transition が消え、§4-5 で必須とされる `data-ending-style` のポーリング観測が無効化される懸念がある。事前に矛盾が無いか確認し、あれば §7 に従い ask 対応とすべき。
3. §4-7（`check-evidence.mjs`）および §6 の証跡 commit は本diffに含まれておらず（`.docs/reviews/2026-09-15-overlay-motion-b/` が無い）、このレビュー時点が実装commitのみの段階であるなら想定どおりだが、最終ラウンドであれば flag に格上げすべき。
4. `.docs/plans/2026-09-15-overlay-motion.md` が `git diff --stat origin/main` に含まれる点は §4-8 の「担当部品のファイル + allowlist削除 + 新規証跡のみ」という条件と字面上矛盾するが、§6 に「spec は A/B 両ブランチに同一内容で存在する」旨の説明があるため、PR本文にその正当化が明記されているか要確認。
5. `check-standards.test.mjs` は担当外ファイルのため入力に含まれておらず、popover.tsx/hover-card.tsx の allowlist エントリを参照する既存テストケースへの影響は本レンズの入力からは判定不能（§4-6 の実測で担保される前提）。

### domain

LGTM

## 確認根拠

- §2.1 / §B表の削除対象がすべて除去されていることを確認: popover/hover-cardの `duration-100`、`data-[side=…]:slide-in-from-…-2` 5個、`data-open:animate-in / fade-in-0 / zoom-in-95`、`data-closed:animate-out / fade-out-0 / zoom-out-95`。tooltipの `data-[state=delayed-open]:animate-in / fade-in-0 / zoom-in-95` 3個も含め、いずれも残存なし（§4-2のgrepパターンは3ファイルとも0件になるはず）。
- 追加された記法が§Bの表と文字列レベルで一致: popover/hover-cardはopen `scale-(--motion-scale-md)`・close `scale-(--motion-scale-sm)`、`duration-slow` → `data-ending-style:duration-fast`。tooltipは `duration-fast` → `data-ending-style:duration-micro`、openもcloseも `scale-(--motion-scale-sm)`。tooltipのopen/close同段は§2.1の「closeは1段小さい」という一般原則を§Bの個別行が明示的に上書きしたものであり、逸脱ではなく仕様準拠。
- `origin-(--transform-origin)` は3ファイルとも維持。popoverの `data-closed:overflow-hidden` は§2.1の削除対象リストに含まれていないため保持が正しい。`motion-safe:` は付与されておらず§2.1と整合。
- Base UI属性とTailwind utilityの接続: `data-starting-style:` / `data-ending-style:` / `data-instant:` は値なしのbare data attribute variantとしてコンパイルされ、Base UIが付与する値なし属性の存在セレクタと整合する。`transition-[opacity,scale]` は、Tailwind v4の `scale-*` がCSSの個別`scale`プロパティを生成する前提（§1の `translate-y-(--motion-distance-md)` と同じ前提）と整合しており、transition-property名として妥当。`data-ending-style:duration-*` によるdurationの非対称化は、Base UIが属性を付与するタイミングとopacity/scaleの状態変化が同一のスタイル再計算内で起きるため機能する。
- allowlist差分は§Bで指定された `popover.tsx` / `hover-card.tsx` の2行のみ削除されており、tooltipはもともと生値もallowlist行も無いため、`motion-literal-allowlist-stale` のリスクはない。

## optional

- popover / hover-cardの `data-instant:transition-none` は、§Bの分岐規定（通常操作直後にdata-instantが付くか否かで採否を決める）に基づく判断だが、その観測結果はPR本文側にあり本レンズの入力（diff・3ファイル・仕様§2/§B/§4）だけでは真偽を確認できない。実装は「付かない」側の判断を採ったコードになっている。確認の際は、§4-5のcomputed style検査（`transition-duration` / `transition-timing-function`）だけでは `transition-property: none` の状態でも数値自体は変わらず見えてしまう点に注意し、`data-ending-style` の属性ポーリング観測（要素が消えるまでの遷移が実際に発生しているか）の方でdata-instant誤付与を検出できることを踏まえてPR本文の記録を照合することを推奨する。

<!-- review-cycle:end 2026-09-15-overlay-motion-b -->
