verified_impl_sha: ec2d883a0940f17d9b82aed14e022578de305871

<!-- review-cycle:start 2026-09-15-overlay-motion-c -->
## 2026-09-16 overlay 開閉モーション統一 PR C

- **Cycle ID**: 2026-09-15-overlay-motion-c
- **対象 HEAD**: `d597cb26ab7cf4c8d1c46710a475973d86e6ca12`（PR D の main 追随後。再レビュー入力の実装 SHA は `ec2d883a0940f17d9b82aed14e022578de305871`）
- **総ラウンド数**: 2（上限3）
- **終了理由**: 全員 LGTM。指摘を修正した後のクリーンラウンド1回を通過した。
- **レンズ別 flag 件数（全ラウンドの延べ数）**: Security 0 / Core Logic 1 / Tests 1 / Domain 1 / Fresh Eyes 0 / Ambiguity - / Altitude -
- **確定した偽陽性**: なし
- **ACCEPTED_RISKS**: なし
- **INSPECTION_STATUS**: flag 0 / optional は原文を末尾に保存 / 検証は §4.1〜4 と72テスト、6部品×2テーマの実測を実施

### 手順と入力の範囲

司令塔の既定裁定に従い、`orca orchestration worker-start` の `consumer_fenced` を回避する承認済み代替を使用した。各レンズを次の CLI で fresh context / read-only に起動し、Fresh Eyes → Security → Core Logic → Tests → Domain の順で直列に実行した。

```sh
claude -p --model sonnet --tools Read,Glob,Grep --strict-mcp-config --safe-mode --permission-mode dontAsk --no-session-persistence
```

入力は `git diff origin/main`、担当6部品全文、spec §2 / §C / §4 およびその追加裁定。作業ディレクトリは一時領域とし、書込ツール・MCPを与えていない。Fresh Eyes は修正履歴を参照する前に現状から指摘するよう指示した。`.ts-review-graph` は存在しないためグラフ経由の絞り込みは行っていない。担当外の全文・既存証跡をレビュー入力へ足していない。

### ラウンド別の結果

| ラウンド | 実装 SHA | Fresh Eyes | Security | Core Logic | Tests | Domain |
|---|---|---:|---:|---:|---:|---:|
| 1 | `ea8585ffb7687a1fb5c9d5c952d4727c25d305c3` | 0 | 0 | 1 | 1 | 1 |
| 2 | `ec2d883a0940f17d9b82aed14e022578de305871` | 0 | 0 | 0 | 0 | 0 |

ラウンド1の3件は、すべて同じ Select の align-trigger 分岐を指摘したもの。指摘の延べ数は3、固有の不具合は1として区別した。Core Logic / Tests の確信度は85%、Domainは80%。

### 指摘と処置

`data-[align-trigger=true]:animate-none` が transition には効かず、整列時に scale が変化する問題を採用した。司令塔の `msg_ae75134f7a15` に従い、このクラスを削除して `data-[align-trigger=true]:data-starting-style:scale-100` / `data-[align-trigger=true]:data-ending-style:scale-100` を追加した（`ec2d883a0940f17d9b82aed14e022578de305871`）。整列時は opacity のみ変化し、非整列時は共通テンプレの scale を使う。

レビューの `transition-none` 案は、仕様の open 0.26s / close 0.12s の transition を失うため、司令塔が変形して採用した。指摘の偽陽性扱い・受容による打切りではない。light / dark とも starting / ending の scale=1、ending 9標本、close 0.12s を実測し、ラウンド2の全5レンズで再確認した。

実ブラウザ調査により context-menu が通常 open で `data-instant="click"`、Escape closeで `dismiss` を出すことを発見した。司令塔裁定どおり同部品だけ `data-instant:transition-none` を外し（`e96877991e70d4917e0860512ead9884ea9eb192`）、open と close の transition を確認した。ラウンド2はこの変更も含む。navigation-menu と Select の追加裁定の詳細は PR 本文へ記録する。

### 起動・出力の実測

