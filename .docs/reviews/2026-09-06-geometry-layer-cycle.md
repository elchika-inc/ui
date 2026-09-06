verified_impl_sha: cc547672fb248eb51c45a7b972ce2ac0cefda982

# Issue #52 幾何レイヤーのレビュー記録

## 実施条件

- 実装担当: Codex / GPT-6。
- レビュアー: fresh Claude Code / Sonnet（`--model sonnet`）、1名。Fresh Eyes → Security → Core Logic → Tests → Domain の順で適用。
- 対象: `cc547672fb248eb51c45a7b972ce2ac0cefda982` の実装。コード変更は `56abdb762edff97b46855d5631b87b228eee4cdc`。
- 最大3ラウンド。確信度80%以上で correctness・セキュリティ・明示要件に影響するものを flag、それ以外を optional とした。
- 最小コンテキスト: `.ts-review-graph/graph.db` が存在しないため現行ソースと差分を参照。
- レビュアーには Read / Grep / Glob と Orca lifecycle に限定した Bash allowlist を渡した。Write / Edit / MCP は無効。実装・テスト・build の実行を禁止した。レビュー前後のソース差分は不変。
- Orca の nested worker depth 1 により sub-worker dispatch は拒否された。司令塔裁定により、用意済み端末へ `orca terminal send` で依頼し、`orca terminal wait --for tui-idle` / `orca terminal read --screen` で回収した。レビュアーには lifecycle メッセージを送らせていない。
- レビュー対象は実装差分のみ。計画は要件正本として参照し、文書自体を対象とする追加レンズは当てていない。

## Round 1

依頼: 対象25ファイルと差分、計画2.1〜2.3、司令塔の Dialog の影・負の検査範囲・box-shadow の透明層の裁定を提示し、指定 class の置換、CSS cascade、Base UI の props 不変、registry 配布を確認するよう依頼した。証跡と残るコマンドは実装担当の検証責務であることを明示した。

| レンズ | flag | optional | 処置 |
|---|---:|---:|---|
| Fresh Eyes | 0 | 0 | 修正なし |
| Security | 0 | 0 | 修正なし |
| Core Logic | 0 | 0 | 修正なし |
| Tests | 0 | 1 | 生の box-shadow と裁定された合否条件を証跡 report に記録する |
| Domain | 0 | 0 | 修正なし |

偽陽性なし。受容した flag なし（ACCEPTED_RISKS 追加なし）。新規コードは追加せず Tailwind の標準 `@theme inline` と既存 token 生成器で接続したため、自前実装への降格はない。

端末の画面上端で欠けた Fresh Eyes / Security は、同じ結果の再掲を1回だけ依頼して回収した。以下は端末から取得したレンズ別本文をそのまま保存したもので、表示上の折り返しを含む。Fresh Eyes 本文中の件数には読み取り誤差があり、実差分は registry 90 item・radius 削除180行・UI 部品15ファイルである（親の `git diff --numstat` と生成器出力で確認）。

### fresh-eyes

```text
  LGTM
  差分全体（registry.json の radius 除去55箇所、login/signup 6ブロックの font-bold→font-semibold、components/ui
  配下14ファイルの寸法・角丸・影・境界線置換、design-tokens.html / tokens.css / global.css のトークン接続）を通読した。委任仕様 2.1〜2.3 の
  literal な指示と実装内容は一対一で対応しており、範囲外ファイル（sidebar.tsx、src/site、src/previews、src/pages）への波及は確認されなかった。負
  の検査対象文字列（ring-foreground/10、font-bold、rounded-4xl、rounded-2xl、rounded-3xl、shadow-xl、--radius: 0.625rem）を src
  配下で検索した結果、design-tokens.html の説明例文中の1件（「p-7 や font-bold のような系外の値」という既存の解説文）のみが一致し、これは仕様が
  明示的に残すよう指示している箇所と一致する。それ以外の実装ファイルに旧値の残存はない。
```

### security

```text
  LGTM
  今回の変更は Tailwind ユーティリティクラス文字列の置換と CSS カスタムプロパティの参照方向変更、および見出し要素の font-weight
  変更に限定されており、ユーザー入力の処理、認証・認可、外部通信、シリアライズ処理には触れていない。className の合成は既存の cn()
  ヘルパーを通しており、新規の動的文字列生成や innerHTML 相当の挿入は導入されていない。registry.json
  の変更もキー削除のみで、スキーマや配布経路に影響する新規フィールドは追加されていない。セキュリティ上の懸念は見当たらない。
```

### core-logic

