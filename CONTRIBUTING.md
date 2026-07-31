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
npm run lint
npm run typecheck
node --test "scripts/*.test.mjs"
node scripts/check-standards.mjs
npm run build
npm run build:lib
```

## コンポーネントを追加・変更するときの規約

- 基底層は Base UI（`@base-ui/react`）を使う。Radix UI を新規に足さない
- 色は `src/styles/global.css` のセマンティックトークンだけを参照する。生の色指定と arbitrary value を使わない（`scripts/check-standards.mjs` が検知する）
- フォーカスリングは `focus-visible:ring-[3px] focus-visible:ring-ring`。透明度合成（`/50` 等）を使わない
- 外部から移植したコードは `provenance.json` に来歴を記録する。PR 本文の「来歴の申告」も実態どおりに埋める

## ブランチとマージ

`main` へ直接 push しない。作業ブランチから PR を出し、マージは人間が承認する。