ラウンド1の起動回数は Fresh Eyes 2、Security 1、Core Logic 1、Tests 2、Domain 1。全 CLI の終了コードは0。Fresh Eyes はブロック外の前置きを全文一致パーサーが拒否したため再試行し、第2応答の有効な単一ブロックを無変更で回収した。Tests は第1応答の説明中に現れた文字列 `[ISSUE]` をパーサーが指摘見出しと誤認したため再試行し、第2応答で実際に出た Select の flag を採用した。起動失敗や無効出力を LGTM として数えていない。ラウンド2では行頭の指摘見出しだけを数え、有効な単一ブロックを抽出するよう検証側を修正した。

| ラウンド2 レンズ | 起動回数 | CLI exit | 所要秒 |
|---|---:|---:|---:|
| fresh-eyes | 1 | 0 | 288.313 |
| security | 1 | 0 | 185.291 |
| core-logic | 1 | 0 | 445.080 |
| tests | 1 | 0 | 259.414 |
| domain | 1 | 0 | 255.840 |

### 収束の対と base 追随

再レビュー終了後に §4.1〜4 を再実行した。`check-standards` は exit 0、`motion-literal` / `motion-literal-allowlist-stale` とも0件。6部品×3検索式は18コマンドすべて件数0 / exit 1。`npm run lint` は exit 0、`npm run build:site` は exit 0。生成 CSS の duration-slow / ease-entrance はそれぞれ1件以上、data-starting-style は1以上を確認した。コマンド個別の出力は PR 本文に記録する。全件テスト・typecheck・check:all は司令塔裁定に従い PR CI へ委ねた。

PR A、続いて PR D の main を merge commit で取り込んだ。rebase は使用していない。allowlist は両方の削除を採った。最後の追随で担当6部品・global.css・tokens.css に変更がないことを `git diff --exit-code ec2d883a -- <対象8ファイル>` の exit 0 で確認した。実装 SHA と証跡の固定値を保持した。

### 全レンズの原文（optional を含む）

以下は各 round の有効な findings 本文を再解釈せず保存したもの。原文中の提案は、上記の処置と最終裁定を経た記録である。

#### ラウンド1 / fresh-eyes

LGTM

根拠:
- navigation-menu.tsx の Content: data-motion 系(from-end/from-start/to-end/to-start)・animate-in/out・fade-in/out・slide-in-from-*-52 が全削除され、activation-direction=left/right の starting/ending translate（左右反転を含む）が裁定通り実装されている。up/down は扱われておらず、これも裁定と一致。
- Content の group-data-[viewport=false] の duration-300→duration-slow 写像、ending duration-fast 追加、Popup の scale-90 保持、duration-300→slow・ease-out→entrance、ending duration-150→duration-fast、Positioner の duration-300→slow・ease-out→entrance かつ data-instant:transition-none 保持、Chevron の duration-300→slow は、すべて司令塔裁定の該当項目と一致している。
- Indicator は data-[state=hidden]:animate-out/fade-out と data-[state=visible]:animate-in/fade-in の4クラス削除のみで代替追加なし、常時レンダリングも維持されており、裁定の最終裁定と一致。
- dropdown-menu / context-menu / menubar（Content・SubContent 両方）/ select / combobox の Popup は、§2.1 テンプレ（transition-[opacity,scale] duration-slow ease-entrance、starting/ending の opacity-0・scale-(--motion-scale-md/sm)、ending duration-fast、data-instant:transition-none）と一致し、既存の origin-(--transform-origin) も残されている。テンプレ対象外の data-closed:overflow-hidden（dropdown-menu）、data-[align-trigger=true]:animate-none（select）、data-[chips=true]:...（combobox）は §2.1 の削除対象クラス一覧に含まれず、残置は妥当。
- check-standards.mjs の allowlist は担当6ファイル分の行のみが削除されており、他 path の行（alert-dialog.tsx、dialog.tsx、drawer.tsx 等）は変更されていない。
- 担当外ファイル（global.css、tokens.css、registry.json、package.json 等）は diff に含まれておらず、§2.3 の制約に抵触しない。
- 過剰実装（自前実装への降格）は見当たらない。すべて Tailwind クラスと Base UI の data-* 属性・CSS変数の組み合わせで完結しており、side offset や duration/scale/curve の固定設計を変更する提案も含まれていない。

