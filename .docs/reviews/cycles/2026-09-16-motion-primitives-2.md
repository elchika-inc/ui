verified_impl_sha: 9ae765fe602b9360c964fee1c30571a247a2c9c7

<!-- review-cycle:start 2026-09-16-motion-primitives-2 -->
# モーションプリミティブ PR 4-2 レビューサイクル

- Cycle ID: 2026-09-16-motion-primitives-2
- 対象 HEAD: 9ae765fe602b9360c964fee1c30571a247a2c9c7
- 総ラウンド数: 1
- 終了理由: 全レンズ LGTM（flag 0）
- レンズ別 flag 件数: Fresh Eyes 0 / Security 0 / Core Logic 0 / Tests 0 / Domain 0
- INSPECTION_STATUS: 全5レンズ実施、flag 0、optional 4件（format 参照2件、callback ref 参照1件、末尾差し替えのテスト1件）
- ACCEPTED_RISKS: なし（flag の受容なし）
- 確定した偽陽性: なし
- 判断レンズへの差し戻し: なし

## 実行方法と範囲

司令塔指定の次のコマンドを、Fresh Eyes → Security → Core Logic → Tests → Domain の順に1レンズ1呼び出しの fresh context で逐次実行した。全呼び出しの exit code は0。入力は git diff origin/main、変更14ファイルの全文、spec §2 / §4 / §C と既出の role=img 裁定。実装ファイルへの書き込み権限をレビューに与えていない。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

Core Logic と Tests の初回応答は指定ブロック外に前置きがあったため、形式不正として各1回だけ再取得した。正常形式の応答を収束判定に採用した。内容上の flag に伴う修正ラウンドは発生していない。参考として初回応答も末尾に保存した。

ts-review-graph の get_minimal_context（implement）は Graph not built を返したため利用できなかった。変更ファイル全文と指定された spec を入力にしてレビューを継続した。

## optional の扱い

追加 API・段・曲線・依存・テストファイルの範囲拡大は行っていない。format の参照に関する2件は、親の props 更新時に再生成する最適化余地として記録する。親 preview は子の rAF state 更新ごとには再実行されないため、Fresh Eyes の「各フレーム」という説明までは成立しない。callback ref の同一性は利用者の渡し方に依存する。末尾差し替えの分岐はブラウザ網羅範囲に含めておらず、report に実測範囲を限定した。いずれも reviewer が初めから optional と分類しており、flag の格下げは行っていない。

## 収束後の独立検証

各コマンドは別プロセスで実行し、個別に終了コードとログを採取した。検証コマンドを shell の pipe / && / ; で連結していない。

| コマンド | exit code |
| --- | --- |
| `node scripts/check-standards.mjs` | 0 |
| `npm run lint` | 0 |
| `node --test scripts/check-completeness.test.mjs` | 0 |
| `node --test scripts/add-component.test.mjs` | 0 |
| `git diff origin/main -- scripts/check-completeness.test.mjs scripts/add-component.test.mjs` | 0 |
| `npm run build:lib` | 0 |
| `npm run check:props` | 0 |
| `node scripts/check-completeness.mjs` | 0 |
| `node scripts/check-preview-render.mjs` | 0 |
| `npm run registry:build` | 0 |
| `node scripts/check-distribution.mjs` | 0 |
| `ls public/r/animated-number.json public/r/streaming-text.json` | 0 |

- check-completeness.test: 95 / 95、fail 0、skip 0。
- add-component.test: 93 / 93、fail 0、skip 0。
- 既存テスト2ファイルの diff は空。
- standards: 252ファイルで適合、arbitrary-value / motion-literal 違反0。
- lint: exit 0。205 warnings / 3 infos（Astro の import 等を含む）を残しており、警告0という主張はしない。
- completeness: 63 component / 28 block、preview selector 宣言 OK。
- registry の2つの JSON が実在し、配布物も原本一致。
- build:site は277ページ、exit 0。生成CSSの @starting-style は grep 1 / exit 0。
- ブラウザの存在・実行・動作の記録は部品別 report と新規撮影の画像4枚に保存。
- check-evidence 初回は exit 0 / 証跡形式 OK。共有面の stale 表示3件、過去履歴の shared stale 91件を別記。
- 証跡commit後の check-evidence と PR CI の最終結果は PR 本文に記録する。全件テスト・typecheck・check:all は指示に従ってローカル未実行。

