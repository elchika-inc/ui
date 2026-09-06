verified_impl_sha: 8ee663e67d9e8d3380fc3ed32fe1a7f9703c8e07

# 幾何レイヤー移行の最終ローカル検証と Round 2

本記録の追加前のHEADでローカルゲートを実行した。CIは本記録を含むPRの最終HEADで別途実行し、その結果をPR本文へ記録する。全件テストの最終ローカル実行はcontrast同期後・provenance同期前であり、その後の生成メタデータ同期は独立ハッシュ照合とcompleteness / check:allで検証した。

## 変更概要

Tailwind の theme layer が正本の幾何トークンを上書きしていたため、値を `--rounding-*` / `--elevation-*` へ置き、`@theme inline` から radius / shadow を接続しました。Button / Input の既定高さは36px・角丸8pxとなり、Dialog は角丸12pxと正本のモーダル影を使用します。

- weight を400 / 500 / 600、既定 motion を120msと `--ease-standard` に接続し、指定15 UIファイルと6 blockのclassを置換しました。
- tokens は正本から再生成し、registryも生成コマンドで同期しました（90 itemのlight / darkから旧 `--radius` を除去、180行）。
- 共有28枚に加え、変更21件の個別reportと42枚を追加しました。仕様と司令塔裁定は [.docs/plans/2026-09-06-geometry-layer.md](../plans/2026-09-06-geometry-layer.md)、共有実測は [report](2026-09-06-geometry-layer/report.md) に記録しました。

## 検証

ローカル環境: macOS / Node.js v24.20.0 / npm。シグネチャ・型・export・propsの変更はなく、検証の測定段階を「存在」「実行」「動作」に分けます。

| 仕様 | コマンド・対象 | exit | 実測値・範囲 |
|---|---|---:|---|
| 4.1 | `node src/styles/design-system/build-tokens.mjs --check` | 0 | Round 2後の再実行、197 tokens、light/dark各30 contrast pairs、未公開token警告29件（実行） |
| 4.2 | `npm run lint` | 0 | Round 2後の再実行、486 files、既存200 warnings / 3 infos（実行） |
| 4.3 | `node scripts/check-standards.mjs` | 0 | Round 2後の再実行、248 files（実行） |
| 4.4 | `npm run build:site` | 0 | 最終再実行、271ページ（実行） |
| 4.5 | Playwright、headless Chromium、1440×900 | 成功 | Button:36px / 8px / 0.12s、Dialog:12pxとlight/darkの期待shadow（動作） |
| 4.6 | `node --test "scripts/*.test.mjs"` | 0 / 0 | 初回・Round 1後・Round 2後とも499 pass / 0 fail、最終0 skip / 0 cancelled、単独再実行不要、単独でも残る失敗0件（実行） |
| 4.7 | `npm run check:all` | 0 | 7検査完走、実利用配色 OK / 全89件の経路 / 配布物 OK / preview selector 宣言 OK / 証跡形式 OK（実行） |
| 4.8 | 各負の検査 | 1 | 下記8語すべて0件。不在を示すexit 1であり実行エラーではない（存在） |
| 4.9 | `node scripts/check-evidence.mjs` | 0 | 「証跡形式 OK」、共有面stale通知3件（過去履歴91件）、形式・immutabilityは全件検査（実行） |
| 4.10 | 証跡 | 成功 | 共有28枚＋個別42枚、JPEG magic / 寸法 / selector / pageerror / 横overflowを実測、目視確認 |

`check:all` はstandards / tokens / contrast / completeness / distribution / preview-render / evidenceの7検査であり、typecheckは含みません。ローカルtypecheckは司令塔提示の既知OOMを踏まえ今回再実行せず、PR CIの実行結果で代替します。CI状態: PR作成後に実測結果を追記。

生成CSS: `dist/_astro/global.DHjz_95G.css`。各grepは独立実行し、件数は一致行数（minify済み1行CSS）です。

| grepの条件 | exit | 件数 |
|---|---:|---:|
| `grep -c -- '--radius:.625rem'` | 1 | 0 |
| `grep -c 'rounded-lg{border-radius:var(--rounding-lg)}'` | 0 | 1 |
| `grep -c 'shadow-xs{'` | 0 | 1 |
| `grep -c '\.font-bold{'` | 1 | 0 |
| `grep -c 'h-control-md{height:var(--control-height-md)}'` | 0 | 1 |
| `grep -c 'transition-duration:var(--duration-fast)'` | 0 | 1 |

`grep -o 'shadow-xs{[^}]*}'` はexit 0で `shadow-xs{--tw-shadow:var(--elevation-xs);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}` を確認しました。

負の検査は各語について `rg -n --fixed-strings -- '<語>' src/components src/blocks src/site src/previews src/pages src/styles/global.css` を独立実行しました。語は `ring-foreground/10` / `font-bold` / `rounded-4xl` / `rounded-2xl` / `rounded-3xl` / `shadow-xl` / `shadow-2xl` / `--radius: 0.625rem`。すべてexit 1・0件です。

