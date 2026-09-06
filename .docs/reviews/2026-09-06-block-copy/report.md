verified_impl_sha: 60d941edae9839bdfec65fb4d5dfe2b0d4719999

# blockの文言・デモデータ日本語化

[PR #55](https://github.com/elchika-inc/ui/pull/55)

[issue #54](https://github.com/elchika-inc/ui/issues/54)の固定対訳に合わせ、28blockの組織名・利用者・ナビゲーション・フォーム・表データをelchika共通の日本語へ統一した。例えば「Acme」「Login to your account」は「elchika」「ログイン」となり、表の状態は「作業中」「完了」で表示・絞り込みが一致する。dashboardの売上カードから指定のグラデーション4classを除いた。

## 変更範囲・司令塔承認

- 実在するblockは28件（dashboard 2、login 5、signup 5、sidebar 16）。原仕様の29件は司令塔の数え間違いとして28件へ補正した。block内65TSXと1JSON、preview外枠15TSXの25文字列を変更した。
- 実装変更は `239ec395905b7c385e564a3bd9d1d5d6ea46974f` と `7ca2df5`。証跡の `verified_impl_sha` は後続の `60d941edae9839bdfec65fb4d5dfe2b0d4719999` に固定し、28report＋56JPEGをcommit `2e815ed324ec1889018a371283924b67189bbd0e` で同時追加した。共有トークンの変更はない。
- `src/previews` は原仕様の対象外だったが、利用者が見る外枠に残る旧組織名・英語パンくず25箇所に限り追加承認された。構造・class・selectorは変えていない。sidebar-12 / 15のカレンダーは既存の `date-fns/locale` の `ja` を渡し、日本語の月・曜日を表示する。新規依存はない。
- dashboard-tableの比較文字列を日本語データへ同期。日本語の文字列比較で顕在化した既定locale差は、承認された `localeCompare` 2箇所の第2引数 `ja-JP` で固定した。既存の組込みAPI・既存ライブラリで解決できるため独自の比較処理や翻訳基盤は追加していない。
- `scripts/dashboard-blocks.test.mjs` は例外承認された範囲だけ変更した。旧組織名表示を要求していた1testの名称・期待値をelchika表示必須／Acme非表示へ同期し、既定localeが異なる子プロセス間の並び順を検証する回帰testを1件追加した。他の検査スクリプト・閾値は維持した。
- 円表記のバッジ切断は、司令塔指定の最初の手段で解消した。4枚の `CardTitle` から `@[250px]/card:text-3xl` を除いて `text-2xl` を維持した。数値の省略や他classの追加はしていない。
- login-05の `Welcome to Acme` はフォームの結果に合わせ「ログイン」とする裁定。人名は指定7名に小林 蓮・加藤 美月・吉田 陸を加えた10名で循環させ、メール差出人10件のemailは一意に保った。sidebar-11の技術ファイル名とGit状態のM / Uは内容そのものとして維持した。
- 全28blockで `node scripts/add-component.mjs <name> --resync` を実行。整形・後続修正後にも対象blockを同期した。独立SHA-256照合は76ファイル一致。provenanceの全体を比較し、`generatedContentSha256`以外の値に差分がないことを確認した。`modified`は変更していない。
- 実装・裁定の正本: [.docs/plans/2026-09-06-block-copy.md](../../plans/2026-09-06-block-copy.md)。規約上のマージ操作・デプロイは実行していない。

## rubricの実測結果

以下は最終ソース固定後の検証。①②⑦は最終レビュー後の「収束の対」として再実行した。

| 項目 | コマンド・対象 | 実測結果 | 確認した範囲 |
|---|---|---|---|
| ① lint | `npm run lint` | exit 0、1.85秒、486ファイル、既存warning 200件 / info 3件、fixなし | 実行・静的適合 |
| ② standards | `node scripts/check-standards.mjs` | exit 0、0.49秒、248ファイル | 実行・静的適合 |
| ③ build | `npm run build:site` | exit 0、4.32秒、271ページ | 実行・配信成果物の存在 |
| ④ 負の検査 | `rg -n --fixed-strings -- <語> src/blocks` を各語別に11回。追加で `src/previews` を2回 | 13コマンド全てexit 1 / 0件（一致なし）。対象語は下記 | 存在・禁止語の残存 |
| ⑤ 英語残存 | `rg -n --pcre2 '>[A-Z][a-z]+(?: [A-Za-z]+)*<' src/blocks` と `src/previews` | block: exit 1 / 0件。preview全体: exit 0 / 5件。今回対象blockのpreview: 0件。全行と裁定は下記 | 存在・残存の全件判定 |
| ⑥ ブラウザー | Playwright / headless Chromium / 1440×900、56route | exit 0、111.27秒、全56件HTTP 200、selector各1、lang ja、pageerror 0、console error 0、横overflow 0。10login/signup×2themeの390×844も20件横overflow 0 | 存在・実行・表示動作 |
| ⑦ 全件test | `node --test --test-concurrency=1 "scripts/*.test.mjs"` | exit 0、500件、pass 500 / fail 0 / skip 0、546.25秒 | 実行・単体動作 |
| ⑧ completeness | `node scripts/check-completeness.mjs` | exit 0、0.69秒、61component＋28block | 実行・配布経路の存在と来歴 |
| ⑨ evidence | `node scripts/check-evidence.mjs` | exit 0、757.18秒 | 実行・証跡と履歴の整合 |
| ⑩ check:all | `npm run check:all` | exit 0、3574.66秒 | 実行・7検査の通し実行 |
| ⑪ 実測範囲 | この表の最右列・各preview report | 存在／実行／表示・単体動作を分けて記載。フォーム送信、全メニュー・全props組合せは未検証 | 検証限界の明示 |

追加検査: `node scripts/check-block-icons.mjs` はexit 0、7.35秒、上流JSON 27件、IconPlaceholder 247箇所、lucide欠損0件、block 231/231・preview 4/4一致。`npm run registry:build` はexit 0、1.17秒。

型検査・CI: 実装・証跡・cycle logを含むHEAD `6db49d563668285d783e6a812bd66461ab251045` の [CI](https://github.com/elchika-inc/ui/actions/runs/34026862120) はSUCCESS。Typecheckは481ファイル・0 errors / 0 warnings、Unit testsは500 pass / 0 fail / 0 skip。Typecheck / Unit tests / Evidence check / Build site / Dist registry checkが全て実行されsuccess（skipなし）。ローカルtypecheckは司令塔がmainで実測したOOMのため再実行せず、このTypecheck成功を代替結果とした。最終の記録commit後のCI状態はPR本文で別途確認する。

検証時の基準HEAD: `6db49d563668285d783e6a812bd66461ab251045`。以後の変更は、この実測結果を残す記録ファイルの追加だけである。

証跡のadvisory（実際の標準出力、終了コードとは分離）:

```text
3 件の証跡が共有面の変更より古い:
  2026-08-05-index-page.md: src/previews
  2026-08-23-catalog-block-isolation/2026-08-23-block-iframe-isolation-catalog.md: registry.json, src/components/ui, src/previews
  過去履歴の shared stale: 91 件（形式・immutability は全件検査済み）
証跡形式 OK
```

### 負の検査と英語残存の全出力

blockの指定11語: `Acme` / `shadcn` / `m@example.com` / `John Doe` / `Evil Corp` / `from-primary/5` / `en-US` / `Login to your account` / `Playground` / `Total Revenue` / `In Process`。各1コマンド、全てexit 1・0件。previewの追加2語 `Acme` / `October 2024` も各exit 1・0件。`rg`のexit 1は一致なしであり、実行エラーのexit 2とは区別した。

blockの英語残存検査は出力なし（0件）。行ごとの判定対象も0件。preview全体の出力は以下の5行が全件であり、省略・抽出による除外はない。

```text
src/previews/toggle.tsx:47:        <h2 className="font-medium text-foreground">Variants</h2>
src/previews/toggle.tsx:58:        <h2 className="font-medium text-foreground">Sizes</h2>
src/previews/kbd.tsx:10:        <Kbd>Esc</Kbd>
src/previews/native-select.tsx:68:              <NativeSelectOption value="linux">Linux</NativeSelectOption>
src/previews/native-select.tsx:72:              <NativeSelectOption value="android">Android</NativeSelectOption>
```

| 残存箇所 | 判定 |
|---|---|
| toggle.tsx:47 `Variants` | 対象外componentの既存preview見出し。司令塔裁定により維持し次PR候補 |
| toggle.tsx:58 `Sizes` | 対象外componentの既存preview見出し。司令塔裁定により維持し次PR候補 |
| kbd.tsx:10 `Esc` | キー名。翻訳不要 |
| native-select.tsx:68 `Linux` | OSの固有名。翻訳不要 |
| native-select.tsx:72 `Android` | OSの固有名。翻訳不要 |

### 不具合の再現と修正の検証

日本語の見出しは既定localeによって並び順が異なった。SSRのNode既定localeはen-US。修正前、en-USブラウザーはSSRと同順でpageerror 0、ja-JPブラウザーは行順が変わりReact hydration error 418を1件検出した。

| 条件 | 行ID順 | pageerror |
|---|---|---:|
| 修正前SSR / en-USブラウザー | 4,8,9,7,12,6,11,2,1,3,5,10 | ブラウザー0 |
| 修正前ja-JPブラウザー | 7,12,6,4,10,11,9,8,5,1,2,3 | 1 |
| 修正後SSR / en-US・ja-JPブラウザー | 7,12,6,4,10,11,9,8,5,1,2,3 | 両方0 |

回帰testの負の対照は既定localeが異なることを先に確認し、修正前の行順不一致でexit 1。修正後 `node --test scripts/dashboard-blocks.test.mjs` はexit 0 / 19件pass・0件fail。ブラウザーで両localeとも初期12行、作業中フィルター4行、表紙検索1行、Drawer開閉を確認した。chartの18tickは全て月/日の数値表記になった。

売上カードの修正前は1440px時のカード右端574pxに対し、バッジ右端583.90625pxで約9.9px切れていた。DOMで原通貨表記に戻す対照ではバッジ右端563.921875pxで収まった。修正後は1440px時574 / 557px、390px時374 / 357pxで、両themeの全4カードについて金額・バッジがカード内に収まることを実測した。フォント24px、pageerror 0、文書横overflow 0。ページ全体のscrollWidth検査だけではoverflow-hidden内の切断を検出できないため、画像目視とカードの実座標で確認した。

カレンダー2件×2themeは月表示「9月」、曜日「日 月 火 水 木 金 土」、pageerror 0を実測した。最初の追加プローブはdropdownの先頭が月という検証側の仮定でexit 1になったが、日本語localeでは年→月の順になるため、月項目の存在を検証するようプローブを訂正してexit 0を確認した。製品コードをその誤検知に合わせて変更していない。

### ベースライン・実行経路の差

main `aaf7810` の基準は司令塔の事前実測（lint warning 200、standards適合、typecheckローカルOOM、既存499test）。本タスクの最初の全件testはexit 1 / 498pass・1failで、旧Acme表示を要求する1件を単独再実行して同じ失敗を確認した。承認された表示契約の同期後は対象18件がpass。その後、locale差の回帰testを追加して19件、全体500件になった。

AGENTS.mdのKey Commandsは `node --test "scripts/*.test.mjs"`。ローカルで既定の並列全件実行中にシェル・Orca・Chromeの応答が約8分停止する現象を2回観測し、1回をCtrl-Cでexit 130へ中断した。司令塔承認により最終実行に `--test-concurrency=1` を追加した。対象testは減らしていない。直列の中間実行も約543秒かかって499件passしたため、並列指定の変更が環境の遅延を解消したとは主張しない。中断した最初のbuildもexit 130として保持し、その後のbuild成功と区別した。

### 証跡文書の形式修正

最初の `check-evidence` はexit 1（404.92秒）で、任意追加した `lens-review.md` / `translations.md` の `verified_impl_sha` 欠落2件を検出した。検査は `.docs/reviews` 内の全Markdownを対象とし、初回commitのSHA欠落も後から検出するため、司令塔承認で証跡commit `503b3b0` のみをamendした。直前のremote headが `503b3b07bfc2a2d549e3a747eb06e2eb74d4d02a` であることを確認し、明示的な `--force-with-lease` で反映した。修正前後のdiffは2文書各2行の追加だけで、28preview report・56画像・実装commit・固定SHAは不変。最終reportとcycle logも固定SHAを初回から記録した。検査スクリプトの変更はない。形式不備を含む初回check:allは証跡段階でexit 130へ中断し、修正後に全7検査を最初から再実行した。修正後の再実行結果が表⑨⑩である。

## レビュー・証跡

INSPECTION_STATUS: コードレビューの全5レンズはflag 0。独立した実ブラウザー測定、負の対照、収束の対と完了ゲートは上記の実測状態を参照。

Orcaでfresh contextの読み取り専用レビュアー1名を作成し、Security / Core Logic / Tests / Domain / Fresh Eyesを順に適用した。3ラウンドと、司令塔承認のラウンド3対象差分再確認。各回flag 0。optionalはラウンド1の2件（組版・時刻表記の好み）とラウンド3追補の1件（対象外preview残存の記録）のみ。独立検証で検出したhydration不一致・バッジ切断は修正済み。受容したflagは0件、ACCEPTED_RISKSおよびrisk-registryへの追加IDはなし。

詳細は [lens-review.md](lens-review.md) と [サイクル記録](../cycles/2026-09-06-block-copy.md)、各blockの `2026-09-06-<name>-preview.md` と同名light / dark画像、実測JSONに記録した。撮影は `npm run build:site` の成果物を `npx astro preview --host 127.0.0.1 --port 4394` で配信し、Playwrightのheadless Chromium（Chrome 152.0.7977.76、1440×900、deviceScaleFactor 1、locale ja-JP）で実施。全56画像のJPEG magic bytesと実寸1440×900を別途検査した。

実装担当: Codex（GPT-6）、worker `term_e80d9d65-233f-418d-ac19-b8889f88ef2e`。レビュアー: Claude Code 2.1.263 / Sonnet 5 / high、`term_27b1feeb-bdc8-4f0e-8da8-b7fa323003b3`。

## 残る課題・未実施

- ローカル全件検証中の長時間応答停止は環境側の課題。AGENTS.mdのKey Commandsを変えるかは別途human判断。
- 対象外toggle previewの `Variants` / `Sizes` は次PR候補。
- mainへのマージ・デプロイ・ruleset変更は未実施。PRのマージはhuman承認に委ねる。


## 終了前の確認

- 差分は承認されたblock・preview・test・来歴ハッシュ・新規作業文書に限定。共有component・styles・pages・site・registry.json・package.json・package-lock.jsonに差分なし。
- 28preview reportと56画像はamend前後で同一。来歴76ファイルを独立SHA-256で照合。
- レビュアーの全報告を保存してからOrcaの対象terminalだけを終了した。今回のAstro previewサーバーも停止した。main sessionのterminalとworktreeは維持する。
- stashなし。Brain / Action Queue / memoryへの書込なし。共有状態の整理はworkerの対象外。残る課題はPRに記録済みで、別の連絡経路へ重複起票していない。
- 検証コマンドの実測一覧は [validation-results.json](validation-results.json)、amend差分は [amend-audit.json](amend-audit.json)、CIの基準HEAD結果は [ci-6db49d5.json](ci-6db49d5.json) に保存した。最終記録commit後のCIはPR本文を参照する。
