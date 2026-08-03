# サイト配信 Phase A 実装レビュー

verified_impl_sha: d39a35a859df4c6b36fcad40b0044881c68f5978

- diff: `be7f63c..d39a35a859df4c6b36fcad40b0044881c68f5978`
- 最終判定: flag 0
- ACCEPTED_RISKS: なし

## レビューサイクル

R1 は明示要件・correctness、security・dependency、tests・a11y、文書の ambiguity・altitude を別のチェックリストとして検査した。実行環境の制約により specialist subagent は追加せず、各観点の対象と判定を分離して同一セッション内で実施した。

- requirements / correctness — `INSPECTION_STATUS: flag=0 optional=0`
  - 上流互換の非空 registry index、3導入経路、単一カテゴリ正本、全 preview 由来の component route、既存 route 非変更、Workers Assets、README、Phase B 手順を brief と照合した。
  - `registry index` の item 集合、static route、Props 次段表示、SPA fallback 無効、JSON Content-Type を機械検査と HTTP 実体の両方で確認した。
- security / dependency — `INSPECTION_STATUS: flag=0 optional=1`
  - workflow は `contents: read` の最小権限で、Cloudflare の値を repository secrets だけから受け取る。component 名は path を混入できない形式へ制限している。
  - `npm audit --audit-level=high` は exit 0。low severity の `tsup` 配下 `esbuild 0.27.7` は base `be7f63c` と同一の既存 dev dependency のため optional とした。
- tests / a11y / fresh eyes — `INSPECTION_STATUS: flag=0 optional=0`
  - top、Button、Dialog を実ブラウザで確認し、desktop / mobile Sidebar、light / dark、`aria-current`、skip link、明示操作後の isolated iframe、console error 0 を実測した。
  - Dialog の focus trap が初回 Tab を奪う問題は `3c195282bcfe7005825de2356f68fe2c36d8cc95` で明示ロードへ変更した。最初の Tab が「本文へ移動」、実行後の active element が `main#main-content`、明示ロード後だけ iframe 内の dialog が開くことを確認した。
- ambiguity / altitude — `INSPECTION_STATUS: flag=0 optional=0`
  - README と Phase B 手順は、公開後の正本 URL と現時点の未公開状態を区別する。Props は次段、deployment・DNS・custom domain は Phase B と明記し、Phase A の完了条件へ混入させていない。

初回 round から flag 0 のため、修正後 clean round は不要と判定した。

## 実行した gate

| command | exit | 結果 |
|---|---:|---|
| `npm run format` | 0 | 意図外差分なし |
| `npm run lint` | 0 | failure なし。既存 warning のみ |
| `npm run typecheck` | 0 | 0 errors、1 hint |
| `node --test scripts/*.test.mjs` | 0 | 278 pass、0 fail |
| `npm run build` | 0 | library、registry、法務ファイル、186 static pages を生成 |
| `npm run check:all` | 0 | component 固有 hard failure なし。shared stale は advisory のみ |
| `npx wrangler deploy --dry-run` | 0 | `dist` の Assets を読み込み、binding なし |
| fresh clone の `npm ci` と `npm run build` | 0 | `dist/r/index.json`、Button page、`lib/index.d.ts` の実体を確認 |

## HTTP 実測

Wrangler local server を空きポートで起動し、次を確認した。

- `/r/index.json`: HTTP 200、`Content-Type: application/json`、非空配列、各要素に `name`・`type`・`files`
- `/not-a-real-route`: HTTP 404、トップページへの SPA fallback なし

## 見ていない範囲

- Cloudflare production deployment、GitHub secrets、DNS、custom domain、外部ネットワークからの公開到達
- 公開 URL を使う shadcn MCP / CLI の end-to-end 取得
- screen reader の読み上げと複数ブラウザ・複数 OS の組み合わせ

これらは Phase B 手順の実行後に判定し、Phase A の flag 0 には含めない。