## レンズ別の最終応答（原文）

### fresh-eyes

LGTM

optional:
- [OPT] src/previews/animated-number.tsx:26 — `format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}` はインライン object literal のため毎レンダー新規参照となり、`AnimatedNumber` 内 `React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])` がアニメーション中の各フレームで再構築される。preview 限定・体感影響なしの軽微な最適化余地。

### security

LGTM

セキュリティ観点で確信度80%以上の問題は見つかりませんでした。

確認した点:
- `animated-number.tsx` の正規表現（`cubic-bezier` パースおよび duration パース）はいずれも入力長がCSSトークン由来で固定的であり、ReDoS のリスクは低い。
- 数値・文字列の描画はすべて JSX の `{}` 展開または属性経由であり、`dangerouslySetInnerHTML` や `innerHTML` 直書きは使用されていないため XSS のリスクはない。
- `getComputedStyle` で読む `--duration-slower` / `--curve-entrance` はデザイントークン由来（利用者入力ではない）であり、外部入力の混入経路がない。
- `streaming-text.tsx` の文字列比較・結合は `startsWith` ベースで、eval・Function コンストラクタ・動的 import 等の危険な API は使用していない。
- 新規 npm 依存の追加はなく、`registry.json` / `provenance.json` の追記は静的メタデータで攻撃面を増やさない。

### core-logic

LGTM

flag 0件。`animated-number.tsx` の rAF 補間・reduced-motion 分岐・cubic-bezier 逆算（二分法）、`streaming-text.tsx` の `committed`/`chunk` の派生 state 更新（レンダー中の条件付き setState は React の「レンダー中に state を調整する」既知の安全パターンに合致し、無限ループや古い state 参照による誤描画は生じない）を含め、確信度80%以上のcorrectness・セキュリティ・明示要件への影響は見つからず。spec §C の各要件（`--duration-slower` / `--curve-entrance` の読み取りとフォールバック、`aria-label` に最終値、`committed` への畳み込みと再進行時の即時確定、`text` が `committed` から始まらない場合の無演出全置換）は実装と一致している。AGENTS.md の96件表記とAnimatedNumberのrole=imgは司令塔裁定により仕様許容と明記されているため対象外。

optional:
- `AnimatedNumberPreview` はインラインの `format` オブジェクトリテラルを毎レンダー新規生成するため、`AnimatedNumber` 内 `useMemo(() => new Intl.NumberFormat(...), [locale, format])` の参照依存が実質無効化され、`Intl.NumberFormat` が毎回再生成される（`fractionDigits` は値比較のため effect 側への影響はなし。挙動に誤りはないが、望むなら `format` を安定参照にすると無駄な再生成を避けられる）。
- `AnimatedNumber` の `attachRef`（`useCallback([ref])`）は呼び出し側がインライン関数 ref を渡すケースで毎レンダー attach/detach が走るが、動作上の破綻はない。

### tests

LGTM

optional:
- [OPTIONAL] src/components/ui/streaming-text.tsx:12-19: `text` が `state.committed` には一致するが `state.text`（直前の全文）には一致しない場合（例: 追記ではなく末尾文字の差し替え）の分岐は、コメント「次の追記で直前の差分を確定し」の想定シナリオ（追記の連続）以外の挙動が未検証。ユニットテストで明示的にカバーされていない分岐なので、テスト追加を検討する余地あり。

### domain

LGTM