追加確認: `npm run registry:build` / `npm run registry:legal` / `node scripts/check-distribution.mjs` はexit 0。配布CSS・tokens・brands・法務ファイルの実体を照合しました。

初回の `build:site` は `ERR_MODULE_NOT_FOUND`（dist/.prerender/chunks）でexit 1となりましたが、全件テスト終了後の単独再実行と最終再実行はexit 0です。初回のdistributionは未生成registryによりexit 1で、生成後にexit 0を確認しました。初回のevidenceは共有28枚だけではcomponent固有staleとレビュー文書のSHA不足を解消できずexit 1となり、司令塔承認の補正・個別証跡追加後に再検証しました。

## computed style と裁定事項

- Button: `height:36px`、`border-radius:8px`、`transition-duration:0.12s`。
- Dialog: `border-radius:12px`、lightの末尾shadowは `rgba(26, 28, 33, 0.1) 0px 12px 32px 0px`、darkは `rgba(0, 0, 0, 0.55) 0px 12px 32px 0px`。先行4層は完全透明かつゼロ寸法で、司令塔裁定の合否条件を満たします。生文字列は共有reportに保存しました。
- Dialog / AlertDialog の `shadow-lg` 追加は、正本のモーダルelevationと実体の不一致に対する司令塔承認によります。
- 正本HTMLの説明文にある `font-bold` 1件はclassではなく、司令塔裁定により維持し負の検査対象から除外しました。
- catalog / disabled-controlsの4画像はfullPage撮影の下部繰返し・白紙を確認したため、司令塔承認の下、1画像31枚のviewport PNGを実scrollYへ無加工で貼り付けJPEG化しました。各画像1440×27302、DOM高さと一致、未撮影領域なし、最下部Toggle / Toggle Group / Tooltipを確認、fixed / stickyの位置をreportに記録しました。
- 最初の証跡commitは未push時にレビュー記録2件の `verified_impl_sha` 追加のみamendしました（`25b528c`）。共有28画像とreportのSHA-256は不変です。個別21件・42画像は別commitで新規追加しました。
- 裁量は入力／triggerの特定、接続先コメント、report表現に使用しました。Comboboxの `*:data-[slot=input-group]:h-8` を対象とし、chipsの `min-h-8` は維持しました。

## contrast consumer contract の同期

`check:all` の初回は削除済み `ring-foreground/10` を要求する固定契約によりcontrast段階でexit 1でした。司令塔承認の下、Cardを背景card、AlertDialog / Dialog / Combobox / Menubarを背景popoverに分け、前景をalphaなしのborderへ同期しました。gateはdecorativeのまま、閾値・他case・check-standards・CIは変更していません。

`REQUIRED_CONSUMER_CONTRACT_DIGEST` の更新はring → borderの意図的な契約変更に対応するものです。

- 旧: `2a6ff5ba437dfdda4b81d5f6fe177c79dc734dcbc22b693886b185a81bfca788`
- 新: `d5435643e7ee0c4baac2f86a7c585fc905d0372bcbf6f41341fee3932c222c19`

`node scripts/contrast.mjs` はexit 0、62 PASS、「実利用配色 OK」。`node --test scripts/contrast.test.mjs` はexit 0、18 pass / 0 failで、各caseの削除やgate・theme・paint・source classの改変を拒否する既存テストも通過しました。

| case | light | dark | gate |
|---|---:|---:|---|
| border on card | 1.3226 | 1.5151 | decorative |
| border on popover | 1.3226 | 1.5151 | decorative |

## block 来歴の同期

`check:all` の2回目はcontrastを通過後、font-boldの置換による6 blockの生成内容ハッシュ不一致でcompletenessがexit 1でした。司令塔承認と既存手順に従い、`node scripts/add-component.mjs <name> --resync` を login-02 / login-04 / login-05 / signup-02 / signup-04 / signup-05 へ順次実行し、すべてexit 0でした。

`--modified` / `--force` は付けず、provenance.jsonの差分が6件の `generatedContentSha256` のみであることをJSON比較で確認しました。実ファイルの `shasum -a 256` との独立照合も6/6一致しました。`node scripts/check-completeness.mjs` はexit 0、「61 件のコンポーネントと 28 件の block が全経路に載っている」を確認しました。この生成メタデータ同期は承認された裁量変更として申告します。

## レビュー

2ラウンド、同じread-onlyレビュアーがFresh Eyes / Security / Core Logic / Tests / Domainを順に実施しました。Round 1は各ロールflag 0、Tests optional 1件（raw shadowと裁定した合否条件の記録）は共有reportへ反映しました。Round 2はcontrastの追加差分をレビューし、全5ロールflag 0・optional 0でした。受容したflagはなく、ACCEPTED_RISKSおよびrisk-registryの追加IDはありません。

