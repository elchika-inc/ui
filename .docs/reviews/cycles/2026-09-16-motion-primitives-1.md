verified_impl_sha: 20a920f0e326e2abd2907c29a2ec4b4efa73d877

# モーションプリミティブ PR 4-1 レビュー記録

## 条件と結果

- 対象: icon-swap / success-check / text-swap / text-reveal / thinking-states の実装・preview・登録25ファイル。
- 入力: git diff origin/main、変更ファイル全文、委任仕様 §2 / §B / §4。TextReveal の role=img は司令塔裁定によるspecの書き漏れ補正。
- Fresh Eyes → Security → Core Logic → Tests → Domain の順で、以下のコマンドをレンズごとにfresh contextで逐次起動した。
- reviewerにはRead / Glob / Grepのみを渡し、書き込みツールを与えていない。結果の永続化はworkerが行った。
- 全5呼び出しexit 0、初回ラウンドでflag 0。形式不正による再取得0回。ACCEPTED_RISKSなし。
- ts-review-graphはこのworktreeにgraph.dbが無いため使用せず、指定された全文入力でレビューした。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

## INSPECTION_STATUS

- ラウンド1: 5レンズすべてLGTM相当、確信度80%以上のflag 0。
- optional 8項目: Fresh Eyes 2項目、Core Logic 2項目、Tests 3項目（計測上の注意点を含む）、Domain 1項目。以下の原文に全件保存し、実測により確認できた事実を補記する。終了条件はflagだけで判定した。

## optionalへの実測補記

- Fresh Eyesのrender中のstate調整コメント案は任意の説明追加であり、実装変更は行わない。
- Fresh Eyesの「単体rootのkeyはno-op」という記述は実測と異なる。text変更後、変更前のroot.isConnected=false、現在rootとの同一性=falseをChromiumで確認した。仕様のkey={text}を保持する。
- Core Logicのreduced-motionでduration=0になる懸念は、この共有CSSでは該当しない。実測は1e-05s（0.01ms）、20ms間隔5回の連続切替後もleaving=0。既存のonTransitionEnd除去を保持する。
- Core Logicの短時間往復時の通常transitionへの復帰は、指摘本文にもあるとおり仕様の観測要件と矛盾しないため変更しない。
- Testsのprovenance懸念は--resync後のハッシュをSHA-256で別途突合し、5部品とも一致した。public/rの配布sourceも本体と一致した。check-completenessのみでハッシュ一致と判断していない。
- Testsの証跡ディレクトリについての記述は限定された入力に基づく記述であり、最終成果物には部品別report5本と新規JPEG10枚が存在する。
- Testsの計測に関する注意点は、16msポーリング、最終computed style、非空白の実unitのdelay、両themeのconsole error / pageerror検査で確認した。

- DomainのArray.fromフォールバックで書記素クラスタが分かれる制限は、仕様が明示した互換経路の制約として記録し、別ライブラリやAPIは追加しない。

## reviewer応答原文

### fresh-eyes

```text
LGTM

主要な仕様項目（icon-swap / success-check / text-swap / text-reveal / thinking-states の API・class 文字列・data-* 契約、registry.json / provenance.json / preview-selectors.json / component-categories.mjs / src/index.ts への登録位置とアルファベット順）を spec §2/§B と逐語比較しましたが、いずれも文字列レベルで一致しており、correctness・セキュリティ・明示要件に影響する不一致は見つかりませんでした。TextReveal の role=img 追加は司令塔裁定どおりの反映です。

optional（確信度不足または主観的な指摘のため flag 化していません）:
- `text-swap.tsx` の `TextSwap`: `values.current !== value` を render 本体内で判定して `setValues` を呼ぶ「derived state」パターンは React の公式に許容された手法ですが、コードに慣れていないレビュアーには意図が伝わりにくいかもしれません。一言コメントがあってもよいかもしれません。
- `text-reveal.tsx` の root `<span key={text} ...>`: 単体要素としてレンダーされる限り `key` は無効化されるだけの no-op です。動作に影響はありません。

```

### security

```text
LGTM
```

### core-logic

```text
LGTM／optional: 以下2点は確信度が閾値に届かないため flag とはしませんが、参考として記録します。

- TextSwap の leaving span の除去は `onTransitionEnd` 依存であり、CSS Transitions の仕様上、遷移時間が 0 の場合は `transitionend` が発火しません。`--duration-fast` が `prefers-reduced-motion` 下で 0 になる設計であれば、leaving span が `aria-hidden` かつ不可視のまま DOM に残留し得ます（最大1要素、機能的な実害は小さい）。ただし仕様どおりの `onTransitionEnd` 除去実装であり、tokens.css の値は本 PR の変更範囲外のため未確認です。
- 値が短時間で A→B→A と往復した場合、戻り先の「A」は直前の leaving ノード（同一 key）を再利用するため、`starting:` による新規挿入アニメーションではなく通常の transition で再入場します。見た目の非対称が生じ得ますが、`getAnimations()` に opacity/translate の transition が観測される点は仕様の検証手順と矛盾しません。

state（TextSwap の `leaving`/`current` 不変条件、React key の重複回避、onTransitionEnd の冪等性）と境界（`data-swapped`/`data-checked` の `""` / 属性なし変換、`active`/`states` の範囲外アクセスへの `?? ""` フォールバック、TextReveal の delayIndex 計算）を追跡しましたが、正しさを損なう新規の不一致は見つかりませんでした。
```