optional（改善提案、flag外）:
- select.tsx の `data-[align-trigger=true]:animate-none` は、旧実装では tw-animate-css の animation を打ち消す目的だったと推測されるが、Popup の開閉が transition ベースに変わったため実質的に何も打ち消していない可能性がある。これは §C・§2.1 のいずれにも明記がなく確信度は80%未満のため flag にはしないが、次ラウンドで意図（align-trigger 時に開くモーションを抑止したいのか）を確認する価値がある。仮に `transition-none` への置き換えや削除を行う場合はテンプレ外の挙動変更にあたるため、設計変更として明示すべき。
- navigation-menu.tsx の Content で viewport=false 時に `group-data-[viewport=false]/navigation-menu:duration-slow` と `data-ending-style:duration-fast` がともに transition-duration を指定しており、Tailwind の生成順序次第でどちらが勝つか diff だけでは判定できない（確信度80%未満）。実測（Playwright での computed style 確認）で viewport=false 経路の ending duration が意図通り fast になっているかを見ておくと安心。

#### ラウンド1 / security

LGTM
根拠:
1. 権限と変更範囲: 差分は scripts/check-standards.mjs の MOTION_LITERAL_ALLOWLIST から §C 担当6ファイル（combobox / context-menu / dropdown-menu / menubar / select / navigation-menu）に対応する行を削除しただけで、正規表現・判定ロジックには一切手を加えていない。削除方向のみのため既存のratchet（motion-literal / motion-literal-allowlist-stale 検査）はむしろ厳格化される側であり、他ファイル（alert-dialog / drawer / input-otp / item / message-scroller / sheet / sidebar）の行は変更されていない。§2.2・§2.3の「他のpathの行は触らない」「正規表現・判定ロジックは触らない」に整合する。
2. 注入・依存面: 6ファイルとも import 文に変更はなく、新規パッケージ・新規 render props・dangerouslySetInnerHTML・className へのテンプレート補間は導入されていない。className は既存の cn(static, className) によるマージのみで、動的な外部入力（ユーザー入力やURL等）を混入する経路は無い。data-[activation-direction=…] 等はいずれも Base UI が付与する固定の enum 値であり、任意文字列を CSS セレクタや属性値に埋め込む箇所はない。
3. 情報漏洩: ポップアップの表示内容やロジックには変更がなく、console出力・データ露出・ログ追加等は無い。
4. 変更範囲の逸脱なし: git diff で変更されたファイルは §C 担当6ファイル + check-standards.mjs のみで、global.css / tokens.css / design-tokens.html / registry.json / package.json / provenance.json / 担当外部品 / previews / pages / site / .docs/reviews のいずれも変更されていない（§2.3準拠）。
5. navigation-menu の司令塔裁定（Content の旧 slide-in/animate-in-out/fade-in-out 削除、Indicator の4クラス削除・代替なし、Popup/Positioner/Chevron の duration・easing写像、group viewport=false の duration-slow写像）は diff上すべて反映されており、権限やセキュリティ境界に影響する変更（表示/非表示の条件分岐やアクセス制御）は含まれていない。残存する scale-90（Popup）や data-[align-trigger=true]:animate-none（select）は §4 の否定正規表現（animate-in|animate-out|…、duration-\d+、ease-(in|out|in-out)）に抵触しない語であり、security上の懸念はない。

#### ラウンド1 / core-logic

flag 1件

[ISSUE] src/components/ui/select.tsx:88
確信度: 85%
問題: `data-[align-trigger=true]:animate-none` が、モーション機構が transition ベースへ移行したことで無効化され、`alignItemWithTrigger`（既定値 `true`）時に本来抑制されるはずだった開閉モーションが実際には発火するようになっている。
根拠: `SelectContent` は `alignItemWithTrigger = true` を既定値とし（select.tsx:74付近）、`data-align-trigger={alignItemWithTrigger}`（select.tsx:86）を出力する。旧実装ではこの `animate-none` が `data-open:animate-in`/`fade-in-0`/`zoom-in-95` 系（`animation` プロパティに基づく tw-animate-css のキーフレーム）を無効化し、align-trigger モード（ポップアップがトリガーに重なり、選択項目をトリガー位置に合わせてスクロール調整する動作）ではモーション無しで開閉していた。今回の置き換えで導入した `transition-[opacity,scale]` は `transition` プロパティであり、`animate-none` は `animation` プロパティのみを打ち消すため、この抑制条件は文字列としては残っているが機能的には無効になっている。結果として既定の align-trigger 経路でも scale/opacity のトランジションが走り、トリガーとポップアップの位置整合を前提にした挙動が変わる。§C の select 行は「同上」としか指定しておらず、司令塔裁定にもこの分岐への言及は無いため、この変更は意図された仕様変更ではなく副作用と判断した。§4.5 の `getComputedStyle` 実測（`transition-duration`/`transition-timing-function` の一致確認）はこの分岐差を検出できない。
修正案: `data-[align-trigger=true]:animate-none` を `data-[align-trigger=true]:transition-none`（本テンプレートの `data-instant:transition-none` と同形）に置き換え、align-trigger モードでモーション無しという既存の開閉条件を維持する。これは duration/scale/curve や side offset の設計変更ではなく、既存条件の実効性を回復する修正。

