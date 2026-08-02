---
trigger: manual
created: 2026-07-31
autonomy: manual
---

# ui.elchika.dev 公開後に registry.json と README を更新する

公開後の配信正本は `ui.elchika.dev` と決定しているが、現在は未公開で、deployment・DNS・公開 URL の確認が未完了である。そのため `registry.json` の
`homepage` に GitHub のリポジトリ URL を置き、README には利用者向けの registry URL を
**書いていない**（暫定 URL を案内すると、確定後に利用側すべての修正が必要になるため）。

#3 で Cloudflare deployment・DNS・`ui.elchika.dev` の公開到達を確認したら、次を行う。

- `registry.json` の `homepage` を `https://ui.elchika.dev` へ差し替える
- README の「利用方法」に、利用者向けの `components.json` 設定例と `npx shadcn add` を追記する
- `AGENTS.md` の routes に本番 URL を追記する