### tests

```text
LGTM／optional:

- text-reveal.tsx は司令塔裁定により scaffold 後に root へ `role="img"` を追加している。provenance.json の `text-reveal.generatedContentSha256`（`08ca02bd…`）は scaffold 直後の値のままの可能性があり、`--resync` されているかはこのレビューからは判定できない。§4-4 の `node scripts/check-completeness.mjs` が exit 0 になるかで実測確認すること。
- §4-7 のブラウザ証跡はまだ diff に含まれていない（`.docs/reviews/2026-09-16-motion-primitives-1/` は untracked の空ディレクトリ）。これは司令塔が「最後の commit に追加する」と明言している既知の未完了ステップであり、今回のレビューは §4-7/§4-8 以外のコード側の検証可能性のみを対象にした。preview-selectors.json の selector は5部品すべてで data-slot と一致し、各 preview に操作可能な button があり、観測表の各行に対応する `getAnimations()` 対象要素（icon-swap-from/to、success-check の circle/path、text-swap の value/leaving span、text-reveal-unit、thinking-states 内部の TextSwap）が揃っている。thinking-states の registryDependencies（@elchika/spinner, @elchika/text-swap）も揃っており registry:build を通す前提は満たしている。
- 証跡取得時の実測手順への注意点（実装の欠陥ではなく、今後の Playwright 実行時に注意すべき点）:
  - text-swap は duration-fast（120ms）の短い遷移のため、click 直後に間を空けず `getAnimations()` を読むこと。
  - icon-swap の「切替後 computed opacity」は `Promise.all(anims.map(a => a.finished))` 後に読むこと。
  - text-reveal の「40 × 最後の index」は、送信元テキストの空白区切り数からの机上計算ではなく、DOM 上の `[data-slot="text-reveal-unit"]` のうち `transitionDelay` を持つ要素数から実測すること（Intl.Segmenter の word 分割は単純な空白分割と一致しない場合がある）。
  - text-reveal は `client:load` で `Intl.Segmenter` を SSR/CSR 双方で実行するため、ICU差異によるhydrationミスマッチが console error に出ないか、light/dark 両ページで明示的に確認すること。
```

### domain

```text
LGTM／optional: `text-reveal.tsx` の `Intl.Segmenter` 非対応時フォールバックで `by="char"` の場合に `Array.from(text)` を使っているが、これは UTF-16 コードポイント単位の分割であり、結合文字や一部の絵文字などの書記素クラスタを正しく1単位として扱えない（`Intl.Segmenter` が使える環境では該当しないため実害は小さい）。仕様がこのフォールバックを明示的に許容しているため flag ではなく optional として記録する。

各コンポーネント（icon-swap / success-check / text-swap / text-reveal / thinking-states）の className・style・data-slot・aria 属性は仕様の記法どおりで、React 側の実装（`TextSwap` のレンダー時 state 更新パターン、`TextReveal` ルート span の `key={text}` による意図的な全体再マウント、`onTransitionEnd` の target/currentTarget 判定）も期待どおりに機能する。TextReveal の `role="img"` + 子要素 `aria-hidden` は司令塔裁定どおりの仕様書き漏れ補正であり、新規の不一致ではない。preview 側のアクセシブルネーム付与（button のラベル切替、`role="status"` の使用）も一貫している。
```

## 動作検証の正本

部品別の観測値と画像は [証跡ディレクトリ](../2026-09-16-motion-primitives-1/) にある。存在・実行・動作を分けて記録している。全件テスト・typecheck・check:allはローカルで実行せず、PR CIを代替ゲートとする。

## 収束後の独立再検証

- `node scripts/check-standards.mjs`: exit 0（0.436秒）。
- `npm run lint`: exit 0（0.444秒）。
- `node --test scripts/check-completeness.test.mjs`: exit 0（0.195秒）。
- `node --test scripts/add-component.test.mjs`: exit 0（10.894秒）。
- `npm run build:lib`: exit 0（24.488秒）。
- `npm run check:props`: exit 0（19.445秒）。
- `node scripts/check-completeness.mjs`: exit 0（0.764秒）。
- `node scripts/check-preview-render.mjs`: exit 0（0.763秒）。
- `npm run registry:build`: exit 0（1.349秒）。
- `node scripts/check-distribution.mjs`: exit 0（0.053秒）。
- `npm run build:site`: exit 0（4.805秒）。

対象単体テストは95件と93件、いずれもpass全件 / fail 0 / skip 0。既存の対象テスト2ファイルにbaseからの差分はない。standardsは258ファイルを検査し、arbitrary-value / motion-literalの違反0。lintは506ファイルを検査し、error 0 / warning 211 / info 3。completenessは66 component / 28 block。registryは95 itemを生成し、担当5件のpublic/r JSONが存在する。build:siteは286ページ。

report作成直後の `node scripts/check-evidence.mjs` はexit 0。共有面の過去証跡に対する非阻害の出力も省略せず記録する。

```text
3 件の証跡が共有面の変更より古い:
  2026-08-05-index-page.md: src/previews
  2026-08-23-catalog-block-isolation/2026-08-23-block-iframe-isolation-catalog.md: registry.json, src/components/ui, src/pages/preview, src/previews
  過去履歴の shared stale: 91 件（形式・immutability は全件検査済み）
証跡形式 OK
```

証跡commit後の2回目のcheck-evidence、およびPR CIの結果はPR本文に記録する。