#### ラウンド1 / tests

flag 1件

[ISSUE] src/components/ui/select.tsx:88（`data-slot="select-content"` の className 文字列内、`data-[align-trigger=true]:animate-none`）
確信度: 85%
問題: `alignItemWithTrigger`（既定値 `true`）時に開閉モーションを無効化する目的で残された `data-[align-trigger=true]:animate-none` が、transition ベースの新実装では効果を持たない死んだクラスになっている。`animate-none` は `animation: none` を設定するのみで、新テンプレの `transition-[opacity,scale]` には一切作用しないため、旧実装で意図されていた「trigger と位置合わせする場合はモーション無し」という分岐が消え、既定状態（`alignItemWithTrigger=true`）でも scale/opacity の open/close transition が常に発生するよう挙動が変わっている。
根拠: origin/main では `duration-100 data-[align-trigger=true]:animate-none ... data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out ...` の構成で、`animate-none` が tw-animate-css の `animate-in/animate-out` を実際に打ち消していた（アニメーションプロパティを共有するため機能した）。新実装は `transition-[opacity,scale] duration-slow ease-entrance data-starting-style:... data-ending-style:...` に置き換わっており、`animate-none` はこの transition 群と無関係のプロパティにしか作用しない。§C の該当行は「同上（popover と同じ置き換え）」としか書かれておらず、司令塔裁定にもこの分岐への言及は無いため、spec からは意図的な廃止か見落としかを判別できない。加えて §4.2 の検索式1（`animate-in|animate-out|fade-in-0|...`）は `animate-none` を含まないため負の検査をすり抜け、§4.5 の実測も既定状態（`alignItemWithTrigger=true`）に対して `duration-slow`/`ease-entrance` を測るだけなので、この分岐消失自体は測定で表面化しない（「測定で見落としうる条件」に該当）。
修正案: 旧来の「align-trigger 時はモーション無し」を維持する意図なら `data-[align-trigger=true]:animate-none` を `data-[align-trigger=true]:transition-none` に置き換える。意図的に当該分岐を廃止するのであれば、無意味になった `data-[align-trigger=true]:animate-none` を削除する。どちらを取るかは spec/司令塔の確認事項であり、本レビューでは設計判断を代行しない。

optional:
- `menubar.tsx` の `MenubarContent` / `MenubarSubContent` は基底の `DropdownMenuContent` が既に保持するテンプレ全文（`transition-[opacity,scale] duration-slow ease-entrance ...`）を className で同値のまま再指定しており冗長（動作影響なし）。
- §4.2 の負の検査式1は `slide-out-to-*`、`-0`/`-95` サフィックス無しの `fade-in`/`fade-out`/`zoom-in`/`zoom-out` を含まない。担当6ファイル全文を確認した限り残存語は無いため今回の実装の欠陥ではないが、rubric 側の網羅漏れとして記録の価値あり。
- `navigation-menu.tsx` の `group-data-[viewport=false]/navigation-menu:*` 群は、この `NavigationMenu` 実装が `data-viewport` 属性自体を出力しないため到達不能に見える（司令塔裁定で「保持」と明示済みのため変更提案はしない）。

#### ラウンド1 / domain

flag 1件