diff・変更ファイル全文・spec §2/§4/§C を突き合わせて確認した範囲では、correctness・セキュリティ・明示要件への影響という基準を満たす確信度80%以上の問題は見つかりませんでした。

確認した主な点:
- `AnimatedNumber`: `--duration-slower` のms換算（フォールバック400）、`--curve-entrance` のcubic-bezierをJSの二分法で解く実装（フォールバック線形）、`prefers-reduced-motion` 時の即時反映、`format.maximumFractionDigits ?? 0` への丸め、rAFのunmount時cancelなど、spec §C の表の実装要件をすべて満たしている。`role="img"` はシステム指示で既に補正済みと明記されているため対象外。
- `StreamingText`: render中のstate調整パターン（`state.text !== text` を条件にした毎レンダーの差分判定）はReactの公式にサポートされたパターンであり、`transitionend` 未発火環境向けのフォールバック（`text` がさらに進んだ場合に前回の全文を`committed`へ畳む）もspec記載の意図どおり実装されている。`key={text}` によるchunkの強制remountは `starting:opacity-0` を再トリガーするための意図的な手法で、途中経過のfadeが破棄される挙動もspecが許容するフォールバックの範囲内。
- `provenance.json` の2件のsha256値は形式上64桁のhexで妥当（実ファイルとの一致は未検証だが、これは記録メタデータであり correctness/security の実害はない）。
- `src/index.ts` / `preview-selectors.json` / `component-categories.mjs` への追加はファイル名順・カテゴリ指定（モーション新設、チャット末尾追加）とも spec §C の指示に整合。
- `registry.json` の `dependencies: ["shadcn"]` のみで新規npm依存を追加していない点も spec の「新npm依存は足さない」指示と整合。

optionalな指摘はありません。

## 形式再取得前の応答（原文・収束判定には不採用）

### core-logic 初回

advisorの確認結果と自身の精査を突き合わせ、確信度80%以上のcorrectness/セキュリティ/明示要件違反は見つかりませんでした。role=imgと96件は既に裁定・spec明示で除外対象です。

<<<LENS_FINDINGS role="core-logic">>>
LGTM

optional:
- animated-number.tsx: `fractionDigits = format?.maximumFractionDigits ?? 0` は spec §C の記述どおりだが、呼び出し側が `minimumFractionDigits` のみを指定し `maximumFractionDigits` を省略した場合、補間中の中間値表示が整数丸めになり最終表示（Intl.NumberFormat の既定桁数）と桁数が食い違う見た目になり得る。spec 準拠のため flag ではないが、利用時の注意点として記録。
- animated-number.tsx: `React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])` の `format` に呼び出し側がインラインオブジェクトリテラルを渡すと毎レンダー参照が変わり formatter が再生成される。correctness には影響しないが軽微な perf 懸念。
<<<END_LENS_FINDINGS>>>

### tests 初回

advisorの分析を踏まえ、証跡ディレクトリや未読テストファイルはレビュー入力範囲外として扱い、diffと観測列の実装対応を確認しました。結果、80%以上の確信度に達するflag対象は見つかりませんでした。

<<<LENS_FINDINGS role="tests">>>
LGTM

optional:
- 証跡ディレクトリ（`.docs/reviews/2026-09-16-motion-primitives-2/`）および `scripts/check-completeness.test.mjs` / `scripts/add-component.test.mjs` はレビュー入力外（diff・変更ファイル全文に含まれない）のため未検証。spec §2 rubric 3・7〜9 のゲートで担保される前提とする。
- streaming-text の chunk 要素は `onTransitionEnd` 確定（約120ms）で unmount されるため、`getAnimations()` による観測ウィンドウが短い。spec 記載どおりの挙動であり実装上の欠陥ではないが、E2E 実測時はタイミングに留意が必要。
<<<END_LENS_FINDINGS>>>

<!-- review-cycle:end 2026-09-16-motion-primitives-2 -->
