# サブプロジェクト #1 DoneCriteria 通し確認

verified_impl_sha: 063671bb699e15d604185ac6d0d6d7d085121a86

検証時の head: `063671bb699e15d604185ac6d0d6d7d085121a86`

| 条件番号 | 実行したコマンド | 実際の出力 |
|---|---|---|
| 1 | `node -e "console.log(require('./components.json').style)"` | `base-nova` |
| 2 | `node scripts/check-standards.mjs`、`grep -c '@base-ui/react' src/components/ui/button.tsx`、Task 6 Step 5b の正負 grep | `standards 適合（3 ファイルを検査）`、Base UI `1`、必須構文 `4 / 4 / 4 / 1 / 1`、除去対象はすべて `0`、`bg-destructive/10` は `1` |
| 3 | standards の `design-tokens.css` との `cmp`、`Hiragino Sans` / `--success:` / `prefers-reduced-motion` の grep、`node scripts/contrast.mjs` | `cmp` exit 0、grep は `1 / 2 / 1`、`light destructive 6.1493 PASS`、`light success 4.7348 PASS`、`light warning 3.9190 FAIL` |
| 4 | `npx tsc --noEmit --ignoreConfig --strict --module esnext --moduleResolution bundler --target es2022 --jsx react-jsx types/dts-contract.ts`、`node scripts/check-completeness.mjs` | 型契約は出力なし・exit 0、`1 件のコンポーネントが 5 経路すべてに載っている` |
| 5 | `serve public` と外部 Vite probe、`npx shadcn@latest add --overwrite`、Button / token / legal の検査、probe の `npm run build`、後始末 | 使用ポート `3011`、scaffold の `ring-ring/50` は `0`、配布した `ring-[3px]` は `1`、法務原本は `1 / 2`、利用者のルート `LICENSE` は無し、`--primary` / `--success` は各 `2`、`37 個のトークンが正本と一致して届いている`、build exit 0、`serve public` と `/tmp/registry-probe` の残留なし |
| 6 | `dist/preview` の存在・dark class 検査、証跡 SHA と現 head の `src/` diff、3 route × 2 テーマの実ブラウザ検証 | 静的ページは両方実在、dark class は `1 / 0`、証跡 SHA `3a5d932406cd97ef8d3a53a58d27b51d9c3cb1b0` と現 head の `src/` は同一。使用ポート `3012`、全6シナリオで Button数・名前・disabled・keyboard・非透明focus ring・横スクロール・矩形・文字色・サブリソースが合格。console はすべて `0`、network はすべて失敗 `0`。背景色は light `oklch(1 0 0)` / dark `oklch(0.145 0 0)` |
| 7 | `node scripts/check-distribution.mjs` と外部 probe の法務ファイル検査 | `配布物 OK（LICENSE / THIRD_PARTY_LICENSES が原本と一致）`、probe の `elchika-ui/LICENSE` / `elchika-ui/THIRD_PARTY_LICENSES` は実在・原本一致、利用者の `LICENSE` は未上書き |
| 8 | provenance の fail-closed 検査、追加時 commit の `button.tsx` と `normalizedContentSha256` の照合 | `ok 4f421aba659a1f5e5bc2d36b591ac4753c0108e7 93edbf2075d6104e1b20d263419d91a9587208d3d05efdd06dfafcfe4d0dfd65 4.16.0 2026-07-31`、`来歴が scaffold 時の実体と一致` |
| 9 | Task 1 Step 6b の PR テンプレート grep | 必須見出しと計画 glob はすべて `1`、`vp check` / `implementation.md` / 事前チェック済み欄はすべて `0` |
| 10 | `.docs/` の `git ls-files` と risk grep、Task 3 Step 4c | actions `1`、plans `2`、plan は追跡対象。risk grep は `Storybook 1 / Base UI 2 / DOCS_OPS §6 2 / AI_FIRST §2 2 / worktree 1 / GitHub Actions 2`、`整合: light warning = 3.9190 (FAIL) / warning の accepted エントリ 1 件` |
| 11 | GitHub ruleset の個別 GET と target / enforcement / ref / pull_request / approvals / bypass 検査 | `protected の条件をすべて満たす` |
| 12 | 本タスクの Step 9 で最終 head に束縛した CI を確認 | 本タスクの Step 9 で PR 本文へ記録 |