[ISSUE] select.tsx:88（`data-[align-trigger=true]:animate-none`）
- 確信度: 80%
- 問題: `animate-none` は `animation: none` を設定するユーティリティであり、本PRで導入された `transition-[opacity,scale]` ベースの開閉モーションには一切効果がない。旧実装（tw-animate-css の `data-open:animate-in` 等）では `data-[align-trigger=true]:animate-none` が「alignItemWithTrigger 既定時（trueのとき）は開閉モーションを止める」という状態属性との接続を担っていたが、今回 animation ベースから transition ベースへ移行したことでその接続が切れ、死んだクラスとして残っている。結果として select は既定（alignItemWithTrigger=true）でも常に scale/opacity の transition が発生するようになり、align-trigger 時にモーションを止めるという既存の意図された挙動が silently 失われている。
- 根拠: spec §2.1 は「tw-animate-css 由来の class …をすべて取り除き、代わりに次を足す」としているが、`animate-none` は tw-animate-css 由来の開閉演出クラス一覧（`data-open:animate-in` 等）には含まれておらず削除対象と明記されていない一方、司令塔裁定にも select の align-trigger 挙動について特別な言及がない。したがって「削除も写像もされないまま実質無効化された state 接続」が放置された状態であり、correctness（意図した状態属性⇄transitionの接続の欠落）に該当する。
- 修正案: 設計判断として司令塔に確認の上、(a) 既存挙動を維持するなら `data-[align-trigger=true]:animate-none` を `data-[align-trigger=true]:transition-none` に置き換える、または (b) align-trigger時もモーションさせる挙動変更を意図するなら当該クラスを削除しその挙動変更を明示的に裁定として承認する。現状はどちらの解決にもなっていない。


#### ラウンド2 / fresh-eyes

LGTM
根拠:
1. §2.1テンプレ整合: dropdown-menu / context-menu / menubar(Content・SubContent 2箇所) / select / combobox の各Popupで `transition-[opacity,scale] duration-slow ease-entrance` + `data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md)` + `data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast` が適用され、旧 `animate-in/out`・`fade-in/out-0`・`zoom-in/out-95`・`slide-in-from-*`・`data-open`系・数値`duration-`・既定`ease-`が全て除去されている。`origin-(--transform-origin)` は保持、`motion-safe:` は未追加で§2.1条件どおり。
2. data-instant:transition-none の扱いが追加裁定と一致: context-menu.tsx（ContextMenuContent、SubContentも同関数経由）にのみ同クラスが無く「1個だけ外す」裁定と整合。dropdown-menu / menubar(2箇所) / select / combobox は残存しており「他4部品は通常openで属性が無ければ残す」の裁定に沿う（実測確定はworker証跡側の責務）。
3. select.tsx: `data-[align-trigger=true]:animate-none` を削除し、代わりに `data-[align-trigger=true]:data-starting-style:scale-100 data-[align-trigger=true]:data-ending-style:scale-100` を追加。msg_ae75134f7a15の裁定（aligned=trueはopacityのみ変化、falseは共通scaleも変化、duration/curveは共通のまま）と一致。
4. navigation-menu.tsx: Trigger/Positioner/Popupは `duration-300→duration-slow`、`ease-out→ease-entrance`、Popupの`duration-150→duration-fast`かつ`scale-90`保持、Positionerの`data-instant:transition-none`保持——司令塔裁定と完全一致。Contentは`data-[motion^=from-/to-]`系・`slide-in-from-*-52`・`animate-in/out`・`fade-in/out`・`data-open系animate/fade/zoom`（viewport=false込み）をすべて削除し、`group-data-[viewport=false]…:duration-300→duration-slow`の写像は保持、`data-ending-style:duration-fast`を追加、`data-[activation-direction=left]`は starting 負/ending 正、`right`はstarting正/ending負の符号でActivation-direction別translateに置換されている（up/downは扱わず裁定どおり）。Indicatorは`data-[state=hidden]:animate-out/fade-out`と`data-[state=visible]:animate-in/fade-in`の4クラス削除のみで代替追加なし——司令塔の最終裁定と一致。
5. §4-2の3正規表現（animate-in等／数値duration・delay／既定ease）を担当6ファイル全文に適用した限り、いずれも0件（`ease-entrance`は`\bease-(in|out|in-out)\b`に非該当）。
6. allowlist: `check-standards.mjs`からdropdown-menu / context-menu / menubar / navigation-menu / select / comboboxの6行が削除されており、他pathの行・判定ロジックは無変更。diffの変更ファイルは担当6部品 + check-standards.mjsのみで§2.3の禁止対象（global.css、registry.json等）に非接触。
過剰実装に該当する自前実装（プラットフォーム/標準/既存ライブラリで足りるのに独自実装した箇所）は見当たらない。duration/scale/curve・side offset撤去といった設計固定事項への変更提案は無し。

