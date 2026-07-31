# Contributing

## 開発の前提

- Node.js `>=22.12.0`
- パッケージマネージャは npm（`package-lock.json` を正本とする）

## セットアップ

```bash
npm ci
```

## 変更を出す前に通すもの

```bash
npm run format
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
npm run build
npm run build:lib
npm run check:all
```

## コンポーネントを追加・変更するときの規約

- 基底層は Base UI（`@base-ui/react`）を使う。Radix UI を新規に足さない
- 色は `src/styles/global.css` のセマンティックトークンだけを参照する。生の色指定と arbitrary value を使わない（`scripts/check-standards.mjs` が検知する）
- フォーカスリングは `focus-visible:ring-[3px] focus-visible:ring-ring`。透明度合成（`/50` 等）を使わない
- 外部から移植したコードは `provenance.json` に来歴を記録する。PR 本文の「来歴の申告」も実態どおりに埋める

新しいコンポーネントを追加したら、次の経路すべてに載せる（`node scripts/check-completeness.mjs` が検査する）。

1. `src/index.ts` からの値 export（`checkCompleteness` の barrel 検査）
2. `export type <Name>Props`（同 Props 検査。ビルド後の `lib/index.d.ts` に現れること）
3. `registry.json` の `items`
4. `src/previews/<name>.tsx` と `src/pages/preview/<name>.astro` / `<name>-dark.astro`
5. `provenance.json`（`PROVENANCE_DATE=$(date +%F) PROVENANCE_MODIFIED='{"<name>":"実際の変更内容"}' node scripts/record-provenance.mjs` で自動記録される。`modified` は自動生成せず、未指定なら停止する）

この 5 項目は `checkCompleteness` が見る 5 つの検査次元と 1 対 1 で対応する。**片方を増減させたら他方も合わせる。**

そのうえで、[component 追加手順](.docs/component-addition-procedure.md)に従い、追加したプレビューの両テーマを実ブラウザで検証してから PR を出す（AI_FIRST §2）。

## ブランチとマージ

`main` へ直接 push しない。作業ブランチから PR を出し、マージは人間が承認する。
