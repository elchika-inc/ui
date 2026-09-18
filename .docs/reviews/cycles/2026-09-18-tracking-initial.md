verified_impl_sha: 971b08315898706ad8ce3d1a152e8bd598a03280

<!-- review-cycle:start 2026-09-18-tracking-initial -->
# 旧 tracking utility 解除のレビューサイクル

- Cycle ID: 2026-09-18-tracking-initial
- 対象 HEAD: 971b08315898706ad8ce3d1a152e8bd598a03280
- 総ラウンド数: 1
- 終了理由: 初回ラウンドの全5レンズで flag 0
- レンズ別 flag 件数: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- 確定した偽陽性: なし
- INSPECTION_STATUS: inspected — flag 0、optional 4件（以下にレンズ別原文を保存）

## 実行方法

委任仕様 §5 に従い、Sonnet を fresh context で1回1レンズ、Fresh Eyes → Security → Core Logic → Tests → Domain の順に起動した。各レンズの最終 exit は0、初回応答に指定境界が揃い、再試行は不要だった。書き込みツールを渡さず、静的レビューを動作検証の代替にしていない。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は global.css・theme-typography.test.mjs・共有面 report の担当範囲 diff と全文、spec §1 / §2 / §4 / §A、および commit 分割に関する司令塔の追加裁定。spec 自体は編集・レビュー対象外。指定された入力範囲を守り、追加グラフや他ファイルからの context 取得は行っていない。画像は実ブラウザ検証と独立した形式検査・目視で確認した。

確信度80%以上の correctness・セキュリティ・明示要件に影響する問題だけを flag とし、任意改善は optional に分離するよう入口で指定した。flag の格下げは行っていない。

| レンズ | 試行数 | exit | 秒 | flag | optional |
|---|---:|---:|---:|---:|---:|
| fresh-eyes | 1 | 0 | 163.84 | 0 | 2 |
| security | 1 | 0 | 51.54 | 0 | 0 |
| core-logic | 1 | 0 | 147.92 | 0 | 1 |
| tests | 1 | 0 | 126.27 | 0 | 1 |
| domain | 1 | 0 | 56.44 | 0 | 0 |

## R1 fresh-eyes（境界内の原文）

LGTM／optional: 2件

1. `scripts/theme-typography.test.mjs` の新規陽性対照「tracking の既定値解除が欠落すると検査が失敗する」は、主テスト `assert.match(theme, /--tracking-\*:\s*initial;/)` を呼ばず正規表現を自前で複製している。既存2件の陽性対照は共有ヘルパー `assertMatchesTokens` を呼ぶため主検査の劣化を検知できるが、この新規テストは自分のコピーした正規表現にしか反応しないため、主テストの正規表現側が壊れても陽性対照は通り続ける（トートロジー気味）。spec §A.2 の文言（「取り除いた文字列に対して fail することを 1 件のテストで確認する」）は満たしており、主テスト側に切り出せる既存ヘルパーも無いため correctness 違反ではないが、任意改善として主テストの assert を関数化して両者で共有すると保護力が上がる。

2. `.docs/reviews/2026-09-18-tracking-initial/report.md` の「コマンド検証」表は `node scripts/check-evidence.mjs` を実行コマンド一覧に含めるが、結果表にはこのコマンドの行がない（結果は本文末尾でPR本文に委譲すると明記されている）。spec §4 冒頭の「結果は PR 本文と worker_done に実測値で書く」という指示と整合しており瑕疵ではないが、コマンド一覧と結果表の対応が崩れて読みにくいので、表記を揃えると親切。

diff・全文・report の記載を spec §1/§2/§4/§A および司令塔追加裁定と突合した結果、global.css への `--tracking-*: initial;` 挿入位置（`--tracking-display` 直前、コメント文言も §A.1 と一致）、テストの3行目assert反転とテスト名変更、report 先頭2つのSHAが commit(2)（971b083、CSSのみのcommit afe500f の子孫）を指している点は、いずれも要求通り。correctness・セキュリティ・明示要件に影響する問題は確認できなかった。

## R1 security（境界内の原文）

LGTM
差分・全文の静的確認で、CSS のトークン変更（`--tracking-*: initial;` の追加）および `theme-typography.test.mjs` の文字列置換・正規表現変更に注入・情報漏洩・データ破壊につながる要素は確認できませんでした。`report.md` もローカルループバック（`::1`）のみを参照し、secrets の記載はありません。

## R1 core-logic（境界内の原文）

LGTM

対象2ファイルのみ確認した。