#### ラウンド2 / security

LGTM
根拠:

【注入】全 className 変更は静的リテラルを cn() で結合しているのみ。props を文字列補間したクラス名や dangerouslySetInnerHTML/style の追加は無い。select.tsx:86 の data-align-trigger={alignItemWithTrigger} と combobox.tsx:117 の data-chips={!!anchor} は既存かつ boolean 由来で、今回の diff で新規の動的 data-* 属性は増えていない。

【情報漏洩】追加された DOM 属性・aria・テキストは無し。data-activation-direction / data-starting-style / data-ending-style / data-instant はいずれも Base UI が付与する既存属性で、コンポーネント側で値を生成していない。navigation-menu.tsx の Indicator から旧4クラス（data-[state=hidden]:animate-out 等）を削除した変更は視覚インジケーターの表示条件のみに影響し、露出する情報は変わらない。

【権限と変更範囲】変更ファイルは §C の担当6ファイル（dropdown-menu.tsx / context-menu.tsx / menubar.tsx / select.tsx / combobox.tsx / navigation-menu.tsx）+ scripts/check-standards.mjs の7件のみで、§4-8「担当部品のファイル + check-standards.mjs（allowlist行の削除だけ）+ 新規証跡」の範囲に一致する。check-standards.mjs の diff は MOTION_LITERAL_ALLOWLIST から担当6 path の行を削除しただけの純削除で、新規追加行は無い。input-otp.tsx / item.tsx / message-scroller.tsx（複数行エントリ含む）/ sidebar.tsx / toast.tsx など担当外 path の行はすべて保持されており、§2.2・§2.3 に反する越権変更は無い。allowlist はratchet方式のため削除は検査の厳格化方向であり、CI ゲートの緩和にはならない。判定ロジック本体（MOTION_ARBITRARY_LITERAL 等の正規表現）は未変更。package.json / global.css / registry.json への変更や新規依存の追加も無い。

data-instant:transition-none の除去は context-menu.tsx の Popup className 1箇所のみで、追加裁定（context-menu のみ dismiss で observed のため1個除去、他4部品は保持）と一致する。navigation-menu の Positioner および combobox / dropdown-menu / menubar / select では保持されており、越権的な属性除去は無い。

#### ラウンド2 / core-logic

LGTM
根拠:

- 6ファイル共通: §2.1の削除対象（`animate-in/out`、`fade-in-0/out-0`、`zoom-in-95/out-95`、`slide-in-from-*`、`data-[state=delayed-open]:…`、生値の`duration-<数値>`、`ease-<既定>`）は全て検出0件。代わりにテンプレ`transition-[opacity,scale] duration-slow ease-entrance` / `data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md)` / `data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast`が付与されている。既存の`origin-(--transform-origin)`は全ファイルで保持（menubarは`DropdownMenuContent`をcn経由で継承するため文字列上は現れないが実体として保持）。
- `data-instant:transition-none`: dropdown-menu / menubar（Content・SubContent各1）/ select / combobox に存在し、context-menuのみ存在しない。context-menuのSubContentは同じPopupのclassNameを共有するため「1クラスだけ除去」の適用範囲は網羅済み。追加裁定（msg_1160542c2e6e）と一致。
- select: `data-[align-trigger=true]:animate-none`は削除済み、代わりに`data-[align-trigger=true]:data-starting-style:scale-100`と`data-[align-trigger=true]:data-ending-style:scale-100`を追加。CSS詳細度は`[data-align-trigger=true][data-starting-style]`(0,3,0)が`[data-starting-style]`(0,2,0)より高く、`alignItemWithTrigger`がtrueのとき`data-align-trigger="true"`が実際に出力されるため、記述順に関わらずalign-trigger時はscale-100が確実に優先される。裁定（msg_ae75134f7a15）通りの実装。
- navigation-menu Content: `data-[activation-direction=left]:data-starting-style:-translate-x-(--motion-distance-lg)` / `right`側は正符号、endingは左右反転（left→正、right→負）で司令塔裁定と一致。up/downは扱っていない。`data-ending-style:duration-fast`（0,2,0）は`group-data-[viewport=false]/navigation-menu:duration-slow`（groupは`:where()`包含のため0,1,0）より詳細度が高く、viewport=false時もending側でfastが優先される設計として整合。
- navigation-menu Positioner: `duration-slow ease-entrance`化と`data-instant:transition-none`の保持を確認。Popup: `duration-slow ease-entrance`、ending `duration-fast`化、`scale-90`は写像表に無いため保持（裁定通り）。
- navigation-menu Indicator: 旧`data-[state=hidden]:animate-out/fade-out`・`data-[state=visible]:animate-in/fade-in`の4クラスを削除し代替なし。裁定「代わりは足さない」と一致。
- navigation-menu Chevron: `duration-300→duration-slow`のみで`ease-entrance`は追加していない（bare `transition`のまま）。裁定「Chevron はduration-300→slow」の文言通りで、easeの追加は範囲外の変更になるため現状維持が正しい。
- dropdown-menuの`data-closed:overflow-hidden`はtw-animate-css由来ではなく§2.1の削除リストにも無いプレーンなTailwindユーティリティで、Base UIは終了アニメーション中も`data-closed`を出すため、スクロールバー抑制の既存挙動を保持する目的で残すのが正しい。
- allowlist（check-standards.mjs）は§Cの6ファイル分の行のみ削除されており、他path・正規表現・判定ロジックには触れていない（§2.3準拠）。