[Round 1詳細](2026-09-06-geometry-layer-cycle.md) / [最終検証・Round 2詳細](2026-09-06-geometry-layer-validation.md) / [Round 1 cycle log](cycles/2026-09-06-geometry-layer.md) / [Round 2追補](cycles/2026-09-06-geometry-layer-round-2.md)。レビュー後の収束の対として4.1〜4.3および4.6を再実行し、すべてexit 0でした。検査を複雑化する実装修正・gateの緩和は行っていません。司令塔承認の下で削除済みringのconsumer契約をborderへ同期しました。

実装担当: Codex / GPT-6。レビュアー: Claude Code / Sonnet（`--model sonnet`）。Orcaのnested dispatch深度制限を確認し、設定変更はせず、司令塔承認の直接terminal send / wait / readで同一のread-only reviewerに各ロールを順次適用しました。

マージはhuman承認待ちです。履歴上の検証SHAを保持するためmerge commitを使用します。

関連: [issue #52](https://github.com/elchika-inc/ui/issues/52)


## Round 2 findings 原文

前回の記録は不変のため、本ファイルへ追補する。以下は端末出力の各レンズ本文を保存したもので、端末の折返しを含む。

### fresh-eyes

```text
LGTM
ringForegroundSources(card含む5要素)をpopoverBorderSources(alert-dialog/combobox/dialog/menubar)へ改名・限定し、cardは単独[source("card",["bor
der-border"])]に分離した構成は、実装がborder-borderへ置換済みの5コンポーネントと1対1で対応し、REQUIRED_CONSUMER_CASE_LABELSも同じ位置で2ラベル
に更新されている。
```

### security

```text
LGTM
変更はcontrast検査スクリプト内の静的ケース定義（背景・前景トークン名の文字列）とdigest定数の更新に限られ、外部入力の処理・ファイルI/Oパス・正
規表現の変更を伴わないため、セキュリティ上の懸念点はない。
```

### core-logic

```text
LGTM
card.tsxはbg-card+border-border、alert-dialog.tsx/dialog.tsx/combobox.tsx/menubar.tsx（MenubarContent・MenubarSubContentとも）はbg-popover+bor
der-borderであることを実ファイルで確認し、新設した2case（border on cardbackground:"card"、border on
popoverbackground:"popover"）の背景トークン指定と一致する。gateは両case共decorativeのまま据え置かれ、閾値・他caseの変更はない。
```

### tests

```text
LGTM
contrast.test.mjsはCONSUMER_CASESをラベル非依存で走査する設計（全件除去・全項目改変を汎用的に検査するテストのみ）であり、旧ラベルforeground
/10 container ringやringForegroundSourcesへのハードコード参照は存在しないため、ケース分割によるテスト側の追随漏れはない。
```

### domain

```text
LGTM
REQUIRED_CONSUMER_CASE_LABELS（32件）とCONSUMER_CASESの全ラベル（32件）が過不足なく一致し、REQUIRED_CONSUMER_CONTRACT_DIGESTも64桁hexとして整
形が正しいことを確認した。ハッシュ値自体の再計算による正当性検証は実行禁止のため範囲外とし、背景で述べられた司令塔承認・既存18 contrast tests
exit0の実測に委ねる。
```

## 来歴ハッシュの独立照合

各実体へ `shasum -a 256 <path>` を実行し、以下の値と provenance の値が6/6一致した。

| block | SHA-256 |
|---|---|
| login-02 | `060b8ae46571abf92cd06ff83d9ac2a1f1fc96ed44a161970c58882678a5257c` |
| login-04 | `5ac94af697ad9b63e9a058df87cfab603c73afbb8e855780154b4ccf49a4b452` |
| login-05 | `db6a3e087c788d2acc5ee113ae325204c9cf1598923a851f2625d38d26895b6b` |
| signup-02 | `a37d9d0ffbdd4705a7b21b8d60343761e04cef84bd5b2ebd7354b19561f45f3f` |
| signup-04 | `cdf00785a2ed7f26d1bc58c776d9980eaa7cd27ead4a16609164edce4412cabc` |
| signup-05 | `3ae8adf0c9eef2c67105a8e03b47356faa444a89f699f20fa3758b357831965f` |

## check:all の完走ログ抜粋

```text
[check:all] standards
standards 適合（248 ファイルを検査）
[check:all] design tokens
[check:all] contrast
実利用配色 OK
[check:all] completeness
61 件のコンポーネントと 28 件の block が全経路に載っている
[check:all] distribution
配布物 OK（alias CSS / design-system token / design-system brands / LICENSE / THIRD_PARTY_LICENSES が原本と一致）
[check:all] preview render
preview selector 宣言 OK
[check:all] evidence
  過去履歴の shared stale: 91 件（形式・immutability は全件検査済み）
証跡形式 OK
```