- `src/styles/global.css`: 非 inline `@theme` 内、`--tracking-display` の直前にコメント1行＋`--tracking-*: initial;`のみ追加。以降の4定義（display/heading/normal/label）の値・順序は不変で、`initial → 再定義`という既存の`--text-*`/`--leading-*`と同じ順序を維持している（§A.1と一致）。
- `scripts/theme-typography.test.mjs`: 「サイズと行間の既定値を解除し、移行中の字間 utility は残す」を改名し、3行目の`assert.doesNotMatch(theme, /--tracking-\*:/)`を`assert.match(theme, /--tracking-\*:\s*initial;/)`へ反転。他3 assertは不変。陽性対照1件を追加し、`--tracking-*: initial;`を除去した文字列で検査が失敗することを確認している（§A.2と一致）。`test(`は6→7で削除なし。
- `declarations()`の正規表現`/--([\w-]+):\s*([^;]+);/g`は`*`を`[\w-]`が受理しないため`--tracking-*: initial;`にはマッチせず、`assertMatchesTokens`の突合には混入しない。よって4定義との既存の値照合（tokens.cssとの文字列一致）は影響を受けない。この挙動はspec §1の記述と実際の正規表現から確認できる。
- 陽性対照テストが`assertMatchesTokens`ではなく`assert.match`を直接使っている点は、上記の理由（`assertMatchesTokens`では`--tracking-*: initial`の欠落を検知できない）による必然の適応であり、correctness上の問題ではない。

optional: 陽性対照テストの正規表現リテラル`/--tracking-\*:\s*initial;/`が本体テストと重複しているため、共有定数化すると保守性が上がるが、任意改善であり必須ではない。

## R1 tests（境界内の原文）

LGTM／optional: 新規陽性対照テスト（scripts/theme-typography.test.mjs 106-112行）は、既存2件の陽性対照が使う共通ヘルパー `assertMatchesTokens` を使わず `assert.match` を直接 `assert.throws` でラップしている。これは正しい判断（`declarations()` の正規表現 `/--([\w-]+):\s*([^;]+);/g` が `--tracking-*` の `*` を拾えないため `assertMatchesTokens` では検出できない、という spec §1 の説明と整合する）だが、既存陽性対照と実装パターンが異なる点は将来の可読性のため一言コメントを添えても良い。

検証根拠: diff は spec §A.2 の指示（3行目 assert の反転、テスト名変更、他3 assert 不変、陽性対照1件追加）と完全に一致。`test(` 呼び出しは変更前6件→変更後7件で削除なし。新規陽性対照は `globalCss` から `--tracking-*: initial;` を文字列除去した上で `typographyTheme` を再パースし、反転後の assert が `ERR_ASSERTION` で失敗することを確認しており、実際に regression を検知できる実装になっている。既存の組版突合テスト（tokens.css との deepEqual）は `--tracking-*` の追加行が declarations() の対象外のため影響を受けないことも diff・spec 双方から確認できる。

## R1 domain（境界内の原文）

LGTM

対象 diff（`src/styles/global.css` の `--tracking-*: initial;` 追加、`scripts/theme-typography.test.mjs` のアサーション反転と陽性対照追加）をレンズ観点（Tailwind / Base UI / アクセシビリティ・ハウススタイル）で確認しました。

- `--tracking-*: initial;` は同一 `@theme` ブロック内の `--text-*: initial;` / `--leading-*: initial;`、および同ファイル内の `--shadow-*: initial;` / `--ease-*: initial;` / `--font-weight-*: initial;` と同じ「wildcard で解除→直後に個別トークンを再定義」というハウス既定パターンに厳密に一致しており、Tailwind v4 の theme namespace reset として構文・順序ともに正しいです。
- 挿入直前に付けたコメント（「Tailwind 既定の tracking を解除し、design system の 4 段だけを残す。」）は `--shadow-*: initial;` 直上のコメントと同じ文体・位置で、ハウススタイルと整合しています。
- `--tracking-display` 以降の4行は diff の context 上変更なしで、既存の字間トークン（display / heading / normal / label）の値は保持されており、アクセシビリティ上意味のある字間（`--tracking-label: 0.08em` 等）に影響はありません。
- テスト側のアサーション反転（`doesNotMatch` → `match`）は spec §1 の要求どおりで、追加された陽性対照テストも直上の既存陽性対照テストと同じ書き方（文字列除去→`assert.throws`）で一貫しています。

Base UI コンポーネント本体やアクセシビリティに影響する属性・ロールの変更は diff に含まれておらず、本レンズで確信度80%以上のflag対象となる問題は見当たりませんでした。

## optional の扱いと検証結果

Fresh Eyes 2件、Core Logic 1件、Tests 1件の原文を保存した。正規表現の共有化・理由コメントは任意改善であり、仕様が固定した assert と他3 assert を維持する今回の変更では追加しない。check-evidence の結果は仕様 §4 の指定先である PR 本文と worker_done に実測値を記録する。共通化に関する同種の提案を含むが、件数は各レンズの報告単位で4件と数えた。

指定単体147件は fail 0 / skip 0、standards・lint・build・整合検査は各 exit 0。[共有面 report](../2026-09-18-tracking-initial/report.md) に公開サイト6ケースの字間と共有面28枚を記録した。report 作成後の check-evidence は279.98秒で exit 0、既存 shared stale 2件と過去履歴92件は許容された警告として残る。証跡 commit 後の再検査と PR CI の実測値は PR 本文に記録する。

report 不在で誤って開始した予備の check-evidence は exit 1（264.39秒、旧共有 report の stale）だった。favicon 404 を別記する report 生成処理を直し、report 実在を確認してから上記の正式な事前検査を完走した。予備実行は §4.7 の成功には数えていない。

ACCEPTED_RISKS: なし。未解決 flag: 0。裁定の正本記録は PR 本文へ置く。
<!-- review-cycle:end 2026-09-18-tracking-initial -->