optional:
- MenubarContent / MenubarSubContentは`DropdownMenuContent`がcn経由で供給する共通テンプレ一式を自身のclassNameでも重複記述している。twMergeで重複整理されるため実害はないが、§C「Popup 2箇所」の記述と矛盾しない範囲での軽微な冗長性として言及のみ。

#### ラウンド2 / tests

LGTM

根拠:
- §4-2 の陰性 grep 3種を担当6ファイル全文で確認した。`animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from|animate-accordion|delayed-open`、`\b(duration|delay)-[0-9]+\b`、`\bease-(in|out|in-out)\b` のいずれも実装後の6ファイルに残存箇所は見当たらず（`ease-entrance` は単語境界的に `ease-out` 等にマッチしない）、grep=0 の想定と実装が一致する。
- 陽性対照については、origin/main の該当ファイルで `ease-(in|out|in-out)` がヒットするのは navigation-menu.tsx のみ（`ease-out`）で、他5ファイルの origin/main には `ease-*` 文字列自体が存在しない。spec の「元から0件の組合せはN/A」規定と整合しており、検証基準側の欠陥ではない。
- selector 整合: menubar は `DropdownMenuContent`/`DropdownMenuSubContent` を内部呼び出ししており、`data-slot="menubar-content"` / `"menubar-sub-content"` が実際にテンプレを持つ Popup 要素に付与される構造になっている（props の展開順で menubar 側の data-slot が優先）。表の実測対象 selector `[data-slot="menubar-content"]` は実装と一致する。
- allowlist 更新は§Cの6ファイル分の行のみが削除されており、他 path（item.tsx、message-scroller.tsx 等）の行は変更されていない。§2.2 の指示と整合する。
- §4-4 の `.duration-slow{`/`.ease-entrance{`/`data-starting-style` の3コマンドと §4-5 の computed style 実測は、`duration-slow`/`ease-entrance`/`--motion-scale-*`/`--motion-distance-lg` 等のトークンが global.css 側（本 PR の担当外、§2.3 により変更禁止）に定義されている前提に依存する。本 diff 単体ではこれらトークンの定義有無を確認できないが、これは実装の欠陥ではなく、§4-4/§4-5 の実測コマンド自体がその前提を検出できる設計になっている（未定義なら該当 grep が0件、または computed 値が期待値と不一致になり、検証段階で顕在化する）。

