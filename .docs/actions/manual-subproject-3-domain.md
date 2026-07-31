---
trigger: manual
created: 2026-07-31
autonomy: manual
---

# 配信ドメイン確定後に registry.json と README を更新する

サブプロジェクト #1 の時点では配信先が決まっていないため、`registry.json` の
`homepage` に GitHub のリポジトリ URL を置き、README には利用者向けの registry URL を
**書いていない**（暫定 URL を案内すると、確定後に利用側すべての修正が必要になるため）。

#3 で Cloudflare の配信ドメインが決まったら、次を行う。

- `registry.json` の `homepage` を配信ドメインへ差し替える
- README の「利用方法」に、利用者向けの `components.json` 設定例と `npx shadcn add` を追記する
- `AGENTS.md` の routes に本番 URL を追記する