```text
  LGTM
  button.tsx の size バリアント別置換（default: h-8→h-control-md・px-2.5→px-control-x、xs: 高さ据え置きで
  rounded-md→rounded-sm・in-data-[slot=button-group]:rounded-lg→rounded-md、sm: h-7→h-control-sm、lg:
  h-9→h-control-lg・px-2.5→px-control-x、icon: size-8→size-control-md、icon-xs: 高さ据え置きで rounded-md→rounded-sm、icon-sm:
  size-7→size-control-sm、icon-lg: size-9→size-control-lg）を仕様2.3の記述と逐語で突き合わせ、全項目が一致することを確認した。xs / icon-xs
  の高さ（h-6 / size-6）が変更されていないことも仕様の明示的な制約と一致する。dialog.tsx / alert-dialog.tsx は Content にのみ shadow-lg
  を追加し、Header / Footer / Media 等の他要素には波及していない。card.tsx は ring-1 ring-foreground/10 → border border-border shadow-xs
  の1回の置換のみで、CardHeader / CardFooter は角丸のみの変更に留まっている。design-tokens.html の RADIUS / ELEVATION セクションは
  light（:root）・dark（[data-theme="dark"]）の両方で同一パターンの別名化がなされ、--shadow-focus
  のみ変更されていないことも仕様と一致する。global.css の @theme inline は :root/.dark の --radius: 0.625rem 削除、7行の --radius-*
  削除と5行への置換、--shadow-* の initial 化と再定義、--font-weight-* の同様の扱い、--default-transition-* と --spacing-control-*
  の追加が仕様の記述順・内容と一致している。ロジック上の欠陥は確認できなかった。
```

### tests

```text
  LGTM／optional: 概要
  本ラウンドの指示によりテスト実行は行っていないため、テストの合否そのものは検証対象外である。仕様（4節6項・7項）が要求する自動テスト（node
  --test、check:all、check-evidence）は実装担当が今後実施する範囲であり、現時点でその欠落を欠陥として扱わないことが依頼文に明記されている。今回
  の差分は className 文字列とトークン定義のみの変更であり、新規のテストケース追加を要する新しい分岐ロジックや条件分岐は導入されていないため、テ
  スト観点から見て構造的な欠落は確認できなかった。optional: computed style の実測（4節5項）は Playwright
  による動作確認が必要な項目であり、本レビューの静的差分読解だけでは合否を判定できない。実装担当の report.md
  作成時に、司令塔裁定にある「末尾1層一致・他層完全透明ゼロ寸法」の基準に沿った生の box-shadow
  文字列の記録漏れがないか、レビュー後半（収束ラウンド）で改めて確認することを推奨する。
```

### domain

```text
  LGTM
  Tailwind CSS v4 の layer 順（design-system → theme → base → utilities）に起因する同名変数衝突を、既存の --font-code パターンに倣い
  --rounding-* / --elevation-* という値を持つ別名を design-tokens.html 側に新設し、--radius-* / --shadow-*
  をその参照に変える構成で解決しており、cascade layer の仕組みと整合している。global.css の @theme inline 内で --shadow-: initial; の後に
  --shadow-xs〜lg を再定義する手順は、Tailwind の @theme のリセット構文として正しい使い方である。--font-weight-: initial;
  の後に値を直書きしている点も、design-tokens.html 側の --font-weight-regular
  等との同名衝突を避けるためという設計判断がコメントに明記されており、意図が追跡可能になっている。Base UI
  ラップコンポーネント（Dialog、AlertDialog、Select、Combobox、Menubar 等）の props シグネチャ・data-slot 属性・export
  一覧に変更はなく、className の内容のみが変わっているため、Base UI 側の契約（プレースホルダーとしての Popup / Trigger / Positioner
  等）への影響はない。light / dark の両テーマで ELEVATION の値が対称的に別名化されており、light 側の書き換えが dark
  側で漏れているといった非対称性は見当たらなかった。registry.json は各 item の cssVars.light / cssVars.dark から "radius"
  キーが機械的に削除されており、registry 配布物としての構造（sidebar 系エイリアス等の他フィールド）に影響を与えていない。
```

## 収束の対

| コマンド | 初回 | 収束時の再実行 |
|---|---|---|
| `node src/styles/design-system/build-tokens.mjs --check` | exit 0 | exit 0、197 token、light / dark 各30 contrast pair、露出外token 29件の既存警告 |
| `npm run lint` | exit 0、warning 200、info 3 | exit 0、486ファイル、warning 200、info 3 |
| `node scripts/check-standards.mjs` | exit 0、248ファイル | exit 0、248ファイル |
| `node --test "scripts/*.test.mjs"` | exit 0、499成功、0失敗、0skip、509120ms | exit 0、499成功、0失敗、0skip、553872ms |

失敗testがないため単独再実行は不要。両回とも単独で失敗が残るtestは0件。初回ラウンドからflag 0のため追加ラウンドは行わない。optional 1件は証跡reportのcomputed style表と生のbox-shadow記録で対応した。

INSPECTION_STATUS: review_cycle=1ラウンド / flag=0 / optional=1（記録で対応） / ACCEPTED_RISKS=なし。