optional:
- §4-2 の regex 1 は `slide-out-to-*` や `animate-none`、素の `fade-in`/`fade-out`（`-0` サフィックス無し）を拾わない。今回目視で6ファイルとも該当文字列が残っていないことを確認したため今回の grep=0 は真の合格だが、正規表現自体は網羅的ではない。証跡側で `grep -cE 'slide-out-to|animate-none|fade-(in|out)\b'` を追加記録するか、目視確認をnoteしておくと後続の陽性対照テストの信頼性が上がる。
- `data-instant:transition-none` は `transition-property: none` のみを変えるため、§4-5 の open 側 computed style チェック（transition-duration / transition-timing-function）は data-instant が付いていても付いていなくても同じ値を返し得る。data-instant の有無記録が実質的な判別要因になるので、同時刻の `transition-property` の computed 値も併記すると証跡が自己完結する。
- navigation-menu の Content に `duration-slow` が base クラスと `group-data-[viewport=false]/navigation-menu:duration-slow` の2箇所に重複して存在するが、これは司令塔裁定「写像して残す」の指示通りであり、後続の担当者が重複と誤認して削除しないよう申し送りしておくとよい。

#### ラウンド2 / domain

LGTM
根拠:
1. §2.1で削除対象と定めたtw-animate-css由来クラス（animate-in/out、fade-in-0/out-0、zoom-in-95/out-95、slide-in-from-*、data-[state=delayed-open]:…）およびTailwind既定のduration-<数値>/ease-<既定>は、担当6ファイル全文（dropdown-menu.tsx、context-menu.tsx、menubar.tsx×2箇所、select.tsx、combobox.tsx、navigation-menu.tsx全ブロック）のいずれにも残存していない。navigation-menuのIndicatorも旧4クラス（data-[state=hidden]:animate-out等）を削除済みで裁定通り代替なし。
2. Menu系5部品（dropdown-menu/context-menu/menubar×2/select/combobox）のPopupはすべて`transition-[opacity,scale] duration-slow ease-entrance data-starting-style:opacity-0 data-starting-style:scale-(--motion-scale-md) data-ending-style:opacity-0 data-ending-style:scale-(--motion-scale-sm) data-ending-style:duration-fast`の共通テンプレに一致し、origin-(--transform-origin)も保持されている。
3. data-instant:transition-noneの扱いは追加裁定（msg_1160542c2e6e）と厳密に一致: context-menuのみ除去、dropdown-menu/menubar/select/comboboxは保持、navigation-menu PositionerはCoreの明示裁定通り保持。
4. Select: data-[align-trigger=true]:animate-noneを削除し、共通template後にdata-[align-trigger=true]:data-starting-style:scale-100とdata-[align-trigger=true]:data-ending-style:scale-100を追加（msg_ae75134f7a15裁定通り）。このセレクタは属性2個（[data-align-trigger=true][data-starting-style]）でCSS詳細度が共通template側（属性1個）より高く、Tailwindのクラス出力順に依存せず確実に上書きされるため、opacityのみ変化・scaleは100固定という意図通りに動作する。
5. navigation-menu: Chevronはduration-300→duration-slow、Contentはtransition-[opacity,transform,translate] duration-slow ease-entrance、ending側にduration-fastを追加、data-[activation-direction=left/right]のstarting/endingのtranslate-x方向が司令塔裁定（left starting=負lg、right starting=正lg、endingは左右反転）と一致。Positionerはduration-slow/ease-entrance＋data-instant:transition-none保持、Popupはduration-slow/ease-entrance＋ending duration-fast、scale-90は写像表に無いため保持という裁定通り。group-data-[viewport=false]のduration-300もduration-slowへ写像されている。
6. scripts/check-standards.mjsのMOTION_LITERAL_ALLOWLISTは担当6ファイルの行のみ削除されており、他path（item.tsx、message-scroller.tsx、sidebar.tsx、toast.tsx、input-otp.tsx）の行は変更されていない。

optional（改善提案、flagではない）:
- navigation-menu.tsxのNavigationMenuContentで`group-data-[viewport=false]/navigation-menu:duration-slow`と`data-ending-style:duration-fast`はCSS詳細度が同値になるため、viewport=false×ending時にどちらが適用されるかはTailwindのvariant出力順に依存する。ただし基本durationが既にduration-slowで冗長な指定であり、実測対象は§Cの表でviewport=trueのケースのみのため実害は薄い。この箇所は司令塔裁定で「写像して残す」と固定されており、削除や整理は設計変更に該当するため対応は次ラウンド判断で可。

<!-- review-cycle:end 2026-09-15-overlay-motion-c -->
