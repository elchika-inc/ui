verified_impl_sha: 57d2af4df3e4dc51173e9cb14f951c0edd0fb3b8

# overlay モーション統一 PR B の検証記録

## 成功基準と実測範囲

[委任仕様 §4 / §B](../../plans/2026-09-15-overlay-motion.md) を成功基準とし、存在（ソース・CSS・selector）、実行（検査コマンド・build・描画操作）、動作（computed style・属性遷移・DOM消失）を区別して測定した。

実装担当: `term_e1021157-2d29-43ac-ac8e-92e145597286` / `task_cf0db53d415e`。実装 commit は冒頭の SHA。証跡は実装 commit 後に別 commit とする。

## コマンド検証

各コマンドは独立実行し、終了コードを個別に取得した。pipe や連結による exit code の合成は行っていない。

| §4 | コマンド / 対象 | 結果 | 検証レベル |
|---|---|---|---|
| 1 | node scripts/check-standards.mjs | exit 0、248ファイル、motion-literal / motion-literal-allowlist-stale 各0件 | 実行 |
| 2 | 下記の負の検査9本 | 全て0件 / exit 1 | 存在 |
| 3 | npm run lint | exit 0、486ファイル、201 warning / 3 info（warningは指定ベースラインと同数） | 実行 |
| 4 | npm run build:site | exit 0、271ページ | 実行 |
| 4 | 生成CSSの3検査 | 全てexit 0、各1件 | 存在 |
| 5 | Playwright 1.63.0 / headless Chromium 153.0.8010.12 | exit 0、6ケース合格、JPEG 6枚 | 動作 |
| 6 | node --test scripts/check-standards.test.mjs | exit 0、72 pass / 0 fail / 0 skip | 実行 |
| 7 | node scripts/check-evidence.mjs（report作成直後、証跡commit前） | exit 0、証跡形式 OK | 実行 |
| 8 | git diff --stat origin/main / 変更範囲の照合 | 実装4ファイルと新規証跡、既存spec追加の裁定例外 | 存在 |
| 9 | 存在 / 実行 / 動作 | 本表と部品別reportに区別して記録 | 範囲の明示 |

証跡commit後の check-evidence と CI の最終結果は PR 本文へ記録する。全件テスト、ローカルtypecheck、check:all は仕様に従い実行していない。全件テストとtypecheckは PR CI の `Lint, typecheck, test & build` で代替する。

check-evidence は既存共有面の stale について「3件」「過去履歴の shared stale: 91件」を診断した。形式・immutability は全件検査済みで exit 0。既存reportや画像には変更を加えていない。

## 負の検査と陽性対照

次の3コマンドを担当ファイルごとに単独実行した。`<担当ファイル>` は `src/components/ui/popover.tsx`、`src/components/ui/hover-card.tsx`、`src/components/ui/tooltip.tsx` の順。

```bash
grep -cE 'animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95|slide-in-from|animate-accordion|delayed-open' <担当ファイル>
grep -cE '\b(duration|delay)-[0-9]+\b' <担当ファイル>
grep -cE '\bease-(in|out|in-out)\b' <担当ファイル>
```

| 部品 | 変更後 animate / duration / ease（件数） | 各exit | origin/main animate / duration / ease（件数） | 対照の各exit |
|---|---|---|---|---|
| popover | 0 / 0 / 0 | 1 / 1 / 1 | 1 / 1 / 0 | 0 / 0 / 1 |
| hover-card | 0 / 0 / 0 | 1 / 1 / 1 | 1 / 1 / 0 | 0 / 0 / 1 |
| tooltip | 0 / 0 / 0 | 1 / 1 / 1 | 1 / 0 / 0 | 0 / 1 / 1 |

対照の origin/main は `94a79dfdbf977440bcc1790c7db457834283cb33`。`git show origin/main:<担当ファイル>` で一時ファイルに書き出し、同じ検索式を実行した。対照でも0件の組合せは N/A。司令塔裁定に従い検索式単位で陽性を確認し、ease は `ease-out` 1語の人工対照で1件 / exit 0を観測した。全対照用一時ファイルは検査後に削除した。

## 生成CSS

`ls dist/_astro/global.*.css` は exit 0、出力は `dist/_astro/global.CYpyX3Eu.css`。

```bash
grep -o '\.duration-slow{[^}]*}' dist/_astro/global.CYpyX3Eu.css
grep -o '\.ease-entrance{[^}]*}' dist/_astro/global.CYpyX3Eu.css
grep -c 'data-starting-style' dist/_astro/global.CYpyX3Eu.css
```

各exit 0。前2つは各1ルール、最後の出力は `1`（CSSがminifyされているため行数）。実出力は次のとおり。

```css
.duration-slow{transition-duration:var(--duration-slow);--tw-duration:var(--duration-slow)}
.ease-entrance{--tw-ease:var(--curve-entrance);transition-timing-function:var(--curve-entrance)}
```

## 実ブラウザと分岐

部品別reportと生データに computed style、16msポーリングの属性列、削除時刻を保存した。

- [popover](2026-09-16-popover-preview.md): 両テーマ open 0.26s / close 0.12s。
- [hover-card](2026-09-16-hover-card-preview.md): 両テーマ open 0.26s / close 0.12s。
- [tooltip](2026-09-16-tooltip-preview.md): 両テーマ open 0.12s / close 0.08s。
- [生データ](browser-results.json): 全件 `cubic-bezier(0.16, 1, 0.3, 1)`、selector 1件、console error / pageerror / favicon error 各0件、starting / ending → DOM消失を観測。

通常open直後の data-instant は3部品ともlight / darkで「なし（false / null）」。popover / hover-card は§Bの分岐により `data-instant:transition-none` を追加し、tooltipは規定どおり無条件に追加した。

## 裁定・変更範囲・裁量

- 司令塔裁定: §Bの「5個」は誤記で、実在するslide-in class 6個を全削除。
- 司令塔裁定: 陽性対照は検索式単位で判定し、easeの人工陽性対照を許容。
- 司令塔裁定: spec追加1件（司令塔commit `e0467c5`）は§4.8の許容一覧に対する明記した例外。specファイル自体は編集していない。
- 担当3ファイルはPopupのclass文字列以外が origin/main とbyte一致。standards検査ファイルは担当allowlist 2行の削除以外がbyte一致（独立比較スクリプト exit 0）。
- 裁量で選択した事項: classの追加位置を既存origin utility直後としたこと、一時ファイル名、report表現。段・曲線・記法は仕様どおり。
- TypeScriptグラフは未構築だったため、ts-review-graphのフォールバックとして対象ソースと直接利用previewを読んだ。
- レビューの記録は [cycle記録](../cycles/2026-09-15-overlay-motion-b.md) を参照。

## 収束時の再検証

5レンズがR1でflag 0件となった後に§4.1〜4を再実行した。standards exit 0（248ファイル）、負の検査9本はいずれも0件 / exit 1、陽性対照は上表と同値（人工ease 1件 / exit 0）、lint exit 0（201 warning / 3 info）、build:site exit 0（271ページ）、生成CSSの3検査はいずれもexit 0 / 各1件だった。

再buildでCSSファイル名が更新されたため、その最終成果物でもPlaywrightの全6ケースを再実行してexit 0を確認し、JPEG・生データ・部品別reportを最終実測値に揃えた。元の実装commit以降、担当4ファイルの内容は変わっていない。
