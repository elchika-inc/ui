# elchika-inc/ui 基盤 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `elchika-inc/ui` を新規作成し、Button 1 件で「法務・来歴の準備 → 生成 → standards 適合 → ビルド → registry 配布 → 隔離プレビュー → CI」の経路を端から端まで通す。

**Architecture:** shadcn CLI v4 の Astro テンプレートで Base UI ベースの単一リポジトリを作る。Astro サイトがカタログ・隔離プレビュー・registry 配信を兼ねる。npm publish はせず shadcn custom registry で配布するが、design-sync が正確な props 契約を読めるようライブラリビルドを併設する。

**Tech Stack:** Astro 7 / React 19 / Base UI (`@base-ui/react` 1.6.0) / Tailwind CSS v4 / shadcn CLI 4.16.0 / Biome / Cloudflare

設計の正本は同ディレクトリの [`2026-07-31-elchika-ui-foundation-design.md`](2026-07-31-elchika-ui-foundation-design.md)（本計画と同一ブランチに存在する）。本計画はそのサブプロジェクト #1 のみを実装する。

## Global Constraints

すべてのタスクの要件に暗黙に含まれる。値は spec と standards から逐語でコピーしている。

- **Node**: `>=22.12.0`（scaffold の `engines.node` が要求する実測値）
- **生成コマンド**: `npx shadcn@latest init --template astro --base base --preset nova -y --no-monorepo`。`--base` の受け付け値は `base` / `radix` / `aria`、`--preset` は `nova`（`base-nova` は不正値。いずれも実測で確認）
- **出力先**: Astro は `dist/`（既定値。触らない）、ライブラリビルドは `lib/`。両者を同じディレクトリにしない
- **フォーカスリング**: `focus-visible:ring-[3px] focus-visible:ring-ring`。**`/50` 等の透明度合成を使わない**（DESIGN.md §5。light 背景で WCAG 1.4.11 の非テキストコントラスト 3:1 を割るため）
- **arbitrary value を使わない**（DESIGN.md §5、SHOULD）。許可済み例外は `ring-[3px]` と `@custom-variant dark (&:is(.dark *))` のみ
- **セマンティックトークンのみ参照する**（DESIGN.md §3）
- **フォント**: 本文・UI は Geist Variable。和文はフォールバックスタック（Hiragino Sans → Noto Sans JP → Yu Gothic UI）。このスタック定義を崩さない
- **npm publish しない**。`package.json` は `private: true` を維持する
- **法的逐語文を生成しない**。ライセンス全文は上流の実ファイルを取得して機械的にコピーする（PRODUCT_PLAYBOOK §15）
- **来歴の申告欄を事前に埋めない**（PRODUCT_PLAYBOOK §15）。PR テンプレートのチェック欄は空で用意する
- **standards の取得経路**: standards は private リポジトリのため `raw.githubusercontent.com` からの取得は失敗する。**ローカル clone（`~/projects/naoto24kawa/standards`）から `cp` する**。clone が無い場合は `gh repo clone naoto24kawa/standards` で取得してから進む
- **合否を判定するコマンドを `&&` で連結しない**。exit code が最後のコマンドのものになり、途中の失敗が消えるため、1 ステップにつき合否判定は 1 つにする
- **pipe は「判定したいコマンドが最後段にある場合」に限り使ってよい**。`sed ... | grep -c ...` は合否を決めるのが最後段の `grep` なので可。逆に `build 2>&1 | tail` のように**判定したいコマンドが前段にある形は禁止**（`tail` の exit code が返り、ビルドの失敗が消える）。前段の結果が要るときはファイルへリダイレクトしてから読む
- **テストの実行形は `node --test "scripts/*.test.mjs"`**。`node --test scripts/` のように裸のディレクトリを渡さない。Node は指定を glob pattern として扱うため `scripts` というモジュールを実行しようとして必ず失敗する（実測）。さらに glob が 0 件一致でも `tests 0` / **exit 0** になる（実測）ため、**出力の `tests N` が 1 以上であること**で走ったことを確かめる。**テストファイルの本数を定数で書かない**（足すたびにずれる）
- **コミットは作業ブランチへ行い、main へ直接コミットしない**（DOCS_OPS §5）

## File Structure

| パス | 責務 |
|---|---|
| `LICENSE` / `THIRD_PARTY_LICENSES` | 帰属。上流の実ファイルから生成する |
| `.github/PULL_REQUEST_TEMPLATE.md` | 来歴の申告欄（空で用意） |
| `.github/workflows/ci.yml` | CI |
| `scripts/fetch-third-party-licenses.mjs` | 上流ライセンスの取得 |
| `scripts/record-provenance.mjs` | コンポーネント来歴の記録 |
| `scripts/check-standards.mjs` | DESIGN.md §5 違反の機械検知 |
| `scripts/check-distribution.mjs` | registry item への法務ファイル同梱検査 |
| `scripts/contrast.mjs` | トークンのコントラストを oklch から実計算する |
| `provenance.json` | コンポーネント単位の来歴（機械可読） |
| `.shadcn-cli-version` | scaffold を実行した CLI の exact version。来歴の正本 |
| `components.json` | shadcn の設定 |
| `src/components/ui/*.tsx` | 部品本体 |
| `src/index.ts` | ライブラリのバレル |
| `types/dts-contract.ts` | ビルド出力の props 契約を型で検査する（grep で代替できない） |
| `src/styles/global.css` | トークン |
| `src/previews/*.tsx` | 隔離プレビューの中身 |
| `src/pages/preview/*.astro` | 隔離プレビューのルート（light / dark で別ページ） |
| `registry.json` | registry の定義 |
| `tsup.config.ts` | ライブラリビルド（出力先 `lib/`） |
| `biome.json` | lint / format |
| `.docs/PROJECT_GOAL.md` / `.docs/risk-registry.md` / `.docs/actions/` / `.docs/plans/` | 作業ドキュメント（DOCS_OPS §1・§3 の MUST） |
| `.docs/reviews/` | 実ブラウザ検証の証跡と DoneCriteria の通し記録 |
| `CONTRIBUTING.md` / `SECURITY.md` / `.github/ISSUE_TEMPLATE/config.yml` | 貢献規約と脆弱性報告の導線 |
| `AGENTS.md` / `CLAUDE.md` / `README.md` | エージェント契約と人間向け入口 |

---

### Task 1: リポジトリと法務・来歴の土台を置く

scaffold より**前**に置く。`shadcn init` はそれ自体が `button.tsx` を生成するため、後から来歴を足すと最初のコンポーネントが来歴なしでコミットされる（design §3）。

**Files:**
- Create: `LICENSE`、`THIRD_PARTY_LICENSES`、`scripts/fetch-third-party-licenses.mjs`、`.github/PULL_REQUEST_TEMPLATE.md`、`CONTRIBUTING.md`、`SECURITY.md`、`.github/ISSUE_TEMPLATE/config.yml`、`.docs/PROJECT_GOAL.md`、`.docs/risk-registry.md`、`.docs/actions/manual-subproject-3-domain.md`、`.docs/plans/2026-07-31-elchika-ui-foundation-design.md`、`.docs/plans/2026-07-31-elchika-ui-foundation-plan.md`

**Interfaces:**
- Produces: `THIRD_PARTY_LICENSES`（上流実ファイルの連結）、`LICENSE`（MIT 本文。上流 API から取得）、`.docs/`（DOCS_OPS §1・§3 の MUST）

- [ ] **Step 1: リポジトリを作成して clone する**

`--add-readme` を付ける。**これを省くとコミットが 1 つも無いリポジトリになり `main` が存在しない。** その状態で `feat/foundation` に最初のコミットを積むと、そのブランチが default branch になり、PR の base が無くなって Task 10 で PR を作れない。

```bash
gh repo create elchika-inc/ui --public --add-readme \
  --description "elchika-inc の共有 UI コンポーネント。Base UI + Tailwind CSS v4。shadcn registry で配布する。"
git clone https://github.com/elchika-inc/ui.git
cd ui
```

Run: `git branch --show-current`
Expected: `main`

Run: `git log --oneline -1`
Expected: 初期コミットが 1 件出る（`main` が実在することの確認）

```bash
git checkout -b feat/foundation
```

- [ ] **Step 2: 上流ライセンスの取得スクリプトを書く**

`scripts/fetch-third-party-licenses.mjs`:

```js
// 上流のライセンス実ファイルを取得して連結する。
// PRODUCT_PLAYBOOK §15: 法的逐語文は生成しない
// （生成させると数語書き換わってもエラーが出ず検出できないため）。
import { writeFileSync } from "node:fs"

const SOURCES = [
  { name: "shadcn/ui", repo: "shadcn-ui/ui" },
  { name: "Base UI", repo: "mui/base-ui" },
]
// ファイル名とブランチは上流ごとに違うため総当たりで探す。
// 見つからなければ例外にする（推測で埋めない）。
const BRANCHES = ["main", "master"]
const NAMES = ["LICENSE", "LICENSE.md", "LICENSE.txt"]

const parts = []
for (const s of SOURCES) {
  let found = null
  for (const b of BRANCHES) {
    for (const n of NAMES) {
      const url = `https://raw.githubusercontent.com/${s.repo}/${b}/${n}`
      const res = await fetch(url)
      if (res.ok) { found = { url, text: await res.text() }; break }
    }
    if (found) break
  }
  if (!found) throw new Error(`${s.name}: ライセンスファイルを特定できない`)
  parts.push(`## ${s.name}\n\nSource: ${found.url}\n\n${found.text}`)
}
writeFileSync("THIRD_PARTY_LICENSES", `# Third Party Licenses\n\n${parts.join("\n\n---\n\n")}\n`)
console.log(`${SOURCES.length} 件のライセンスを取得した`)
```

- [ ] **Step 3: 実行する**

Run: `node scripts/fetch-third-party-licenses.mjs`
Expected: `2 件のライセンスを取得した`

- [ ] **Step 4: 取得物が生成物でないことを確認する**

Source 行の本数だけでは足りない。**生成した任意の本文に正しい Source 行を 2 本置けば通る**（実測: 同じ `grep -c` に「AI が生成した本文＋Source 行 2 本」を与えると `2` で通過した）。上流の実本文が入っていることを、上流から取り直して照合する。

Run: `grep -c "Source: https://raw.githubusercontent.com" THIRD_PARTY_LICENSES`
Expected: `2`

Run:

```bash
node -e '
const fs = require("node:fs")
const body = fs.readFileSync("THIRD_PARTY_LICENSES", "utf8")
// 埋め込まれた Source URL からもう一度取得し、その本文が実際に含まれるかを見る。
const urls = [...body.matchAll(/^Source: (https:\/\/raw\.githubusercontent\.com\/\S+)$/gm)].map((m) => m[1])
if (urls.length === 0) { console.error("Source URL が無い"); process.exit(1) }
Promise.all(urls.map((u) => fetch(u).then((r) => {
  if (!r.ok) throw new Error(`${u}: ${r.status}`)
  return r.text().then((t) => ({ u, t }))
}))).then((rs) => {
  const missing = rs.filter(({ t }) => !body.includes(t.trim()))
  if (missing.length) {
    console.error(`上流本文が含まれていない: ${missing.map((m) => m.u).join(", ")}`)
    process.exit(1)
  }
  console.log(`${rs.length} 件の上流本文が逐語で含まれている`)
})
'
```

Expected: `2 件の上流本文が逐語で含まれている` が出力され exit 0

**失敗したら本文を書き直さない。** `scripts/fetch-third-party-licenses.mjs` を再実行して取り直す（PRODUCT_PLAYBOOK §15: 法的逐語文を生成しない）。

- [ ] **Step 5: `LICENSE` を機械的に取得して置く**

MIT。著作権者は `elchika-inc`。**本文を書かない**（PRODUCT_PLAYBOOK §15。法的逐語文を生成させると数語書き換わってもエラーが出ず検出できない）。GitHub の licenses API が返す正準本文を取得し、プレースホルダ 2 箇所だけを置換する。

```bash
gh api /licenses/mit --jq '.body' > LICENSE
node -e '
const fs = require("node:fs")
// [year] と [fullname] は上流本文が持つプレースホルダ。ここだけを置換する。
let t = fs.readFileSync("LICENSE", "utf8")
t = t.replace("[year]", String(new Date().getFullYear())).replace("[fullname]", "elchika-inc")
fs.writeFileSync("LICENSE", t)
'
```

- [ ] **Step 5b: `LICENSE` の中身を検査する（ファイル名の存在では代替しない）**

Run: `grep -c '^MIT License$' LICENSE`
Expected: `1`

Run: `grep -c 'Permission is hereby granted, free of charge' LICENSE`
Expected: `1`

Run: `grep -c 'THE SOFTWARE IS PROVIDED "AS IS"' LICENSE`
Expected: `1`

Run: `grep -c 'Copyright (c) 20[0-9][0-9] elchika-inc' LICENSE`
Expected: `1`

Run: `grep -c '\[year\]\|\[fullname\]' LICENSE`
Expected: `0`（置換漏れがない）

Run: `test "$(wc -l < LICENSE)" -ge 20`
Expected: exit 0（MIT 本文は実測 22 行。20 行を切るなら取得が途中で切れている）

- [ ] **Step 6: PR テンプレートを正準テンプレートの上に置く**

`.github/PULL_REQUEST_TEMPLATE.md`。**正準テンプレートを置き換えず、来歴の申告節を追加する。** design §3 のとおり、既存の「エージェント実装の来歴」（実装計画・実装担当識別子）と PRODUCT_PLAYBOOK §15 の「来歴の申告」（自作／AI 生成／移植）は別物であり、後者は前者を置換しない。

```bash
mkdir -p .github
cp ~/projects/naoto24kawa/standards/templates/.github/PULL_REQUEST_TEMPLATE.md .github/PULL_REQUEST_TEMPLATE.md
```

コピーした上で、**下に番号を振った項目をすべて**適用する。それ以外は変更しない（正準テンプレートの節を削らないため）。

1. `## エージェント実装の来歴` の節の**直後**に、次の節を挿入する。**チェック欄は空のまま置く**（PRODUCT_PLAYBOOK §15。埋める主体と雛形を書く主体が別のとき、事前に埋めると実態と異なる申告が通る）。「自作」は「他プロジェクトからのコピーではない」を意味し AI 生成と排他ではないため複数選択可とする。

```markdown
## 来歴の申告（当てはまるものをすべてチェック）

- [ ] 自作（他プロジェクトからのコピーではない）
- [ ] AI が生成した
- [ ] 他プロジェクトから移植した

移植を含む場合、出典 URL・commit SHA・ライセンス:

<!-- 例: https://github.com/shadcn-ui/ui @ 705ce5961080264830471ddd885c01b907706068 / MIT
     SHA は provenance.json の該当コンポーネントの upstreamPathSha をそのまま書く。
     受け取った内容そのものの錨は registryContentSha256 で、これも併記する。
     角括弧つきの穴埋め記法をここに書かないこと（未記入検査が誤検知するため） -->
```

2. `## エージェント実装の来歴` の `- 実装計画:` 行にある案内コメントの glob を直す。正準テンプレートは `.docs/plans/*-implementation.md` と書いているが、**DOCS_OPS §3 の MUST は `-design.md` / `-plan.md` の 2 接尾辞**であり `*-implementation.md` は存在しない命名。そのまま残すと、以後の PR 作成者が存在しないパスへ誘導される。

```markdown
- 実装計画: <!-- `.docs/plans/*-plan.md` の相対パス。人間のみの変更は N/A -->
```

（これは standards 側のテンプレートの誤りでもある。`templates/.github/PULL_REQUEST_TEMPLATE.md` の修正は standards の別 PR として扱う。）

3. チェックリストの 1 行目 `- [ ] \`vp check\` / \`vp fmt\` をローカルで通した` を、本リポジトリに実在するコマンドへ差し替える（`vp` はこのリポジトリに存在しない）。

```markdown
- [ ] `npm run lint` / `npm run typecheck` / `node --test "scripts/*.test.mjs"` をローカルで通した
- [ ] `node scripts/check-standards.mjs` が通る
- [ ] `npm run build` と `npm run build:lib` が通る
```

- [ ] **Step 6b: 正準テンプレートの節が失われていないことを確認する**

Run: `grep -c '^## 関連 Issue / ゴール$' .github/PULL_REQUEST_TEMPLATE.md`
Run: `grep -c '^- 実装計画:' .github/PULL_REQUEST_TEMPLATE.md`
Run: `grep -c '^- 実装担当識別子:' .github/PULL_REQUEST_TEMPLATE.md`
Run: `grep -c '^## 検証証跡$' .github/PULL_REQUEST_TEMPLATE.md`
Run: `grep -c '^## 来歴の申告' .github/PULL_REQUEST_TEMPLATE.md`
Expected: すべて `1`

Run: `grep -c 'vp check' .github/PULL_REQUEST_TEMPLATE.md`
Expected: `0`（実在しないコマンドが残っていない）

Run: `grep -c 'implementation.md' .github/PULL_REQUEST_TEMPLATE.md`
Expected: `0`（存在しない命名規則への誘導が残っていない）

Run: `grep -c 'plans/\*-plan.md' .github/PULL_REQUEST_TEMPLATE.md`
Expected: `1`（DOCS_OPS §3 の MUST に一致する glob になっている）

Run: `grep -c '^- \[x\]' .github/PULL_REQUEST_TEMPLATE.md`
Expected: `0`（チェック欄を事前に埋めていない）

- [ ] **Step 7: `SECURITY.md` / `CONTRIBUTING.md` / Issue テンプレートの `config.yml` を置く**

`SECURITY.md` は standards のローカル clone からコピーし、**placeholder を具体値へ差し替える**。

```bash
cp ~/projects/naoto24kawa/standards/templates/SECURITY.md SECURITY.md
```

差し替えは下の表の行。値は推測せず、ここに書かれたとおりにする。

| 元の記述 | 差し替え後 |
|---|---|
| `- **Email**: <your-email>` | **行ごと削除する**。専用の報告用メールアドレスを持たないため、窓口を Security Advisories に一本化する |
| `https://github.com/<owner>/<repo>/security/advisories/new` | `https://github.com/elchika-inc/ui/security/advisories/new` |
| `報告後、**<N> 時間以内（暦日）** に初回返答します。` | `報告後、**72 時間以内（暦日）** に初回返答します。` |

末尾のコメントアウトされた `https://<your-domain>/security` の 3 行（`<!-- 公開 URL がある場合は下記を使う` から `-->` まで）も削除する。公開ドメインはサブプロジェクト #3 まで決まらないため、決まっていない URL を残さない。

`CONTRIBUTING.md` は standards にテンプレートが無いため、次を逐語で置く。

```markdown
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
```

`.github/ISSUE_TEMPLATE/config.yml` は脆弱性を公開 Issue に書かせない導線を張る。逐語で置く。

```yaml
blank_issues_enabled: true
contact_links:
  - name: セキュリティ上の問題の報告
    url: https://github.com/elchika-inc/ui/security/advisories/new
    about: 脆弱性は公開 Issue に書かず、Security Advisory から非公開で報告してください
```

- [ ] **Step 7b: placeholder が 1 つも残っていないことを確認する**

テンプレート由来の `<...>` 形式の placeholder がファイルに残ると、実行者が推測で埋めることになる。ゼロ件を機械で確かめる。

Run: `grep -c 'your-email\|your-domain\|your-name\|<owner>\|<repo>\|<project>\|<N> 時間' SECURITY.md`
Expected: `0`

Run: `grep -c 'elchika-inc/ui/security/advisories/new' SECURITY.md`
Expected: `1`

Run: `grep -c '72 時間以内' SECURITY.md`
Expected: `1`

Run: `grep -c 'elchika-inc/ui/security/advisories/new' .github/ISSUE_TEMPLATE/config.yml`
Expected: `1`

- [ ] **Step 8: `.docs/` を DOCS_OPS §3 の構成で作る**

ディレクトリを作るだけでは足りない。DOCS_OPS §3 は新規プロジェクトに対し `PROJECT_GOAL.md`・`actions/`・`plans/`・`risk-registry.md` を MUST としている（`STATUS.md` と `reviews/` は SHOULD）。

```bash
mkdir -p .docs/actions .docs/plans .docs/reviews
```

**ディレクトリを作るだけでは PR にもマージ後の clone にも存在しない。** Git は空ディレクトリを記録しないため、`test -d` はローカルで通っても、clone した人にとって `actions/` と `plans/` は存在しない。各層に**追跡される実ファイル**を置く。

`.docs/plans/` には、本サブプロジェクトの設計と実装計画を standards のローカル clone からコピーする。これがないと、PR 本文の「実装計画」欄が target repo 内で解決できない参照になる。

```bash
cp ~/projects/naoto24kawa/standards/.docs/plans/2026-07-31-elchika-ui-foundation-design.md .docs/plans/
cp ~/projects/naoto24kawa/standards/.docs/plans/2026-07-31-elchika-ui-foundation-plan.md .docs/plans/
```

`.docs/actions/` には、本サブプロジェクトの時点で**実在する持ち越し**を 1 件書く。層を埋めるためのダミーを置かない。

`.docs/actions/manual-subproject-3-domain.md`（DOCS_OPS §3 はファイル名を `{trigger}-{short-description}.md` と MUST で定めている。`trigger` は `manual` — 発火条件は「次のセッション」ではなく「#3 でドメインが決まったとき」なので `next-session` は実態と合わない）:

```markdown
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
```

`.docs/PROJECT_GOAL.md` に、何を作るかと SuccessCriteria / DoneCriteria を書く。DoneCriteria は本計画が実装する design §8 の 12 条件を引き継ぐ。

`.docs/risk-registry.md` に、本サブプロジェクトで確定している**下記の逸脱すべて**を受容エントリとして書く（`--warning` の件は Task 3 Step 4b の実測後に条件付きで足すため、ここでは書かない）。#6 へ延期しない（延期すると #1 完了時点で受容記録が存在しない状態になる）。

- **Storybook を置かない** — DESIGN.md §7 は Storybook を SHOULD としているが、Astro の隔離プレビューで代替する。理由はカタログサイトと確認手段を 1 つに寄せるため。代償として design-sync が storybook shape ではなく package shape になり、実レンダリングとのスクリーンショット照合が使えない
- **Base UI を基底層に採用** — DESIGN.md §2 の表は shadcn/ui を Radix UI ベースとして記載している。DESIGN.md:42 が乗り換え時の理由記録を求めている
- **PR CI を build-check だけに絞らない** — DOCS_OPS §6 の役割分担は「PR はビルドチェックのみ。lint / fmt / test はスキップ。フルセットは main push の Deploy job」と定めている。本リポジトリはこれを**意図的に逸脱**し、PR CI でフルセットを走らせる。理由は次のとおり。①§6 の分担は `vp check` がローカルの一次責任者であることを前提にしているが、本リポジトリに `vp` は存在せず、コミット前ゲートも無い。PR で lint / test を飛ばすと、それらは人間のマージ後まで一度も走らない。②本リポジトリは配布物を持つが `main` push で deploy する対象を #1 の時点で持たない（Cloudflare 配信はサブプロジェクト #3）。フルセットを main push に置くと、唯一の実行機会が human-gate の**後**になり、マージ判断の材料にならない。代償として PR ごとの Actions 実行時間が増える。#3 で deploy が入った時点で、§6 の分担へ寄せられるかを再評価する
- **検証スクリーンショットを PR へ直接添付せず、リポジトリへコミットする** — AI_FIRST §2 は「スクリーンショットは PR への直接添付を正本とする」としているが、GitHub の添付アップロードは Web UI 経由でしか行えず、CLI で作業するエージェントからは実行できない。代わりに `.docs/reviews/` へコミットし、PR 本文からは**画像を含むコミットの SHA に固定した permalink** で参照する（`https://github.com/elchika-inc/ui/blob/<commit-sha>/.docs/reviews/<file>.png?raw=1`）。**ブランチ名を含む URL を使わない** — `feat/foundation` はマージ後に削除され、その時点で証跡が 404 になる。ブランチ ref は可変なので内容の同一性も保証しない。SHA 固定なら §2 が求める性質（インライン表示・マージ後も参照可能・TTL 無し・改ざん不可）をすべて満たす。public リポジトリのため、証跡に機微情報を写り込ませないことを条件とする
- **実ブラウザ検証を別 worktree で行わない** — AI_FIRST §2 手順 1 は clean worktree を切ることを求めるが、その目的は「オーナーの作業ツリーを汚さない」ことと「DB を共有しない」ことの 2 つ。本リポジトリは Task 1 がこのタスク自身で作成したものであり、守るべき別の作業ツリーが存在しない。DB も持たない（`dev-data-safety: local`）。代わりに §2 の実質的な要求である「PR に入るコードを検証する」を、**実装を先にコミットしてから、その SHA でビルドして検証し、SHA を証跡へ記録する**ことで満たす（Task 9 Step 7・11）
- **（Task 3 Step 4b の実測結果しだいで足す）`--warning` × `--warning-foreground` が WCAG AA を満たさないまま取り込む** — この 1 件だけは**ここで書かない**。トークンを取り込むのは Task 3 であり、比が 4.5:1 に届くかどうかはその時点の standards の実値で決まる。**Task 3 Step 4b が FAIL を観測したときにだけ、そこで追記する。** 本計画の作成時点（2026-07-31）の実測は 3.919:1 で FAIL であり、standards 側にも `.docs/actions/next-session-warning-foreground-contrast.md` として記録がある。したがって通常はこのエントリが 1 件足され、`.docs/risk-registry.md` には Task 1 で書いた分とあわせて受容エントリが並ぶ（件数を他所から参照しない — 項目を足したときに参照側がずれるため）

書式は DOCS_OPS §3 の受容エントリ規約に従い、ループ外の `anchor` を持たせる。

- [ ] **Step 8b: `.docs/` の MUST が揃ったことを確認する**

**`test -d` を根拠にしない。** ディレクトリの存在はローカルの事実にすぎず、Git が記録するのはファイルだけ。`git add -A` 済みであることを前提に、**追跡対象として何件あるか**で見る。

Run: `git add -A`（先に実行する。以下の `git ls-files` は index を見るため）
Run: `test "$(git ls-files .docs/actions | wc -l)" -ge 1`
Run: `test "$(git ls-files .docs/plans | wc -l)" -ge 2`
Expected: どちらも exit 0（`plans` は design と plan の 2 件）

Run: `git ls-files .docs/plans/2026-07-31-elchika-ui-foundation-plan.md`
Expected: パスが 1 行出力される（PR 本文から参照する実装計画が target repo 内に実在する）

Run: `test -f .docs/PROJECT_GOAL.md`
Run: `test -f .docs/risk-registry.md`
Run: `grep -c "Storybook" .docs/risk-registry.md`
Run: `grep -c "Base UI" .docs/risk-registry.md`
Run: `grep -c "DOCS_OPS §6" .docs/risk-registry.md`
Run: `grep -c "AI_FIRST §2" .docs/risk-registry.md`
Run: `grep -c "worktree" .docs/risk-registry.md`
Expected: `grep -c` の各行は `1` 以上（Storybook / Base UI / CI 役割分担 / 証跡の置き場 / worktree 分離）。`--warning` の受容はこの時点では存在しない

- [ ] **Step 9: 確認してコミットする**

Run: `test -s LICENSE`
Run: `test -s THIRD_PARTY_LICENSES`
Run: `test -s CONTRIBUTING.md`
Run: `test -s SECURITY.md`
Run: `test -s .github/PULL_REQUEST_TEMPLATE.md`
Run: `test -s .github/ISSUE_TEMPLATE/config.yml`
Expected: すべて exit 0（`-s` は「存在し、かつ空でない」。`-f` は空ファイルでも通るため使わない）

```bash
git add -A
git commit -m "chore: 法務ファイルと来歴の申告経路を置く"
```

---

### Task 2: scaffold して来歴を記録する

**Files:**
- Create: scaffold の出力一式、`.shadcn-cli-version`、`scripts/record-provenance.mjs`、`provenance.json`

**Interfaces:**
- Produces: `components.json`（`style: "base-nova"`）、`src/components/ui/button.tsx`、`src/styles/global.css`、`.shadcn-cli-version`（生成器として動いた CLI の exact version。`record-provenance.mjs` が必須読取する）、`provenance.json`

- [ ] **Step 1: scaffold を実行する**

リポジトリが空でないため一時ディレクトリで生成して中身を移す。

**実行する CLI の版を先に固定して記録する。** `npx shadcn@latest` が実行するパッケージと、scaffold 後に target repo へ入る `node_modules/shadcn` は**別のインストール**であり、同じ版である保証がない。来歴に残すべきは「実際に生成器として動いた版」なので、実行前に解決して固定する。

```bash
cd ..
SHADCN_CLI_VERSION=$(npx -y shadcn@latest --version)
echo "$SHADCN_CLI_VERSION"
npx -y shadcn@"$SHADCN_CLI_VERSION" init --template astro --base base --preset nova -y --no-monorepo --name ui-scaffold
rsync -a --exclude .git --exclude node_modules ui-scaffold/ ui/
rm -rf ui-scaffold
cd ui
# 実行した版をファイルへ残す。record-provenance.mjs がこれを読む。
printf '%s\n' "$SHADCN_CLI_VERSION" > .shadcn-cli-version
npm install
```

Run: `grep -cE '^[0-9]+\.[0-9]+\.[0-9]+$' .shadcn-cli-version`
Expected: `1`（exact version が 1 行だけ入っている。実測では `4.16.0`）

- [ ] **Step 2: 生成物を確認する**

Run: `node -e "console.log(require('./components.json').style)"`
Expected: `base-nova`

Run: `test -f src/components/ui/button.tsx`
Expected: exit 0

- [ ] **Step 2b: scaffold が `typecheck` script を提供していることを確認する**

Task 10 の CI が `npm run typecheck` を実行する。この script を定義するタスクは本計画に無く、**scaffold が提供する前提**に依存している。実測では scaffold の `package.json` に `"typecheck": "astro check"` と devDependency の `@astrojs/check` / `typescript` が入っている。前提が崩れていたらここで止める。

Run: `node -e "const s=require('./package.json').scripts; if(!s.typecheck) { console.error('typecheck script が無い'); process.exit(1) } console.log(s.typecheck)"`
Expected: `astro check` が出力され exit 0

Run: `npm run typecheck`
Expected: exit 0

**Expected が満たされない場合**（scaffold が `typecheck` を提供しなくなっていた場合）は、`package.json` の `scripts` に `"typecheck": "astro check"` を足し、`npm i -D @astrojs/check typescript` を実行してから再確認する。CI の入力なので、ここを飛ばして先へ進まない。

- [ ] **Step 3: 来歴記録スクリプトを書く**

`scripts/record-provenance.mjs`:

**「上流の default branch の現在 HEAD」を出典 SHA にしない。** それは取り込んだ内容と対応が取れない値であり、40 桁の形式検査を通るぶんかえって危険（実態と違う来歴が機械可読な形で固定される）。

実測して分かった registry の構造は次のとおり。

| 比較 | 結果 |
|---|---|
| registry 配信内容 × 上流リポジトリの実ファイル（`apps/v4/registry/bases/base/ui/button.tsx`） | **一致しない**。registry は preset を解決したビルド生成物を配信しており、リポジトリ側は `cn-button-variant-default` のようなプレースホルダを持つ |
| registry 配信内容 × scaffold が置いた `src/components/ui/button.tsx` | **import 1 行を除いて一致**（CLI が `@/registry/base-nova/lib/utils` を `@/lib/utils` へ書き換える） |

したがって「配信内容と byte 一致する上流 commit」は存在しない。証明できるのは下記で、これをすべて記録する。

1. **実際に受け取った内容のハッシュ**（`registryContentSha256`）— 唯一の暗号学的な錨
2. **配信元 URL**（`registryUrl`）
3. **元テンプレートのパスと、それを最後に変更した commit SHA**（`upstreamPath` / `upstreamPathSha`）— §15 の「commit SHA」に対応する。ただし byte 一致は主張しない

```js
// コンポーネントの来歴を機械可読に記録する（PRODUCT_PLAYBOOK §15）。
// §15 が移植コードへ要求するのは「出典 URL・commit SHA・ライセンス」。
//
// registry は preset を解決したビルド生成物を配信するため、配信内容と
// byte 一致する上流 commit は存在しない（実測）。そこで
//   - 受け取った内容そのものの SHA-256（改ざん・すり替えを検出できる錨）
//   - 元テンプレートのパスと、それを最後に変更した commit SHA
// の両方を記録し、どちらが何を保証するかを notes に明記する。
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))
// scaffold が shadcn をどちらに置くかはテンプレート依存。
// --template astro の実測では dependencies だが、registry の index は
// devDependencies に置く。片方だけを見ると undefined になり、
// JSON.stringify でキーごと脱落して「記録した」と表示されたまま
// 後続の検査で止まる。両方を見て、無ければここで落とす。
const shadcnRange = pkg.dependencies?.shadcn ?? pkg.devDependencies?.shadcn
if (!shadcnRange) throw new Error("package.json に shadcn の版が無い（dependencies / devDependencies の両方を確認した）")

// package.json に入っているのは semver range（実測: "^4.16.0"）であり、
// 実際に生成器として動いた版ではない。
// さらに target repo の node_modules/shadcn も、scaffold を実行した
// npx のパッケージとは別のインストールであり、同じ版とは限らない。
// 来歴に残すべきは「生成器として動いた版」なので、Step 1 が固定して
// 書き出した .shadcn-cli-version を正本にする。
const shadcnCliVersion = readFileSync(".shadcn-cli-version", "utf8").trim()
if (!/^\d+\.\d+\.\d+/.test(shadcnCliVersion)) {
  throw new Error(`実行した shadcn CLI の版を特定できない: ${shadcnCliVersion}`)
}
// target repo の依存として入った版。生成器とは別物なので別キーで残す。
const shadcnVersion = JSON.parse(readFileSync("node_modules/shadcn/package.json", "utf8")).version
if (!/^\d+\.\d+\.\d+/.test(shadcnVersion)) {
  throw new Error(`依存の shadcn exact version を特定できない: ${shadcnVersion}`)
}
const date = process.env.PROVENANCE_DATE
if (!date) throw new Error("PROVENANCE_DATE を YYYY-MM-DD で渡すこと")

const STYLE = "base-nova"
const UPSTREAM_REPO = "shadcn-ui/ui"
// 元テンプレートのリポジトリ内パス。registry 応答の path とは別（実測で特定した）。
// **コンポーネントごとに変わる。** 定数に固定すると 2 件目以降が Button の
// 来歴を記録して成功表示する（実測: input の commit SHA は button と異なる）。
const upstreamPathFor = (name) => `apps/v4/registry/bases/base/ui/${name}.tsx`

const gh = async (p) => {
  const res = await fetch(`https://api.github.com/${p}`, { headers: { accept: "application/vnd.github+json" } })
  if (!res.ok) throw new Error(`GitHub API ${p}: ${res.status}`)
  return res.json()
}
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex")
// CLI は install 時に import のエイリアスだけを書き換える。比較・ハッシュの
// 双方でこの差を吸収する。
const norm = (s) => s.replace(/@\/(?:registry\/[^/]+\/)?lib\/utils/g, "@/lib/utils")

const prev = existsSync("provenance.json")
  ? JSON.parse(readFileSync("provenance.json", "utf8"))
  : { components: {} }

for (const f of readdirSync("src/components/ui")) {
  const name = f.replace(/\.tsx$/, "")
  if (prev.components[name]) continue

  // 1. registry から配信物そのものを取得する（CLI と同じ URL）。
  const registryUrl = `https://ui.shadcn.com/r/styles/${STYLE}/${name}.json`
  const res = await fetch(registryUrl)
  if (!res.ok) throw new Error(`registry 取得に失敗: ${registryUrl} ${res.status}`)
  const item = await res.json()
  const served = item.files?.[0]?.content
  if (!served) throw new Error(`${name}: registry 応答に content が無い`)

  // 2. 手元の生成物が配信物と同じであることを確かめる。
  //    CLI は import のエイリアスだけを書き換えるので、そこを正規化して比較する。
  const local = readFileSync(`src/components/ui/${f}`, "utf8")
  if (norm(local) !== norm(served)) {
    throw new Error(`${name}: 手元の生成物が registry 配信物と一致しない。来歴を記録できない`)
  }

  // 3. 元テンプレートを最後に変更した commit を取る。
  const upstreamPath = upstreamPathFor(name)
  // パスが実在することを先に確かめる。存在しないパスへ commits を問い合わせると
  // 空配列が返り、SHA を特定できないまま進みかける。
  const head = await fetch(`https://api.github.com/repos/${UPSTREAM_REPO}/contents/${upstreamPath}`, {
    headers: { accept: "application/vnd.github+json" },
  })
  if (!head.ok) throw new Error(`${name}: 上流パスが見つからない: ${upstreamPath} (${head.status})`)
  const commits = await gh(`repos/${UPSTREAM_REPO}/commits?path=${encodeURIComponent(upstreamPath)}&per_page=1`)
  const upstreamPathSha = commits?.[0]?.sha
  if (!/^[0-9a-f]{40}$/.test(upstreamPathSha ?? "")) {
    throw new Error(`${name}: 元テンプレートの commit SHA を特定できない`)
  }

  prev.components[name] = {
    origin: "shadcn/ui registry",
    sourceUrl: `https://github.com/${UPSTREAM_REPO}`,
    registry: "https://ui.shadcn.com",
    registryUrl,
    registryPath: item.files[0].path,
    registryContentSha256: sha256(served),
    // import エイリアスを正規化した内容のハッシュ。手元のファイルと
    // ネットワーク無しで突き合わせるための錨（最終ゲートで使う）。
    normalizedContentSha256: sha256(norm(served)),
    upstreamRepo: UPSTREAM_REPO,
    upstreamPath,
    upstreamPathSha,
    style: STYLE,
    shadcnCliVersion,
    shadcnVersion,
    shadcnRange,
    fetchedAt: date,
    license: "MIT",
    modified: "DESIGN.md §5 適合のため focus ring と arbitrary value を修正",
    notes:
      "registry は preset を解決したビルド生成物を配信するため、配信内容と byte 一致する上流 commit は存在しない。" +
      "registryContentSha256 が受け取った内容そのものの錨であり、upstreamPathSha は元テンプレートを最後に変更した commit を指す（byte 一致は主張しない）。",
  }
}
writeFileSync("provenance.json", JSON.stringify(prev, null, 2) + "\n")
console.log(`${Object.keys(prev.components).length} 件の来歴を記録した`)
```

**`src/components/ui/button.tsx` を standards 適合へ直す前に実行する**（Task 6 より先）。直した後では手元の内容と配信物が一致せず、上の検査で止まる。

- [ ] **Step 4: 来歴を記録する**

Run: `PROVENANCE_DATE=$(date +%F) node scripts/record-provenance.mjs`
Expected: `1 件の来歴を記録した`

- [ ] **Step 5: §15 が要求する 3 要素が揃っていることを確認する**

§15 が要求する 3 つ（出典 URL・commit SHA・ライセンス）と、design §8 DoneCriteria 8 が要求する 3 つ（shadcn version・registry URL・取得日）を、**すべて fail-closed に**検査する。`console.log` で表示するだけでは検査にならない（`undefined undefined` でも exit 0 になる）。

Run:

```bash
node -e '
const p = require("./provenance.json").components.button
const fail = (m) => { console.error(m); process.exit(1) }
if (!p) fail("button の来歴が無い")
// §15: 出典 URL・commit SHA・ライセンス
// DoneCriteria 8: registry URL・shadcn version・取得日
for (const k of ["sourceUrl", "upstreamPathSha", "upstreamPath", "registryContentSha256",
                 "normalizedContentSha256", "license", "registry", "registryUrl",
                 "shadcnCliVersion", "shadcnVersion", "shadcnRange", "fetchedAt"]) {
  if (!p[k] || String(p[k]).trim() === "") fail(`欠落または空: ${k}`)
}
if (!/^[0-9a-f]{40}$/.test(p.upstreamPathSha)) fail(`upstreamPathSha が 40 桁の 16 進でない: ${p.upstreamPathSha}`)
if (!/^[0-9a-f]{64}$/.test(p.registryContentSha256)) fail(`registryContentSha256 が 64 桁の 16 進でない: ${p.registryContentSha256}`)
if (!/^https:\/\//.test(p.sourceUrl)) fail(`sourceUrl が URL でない: ${p.sourceUrl}`)
if (!/^https:\/\//.test(p.registry)) fail(`registry が URL でない: ${p.registry}`)
if (!/^https:\/\//.test(p.registryUrl)) fail(`registryUrl が URL でない: ${p.registryUrl}`)
if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fetchedAt)) fail(`fetchedAt が YYYY-MM-DD でない: ${p.fetchedAt}`)
// range（"^4.16.0"）ではなく解決済みの exact version が入っていること。
// range のままだと「どの版が生成したか」を来歴から特定できない。
if (!/^\d+\.\d+\.\d+/.test(p.shadcnVersion)) fail(`shadcnVersion が exact version でない: ${p.shadcnVersion}`)
if (/^[\^~><=]/.test(p.shadcnVersion)) fail(`shadcnVersion に range 記号が含まれる: ${p.shadcnVersion}`)
// 生成器として動いた版。依存の版とは別に、これが記録されていること。
if (!/^\d+\.\d+\.\d+/.test(p.shadcnCliVersion)) fail(`shadcnCliVersion が exact version でない: ${p.shadcnCliVersion}`)
if (!/^[0-9a-f]{64}$/.test(p.normalizedContentSha256)) fail(`normalizedContentSha256 が 64 桁の 16 進でない: ${p.normalizedContentSha256}`)
console.log(`ok ${p.upstreamPathSha} ${p.registryContentSha256} ${p.shadcnVersion} ${p.fetchedAt}`)
'
```

Expected: `ok` に続いて 40 桁 SHA・64 桁ハッシュ・shadcn のバージョン・当日の日付が出力され exit 0

- [ ] **Step 5b: 検査が欠落を実際に落とすことを確認する**

Run: `node -e 'const fs=require("node:fs");const p=JSON.parse(fs.readFileSync("provenance.json","utf8"));delete p.components.button.registry;fs.writeFileSync("/tmp/prov-broken.json",JSON.stringify(p))'` のうえで、Step 5 のスクリプトの `require("./provenance.json")` を `require("/tmp/prov-broken.json")` に置き換えて実行する
Expected: **exit 1**、`欠落または空: registry` が出力される（検査が本当にキーを見ている）

- [ ] **Step 5c: 記録したハッシュが配信物と実際に一致することを確認する**

`registryContentSha256` は「記録した時点の内容の錨」なので、**その錨が本当に配信物を指しているか**を独立に確かめる。

Run:

```bash
node -e '
const { createHash } = require("node:crypto")
const p = require("./provenance.json").components.button
fetch(p.registryUrl).then((r) => r.json()).then((item) => {
  const served = item.files[0].content
  const h = createHash("sha256").update(served, "utf8").digest("hex")
  if (h !== p.registryContentSha256) {
    console.error(`ハッシュ不一致\n  記録: ${p.registryContentSha256}\n  現在: ${h}`)
    process.exit(1)
  }
  console.log("registryContentSha256 が現在の配信物と一致")
})
'
```

Expected: `registryContentSha256 が現在の配信物と一致` が出力され exit 0

**この検査は本タスク内でだけ実行する。** ここでは `src/components/ui/button.tsx` がまだ scaffold のままなので、やり直しが成立する。Task 6 で standards 適合へ書き換えたあとに実行すると、記録スクリプトの「手元の生成物 == 配信物」比較が必ず失敗し、復旧経路が存在しなくなる。最終ゲートでは代わりにネットワーク非依存の検査（Task 10 Step 8 の条件 #8）を使う。

**不一致で止まった場合**は、記録後に上流が更新されたということ。まだ Task 6 に入っていないので、`provenance.json` の `button` エントリを削除し、`PROVENANCE_DATE` を当日にして Step 4 からやり直せる。**ハッシュだけを書き換えて合わせない**（それでは何も証明していない）。

**すでに Task 6 以降に進んでいた場合は、この検査に戻らない。** 上流が更新されたことは、こちらが記録した来歴（`fetchedAt` 時点で受け取った内容）を無効にしない。記録は「いつ何を受け取ったか」であって「上流の現在の状態」ではない。

- [ ] **Step 6: コミットする**

```bash
git add -A
git commit -m "chore: shadcn の Astro + Base UI テンプレートで scaffold し来歴を記録する"
```

---

### Task 3: standards のトークンを取り込む

**Files:**
- Modify: `src/styles/global.css`

scaffold の `global.css` は standards の `templates/design-tokens.css` と同一構造だが、standards 側が上位互換である（success / warning とその foreground、和文フォールバック、reduced-motion）。正本で置き換える。

**「WCAG を全ペアで満たしている」とは書かない。** light の `--warning` × `--warning-foreground` は **3.919:1** で 4.5:1 に届かない（standards 側で実測済み。`.docs/actions/next-session-warning-foreground-contrast.md` に記録がある既知の欠陥）。本サブプロジェクトの Button は warning を使わないため #1 は進められるが、Step 4b で実測して事実として記録する。

**Interfaces:**
- Produces: `:root` に 37 個のセマンティックトークン

- [ ] **Step 1: 置き換え前のトークン数を測る**

Run: `sed -n '/^:root {/,/^}/p' src/styles/global.css | grep -c '^\s*--'`
Expected: 数値が出る（ベースライン。置き換え後との差を見るため）

- [ ] **Step 2: standards の正本で置き換える**

standards は private リポジトリのため URL 取得ではなくローカル clone から取る。

```bash
STANDARDS=~/projects/naoto24kawa/standards
test -d "$STANDARDS" || gh repo clone naoto24kawa/standards "$STANDARDS"
cp "$STANDARDS/templates/design-tokens.css" src/styles/global.css
```

- [ ] **Step 3: 正本と一致していることを確認する**

**件数を条件にしない。** standards が正当にトークンを増減したとき、正しくコピーした実装が落ちる。逆に名前を差し替えて総数を保った誤実装は通る。取り込み元と同一かどうかで見る。

```bash
STANDARDS=~/projects/naoto24kawa/standards
```

Run: `cmp src/styles/global.css "$STANDARDS/templates/design-tokens.css"`
Expected: exit 0、出力なし（丸ごとコピーなのでファイル全体が一致する）

Run: `sed -n '/^:root {/,/^}/p' src/styles/global.css | grep -c '^\s*--'`
Expected: 数値が出る。**Step 1 のベースラインより増えている**こと（standards 側が上位互換であることの確認。本計画の作成時点の実測値は `37`）

- [ ] **Step 4: 和文フォールバックと status トークンと reduced-motion を確認する**

Run: `grep -c "Hiragino Sans" src/styles/global.css`
Run: `grep -c -- "--success:" src/styles/global.css`
Run: `grep -c "prefers-reduced-motion" src/styles/global.css`
Expected: すべて `1` 以上

- [ ] **Step 4b: status ペアのコントラストを実計算して記録する**

トークンの説明コメントを根拠にしない（DESIGN.md §3 は「暗算・幻覚値での『確認した』は不可」としている）。oklch → sRGB → WCAG 相対輝度で実際に計算する。

`scripts/contrast.mjs` を作る（`.gitignore` せず、後続コンポーネントでも使えるよう残す）。

```js
// oklch(L C H) 文字列 → WCAG 相対輝度 → コントラスト比。
// DESIGN.md §3 が禁じている「暗算・幻覚値での確認した」を避けるための実計算。
const oklchToLinearSrgb = (L, C, H) => {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h), b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}
const luminance = (L, C, H) =>
  oklchToLinearSrgb(L, C, H)
    .map((v) => Math.min(Math.max(v, 0), 1))
    .reduce((acc, v, i) => acc + [0.2126, 0.7152, 0.0722][i] * v, 0)
const ratio = (a, b) => {
  const [hi, lo] = [luminance(...a), luminance(...b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// 値を手で写さない。写した定数は CSS が変わっても据え置きになり、
// 「実際に取り込まれたトークン」ではなく「計画時点の定数」を計算してしまう。
// src/styles/global.css の :root ブロックから直接読む。
import { readFileSync } from "node:fs"

const css = readFileSync("src/styles/global.css", "utf8")
const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)
if (!root) { console.error(":root ブロックを見つけられない"); process.exit(1) }
const token = (name) => {
  const m = root[1].match(new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`))
  if (!m) { console.error(`トークンが無い: --${name}`); process.exit(1) }
  const nums = m[1].trim().split(/\s+/).map(Number)
  if (nums.length !== 3 || nums.some(Number.isNaN)) {
    console.error(`--${name} の値を解釈できない: ${m[1]}`); process.exit(1)
  }
  return nums
}

const PAIRS = [
  ["light destructive", "destructive", "destructive-foreground"],
  ["light success", "success", "success-foreground"],
  ["light warning", "warning", "warning-foreground"],
]
for (const [label, bg, fg] of PAIRS) {
  const r = ratio(token(bg), token(fg))
  console.log(`${label}\t${r.toFixed(4)}\t${r >= 4.5 ? "PASS" : "FAIL"}`)
}
```

Run: `node scripts/contrast.mjs`
Expected: `light destructive` / `light success` / `light warning` の 3 行が、比の値と `PASS` / `FAIL` つきで出力される。

参考として、本計画の作成時（2026-07-31）に standards の現行トークンへ対して実行した結果は次のとおり。**これを Expected の固定値にしない** — standards 側が修正されれば正当に変わる。

```
light destructive	6.1493	PASS
light success	4.7348	PASS
light warning	3.9190	FAIL
```

3 行が出力されない、あるいは `destructive` / `success` が FAIL になった場合は、`token()` の読み取りか standards 側のトークンに問題がある。`src/styles/global.css` の実値と突き合わせて原因を特定してから進む。

**判定結果に応じて risk-registry を書く。** どちらの分岐でも、以降のゲートは「実測結果と記録が一致していること」だけを見る（`3.919` のような固定文字列を期待値にしない）。

**`light warning` が `FAIL` の場合**（本計画の作成時点の実測。通常はこちら）:

`.docs/risk-registry.md` に受容エントリを 1 件追記する。ここで直さない — standards 側の既知欠陥であり、`.docs/actions/next-session-warning-foreground-contrast.md` に記録がある。本サブプロジェクトの Button は warning を使わないため実害はないが、トークンを丸ごと取り込む以上、未達のペアを抱えることを事実として残す。warning 背景 + foreground を使うコンポーネントを追加する前に、standards 側の修正を待つか個別に受容する。エントリには**実測した比の値をそのまま書く**。

**`light warning` が `PASS` の場合**（standards が修正済み）:

追記しない。逸脱は 5 件のままとなる。

- [ ] **Step 4c: 実測結果と risk-registry が一致していることを確認する**

固定文字列でなく、いま測った値との整合で見る。

Run:

**「registry のどこかに比率の数字がある」では検査にならない。** それだと無関係な行にその数値が 1 回出るだけで通ってしまい、「明示受容した」という条件を偽装できる。DOCS_OPS §3 が `accepted` に要求するのは `status` / `reason` / `anchor` の 3 つなので、**その 3 つを備えた `## RISK-` ブロックの中に比率がある**ことを見る。

```bash
node scripts/contrast.mjs > /tmp/ui-contrast.txt
node -e '
const fs = require("node:fs")
const out = fs.readFileSync("/tmp/ui-contrast.txt", "utf8")
const line = out.split("\n").find((l) => l.startsWith("light warning"))
if (!line) { console.error("contrast.mjs に light warning の行が無い"); process.exit(1) }
const [, ratio, verdict] = line.split("\t")

// risk-registry を ## RISK- 見出しでブロックに割る。
const reg = fs.readFileSync(".docs/risk-registry.md", "utf8")
const blocks = reg.split(/^## (?=RISK-)/m).slice(1)
const field = (b, k) => (b.match(new RegExp(`^\\s*-\\s*${k}:\\s*(.+)$`, "m")) ?? [])[1]?.trim() ?? ""

// 「warning トークンについての受容エントリ」をまず特定する。比率の数値で
// 探すと 2 つの穴が開く。①同じ数値を持つ無関係な accepted risk で代用できる
// ②standards 修正後は比率が変わるため、旧比率を持つ stale なエントリが
//   検索から外れて残存を検出できない。
// 束縛先は数値ではなく token 名にする。
const warningBlocks = blocks.filter((b) => b.includes("--warning") && b.includes("--warning-foreground"))
const acceptedWarning = warningBlocks.filter(
  (b) => field(b, "status") === "accepted" && field(b, "reason") && field(b, "anchor")
)

if (verdict === "FAIL") {
  if (acceptedWarning.length === 0) {
    console.error("FAIL なのに、--warning × --warning-foreground についての accepted エントリ（status/reason/anchor つき）が risk-registry に無い")
    process.exit(1)
  }
  // そのエントリが「いま測った値」を書いていること（古い値の残置を弾く）。
  if (!acceptedWarning.some((b) => b.includes(ratio))) {
    console.error(`accepted エントリはあるが、いまの実測値 ${ratio} が書かれていない（古い値のまま）`)
    process.exit(1)
  }
}
if (verdict === "PASS" && warningBlocks.length > 0) {
  console.error(`PASS なのに --warning の受容エントリが ${warningBlocks.length} 件残っている（比率の値によらず残置を検出する）`)
  process.exit(1)
}
console.log(`整合: light warning = ${ratio} (${verdict}) / warning の accepted エントリ ${acceptedWarning.length} 件`)
'
```

Expected: `整合: light warning = ... / warning の accepted エントリ 1 件`（FAIL の場合）または `... 0 件`（PASS の場合）が出力され exit 0

**FAIL なのに落ちた場合**は、受容エントリの体裁が DOCS_OPS §3 を満たしていない。`status: accepted` と、非空の `reason` / `anchor` を書く。`anchor` には「この受容が破れたことを、受容した本人以外の何が検知するか」を書く（例: standards の `.docs/actions/next-session-warning-foreground-contrast.md` が閉じられ `templates/design-tokens.css` の該当行が変わること）。**受容内容を再記述するだけの文書を anchor にしない。**

この判定は Task 10 Step 8 の条件 #10 でもそのまま再実行する。

- [ ] **Step 5: ビルドが通ることを確認する**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 6: コミットする**

```bash
git add src/styles/global.css scripts/contrast.mjs .docs/risk-registry.md
git commit -m "feat: standards のデザイントークンを取り込みコントラストを実計算する"
```

---

### Task 4: ツーリングを standards へ寄せる

**Files:**
- Create: `biome.json`
- Delete: `eslint.config.js`、`.prettierrc`、`.prettierignore`
- Modify: `package.json`

- [ ] **Step 1: standards の biome 設定をローカル clone から取り込む**

```bash
cp ~/projects/naoto24kawa/standards/templates/biome.json biome.json
```

- [ ] **Step 2: eslint / prettier を除去する**

```bash
rm -f eslint.config.js .prettierrc .prettierignore
npm remove eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier prettier-plugin-astro prettier-plugin-tailwindcss
npm i -D @biomejs/biome
```

- [ ] **Step 3: `package.json` の scripts を差し替える**

`lint` を `biome check .`、`format` を `biome check --write .` にする。**`typecheck` には触らない**（`astro check`。Task 2 Step 2b で実在を確認済みで、Task 10 の CI がこれを実行する。biome は型チェックをしないため置き換えられない）。

- [ ] **Step 4: 二重の lint が残っていないことを確認する**

Run: `test ! -f eslint.config.js`
Run: `npm run lint`
Expected: どちらも exit 0（指摘が出たら `npm run format` で直してから再実行する）

- [ ] **Step 4b: `typecheck` が生き残っていることを確認する**

Run: `node -e "const s=require('./package.json').scripts; if(s.typecheck!=='astro check') { console.error('typecheck が失われた: '+s.typecheck); process.exit(1) } console.log('ok')"`
Run: `npm run typecheck`
Expected: どちらも exit 0

- [ ] **Step 5: コミットする**

```bash
git add -A
git commit -m "chore: lint と format を biome へ寄せる"
```

---

### Task 5: standards 適合の機械検知を作る

**Files:**
- Create: `scripts/check-standards.mjs`、`scripts/check-standards.test.mjs`

生成された Button は `focus-visible:ring-ring/50` と `rounded-[min(var(--radius-md),10px)]` を使い DESIGN.md §5 に違反する（実測 §7-8）。50 件生成すれば 50 件とも違反しうるため、目視でなく sensor で拾う。

**Interfaces:**
- Produces: `checkFile(path, source) -> {violations: Array<{rule, line, text}>}`。`rule` は `"focus-ring-opacity"` または `"arbitrary-value"`

- [ ] **Step 1: 失敗するテストを書く**

`scripts/check-standards.test.mjs`:

```js
import { test } from "node:test"
import assert from "node:assert/strict"
import { checkFile } from "./check-standards.mjs"

test("透明度を合成したフォーカスリングを検出する", () => {
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-3 focus-visible:ring-ring/50"`)
  assert.equal(violations.length, 1)
  assert.equal(violations[0].rule, "focus-ring-opacity")
})

test("許可済み例外の ring-[3px] は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="focus-visible:ring-[3px] focus-visible:ring-ring"`)
  assert.deepEqual(violations, [])
})

test("値系ユーティリティの arbitrary value を検出する", () => {
  const { violations } = checkFile("a.tsx", `className="rounded-[min(var(--radius-md),10px)]"`)
  assert.equal(violations.length, 1)
  assert.equal(violations[0].rule, "arbitrary-value")
})

test("値系ユーティリティなら bg と text も検出する", () => {
  const src = `className="bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-[0.8rem]"`
  const { violations } = checkFile("a.tsx", src)
  assert.equal(violations.length, 2)
})

// ここから 4 件は「正当な Tailwind の variant 構文」であり違反ではない。
// AUDIT.md の arbitrary value 検査は「値系ユーティリティのみ対象。
// data-[...] / aria-[...] 等の variant 構文は正当なので除外」と定めている。
// 素朴な /\b[a-z-]+-\[[^\]]+\]/ はこれらを誤検知し、実行者が
// Base UI の状態スタイルを推測で削る誤実装へ誘導する。
test("has-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="has-data-[icon=inline-end]:pr-1.5"`)
  assert.deepEqual(violations, [])
})

test("in-data- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="in-data-[slot=button-group]:rounded-lg"`)
  assert.deepEqual(violations, [])
})

test("not-aria- の variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="active:not-aria-[haspopup]:translate-y-px"`)
  assert.deepEqual(violations, [])
})

test("任意セレクタの variant 構文は違反にしない", () => {
  const { violations } = checkFile("a.tsx", `className="[&_svg]:pointer-events-none"`)
  assert.deepEqual(violations, [])
})

test("dark variant の宣言は違反にしない", () => {
  const { violations } = checkFile("a.css", `@custom-variant dark (&:is(.dark *));`)
  assert.deepEqual(violations, [])
})
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `node --test scripts/check-standards.test.mjs`
Expected: FAIL（`checkFile` が存在しない）

- [ ] **Step 3: 実装を書く**

`scripts/check-standards.mjs`:

```js
// DESIGN.md §5 の 2 規定を機械検知する。
// 1. フォーカスリングに透明度合成を使わない（WCAG 1.4.11 の 3:1 を割るため）
// 2. 値系ユーティリティの arbitrary value を使わない。
//    例外は ring-[3px] と @custom-variant dark のみ。
//    variant 構文（data-[...] / aria-[...] / [&_svg]:...）は AUDIT.md の
//    規定どおり対象外。
// AUDIT.md は components/ui/ を検査対象外としているが、それは shadcn から
// コピーして所有するだけのプロジェクト向けの規定。本リポジトリは
// components/ui/ そのものを standards へ正規化して配布する側なので、
// ここは意図的に対象へ含める。
import { readFileSync, globSync } from "node:fs"
import { pathToFileURL } from "node:url"

const RING_OPACITY = /\bring-(?:ring|[a-z-]+)\/\d+/g

// 値系ユーティリティだけを対象にする。プレフィックスの列挙は AUDIT.md の
// arbitrary value 検査コマンドから逐語で写した。
// has-data-[...] / in-data-[...] / not-aria-[...] / [&_svg]:... は
// 正当な variant 構文であり、この列挙に含まれないので自然に除外される。
const ARBITRARY =
  /\b(?:w|h|size|p[trblxy]?|m[trblxy]?|text|gap|z|top|left|right|bottom|inset|rounded|duration|leading|tracking|ring|border|shadow|bg|fill|stroke)-\[[^\]]+\]/g
const ALLOWED_ARBITRARY = new Set(["ring-[3px]"])

export function checkFile(path, source) {
  const violations = []
  source.split("\n").forEach((line, i) => {
    if (line.includes("@custom-variant dark")) return
    for (const m of line.matchAll(RING_OPACITY)) {
      violations.push({ rule: "focus-ring-opacity", line: i + 1, text: m[0] })
    }
    for (const m of line.matchAll(ARBITRARY)) {
      if (ALLOWED_ARBITRARY.has(m[0])) continue
      violations.push({ rule: "arbitrary-value", line: i + 1, text: m[0] })
    }
  })
  return { violations }
}

// pathToFileURL を使う。`file://${process.argv[1]}` の素朴な連結は
// パスに特殊文字を含む環境で一致しない。
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = globSync("src/**/*.{tsx,css}")
  if (files.length === 0) { console.error("走査対象が 0 件（glob が壊れている）"); process.exit(1) }
  let total = 0
  for (const f of files) {
    const { violations } = checkFile(f, readFileSync(f, "utf8"))
    for (const v of violations) {
      console.error(`${f}:${v.line}  ${v.rule}  ${v.text}`)
      total++
    }
  }
  if (total) { console.error(`\n${total} 件の standards 違反`); process.exit(1) }
  console.log(`standards 適合（${files.length} ファイルを検査）`)
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `node --test scripts/check-standards.test.mjs`
Expected: PASS（9 テスト）。**`ℹ pass 9` を目視で確認する**。0 件でも exit 0 になるため（実測: 一致しない指定では `tests 0` / exit 0）、件数を見ないと「テストが 1 つも走らなかった」を成功と読み違える

- [ ] **Step 5: 検知が実際に走り、違反を出すことを確認する（ベースライン）**

走査対象 0 件で素通りしていないことを、出力のファイル数で確かめる。

Run: `node scripts/check-standards.mjs`
Expected: **exit 1**。`src/components/ui/button.tsx` について、少なくとも次が列挙される（shadcn 4.16.0 の実生成物に対する実測値）。

| rule | 検出される文字列 |
|---|---|
| `focus-ring-opacity` | `ring-ring/50` |
| `focus-ring-opacity` | `ring-destructive/20` |
| `focus-ring-opacity` | `ring-destructive/40` |
| `arbitrary-value` | `rounded-[min(var(--radius-md),10px)]`（2 箇所）|
| `arbitrary-value` | `rounded-[min(var(--radius-md),12px)]`（2 箇所）|
| `arbitrary-value` | `text-[0.8rem]` |
| `arbitrary-value` | `bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]` |

**`has-data-[...]` / `in-data-[...]` / `not-aria-[...]` / `[&_svg]:...` が列挙に含まれていないことも確認する。** 含まれていたら正規表現が variant 構文を誤検知しており、Task 6 で正当なスタイルを削る誤実装に至る。含まれていたら Step 3 の `ARBITRARY` を見直す。

この出力が Task 6 の入力になる。

- [ ] **Step 6: コミットする**

```bash
git add scripts/check-standards.mjs scripts/check-standards.test.mjs
git commit -m "feat: DESIGN.md §5 の違反を機械検知する"
```

---

### Task 6: Button を standards に適合させ props 型を明示する

**Files:**
- Modify: `src/components/ui/button.tsx`

**Interfaces:**
- Consumes: Task 5 の `node scripts/check-standards.mjs`
- Produces: `export type ButtonProps`（`variant` と `size` を含む）、`Button`、`buttonVariants`

- [ ] **Step 1: 違反を確認する**

Run: `node scripts/check-standards.mjs`
Expected: exit 1。違反が列挙される

- [ ] **Step 2: フォーカスリングと透明度合成を standards の標準へ直す**

置換は**下の表の行だけ**を行う。実測した shadcn 4.16.0 の生成物に対する全件であり、表に無いものは推測で触らない。

| 置換前 | 置換後 | 理由 |
|---|---|---|
| `focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:ring-[3px] focus-visible:ring-ring` | DESIGN.md §5。light 背景で WCAG 1.4.11 の 3:1 を割る |
| `aria-invalid:ring-3 aria-invalid:ring-destructive/20` | `aria-invalid:ring-[3px] aria-invalid:ring-destructive` | 同上 |
| `dark:aria-invalid:ring-destructive/40` | `dark:aria-invalid:ring-destructive` | 同上 |
| `dark:aria-invalid:border-destructive/50` | `dark:aria-invalid:border-destructive` | 同じ透明度合成。`check-standards.mjs` は `ring-` しか見ないので**機械検知に出ない**。ここで手で直す |

- [ ] **Step 3: 値系の arbitrary value を除去する**

置換は**下の表の行だけ**を行う。**`has-data-[...]` / `in-data-[...]` / `not-aria-[...]` / `[&_svg]:...` には触らない** — これらは正当な Tailwind の variant 構文であり、Base UI の状態スタイルを実現している。削ると button-group やアイコン付きボタンの表示が壊れる。

| 置換前 | 置換後 | 理由 |
|---|---|---|
| `rounded-[min(var(--radius-md),10px)]`（2 箇所） | `rounded-md` | 角丸の乗算スケールは `templates/design-tokens.css` の `@theme inline` が正本。自前で補間しない |
| `rounded-[min(var(--radius-md),12px)]`（2 箇所） | `rounded-md` | 同上 |
| `text-[0.8rem]` | `text-xs` | サイズスケールもトークンが正本 |
| `hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]` | `hover:bg-secondary/80` | `--secondary` のホバー用トークンは存在しない。色計算をクラス側に持たず、セマンティックトークンの不透明度で表現する。**フォーカスリングではないため §5 の透明度合成禁止には当たらない**（禁止対象はリングのコントラスト） |

- [ ] **Step 4: props 型を名前付きで export する**

design-sync が読むのは `<Name>Props` であり、インライン型のままでは出力に現れない。

```tsx
export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 5: 検知が通ることを確認する**

Run: `node scripts/check-standards.mjs`
Expected: `standards 適合` と検査ファイル数が出力され exit 0

- [ ] **Step 5b: 正当な variant 構文を消して sensor を通していないことを確認する**

sensor を green にする最も安易な方法は、検知された文字列を含む行ごと削ることだ。それをすると Base UI の状態スタイルが消える。残っているべきものが残っていることを別途見る。

Run: `grep -c 'has-data-\[icon=inline-start\]' src/components/ui/button.tsx`
Run: `grep -c 'has-data-\[icon=inline-end\]' src/components/ui/button.tsx`
Run: `grep -c 'in-data-\[slot=button-group\]' src/components/ui/button.tsx`
Run: `grep -c 'not-aria-\[haspopup\]' src/components/ui/button.tsx`
Expected: すべて `1` 以上

Run: `grep -c 'ring-\[3px\]' src/components/ui/button.tsx`
Expected: `1` 以上（フォーカスリングを削除して逃げていない）

**Step 2 の 4 件が実際に消えたことを、負の検査で見る。** うち `dark:aria-invalid:border-destructive/50` は `check-standards.mjs` の対象外（sensor は `ring-` しか見ない）なので、この検査が唯一の観測手段になる。手作業を「やったつもり」で通さない。

Run: `grep -c 'ring-ring/50' src/components/ui/button.tsx`
Run: `grep -c 'aria-invalid:ring-destructive/20' src/components/ui/button.tsx`
Run: `grep -c 'aria-invalid:ring-destructive/40' src/components/ui/button.tsx`
Run: `grep -c 'aria-invalid:border-destructive/50' src/components/ui/button.tsx`
Expected: すべて `0`

- [ ] **Step 6: Base UI を参照していることを確認する**

Run: `grep -c '@base-ui/react' src/components/ui/button.tsx`
Expected: `1` 以上

- [ ] **Step 7: ビルドが壊れていないことを確認する**

Run: `npm run build`
Expected: exit 0

- [ ] **Step 8: コミットする**

```bash
git add src/components/ui/button.tsx
git commit -m "fix: Button を DESIGN.md §5 へ適合させ props 型を export する"
```

---

### Task 7: ライブラリビルドを足す

**Files:**
- Create: `src/index.ts`、`tsup.config.ts`、`types/dts-contract.ts`
- Modify: `package.json`、`package-lock.json`（`npm i -D tsup` が更新する）、`.gitignore`

design-sync がビルド出力の `.d.ts` から props 契約を読む。ビルドがないと synth-entry モードになり props が `{ [key: string]: unknown }` に潰れることを実測で確認済み（design §7-4）。publish はしないため `private: true` は維持する。

**Interfaces:**
- Consumes: Task 6 の `ButtonProps` / `Button` / `buttonVariants`
- Produces: `lib/index.js`（ESM）、`lib/index.d.ts`（`ButtonProps` を含む）

- [ ] **Step 1: バレルを作る**

`src/index.ts`:

```ts
export { Button, buttonVariants } from "./components/ui/button"
export type { ButtonProps } from "./components/ui/button"
```

- [ ] **Step 2: tsup を入れて設定する**

```bash
npm i -D tsup
```

`tsup.config.ts`:

```ts
import { defineConfig } from "tsup"

// 出力先は lib/。dist/ は Astro の outDir 既定値であり奪い合うと成果物が消える。
// ESM のみ。CJS を出さないのは PRODUCT_PLAYBOOK §15 が警告する
// exports マップの片側だけ壊れる失敗面を作らないため。
export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "lib",
  format: ["esm"],
  dts: true,
  external: ["react", "react-dom", "@base-ui/react"],
})
```

- [ ] **Step 3: `package.json` に script と exports を足し、`lib/` を gitignore する**

```json
{
  "types": "./lib/index.d.ts",
  "exports": {
    ".": { "types": "./lib/index.d.ts", "import": "./lib/index.js" },
    "./styles.css": "./src/styles/global.css"
  },
  "scripts": { "build:lib": "tsup" }
}
```

**トップレベルの `types` は省略できない。** design-sync は型の入口を `pj.types || pj.typings || 'index.d.ts'` の順で解決し、**`exports['.'].types` を読まない**（`lib/dts.mjs:90` を実読して確認）。`exports` にだけ書くと、`lib/index.d.ts` が実在してもルートの存在しない `index.d.ts` を見に行き、export 名の集合が空になる。`lib/index.js` は在るので synth-entry にも入らず、**コンポーネントを 1 件も発見できないまま `[ZERO_MATCH]` で停止する**。#1 の目的が達成されない。

`.gitignore` に `lib/` を追加する。

- [ ] **Step 4: ビルドする**

Run: `npm run build:lib`
Expected: exit 0

- [ ] **Step 5: `ButtonProps` が型として出力されていることを確認する**

`buttonVariants` の存在では代替できない。型名そのものを見る。

Run: `grep -c 'ButtonProps' lib/index.d.ts`
Expected: `1` 以上

- [ ] **Step 6: `ButtonProps` が `variant` / `size` を実際に持つことを型で検査する（本タスクの核心）**

**grep では検証できない。** `ButtonProps` と `variant` をファイル全体へ別々に grep すると、`buttonVariants` の宣言に `variant` が出るだけで通ってしまう。両者が同じ型に属することは型検査でしか示せない。実際 `ButtonProps` は `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>` であり、`variant` という文字列は `ButtonProps` の宣言行に現れない。

`types/dts-contract.ts` を作る。

```ts
// lib/index.d.ts が公開する props 契約を型で検査する。
// design-sync はこの .d.ts を読んで API 契約を組み立てるため、
// ここが潰れると設計エージェントが全コンポーネントで API を誤用する。
import type { ButtonProps } from "../lib/index.js"

// variant / size が ButtonProps から到達でき、実際の union を持つ
const variant: ButtonProps["variant"] = "secondary"
const size: ButtonProps["size"] = "sm"

// @ts-expect-error 未知の値は弾かれること。
// ButtonProps が { [key: string]: unknown } へ潰れていると
// ButtonProps["variant"] は unknown になり、この行はエラーにならない。
// その場合 tsc は「未使用の @ts-expect-error」として失敗するので、
// 潰れを検出できる。
const invalid: ButtonProps["variant"] = "存在しない variant"

export { variant, size, invalid }
```

Run: `npx tsc --noEmit --strict --module esnext --moduleResolution bundler --target es2022 --jsx react-jsx types/dts-contract.ts`
Expected: exit 0、出力なし

**失敗の読み分け**（どちらも「潰れている」を意味するので Task 6 の props 型 export とライブラリビルド設定へ戻る）:

- `Property 'variant' does not exist` → `ButtonProps` が `VariantProps` を合成していない
- `Unused '@ts-expect-error' directive` → `ButtonProps` が索引シグネチャへ潰れており、どんな値も通る状態

- [ ] **Step 6b: 索引シグネチャへの潰れを直接も確認する**

Run: `grep -c '\[key: string\]: unknown' lib/index.d.ts`
Expected: `0`

- [ ] **Step 7: Astro の出力と衝突していないことを確認する**

Run: `npm run build`
Run: `test -f lib/index.d.ts`
Expected: どちらも exit 0（Astro のビルド後もライブラリ出力が残っている）

- [ ] **Step 8: コミットする**

```bash
git add src/index.ts tsup.config.ts types/dts-contract.ts package.json package-lock.json .gitignore
git commit -m "feat: design-sync 用にライブラリビルドを足し props 契約を型で固定する"
```

---

### Task 8: registry を定義し法務ファイルを同梱する

**Files:**
- Create: `registry.json`、`scripts/sync-registry-tokens.mjs`、`scripts/check-distribution.mjs`、`scripts/check-distribution.test.mjs`、`scripts/check-completeness.mjs`、`scripts/check-completeness.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `public/r/button.json`（`files` に Button と法務ファイル 2 件を含む）、`public/r/LICENSE`、`public/r/THIRD_PARTY_LICENSES`（直接 URL 取得用の補助）

- [ ] **Step 1: `registry.json` を書く**

**法務ファイルを item の `files` に入れる。** PRODUCT_PLAYBOOK §15 は「配布物そのものに同梱する。リポジトリのルートに置くだけでは要件を満たさない」と定めている。registry における「配布物」とは `npx shadcn add` が利用者の手元へ**書き込むもの**であり、それは item の `files` に列挙されたものだけ。`public/r/` にファイルを並べても、URL で取れるだけで install されない。

`registry:file` 型は `target`（利用者側の書き込み先）が**必須**（shadcn 4.16.0 の schema を実読して確認）。`target` を `LICENSE` にすると利用者自身の `LICENSE` を上書きするため、名前空間を切った配下へ置く。

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "elchika-ui",
  "homepage": "https://github.com/elchika-inc/ui",
  "items": [
    {
      "$schema": "https://ui.shadcn.com/schema/registry-item.json",
      "name": "button",
      "type": "registry:ui",
      "title": "Button",
      "description": "Button component.",
      "files": [
        { "path": "src/components/ui/button.tsx", "type": "registry:ui" },
        { "path": "LICENSE", "type": "registry:file", "target": "elchika-ui/LICENSE" },
        { "path": "THIRD_PARTY_LICENSES", "type": "registry:file", "target": "elchika-ui/THIRD_PARTY_LICENSES" }
      ],
      "dependencies": ["@base-ui/react", "class-variance-authority"]
    }
  ]
}
```

`homepage` は #3 でドメインが決まるまで GitHub の URL を置く。

- [ ] **Step 1b: トークンを registry の配布物へ載せる**

**コードを配ってもトークンを配らなければ「同じ見た目」にならない。** registry item が配るのは `button.tsx` と法務ファイルだけで、`src/styles/global.css` の値は利用者へ届かない。利用者は自分の `components.json` が持つ既定トークンで描画するため、**コードは同じでも elchika の共有デザインにならない**。`package.json` の `./styles.css` export は npm publish しない設計なので、registry 利用者の取得経路にならない。

shadcn の registry item は `cssVars.light` / `cssVars.dark` を受け付ける（ローカルの shadcn 4.16.0 の型定義で確認）。`global.css` から機械的に生成して `registry.json` へ流し込む。**手で写さない**（写した値は CSS が変わっても据え置きになる。round 5 で同じ穴を踏んでいる）。

`scripts/sync-registry-tokens.mjs`:

```js
// src/styles/global.css の :root と .dark を読み、registry.json の各 item へ
// cssVars として流し込む。値を手で写さないための機構。
import { readFileSync, writeFileSync } from "node:fs"

const css = readFileSync("src/styles/global.css", "utf8")
const block = (sel) => {
  const m = css.match(new RegExp(`${sel}\\s*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) throw new Error(`${sel} ブロックが見つからない`)
  return Object.fromEntries(
    [...m[1].matchAll(/^\s*--([\w-]+):\s*([^;]+);/gm)].map(([, k, v]) => [k, v.trim()]),
  )
}
const light = block(":root")
const dark = block("\\.dark")
if (Object.keys(light).length === 0) throw new Error(":root からトークンを 1 件も読めていない")

const reg = JSON.parse(readFileSync("registry.json", "utf8"))
for (const item of reg.items) item.cssVars = { light, dark }
writeFileSync("registry.json", JSON.stringify(reg, null, 2) + "\n")
console.log(`${reg.items.length} item に ${Object.keys(light).length} 個のトークンを載せた`)
```

Run: `node scripts/sync-registry-tokens.mjs`
Expected: `1 item に N 個のトークンを載せた`（N は `global.css` の `:root` の実数）

Run: `node -e "const i=require('./registry.json').items[0];if(!i.cssVars?.light?.primary){console.error('cssVars.light.primary が無い');process.exit(1)}console.log(i.cssVars.light.primary)"`
Expected: `global.css` の `--primary` と同じ値が出力される

- [ ] **Step 2: build script を足す**

```json
{
  "scripts": {
    "build:site": "astro build",
    "registry:tokens": "node scripts/sync-registry-tokens.mjs",
    "registry:build": "npm run registry:tokens && shadcn build --output public/r",
    "registry:legal": "cp LICENSE THIRD_PARTY_LICENSES public/r/",
    "build": "npm run build:lib && npm run registry:build && npm run registry:legal && npm run build:site"
  }
}
```

**`build` を複合スクリプトにする。** scaffold の `build` は `astro build` だけで、`exports['.']` が指す `lib/index.js` を作らない。fresh checkout で `npm ci && npm run build` を実行しても `exports` が解決できない状態は、`exports` マップが壊れた配布物と同じ。design-sync も `exports['.']` を解決できないと `<pm> run build` を試し、それでも無ければ**人間に build コマンドを尋ねて止まる**（`non-storybook/SKILL.md` と `lib/bundle.mjs` の解決順を実読して確認）。

順序は round 5 で確定したとおり `registry:build` → `build:site`（Astro は build 時点の `public/` を `dist/` へコピーするため）。`build:lib` は独立なので先頭に置く。ここでの `&&` は「前が失敗したら止める」ための連結であり、Global Constraints が禁じている「合否判定の連結」ではない（`&&` は前段が失敗すれば全体が失敗する）。

CI は失敗箇所を特定するため個別ステップのまま実行する（`build:site` を呼ぶ。複合の `build` を呼ぶと registry を二重に作る）。

`registry:legal` は**直接 URL で取得したい人向けの補助**であり、これだけでは §15 を満たさない（install されないため）。§15 を満たすのは Step 1 の `files` エントリのほう。

- [ ] **Step 3: 同梱検査のテストを書く**

`scripts/check-distribution.test.mjs`:

```js
import { test } from "node:test"
import assert from "node:assert/strict"
import { checkDistribution } from "./check-distribution.mjs"

const ORIGIN = { LICENSE: "MIT 本文", THIRD_PARTY_LICENSES: "上流の連結" }
const entry = (target, content) => ({ path: target.split("/").pop(), type: "registry:file", target, content })

test("files に法務ファイルが無ければ検出する", () => {
  const { problems } = checkDistribution({ files: [{ path: "b.tsx", type: "registry:ui" }] }, ORIGIN)
  assert.deepEqual(problems, [
    "LICENSE: registry item の files に無い（install されない）",
    "THIRD_PARTY_LICENSES: registry item の files に無い（install されない）",
  ])
})

test("content が空なら同梱扱いにしない", () => {
  const item = { files: [entry("elchika-ui/LICENSE", ""), entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結")] }
  const { problems } = checkDistribution(item, ORIGIN)
  assert.deepEqual(problems, ["LICENSE: content が空"])
})

test("原本と内容が違えば検出する", () => {
  const item = {
    files: [entry("elchika-ui/LICENSE", "MIT 本文"), entry("elchika-ui/THIRD_PARTY_LICENSES", "改ざん")],
  }
  const { problems } = checkDistribution(item, ORIGIN)
  assert.deepEqual(problems, ["THIRD_PARTY_LICENSES: 原本と内容が一致しない"])
})

test("type が registry:file でなければ検出する", () => {
  const bad = { ...entry("elchika-ui/LICENSE", "MIT 本文"), type: "registry:ui" }
  const item = { files: [bad, entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結")] }
  const { problems } = checkDistribution(item, ORIGIN)
  assert.deepEqual(problems, ["LICENSE: type が registry:file でない"])
})

test("揃っていて原本と一致すれば問題なし", () => {
  const item = {
    files: [
      { path: "src/components/ui/button.tsx", type: "registry:ui", content: "..." },
      entry("elchika-ui/LICENSE", "MIT 本文"),
      entry("elchika-ui/THIRD_PARTY_LICENSES", "上流の連結"),
    ],
  }
  assert.deepEqual(checkDistribution(item, ORIGIN).problems, [])
})
```

- [ ] **Step 4: テストが失敗することを確認する**

Run: `node --test scripts/check-distribution.test.mjs`
Expected: FAIL

- [ ] **Step 5: 実装を書く**

`scripts/check-distribution.mjs`:

```js
// registry の「配布物」に法務ファイルが中身つきで同梱されているかを検査する。
// 配布物とは `npx shadcn add` が利用者の手元へ書き込むもの、すなわち
// registry item の files に列挙されたもの。public/r/ にファイルが
// 隣接しているだけでは install されないため要件を満たさない
// （PRODUCT_PLAYBOOK §15「リポジトリのルートに置くだけでは要件を満たさない」と同じ理由）。
import { readFileSync, existsSync } from "node:fs"
import { pathToFileURL } from "node:url"

const REQUIRED = ["LICENSE", "THIRD_PARTY_LICENSES"]

// item:   shadcn build が出力した registry item（public/r/<name>.json をパースしたもの）
// origin: リポジトリ直下の原本の { ファイル名: 内容 }
export function checkDistribution(item, origin) {
  const problems = []
  const files = item?.files ?? []
  for (const name of REQUIRED) {
    const e = files.find((f) => f.target === name || f.target?.endsWith(`/${name}`))
    if (!e) { problems.push(`${name}: registry item の files に無い（install されない）`); continue }
    if (e.type !== "registry:file") { problems.push(`${name}: type が registry:file でない`); continue }
    if (!e.content) { problems.push(`${name}: content が空`); continue }
    if (e.content !== origin[name]) { problems.push(`${name}: 原本と内容が一致しない`); continue }
  }
  return { problems }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ITEM = "public/r/button.json"
  if (!existsSync(ITEM)) { console.error(`${ITEM} が無い（registry:build を先に実行する）`); process.exit(1) }
  const item = JSON.parse(readFileSync(ITEM, "utf8"))
  const origin = {}
  for (const name of REQUIRED) {
    if (!existsSync(name)) { console.error(`原本 ${name} がリポジトリ直下に無い`); process.exit(1) }
    origin[name] = readFileSync(name, "utf8")
  }
  const { problems } = checkDistribution(item, origin)
  if (problems.length) {
    console.error(`配布物の検査に失敗:\n  ${problems.join("\n  ")}`)
    process.exit(1)
  }
  console.log(`配布物 OK（${item.files.length} files / 法務ファイル ${REQUIRED.length} 件が原本と一致）`)
}
```

- [ ] **Step 6: テストが通ることを確認する**

Run: `node --test scripts/check-distribution.test.mjs`
Expected: PASS（5 テスト）。`ℹ pass 5` を目視で確認する

- [ ] **Step 7: registry を出力して検査する**

Run: `npm run registry:build`
Run: `npm run registry:legal`
Run: `node scripts/check-distribution.mjs`
Expected: すべて exit 0。最後は `配布物 OK（3 files / 法務ファイル 2 件が原本と一致）` が出力される

- [ ] **Step 7b: 検査が「同梱漏れ」を実際に落とすことを確認する（sensor の空走ガード）**

sensor が本当に効いているかは、**わざと壊して落ちることを見る**しかない。通ることの確認だけでは、検査が何も見ていない場合と区別できない。

```bash
cp public/r/button.json /tmp/ui-item-backup.json
node -e '
const fs = require("node:fs")
const it = JSON.parse(fs.readFileSync("public/r/button.json", "utf8"))
it.files = it.files.filter((f) => !String(f.target ?? "").endsWith("/LICENSE"))
fs.writeFileSync("public/r/button.json", JSON.stringify(it, null, 2))
'
```

Run: `node scripts/check-distribution.mjs`
Expected: **exit 1**、`LICENSE: registry item の files に無い（install されない）` が出力される

```bash
cp /tmp/ui-item-backup.json public/r/button.json
```

Run: `node scripts/check-distribution.mjs`
Expected: exit 0（原状復帰した）

- [ ] **Step 7c: `npm run build` 一発で `exports` が満たされることを確認する**

利用者と design-sync が辿るのは個別スクリプトではなく標準の `build`。fresh checkout 相当の状態から確かめる。

```bash
rm -rf lib dist public/r
npm run build
```

Run:

```bash
node -e '
const fs = require("node:fs")
const pj = require("./package.json")
const targets = [...Object.values(pj.exports["."]), pj.types]
for (const v of targets) {
  if (!v) { console.error("types が未設定（design-sync が型入口を解決できない）"); process.exit(1) }
  if (!fs.existsSync(v.replace(/^\.\//, ""))) { console.error(`参照先が無い: ${v}`); process.exit(1) }
}
console.log("types と exports の参照先がすべて実在する")
'
```

Expected: `types と exports の参照先がすべて実在する` が出力され exit 0

Run: `test -f dist/r/button.json`
Expected: exit 0（複合ビルドの順序が正しく、registry が配信物へ入っている）

- [ ] **Step 8: リポジトリ外の別プロジェクトへコピーできることを確認する（本タスクの核心）**

ワークスペース内での確認を根拠にしない（PRODUCT_PLAYBOOK §15）。ローカル配信して外から引く。**削除は元のディレクトリへ戻ってから行う**（probe 内にいる状態で probe を消すと戻り先が消える）。

```bash
# export する。後続の node -e が process.env.UI_DIR で読むため、
# shell 変数のままだと undefined になる。
export UI_DIR="$(pwd)"
npx serve public -l 3001 &
SERVE_PID=$!
mkdir -p /tmp/registry-probe
cd /tmp/registry-probe
npx shadcn@latest init --template vite --base base --preset nova -y --no-monorepo --name probe
cd probe
# --overwrite は必須。vite テンプレートは App.tsx が Button を import しており、
# init の時点で src/components/ui/button.tsx が既に存在する（実測: 公式
# templates/vite-app/src/App.tsx が "We've already added the button component
# for you." と書いて Button を描画する）。--overwrite なしだと
# 「Would you like to overwrite?」（初期値 No）が出て、非対話では skip される。
# skip されると scaffold 由来の Button が残り、配布物の到達確認にならない。
npx shadcn@latest add --overwrite http://127.0.0.1:3001/r/button.json
```

Run: `grep -c 'ring-ring/50' src/components/ui/button.tsx`
Expected: `0`（**scaffold 由来のファイルが残っていない**。`1` なら上書きされておらず、以降の確認は配布物ではなく scaffold を見ていることになる）

Run: `test -f src/components/ui/button.tsx`
Run: `grep -c 'ring-\[3px\]' src/components/ui/button.tsx`
Expected: 前者は exit 0、後者は `1` 以上（standards 適合済みの内容が配られている）

**法務ファイルが利用者の手元まで届いていることを見る。** これが「配布物に同梱」の実体確認であり、ホスト側の `public/r/` に隣接していることでは代替できない。

Run: `test -s elchika-ui/LICENSE`
Run: `test -s elchika-ui/THIRD_PARTY_LICENSES`
Expected: どちらも exit 0（`registry.json` の `target` で指定した位置に書き込まれている）

Run: `grep -c 'Copyright (c) 20[0-9][0-9] elchika-inc' elchika-ui/LICENSE`
Run: `grep -c 'Source: https://raw.githubusercontent.com' elchika-ui/THIRD_PARTY_LICENSES`
Expected: 前者は `1`、後者は `2`（中身が原本と同じで、生成物にすり替わっていない）

Run: `test ! -f LICENSE`
Expected: exit 0（利用者自身の `LICENSE` を上書きする位置へ書き込んでいない。probe は `--add-readme` を使っていないので直下に `LICENSE` は無いはず）

**トークンが届いていることを見る。** コードだけ届いても共有デザインにならない。`cssVars` は利用者の CSS へ書き込まれる。

Run: `grep -c -- '--primary:' src/*.css src/**/*.css`
Expected: `1` 以上

Run:

```bash
node -e '
const fs = require("node:fs"), path = require("node:path")
// probe 側の CSS を集めて、elchika のトークン値が入っているかを見る。
const want = JSON.parse(fs.readFileSync(process.env.UI_DIR + "/registry.json", "utf8")).items[0].cssVars.light
const files = []
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const f = path.join(d, e.name)
  if (e.isDirectory()) walk(f); else if (f.endsWith(".css")) files.push(f)
})
walk("src")
const all = files.map((f) => fs.readFileSync(f, "utf8")).join("\n")
const missing = Object.entries(want).filter(([k, v]) => !all.includes(`--${k}: ${v}`))
if (missing.length) { console.error(`届いていないトークン ${missing.length} 件: ${missing.slice(0, 5).map(([k]) => k).join(", ")}`); process.exit(1) }
console.log(`${Object.keys(want).length} 個のトークンが利用者側へ届いている`)
'
```

Expected: `N 個のトークンが利用者側へ届いている` が出力され exit 0

**probe 側が実際にビルドできることも見る。** ソース文字列の一致は「コンパイルできる」を意味しない。

Run: `npm run build`
Expected: exit 0（取り込んだ Button を含むプロジェクトがビルドできる）

- [ ] **Step 8b: 「コンポーネントを足したら全経路に載る」検査を作る（#2 のための機構）**

ここまでの検査は Button 固定で、2 件目以降には効かない。`src/components/ui/` に `.tsx` を足して standards check と typecheck を通しただけで、**バレル export・`<Name>Props`・registry item・light/dark プレビューのどれかから欠落したまま CI が緑になる**。とくにバレル漏れは、design-sync が出荷 `.d.ts` の PascalCase value export をコンポーネント一覧の正本にするため、**同期時にその部品が丸ごと消える**。

`scripts/check-completeness.mjs`:

```js
// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 4 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { pathToFileURL } from "node:url"

const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")

export function checkCompleteness({ components, barrel, dts, registry, previewFiles }) {
  const problems = []
  for (const name of components) {
    const P = pascal(name)
    if (!barrel.includes(`./components/ui/${name}`)) problems.push(`${name}: src/index.ts から export されていない`)
    if (!dts.includes(`${P}Props`)) problems.push(`${name}: lib/index.d.ts に ${P}Props が無い`)
    if (!registry.items.some((i) => i.name === name)) problems.push(`${name}: registry.json に item が無い`)
    for (const suffix of ["", "-dark"]) {
      if (!previewFiles.includes(`${name}${suffix}.astro`)) problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`)
    }
  }
  return { problems }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const components = readdirSync("src/components/ui").filter((f) => f.endsWith(".tsx")).map((f) => f.replace(/\.tsx$/, ""))
  if (components.length === 0) { console.error("コンポーネントが 0 件（走査対象が壊れている）"); process.exit(1) }
  if (!existsSync("lib/index.d.ts")) { console.error("lib/index.d.ts が無い（build:lib を先に実行する）"); process.exit(1) }
  const { problems } = checkCompleteness({
    components,
    barrel: readFileSync("src/index.ts", "utf8"),
    dts: readFileSync("lib/index.d.ts", "utf8"),
    registry: JSON.parse(readFileSync("registry.json", "utf8")),
    previewFiles: readdirSync("src/pages/preview"),
  })
  if (problems.length) { console.error(`欠落:\n  ${problems.join("\n  ")}`); process.exit(1) }
  console.log(`${components.length} 件のコンポーネントが 4 経路すべてに載っている`)
}
```

**この検査は Task 9 でプレビューを作ってから通る。** ここではスクリプトとテストだけ置き、実行は Task 9 Step 12 の後に行う。

`scripts/check-completeness.test.mjs` に、欠落 4 種（バレル / Props / registry / プレビュー）をそれぞれ検出するテストと、揃っていれば問題なしとするテストを書く。

Run: `node --test scripts/check-completeness.test.mjs`
Expected: PASS（5 テスト）。`ℹ pass 5` を目視で確認する

`CONTRIBUTING.md` の「コンポーネントを追加・変更するときの規約」に次を追記する。

```markdown
新しいコンポーネントを追加したら、次の 4 経路すべてに載せる（`node scripts/check-completeness.mjs` が検査する）。

1. `src/index.ts` からの export と `export type <Name>Props`
2. `registry.json` の `items`
3. `src/previews/<name>.tsx` と `src/pages/preview/<name>.astro` / `<name>-dark.astro`
4. `provenance.json`（`PROVENANCE_DATE=$(date +%F) node scripts/record-provenance.mjs` で自動記録される）

そのうえで、追加したプレビューの両テーマを実ブラウザで検証してから PR を出す（AI_FIRST §2）。
```

- [ ] **Step 9: 後始末してコミットする**

**`public/r/` を `.gitignore` へ追加する。** `shadcn build` の生成物でありビルドで再現できる。加えて public リポジトリへコミットすると GitHub の raw URL から取得可能になり、**#1 の時点で registry を公開したのと同じ**になる。design §2 は公開デプロイを #4 と定め、配信ドメインは #3 で決まる。確定前の暫定 URL を利用者へ露出させると移行負債になる。

```bash
cd "$UI_DIR"
kill "$SERVE_PID"
rm -rf /tmp/registry-probe
printf 'public/r/\n' >> .gitignore
git add registry.json scripts/ package.json .gitignore CONTRIBUTING.md
git commit -m "feat: shadcn registry を定義し配布物へ法務ファイルを同梱する"
```

Run: `git check-ignore -q public/r`
Expected: exit 0（生成物が追跡対象になっていない）

---

### Task 9: 隔離プレビューを作る

**Files:**
- Create: `src/previews/button.tsx`、`src/pages/preview/button.astro`、`src/pages/preview/button-dark.astro`、`.docs/reviews/2026-07-31-button-preview.md`、`.docs/reviews/` 配下のスクリーンショット 6 件（3 route × 2 テーマ）

Storybook を置かず Astro の隔離ルートで描画確認する。**light と dark を別ページとして静的生成する。** Astro の prerendered page では build 時に search parameter を読めないため、`?theme=dark` では class を切り替えられない。

**Interfaces:**
- Produces: `dist/preview/button/index.html`（light）と `dist/preview/button-dark/index.html`（`<html class="dark">`）

- [ ] **Step 1: プレビュー本体を書く**

`src/previews/button.tsx`:

```tsx
import { Button } from "@/components/ui/button"

export function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button>保存する</Button>
      <Button variant="secondary">キャンセル</Button>
      <Button variant="outline">絞り込み</Button>
      <Button variant="ghost">詳細</Button>
      <Button variant="destructive">削除する</Button>
      <Button variant="link">利用規約</Button>
      <Button disabled>送信中</Button>
    </div>
  )
}
```

内容は実在の用途に沿った日本語にする（`foo` / `test` を使わない）。カードは人間が見て design agent が模倣する。

- [ ] **Step 2: light のルートを書く**

`src/pages/preview/button.astro`:

```astro
---
import { ButtonPreview } from "@/previews/button"
import "@/styles/global.css"
---
<html lang="ja">
  <head><meta charset="utf-8" /><title>Button</title></head>
  <body class="bg-background text-foreground">
    <ButtonPreview client:load />
  </body>
</html>
```

- [ ] **Step 3: dark のルートを書く**

`src/pages/preview/button-dark.astro`。`<html lang="ja" class="dark">` とする以外は Step 2 と同じ内容を書く（`class` 属性が唯一の差分）。

- [ ] **Step 4: 静的生成されることを確認する**

Run: `npm run build`
Run: `test -f dist/preview/button/index.html`
Run: `test -f dist/preview/button-dark/index.html`
Expected: すべて exit 0

- [ ] **Step 5: dark 側に `class="dark"` が出力されていることを確認する**

Run: `grep -c 'class="dark"' dist/preview/button-dark/index.html`
Expected: `1` 以上

- [ ] **Step 6: light 側に `class="dark"` が無いことを確認する**

Run: `grep -c 'class="dark"' dist/preview/button/index.html`
Expected: `0`

- [ ] **Step 7: 実装を先にコミットしてから配信する**

**検証はコミット済みの状態に対して行う。** 未コミットの作業ツリーで撮った証跡は、PR に入るコードを検証した証明にならない（AI_FIRST §2 が clean worktree を MUST にしているのは、この「PR と違うコードを検証する検証劇場」を防ぐため）。実装を先に確定させ、その SHA を証跡へ書く。

```bash
git add src/previews src/pages/preview
git commit -m "feat: 隔離プレビューを light と dark で静的生成する"
VERIFIED_SHA=$(git rev-parse HEAD)
echo "$VERIFIED_SHA"
```

Run: `git status --porcelain -- src/`
Expected: **出力なし**（`src/` に未コミットの変更が残っていない。残っていると、いま検証する `dist/` がコミット内容と対応しない）

この SHA からビルドし直して配信する。

```bash
rm -rf dist
npm run build
npx serve dist -l 3002 &
PREVIEW_PID=$!
```

`dist/` は静的サイトなので dev サーバは不要。DB を持たないため AI_FIRST §2 手順 1 の DB 隔離の論点は発生しない（`dev-data-safety: local`）。オーナーの作業ツリーを汚さないための worktree 分離も、本リポジトリはこのタスクが作った当のリポジトリであり守るべき別の作業ツリーが存在しないため適用しない。この解釈は Task 1 Step 8 の risk-registry に記録する。

Run: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/`
Run: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/preview/button/`
Run: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/preview/button-dark/`
Expected: 3 つとも `200`

ポート 3002 が使用中なら別番号にし、以降の URL をその番号に読み替える。`serve` が出力した実ポートを使う。

- [ ] **Step 8: 走査対象を確定する**

AI_FIRST §2 は走査スコープを次のように定めている。

- 共有コンポーネント（`components/ui/` 等）の変更は**全ページ走査**
- デザイントークン変更時は**全ページ × 両テーマ**

本サブプロジェクトは `src/components/ui/button.tsx` と `src/styles/global.css` の両方を変更しているため、**全 route × 両テーマ**が対象になる。`AGENTS.md` に列挙する route は 3 件で、そのすべてが対象。

| route | 内容 | Button を描画するか |
|---|---|---|
| `/` | カタログトップ。scaffold の `index.astro` が `@/components/ui/button` を import し `<Button client:load>` を描画する（実測で確認） | する |
| `/preview/button/` | 隔離プレビュー（light） | する |
| `/preview/button-dark/` | 隔離プレビュー（dark） | する |

`/preview/button/` と `/preview/button-dark/` は静的にテーマが決まっているが、`/` はテーマ切り替えを持たない。**両テーマを観測するため、ブラウザ側で `document.documentElement.classList.add("dark")` / `.remove("dark")` を評価してから観測する。** これは実行時の class 操作であり、`.dark` セレクタが実際に効くかを見る点で静的ページの検証と等価。

- [ ] **Step 9: 各 route × 各テーマを実ブラウザで検証する**

エージェントブラウザ（Playwright MCP / Claude in Chrome）で、下表の 6 通り（3 route × 2 テーマ）すべてに対して同じ項目を実行する。`/preview/button/` の dark と `/preview/button-dark/` の light は、Step 8 の class 操作で作る。

| 確認項目 | 手段 | Expected |
|---|---|---|
| Button が DOM に存在する | a11y スナップショット | `/preview/*` は `role=button` が **7 個**、`/` は **1 個** |
| アクセシブル名が付いている | 同上 | `/preview/*` は「保存する」「キャンセル」「絞り込み」「詳細」「削除する」「利用規約」「送信中」、`/` は「Button」が名前として読める |
| `disabled` が伝わっている | 同上 | `/preview/*` で「送信中」が disabled として現れる（`/` は対象外）|
| console にエラー・警告が無い | console メッセージ取得 | error と warning が **0 件** |
| **ネットワークエラーが無い** | ネットワークリクエスト一覧を取得 | 失敗したリクエストが **0 件**、かつ status が 4xx / 5xx のものが **0 件**。1 件でもあれば失敗した URL を記録する（AI_FIRST §2 手順 4 が「表示崩れ・console error・ネットワークエラー」を MUST としている。route 本体の 200 と console 0 件は、フォント・CSS・JS 等のサブリソース失敗を独立には証明しない）|
| トークンが効いている | `getComputedStyle(document.body).backgroundColor` を評価 | 値を記録する（Step 10 で比較する）|
| キーボードで到達できる | `Tab` を押して `document.activeElement.tagName` と `textContent` を評価 | 最初の Button にフォーカスが移る |
| フォーカスリングが透明合成でない | 下記のスクリプトで**可視レイヤーだけ**を判定 | 可視レイヤーが 1 枚以上あり、そのどれもが 1 未満の alpha を持たない |
| **横スクロールが発生していない** | `document.documentElement.scrollWidth <= window.innerWidth` を評価 | `true` |
| **全 Button が可視の矩形を持つ** | 各 Button の `getBoundingClientRect()` を評価 | すべて `width > 0` かつ `height > 0` |
| **文字が背景に埋もれていない** | 各 Button の `getComputedStyle(el)` の `color` と `backgroundColor` を評価 | 同一の値になっているものが **0 個** |
| スクリーンショット | 撮影 | 下表のファイル名で `.docs/reviews/` に保存 |

**フォーカスリングの判定は `boxShadow` 全体を見ない。** Tailwind は可視リングとは別に、常に 4 枚の透明ゼロ幅レイヤー（`--tw-inset-shadow` / `--tw-inset-ring-shadow` / `--tw-ring-offset-shadow` / `--tw-shadow`、初期値 `0 0 #0000`）を `box-shadow` へ連結する（実測: 生成 CSS が `box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)` を出力し、フォーカス時の計算値に `rgba(0, 0, 0, 0)` のレイヤーが 4 枚現れる）。文字列全体で「alpha < 1 を含まない」を判定すると、**正しく opaque に直したリングでも必ず失敗する**。

透明レイヤーを落としてから、残った可視レイヤーだけを見る。フォーカス中の Button に対して次を評価する。

```js
const cs = getComputedStyle(document.activeElement)
// カンマで分割する。ただし rgb()/rgba()/color-mix() の中のカンマでは割らない。
const layers = cs.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim())
// リングがそもそも描画されていないと boxShadow は "none" になる。
// "none" を可視レイヤーとして数えると、リングを削除した実装でも
// 「1 件以上あるので描画されている」と誤判定する（実測: passes=true になる）。
// 完全透明なレイヤーと "none" を、どちらも判定対象から外す。
const visible = layers.filter((x) => x !== "none" && !x.includes("rgba(0, 0, 0, 0)"))
// 残ったレイヤーに 1 未満の alpha が入っていれば透明度合成。
const translucent = visible.filter((x) => /rgba?\([^)]*,\s*0?\.\d+\s*\)/.test(x))
JSON.stringify({ layers: layers.length, visible, translucent })
```

Expected: `visible` が **1 件以上**（リングが実際に描画されている）かつ `translucent` が **0 件**。

- `visible` が 0 件（`boxShadow` が `none` の場合を含む）→ リングが描画されていない。Task 6 Step 2 でリングごと消してしまっている
- `translucent` が 1 件以上 → 透明度合成が残っている。その文字列を手がかりに Task 6 Step 2 の置換表へ戻る

「表示崩れが無い」を主観で判定しない。上の 3 項目（横スクロール・矩形・色）が観測可能な判定条件であり、**どれかが Expected を外れたら崩れとして扱い、Task 6 のクラス置換へ戻る**。

ネットワークエラーが出た場合は、フォント（Geist Variable）やスタイルの読み込み失敗が最も疑わしい。**失敗を残したまま「表示は問題ない」で通さない** — フォントが落ちてフォールバックで描画されていても見た目は成立してしまう。

スクリーンショットのファイル名:

| route | light | dark |
|---|---|---|
| `/` | `index-light.png` | `index-dark.png` |
| `/preview/button/` | `button-preview-light.png` | `button-preview-light-forced-dark.png` |
| `/preview/button-dark/` | `button-preview-dark-forced-light.png` | `button-preview-dark.png` |

- [ ] **Step 10: テーマが実際に切り替わっていることを確認する**

`class="dark"` が HTML に出ていること（Step 5）は、**トークンが切り替わったことを意味しない**。CSS が読み込まれていなくても class は出る。計算後の色で確かめる。

Step 9 で各 route × 各テーマについて記録した `backgroundColor` を比較する。
Expected: **同一 route の light と dark で値が異なる**（3 route すべてで）。同一なら `global.css` が読み込まれていないか `.dark` セレクタが効いていない。その場合は Task 3 のトークン取り込みと各 `.astro` の `import "@/styles/global.css"` へ戻る

- [ ] **Step 11: 証跡マトリクスを書き出す**

AI_FIRST §2 は **route × テーマ × チェック項目のマトリクス**での報告を MUST としている。`.docs/reviews/2026-07-31-button-preview.md` に次の表を実測値で埋めて書く。**`—` を残さない**（全ページ × 両テーマが要求されているため、空欄は未実施を意味する）。`✅` は Step 9〜10 で実際に観測できたものにだけ付ける。

```md
検証した commit: <VERIFIED_SHA>

| route | light | dark | console | network | a11y tree | keyboard | 崩れ |
|---|---|---|---|---|---|---|---|
| /                     | ✅ index-light.png | ✅ index-dark.png | ✅ 0 件 | ✅ 失敗 0 件 | ✅ button 1 個 | ✅ Tab で到達 | ✅ |
| /preview/button/      | ✅ button-preview-light.png | ✅ button-preview-light-forced-dark.png | ✅ 0 件 | ✅ 失敗 0 件 | ✅ button 7 個 | ✅ Tab で到達 | ✅ |
| /preview/button-dark/ | ✅ button-preview-dark-forced-light.png | ✅ button-preview-dark.png | ✅ 0 件 | ✅ 失敗 0 件 | ✅ button 7 個 | ✅ Tab で到達 | ✅ |
```

`<VERIFIED_SHA>` は Step 7 で記録した実装コミットの SHA を書く。**この記述が、証跡とコードを束縛する唯一の手段。**

同じファイルに、Step 10 で比較した 6 通りの `backgroundColor` の実測値を併記する。

- [ ] **Step 12: 配信を止めて証跡をコミットする**

```bash
kill "$PREVIEW_PID"
git add .docs/reviews
git commit -m "docs: 隔離プレビューの実ブラウザ検証の証跡を記録する"
```

Run: `test -s .docs/reviews/2026-07-31-button-preview.md`
Run: `test "$(ls .docs/reviews/*.png | wc -l)" -eq 6`
Expected: どちらも exit 0（6 通りすべての証跡が実体として残っている）

Run: `grep -c "$VERIFIED_SHA" .docs/reviews/2026-07-31-button-preview.md`
Expected: `1` 以上（証跡が検証対象のコミットに束縛されている）

Run: `grep -c '—' .docs/reviews/2026-07-31-button-preview.md`
Expected: `0`（未実施のセルが残っていない）

- [ ] **Step 13: 4 経路の網羅検査を初めて通す**

Task 8 Step 8b で作った検査は、プレビューが揃って初めて成立する。ここで通す。

Run: `node scripts/check-completeness.mjs`
Expected: `1 件のコンポーネントが 4 経路すべてに載っている` が出力され exit 0

**落ちたら**、出力が名指しした経路（バレル / `<Name>Props` / registry / プレビュー）へ戻って足す。この検査が #2 で 50 件を足すときの安全網になるので、ここで通ることを確かめておく。

---

### Task 10: CI とエージェント契約を置く

**Files:**
- Create: `.github/workflows/ci.yml`、`AGENTS.md`、`CLAUDE.md`、`README.md`、`.design-sync/config.json`、`.docs/reviews/2026-07-31-donecriteria.md`

**Interfaces:**
- Consumes: Task 2 の `provenance.json`（`sourceUrl` / `upstreamPathSha` / `registryContentSha256` / `license` を PR 本文へ転記する）、Task 2 Step 2b の `typecheck` script、Task 7 の `types/dts-contract.ts`、Task 9 Step 11 の証跡マトリクス

- [ ] **Step 1: CI を書く**

`.github/workflows/ci.yml` を逐語で置く。**ステップ名がそのまま Step 7 の検証対象になる**ため、名前を変えない。

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, typecheck, test & build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22.12.0"
          cache: npm

      # 各コマンドを個別ステップにする。&& で連結すると exit code が
      # 最後のコマンドのものになり、途中の失敗が消える。
      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      # node --test に裸のディレクトリを渡すと glob pattern として解釈され、
      # `scripts` というモジュールを実行しようとして必ず失敗する（実測）。
      # かつ glob が 0 件一致でも tests 0 / exit 0 になるため（実測）、
      # 「テストが実際に走ったか」を出力の件数で確かめる。
      # **ファイル数を定数で書かない** — テストを 1 本足すたびにここがずれ、
      # 実際にずれた（round 13 で check-completeness.test.mjs を足したとき）。
      # 出力から読めば、本数が増えても減っても正しく判定できる。
      # GitHub Actions の run は bash -e なので、前段が失敗すればステップごと落ちる。
      - name: Unit tests
        run: |
          node --test "scripts/*.test.mjs" > /tmp/ui-tests.txt 2>&1
          cat /tmp/ui-tests.txt
          grep -qE '^. tests [1-9]' /tmp/ui-tests.txt

      - name: Standards check
        run: node scripts/check-standards.mjs

      # registry を先に作る。Astro は build 時点の public/ を dist/ へコピーするため、
      # build のあとに public/r を生成しても dist/ には入らない（実測: public/r/x.json →
      # dist/r/x.json になるのは build 前に置いた場合だけ）。Astro サイトが registry の
      # 配信も兼ねる設計なので、順序を逆にすると配信物が丸ごと欠ける。
      - name: Build registry
        run: npm run registry:build

      - name: Bundle legal files
        run: npm run registry:legal

      - name: Distribution check
        run: node scripts/check-distribution.mjs

      - name: Build library
        run: npm run build:lib

      - name: Props contract
        run: npx tsc --noEmit --strict --module esnext --moduleResolution bundler --target es2022 --jsx react-jsx types/dts-contract.ts

      # lib/index.d.ts を読むので Build library の後ろに置く。
      - name: Completeness check
        run: node scripts/check-completeness.mjs

      - name: Build site
        run: npm run build:site

      # dist/ が registry を配信できる状態かを見る。public/ に置いたことと
      # dist/ に入ったことは別の事実。
      - name: Dist registry check
        run: |
          test -f dist/r/button.json
          test -f dist/r/LICENSE
          test -f dist/r/THIRD_PARTY_LICENSES
          cmp dist/r/button.json public/r/button.json
```

**DOCS_OPS §6 との関係**: §6 の役割分担は「PR はビルドチェックのみ、フルセットは main push」と定める。本リポジトリはこれを意図的に逸脱し、PR でフルセットを走らせる。理由と代償は Task 1 Step 8 で `.docs/risk-registry.md` に受容エントリとして記録済み。**この逸脱を記録せずにこの workflow を置かない。**

- [ ] **Step 2: `AGENTS.md` を書く**

standards のローカル clone の `templates/AGENTS.md.template` を基にする。次を明記する。

`templates/AGENTS.md.template` の placeholder は次のとおり埋める。**`<...>` を 1 つも残さない。**

| placeholder | 埋める内容 |
|---|---|
| `<project>` | `ui` |
| `<1行説明と関連資産へのリンク>` | `elchika-inc の共有 UI コンポーネント。Base UI + Tailwind CSS v4。shadcn registry で配布する。` |
| `<言語、フレームワーク、インフラ>` | `Astro 7 / React 19 / TypeScript / Base UI (@base-ui/react) / Tailwind CSS v4 / Biome。パッケージマネージャは npm` |
| `<ディレクトリ、モジュール、主要データフロー>` | 本計画の「File Structure」表を転記する |
| `<制約、禁止事項、その理由>` | ①`main` へ直接コミットしない ②生の色指定と値系 arbitrary value を使わない ③フォーカスリングに透明度合成を使わない ④`private: true` を外して npm publish しない ⑤外部から移植したコードは `provenance.json` に来歴を記録する |
| `<コマンド>`（Key Commands） | 下の Key Commands の 3 行 |
| `<local \| shared>` | `local` |
| `<protected \| human-bypass \| unprotected>` | `protected` |
| `<アクセスURL>` | `http://localhost:4321/` |
| `<説明>`（routes 各行） | 下の routes の 3 行 |
| `<YYYY-MM-DD (rev.N)>` | `~/projects/naoto24kawa/standards/CHANGELOG.md` の先頭 rev と日付を**実際に読んで**書く。推測しない |

placeholder ではないが、別スタック前提の固定行が 1 つある。これも差し替える（`<...>` スキャンには掛からない）。

| テンプレートの記述 | 差し替え後 |
|---|---|
| `- スタック: Cloudflare Webサービス系（pnpm + Vite Plusモノレポ）。` | `- スタック: Astro 7 + React 19 の単一ルート。パッケージマネージャは npm。配布は shadcn registry（npm publish しない）。` |

確定値は次のとおり。

- `standards_version`: 上表のとおり CHANGELOG から読んだ値
- `branch_policy`: **`protected`**（public リポジトリのため GitHub の ruleset が利用できる。DOCS_OPS §5 の定義は「PR 必須で、直 push の bypass を設けない」）
- `dev-data-safety`: **`local`**。AI_FIRST §4 が定める値は `local` と `shared` の**二択**であり、第三の値を発明しない。本リポジトリは DB を一切持たないため、dev の自動起動は安全であり `local` が正しい（宣言なしは `shared` 扱いになり自動 QA が回らなくなる）
- dev 起動コマンド: `npm run dev`。アクセス URL: `http://localhost:4321/`（Astro dev の既定ポート。portless ではないため URL を明記して契約を満たす）
- routes（AI_FIRST §4 が MUST とする走査対象の列挙）:
  - `/` — カタログトップ
  - `/preview/button/` — Button の隔離プレビュー（light）
  - `/preview/button-dark/` — Button の隔離プレビュー（dark）
- Base UI を基底層に採用した判断
- Storybook を置かず Astro の隔離プレビューで代替する判断
- Key Commands: `test` = `node --test "scripts/*.test.mjs"`、`check` = `npm run lint` + `npm run typecheck`、`deploy` = `N/A（配信先はサブプロジェクト #3 で決まる。#1 の時点でデプロイ対象を持たない）`。AI_FIRST §4 は該当しないコマンドの省略を禁じ、`N/A（理由）` の明記を要求している

- [ ] **Step 3: `CLAUDE.md` と `README.md` を書く**

`templates/CLAUDE.md.template` と `templates/README.template.md` を基にする。テンプレートには placeholder が残っているため、次の表のとおり差し替える。**推測で埋める余地を残さない。**

| placeholder | 差し替え後 |
|---|---|
| `<project>` | `ui` |
| `<owner>` | `elchika-inc` |
| `<repo>` | `ui` |
| `<your-name>` | `elchika-inc` |
| `<一行説明 — 何をするツール/サービスか>` | `elchika-inc の共有 UI コンポーネントライブラリ` |
| `<概要 — 2〜3 文。...>` | `Base UI と Tailwind CSS v4 で作った UI コンポーネント集。elchika-inc の各プロダクトが同じ見た目と操作性を共有するための正本。npm publish はせず shadcn の custom registry で配布し、利用側はソースをコピーして所有する。` |
| `<主要機能 1>` | `Base UI ベースのアクセシブルなコンポーネント` |
| `<主要機能 2>` | `standards のデザイントークンを同梱（light / dark 対応）` |
| `<主要機能 3>` | `shadcn CLI でコピー取得できる registry 配布` |
| `<認証方式>` | **セクションごと削除**（認証を実装しないため。テンプレートのコメントが「なければ削除」と指示している）|
| `[Demo](https://<your-domain>)` | **行ごと削除**（配信ドメインはサブプロジェクト #3 で決まる）|
| Deploy バッジの行（`deploy.yml` を指す）| **行ごと削除**（`deploy.yml` を持たない）|

**角括弧を使っていない placeholder が 1 つある。** standards バッジの `YYYY--MM--DD_(rev.N)` は `<...>` の形をしていないため、Step 3b の網羅スキャンに掛からない。ここだけは個別に差し替える。

| テンプレートの記述 | 差し替え後 |
|---|---|
| `[![standards](https://img.shields.io/badge/standards-YYYY--MM--DD_(rev.N)-blue)](...)` | `YYYY--MM--DD_(rev.N)` を CHANGELOG の先頭 rev と日付に置換（例: `2026--07--31_(rev.46)`）。**`AGENTS.md` の `standards_version` と同じ値にする**（DOCS_OPS §1 が同期を求めている）|

`<usage example>` は**行だけを置換しない**。テンプレートでは次の 3 行の fence 内に置かれており、置換内容が自前の fence を含むため、placeholder だけを差し替えると fence が入れ子になって README が壊れる。

````markdown
```bash
<usage example>
```
````

**この 3 行をまとめて削除し、下記の導入手順ブロックに置き換える。**

テンプレートに残る**別スタック前提のコマンド**も差し替える。README テンプレートは pnpm / Vite Plus 系を前提にしているが、本リポジトリは npm + Astro であり、そのままだと動かない手順を配ることになる。

| テンプレートの記述 | 差し替え後 |
|---|---|
| `Node 20+` | `Node 22.12.0+` |
| `pnpm 9+` の行 | **行ごと削除**（npm を使う）|
| `pnpm install` | `npm ci` |
| `vp run -r dev` | `npm run dev` |
| `# → http://<project>.localhost/ でアクセス` | `# → http://localhost:4321/ でアクセス（Astro dev の既定ポート）` |
| `vp check` | `npm run lint` と `npm run typecheck` |
| `vp test` | `node --test "scripts/*.test.mjs"` |
| `vp build` | `npm run build` と `npm run build:lib` |
| `vp run -r deploy` を含むデプロイ手順 | **セクションごと削除**（#1 の時点で配信先を持たない）|

テンプレートの `### Architecture` にある**モノレポ構成のコードブロックも置換する**。`apps/web`・`apps/api`・`packages/core`・`packages/ui` は Vite Plus モノレポ前提の逐語であり、placeholder でも `pnpm`/`vp` でもないため、Step 3b の検査をすり抜ける。放置すると存在しないパスへ読者を誘導する。

````markdown
```
src/
  components/ui/   # 部品本体（registry で配布する正本）
  previews/        # 隔離プレビューの中身
  pages/           # Astro のルート（カタログとプレビュー）
  styles/          # standards のデザイントークン
  index.ts         # ライブラリのバレル
scripts/           # 来歴記録・standards 適合検知・配布物検査
types/             # ビルド出力の props 契約を検査する型テスト
public/r/          # shadcn build の出力（registry の配信物）
```
````

`<usage example>` に入れる導入手順（registry からの取り込み）:

**利用者向けの registry URL をここに書かない。** 配信ドメインは #3 で確定し、公開デプロイは #4。確定前の暫定 URL を案内すると、利用者の `components.json` に書かれた値を後から全件直すことになる（design §9）。代わりに現状と、貢献者がローカルで確かめる手順を書く。

````markdown
## 利用方法

registry はまだ公開していない。配信 URL はサブプロジェクト #3 でドメインを確定してから、このセクションに追記する。

貢献者がローカルで取り込みを確かめる場合は、このリポジトリで registry を生成してから配信する。

```bash
npm ci
npm run build
npx serve public -l 3001
```

別のプロジェクトから取り込む。

```bash
npx shadcn@latest add --overwrite http://127.0.0.1:3001/r/button.json
```
````

- [ ] **Step 3c: `.design-sync/config.json` を置く**

design-sync は CSS の入口を `cfg.cssEntry` → shape adapter の `src.cssEntry` → `build/esm/styles.css` / `dist/styles.css` / `dist/style.css` / ルート `styles.css` の順で探し、**`exports['./styles.css']` を読まない**（`package-build.mjs` の候補列挙を実読して確認）。本リポジトリのトークンは `src/styles/global.css` にあり、どの既定候補にも当たらない。

置かないと CSS が空のまま runtime placeholder が書かれ、`package-validate.mjs` は `[CSS_RUNTIME]` の warning として**通してしまう**。つまり「トークンが入っていない bundle」が gate を通る。

```json
{
  "shape": "package",
  "cssEntry": "src/styles/global.css"
}
```

`projectId` と `pkg` はサブプロジェクト #5 で同期を実行するときに追記される。ここでは shape と CSS 入口だけを確定させる。

Run: `node -e "const c=require('./.design-sync/config.json');if(c.cssEntry!=='src/styles/global.css'){console.error('cssEntry が違う: '+c.cssEntry);process.exit(1)}console.log('ok')"`
Run: `test -f src/styles/global.css`
Expected: どちらも exit 0

- [ ] **Step 3b: placeholder が残っていないことを確認する（列挙でなく網羅で見る）**

既知の placeholder 名を列挙して grep すると、**列挙から漏れたものを見逃す**。テンプレートには表に書ききれない `<一行説明 — ...>` 形式が多数あるため、「`<...>` の形をしたものがゼロ件」を条件にする。HTML コメント（`<!--`）と閉じタグ（`</`）は除外する。

Run: `grep -nE '<[^!/][^>]*>' README.md AGENTS.md CLAUDE.md SECURITY.md CONTRIBUTING.md`
Expected: **ヒットなし**（`grep` は 0 件で exit 1 を返す）

ヒットが出た行の扱いは 2 通りしかない。**実値へ差し替える**か、**その記述ごと削除する**か。テンプレートの案内コメント内に残っている穴埋め記法も、判断に使い終わったら削除する。「コメントだから残してよい」と解釈しない — 残すと次に読む人が未完成のドキュメントと区別できない。処理してから再実行する。

別スタック前提のコマンドが残っていないことも見る。

Run: `grep -c 'pnpm\|vp check\|vp test\|vp build\|vp run\|localhost/' README.md AGENTS.md CLAUDE.md`
Expected: 3 ファイルとも `0`

Run: `grep -c 'deploy.yml' README.md`
Expected: `0`（存在しない workflow のバッジが残っていない）

角括弧を使わない placeholder とモノレポ構成が残っていないことも見る（どちらも `<...>` スキャンに掛からない）。

Run: `grep -c 'YYYY--MM--DD\|rev.N' README.md`
Expected: `0`

Run: `grep -c 'apps/web\|apps/api\|packages/core' README.md`
Expected: `0`

Run: `grep -c 'src/components/ui/' README.md`
Expected: `1` 以上（実構成の Architecture に置き換わっている）

バッジと `standards_version` が同じ値であることを見る（DOCS_OPS §1）。

Run:

```bash
node -e '
const fs = require("node:fs")
const readme = fs.readFileSync("README.md", "utf8")
const agents = fs.readFileSync("AGENTS.md", "utf8")
const badge = readme.match(/badge\/standards-(\d{4})--(\d{2})--(\d{2})_\(rev\.(\d+)\)/)
if (!badge) { console.error("README の standards バッジが未差し替え"); process.exit(1) }
const [, y, m, d, rev] = badge
const want = `${y}-${m}-${d} (rev.${rev})`
if (!agents.includes(want)) { console.error(`AGENTS.md の standards_version がバッジと不一致。バッジ側: ${want}`); process.exit(1) }
console.log(`standards_version 一致: ${want}`)
'
```

Expected: `standards_version 一致: ...` が出力され exit 0

Markdown の fence が壊れていないことを見る（`<usage example>` の置換で入れ子にすると壊れる）。

Run: `test "$(grep -c '^```' README.md)" -gt 0`
Run: `node -e 'const n=require("node:fs").readFileSync("README.md","utf8").split("\n").filter(l=>/^```/.test(l)).length; if(n%2!==0){console.error("fence の数が奇数: "+n);process.exit(1)} console.log("fence ok: "+n)'`
Expected: どちらも exit 0（fence が偶数個で閉じている）

AI_FIRST §4 が MUST とする契約項目が実在することも見る。

Run: `grep -c 'standards_version' AGENTS.md`
Run: `grep -c 'branch_policy: `protected`' AGENTS.md`
Run: `grep -c 'dev-data-safety: local' AGENTS.md`
Run: `grep -c 'http://localhost:4321/' AGENTS.md`
Run: `grep -c '/preview/button-dark/' AGENTS.md`
Run: `grep -c 'N/A' AGENTS.md`
Expected: すべて `1` 以上（順に standards_version / branch_policy / dev-data-safety / アクセス URL / routes / Key Commands の `N/A（理由）`）

- [ ] **Step 4: branch protection を実際に有効にする**

`branch_policy: protected` と宣言するだけでなく設定を入れる。**作成は `POST`**（`PUT` はリポジトリ ruleset の更新用で、collection endpoint には無い）。`pull_request` rule は `parameters` が必須で、省略すると 422 になる。

```bash
gh api -X POST repos/elchika-inc/ui/rulesets --input - <<'JSON'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    }
  ]
}
JSON
```

`required_approving_review_count` は `0` にする。単独運用のリポジトリで `1` 以上にすると、GitHub は自分の PR を自分で承認できないため、オーナー自身がマージできなくなる。DOCS_OPS §5 の `protected` が要求するのは「PR 必須」と「bypass を設けない」であり、承認数は規定していない。

**422 が返った場合**: レスポンス body に不足している parameter 名が入る。その名前を上記 `parameters` に足して再実行する。名前を推測して足さない。

- [ ] **Step 5: ruleset の中身を検査する（名前と enforcement では代替しない）**

`name` が `main` で `enforcement` が `active` なだけの別 ruleset でも素通りするため、実体を見る。collection の GET は `rules` を返さないので、ID を引いてから個別に GET する。

```bash
RULESET_ID=$(gh api repos/elchika-inc/ui/rulesets --jq '.[] | select(.name=="main") | .id')
gh api "repos/elchika-inc/ui/rulesets/$RULESET_ID" > /tmp/ui-ruleset.json
```

Run: `test -n "$RULESET_ID"`
Expected: exit 0（`main` という名前の ruleset が実在する）

Run:

```bash
node -e '
const r = require("/tmp/ui-ruleset.json")
const fail = (m) => { console.error(m); process.exit(1) }
if (r.target !== "branch") fail(`target が branch でない: ${r.target}`)
if (r.enforcement !== "active") fail(`enforcement が active でない: ${r.enforcement}`)
const inc = r.conditions?.ref_name?.include ?? []
if (!inc.includes("refs/heads/main")) fail(`main を対象にしていない: ${JSON.stringify(inc)}`)
const pr = (r.rules ?? []).find((x) => x.type === "pull_request")
if (!pr) fail("pull_request rule が無い（PR 必須になっていない）")
// 承認数は 0 でなければならない。単独運用では自分の PR を自分で承認できないため、
// 1 以上だとオーナー自身がマージできなくなる（計画 Step 4 の判断）。
// rule の存在だけを見ると、この値がずれていても「protected」と判定してしまう。
const approvals = pr.parameters?.required_approving_review_count
if (approvals !== 0) fail(`required_approving_review_count が 0 でない: ${approvals}`)
if ((r.bypass_actors ?? []).length !== 0) fail(`bypass_actors が空でない: ${JSON.stringify(r.bypass_actors)}`)
console.log("protected の条件をすべて満たす")
'
```

Expected: `protected の条件をすべて満たす` が出力され exit 0

不一致で止まった場合は Step 4 の body を直して ruleset を作り直す（既存を消すには `gh api -X DELETE "repos/elchika-inc/ui/rulesets/$RULESET_ID"`）。

- [ ] **Step 6: PR を出し、来歴の申告を実態どおりに埋める**

```bash
git add -A
git commit -m "chore: CI とエージェント契約を置く"
git push -u origin feat/foundation
```

**`gh pr create --fill` を使わない。** `--fill` は「コミット情報で title と body を埋める」フラグであり、`.github/PULL_REQUEST_TEMPLATE.md` は**一切参照されない**（`gh pr create --help` で実測。テンプレートを起点にするのは別フラグの `-T, --template`）。`--fill` で作ると、Task 1 で用意した来歴の申告欄も検証証跡の表も PR 本文に存在しないまま出来上がる。

正準テンプレートを起点に本文を作る。

```bash
cp .github/PULL_REQUEST_TEMPLATE.md /tmp/ui-pr-draft.md
```

`/tmp/ui-pr-draft.md` を編集して次を実態どおりに記入する。**節の見出しは削らない**（Step 6b がその実在を検査する）。

- **来歴の申告**: `AI が生成した` と `他プロジェクトから移植した` にチェックを入れる（Button は shadcn registry から取り込み、エージェントが改変している）。`自作` にはチェックを入れない
- **出典 URL・commit SHA・ライセンス**: `provenance.json` の `components.button` から**読み出した値をそのまま**書く。手で SHA を書かない

```bash
node -e 'const p=require("./provenance.json").components.button;console.log(`${p.sourceUrl} @ ${p.upstreamPathSha} (${p.upstreamPath}) / content sha256 ${p.registryContentSha256} / ${p.license}`)'
```

- **実装計画 / 実装担当識別子**: 本計画のパスと、実行しているエージェントの識別子
- **検証証跡**: Task 9 Step 11 のマトリクスを転記し、スクリーンショットを **commit SHA 固定の permalink** で埋め込む。**ブランチ名を URL に含めない** — `feat/foundation` はマージ後に削除され、その時点で証跡が 404 になる（AI_FIRST §2 は永続証跡を要求している）

  ```bash
  # 証跡画像を含むコミットの SHA を取る
  IMG_SHA=$(git log -1 --format=%H -- .docs/reviews)
  for f in .docs/reviews/*.png; do
    echo "https://github.com/elchika-inc/ui/blob/$IMG_SHA/$f?raw=1"
  done
  ```

  出力された **6 本**の URL（3 route × 2 テーマ）をマトリクスの各セルへ貼る。Task 9 Step 11 で記録した検証対象コミットの SHA も本文へ書く
- **実装計画**: `.docs/plans/2026-07-31-elchika-ui-foundation-plan.md`（Task 1 Step 8 で target repo へコピー済み）
- **関連 Issue / ゴール**: Issue を立てていないため、`.docs/PROJECT_GOAL.md` の SuccessCriteria を直記する

記入し終えたら、その本文で PR を作る。

```bash
gh pr create --base main --head feat/foundation \
  --title "feat: elchika-inc/ui の基盤を作る（サブプロジェクト #1）" \
  --body-file /tmp/ui-pr-draft.md
```

- [ ] **Step 6b: 申告が PR 本文に実在することを読み戻す**

書いたつもりで反映されていない場合を排除する。**下書きファイルではなく GitHub 側の本文**を別ファイルへ取得して確かめる（下書きを上書きすると、比較対象が消える）。

```bash
gh pr view --json body --jq '.body' > /tmp/ui-pr-remote.md
```

正準テンプレートの節が生き残っていることを見る。

Run: `grep -c '^## 関連 Issue / ゴール$' /tmp/ui-pr-remote.md`
Run: `grep -c '^## エージェント実装の来歴$' /tmp/ui-pr-remote.md`
Run: `grep -c '^## 来歴の申告' /tmp/ui-pr-remote.md`
Run: `grep -c '^## 検証証跡$' /tmp/ui-pr-remote.md`
Expected: すべて `1`（`--fill` で作ると 0 になる。0 が出たら Step 6 の `--body-file` を使った作成をやり直す）

申告が実態どおりに埋まっていることを見る。

Run: `grep -c '^- \[x\] AI が生成した' /tmp/ui-pr-remote.md`
Run: `grep -c '^- \[x\] 他プロジェクトから移植した' /tmp/ui-pr-remote.md`
Expected: どちらも `1`

§15 が要求する要素が `provenance.json` と一致することを見る。SHA だけ照合すると、URL や license が空・誤記でも通ってしまう。**受け取った内容の錨（`registryContentSha256`）も照合する** — これが無いと「どの内容を取り込んだか」が PR から辿れない。

Run:

```bash
node -e '
const fs = require("node:fs")
const p = require("./provenance.json").components.button
const body = fs.readFileSync("/tmp/ui-pr-remote.md", "utf8")
const missing = ["sourceUrl", "upstreamPathSha", "registryContentSha256", "license"].filter((k) => !body.includes(String(p[k])))
if (missing.length) { console.error(`PR 本文に無い来歴要素: ${missing.join(", ")}`); process.exit(1) }
console.log("来歴 4 要素が provenance.json と一致")
'
```

Expected: `来歴 4 要素が provenance.json と一致` が出力され exit 0

Run: `grep -cE 'blob/[0-9a-f]{40}/\.docs/reviews/[a-z0-9-]+\.png' /tmp/ui-pr-remote.md`
Expected: `6` 以上（3 route × 2 テーマの証跡がすべて貼られている）

Run: `grep -c 'blob/feat/foundation/' /tmp/ui-pr-remote.md`
Expected: `0`（**ブランチ名を含む URL が残っていない**。`feat/foundation` はマージ後に削除され証跡が 404 になる）

Run: `grep -c "$(node -e 'console.log(require("./provenance.json").components.button.registryContentSha256)')" /tmp/ui-pr-remote.md`
Expected: `1` 以上（受け取った内容の錨が PR から辿れる）

Run: `grep -cE '<[^!/][^>]*>' /tmp/ui-pr-remote.md`
Expected: `0`（テンプレートの未記入欄が残っていない）

- [ ] **Step 7: CI が緑であることと、全ステップを実際に実行したことを確認する**

Run: `gh pr checks --watch`
Expected: すべて pass

緑であることだけを根拠にしない。**ステップが 1 つも定義されていない workflow でも「緑」になる。** 実行したステップ名と結果を run に束縛して取り出す。`gh run view` を run ID なしで呼ぶと対話選択になり対象 run に束縛されないため、必ず ID を渡す。

```bash
RUN_ID=$(gh run list --branch feat/foundation --workflow ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh api "repos/elchika-inc/ui/actions/runs/$RUN_ID/jobs" --jq '.jobs[].steps[] | "\(.conclusion)\t\(.name)"' > /tmp/ui-ci-steps.txt
```

Run: `test -n "$RUN_ID"`
Expected: exit 0

Run:

```bash
node -e '
const fs = require("node:fs")
// Step 1 の workflow に書いた name をそのまま期待値にする。
const EXPECTED = ["Install dependencies","Lint","Typecheck","Unit tests","Standards check",
  "Build registry","Bundle legal files","Distribution check","Build library","Props contract",
  "Completeness check","Build site","Dist registry check"]
const ok = new Set(
  fs.readFileSync("/tmp/ui-ci-steps.txt", "utf8").split("\n")
    .filter((l) => l.startsWith("success\t")).map((l) => l.split("\t")[1])
)
const missing = EXPECTED.filter((n) => !ok.has(n))
if (missing.length) { console.error(`success でないステップ: ${missing.join(", ")}`); process.exit(1) }
console.log(`${EXPECTED.length} ステップすべて success`)
'
```

Expected: `13 ステップすべて success` が出力され exit 0

不足があれば、そのステップ名で `.github/workflows/ci.yml` を確認して直し、push して本 Step をやり直す。

- [ ] **Step 8: DoneCriteria を最終状態で通しで再実行する**

各タスク中の確認は、その時点の作業ツリーに対するものだった。ここでは**マージ直前の最終状態**に対して、design §8 の 12 条件を再実行する。過去の確認結果を再利用しない（独立検証。AGENTS.md の Verification Gate）。

まずクリーンな状態から作り直す。

```bash
rm -rf node_modules lib dist public/r
npm ci
npm run registry:build
npm run registry:legal
npm run build:lib
npm run build
```

**順序を守る。** `registry:build` と `registry:legal` を `npm run build` より**前**に置く。Astro は build 時点の `public/` を `dist/` へコピーするため（実測）、逆順にすると `dist/r/` が空になり、Astro サイトが registry を配信できない状態のまま最終ゲートを通ってしまう。外部 probe は `public/` を直接 serve するのでこの欠落を検出できない。

Run: `test -f dist/r/button.json`
Run: `cmp dist/r/button.json public/r/button.json`
Expected: どちらも exit 0

そのうえで条件 #1〜#11 を順に確認する（#12 は本 Step のコミットを含む head に対して**本タスクの Step 9** で確認する。ここで確認すると、これから作るコミットを含まない古い run を根拠にすることになる）。

| # | Run | Expected |
|---|---|---|
| 1 | `node -e "console.log(require('./components.json').style)"` | `base-nova` |
| 2 | `node scripts/check-standards.mjs` / `grep -c '@base-ui/react' src/components/ui/button.tsx` / Task 6 Step 5b の `Run:` 行すべて | 1 つ目 exit 0、2 つ目 `1` 以上、Step 5b は各行の Expected どおり（正の検査は `1` 以上、負の検査は `0`）|
| 3 | **Task 3 Step 3 と Step 4 の `Run:` 行すべて**（正本との `cmp` / `Hiragino Sans` / `--success:` / `prefers-reduced-motion`）と `node scripts/contrast.mjs` | `cmp` が exit 0、Step 4 の各行が `1` 以上、contrast は Step 4b と同じ 3 行が出る。**トークン数を固定条件にしない** |
| 4 | `npx tsc --noEmit --strict --module esnext --moduleResolution bundler --target es2022 --jsx react-jsx types/dts-contract.ts` と `node scripts/check-completeness.mjs` | 前者は exit 0・出力なし、後者は `... 4 経路すべてに載っている` |
| 5 | Task 8 Step 8 の外部 probe を再実行し、**Step 9 の後始末（`kill "$SERVE_PID"` と `rm -rf /tmp/registry-probe`）まで必ず行う** | probe 側に Button と `elchika-ui/LICENSE` / `elchika-ui/THIRD_PARTY_LICENSES` が届き、**Step 8 の `Run:` 行すべて**が Expected どおり。実行後に `pgrep -f 'serve public'` が 1 件も返さず、`test ! -d /tmp/registry-probe` が exit 0（残すと次の再実行がポート衝突と既存 probe の混在で収束しない）|
| 6 | 下記「条件 6 の再確認」 | すべて Expected どおり |
| 7 | `node scripts/check-distribution.mjs` と、条件 5 で再実行した probe 側の法務関連 `Run:` 行すべて（`elchika-ui/LICENSE` と `elchika-ui/THIRD_PARTY_LICENSES` の存在・内容、および利用者の `LICENSE` を上書きしていないこと）| 前者 exit 0 で `配布物 OK（3 files / 法務ファイル 2 件が原本と一致）`、後者も Expected どおり |
| 8 | Task 2 Step 5 と、下記「条件 8 の再確認」 | 前者は `ok` に続いて 40 桁 SHA・64 桁ハッシュ・shadcn version・日付。後者は `来歴が scaffold 時の実体と一致` |
| 9 | Task 1 Step 6b の `Run:` 行すべて | すべて Expected どおり |
| 10 | Task 1 Step 8b の `Run:` 行すべて（`git ls-files` による追跡確認を含む）と Task 3 Step 4c | 前者は各行の Expected どおり。後者は `整合: light warning = ...`（`3.919` のような固定値を期待値にしない — standards が直れば食い違うため）|
| 11 | Task 10 Step 5 の ruleset 検査 | `protected の条件をすべて満たす` |

**条件 8 の再確認**（ネットワークに依存させない。Task 2 Step 5c は上流の現在の状態と突き合わせる検査であり、最終ゲートでは使えない — 上流が更新されているだけで落ち、しかも Task 6 でファイルを書き換えたあとでは復旧経路が存在しない）:

証明したいのは「**記録した来歴が、実際に取り込んだファイルのものである**」こと。scaffold が最初に置いた内容は Git 履歴に残っているので、そこから確かめる。

```bash
ADD_SHA=$(git log --diff-filter=A --format=%H -- src/components/ui/button.tsx | tail -1)
git show "$ADD_SHA:src/components/ui/button.tsx" > /tmp/ui-pristine-button.tsx
```

Run: `test -n "$ADD_SHA"`
Expected: exit 0（`button.tsx` を追加したコミットが履歴に実在する）

Run:

```bash
node -e '
const { createHash } = require("node:crypto")
const fs = require("node:fs")
const p = require("./provenance.json").components.button
const norm = (s) => s.replace(/@\/(?:registry\/[^/]+\/)?lib\/utils/g, "@/lib/utils")
const pristine = fs.readFileSync("/tmp/ui-pristine-button.tsx", "utf8")
const h = createHash("sha256").update(norm(pristine), "utf8").digest("hex")
if (h !== p.normalizedContentSha256) {
  console.error(`来歴と scaffold 時の実体が一致しない\n  記録: ${p.normalizedContentSha256}\n  実体: ${h}`)
  process.exit(1)
}
console.log("来歴が scaffold 時の実体と一致")
'
```

Expected: `来歴が scaffold 時の実体と一致` が出力され exit 0

不一致なら、`provenance.json` が別のファイルの来歴を記録している。

**「Task 2 Step 4 からやり直す」では直らない。** `record-provenance.mjs` は既存エントリがあれば `continue` するので Step 4 は何も再記録せず「1 件の来歴を記録した」と成功表示する。エントリを削除しても、この時点の `button.tsx` は Task 6 で改変済みなので「手元の生成物 == 配信物」比較で必ず停止する。

復旧はこの順で行う。**scaffold 時の状態へ戻してから再記録し、Task 6 の置換を再適用する。**

```bash
# 1. scaffold 時の button.tsx へ戻す
ADD_SHA=$(git log --diff-filter=A --format=%H -- src/components/ui/button.tsx | tail -1)
git show "$ADD_SHA:src/components/ui/button.tsx" > src/components/ui/button.tsx

# 2. 来歴エントリを消す
node -e 'const fs=require("node:fs");const p=JSON.parse(fs.readFileSync("provenance.json","utf8"));delete p.components.button;fs.writeFileSync("provenance.json",JSON.stringify(p,null,2)+"\n")'

# 3. 再記録する（このとき手元は scaffold 状態なので比較が通る）
PROVENANCE_DATE=$(date +%F) node scripts/record-provenance.mjs
```

Run: Task 2 Step 5 の fail-closed 検査
Expected: `ok` から始まる行が出て exit 0

4. **Task 6 Step 2〜4 の置換表をもう一度適用する**（置換内容はすべて表に逐語で書かれているので推測は不要）。

Run: `node scripts/check-standards.mjs`
Run: Task 6 Step 5b の `Run:` 行すべて
Expected: 前者 exit 0、後者は各行の Expected どおり

5. 変更をコミットしてから、本 Step の条件 #8 を先頭からやり直す。

**上流が更新されていただけの場合はここに来ない。** 条件 #8 はネットワークを見ず、Git 履歴の scaffold 時実体と記録を突き合わせるだけなので、上流の変化では落ちない。落ちたということは記録側が実体とずれている。

**条件 6 の再確認**（ファイルの存在だけを見ない。design DoneCriteria 6 は「2 つの静的ページ」と「dark 側ルート要素の `class="dark"`」を要求しており、証跡ファイルが残っていることは最終状態の描画を意味しない）:

Run: `test -f dist/preview/button/index.html`
Run: `test -f dist/preview/button-dark/index.html`
Run: `grep -c 'class="dark"' dist/preview/button-dark/index.html` → `1` 以上
Run: `grep -c 'class="dark"' dist/preview/button/index.html` → `0`
Run: `test -s .docs/reviews/2026-07-31-button-preview.md`
**証跡が現在のコードを検証したものかを見る。** ここで「証跡ファイルに現在の HEAD が書いてあること」を条件にしてはいけない — 追跡ファイルへ HEAD を書いて commit すると、その commit が新しい HEAD を作るので永久に一致しない（自己参照で固定点が存在しない）。

正しい不変条件は「**証跡が撮られた時点の `src/` と、いまの `src/` が同じ**」であること。これは commit を重ねても壊れない。

```bash
VERIFIED_SHA=$(grep -oE '[0-9a-f]{40}' .docs/reviews/2026-07-31-button-preview.md | head -1)
```

Run: `test -n "$VERIFIED_SHA"`
Expected: exit 0（証跡に検証対象の SHA が書かれている）

Run: `git cat-file -e "$VERIFIED_SHA^{commit}"`
Expected: exit 0（その SHA がこのリポジトリに実在するコミットである）

Run: `git diff --quiet "$VERIFIED_SHA" HEAD -- src/`
Expected: **exit 0**。非 0 なら、証跡を撮ったあとに `src/` が変わっている＝いま出荷しようとしているコードは検証されていない。その場合は Task 9 Step 7 から実ブラウザ検証をやり直し、証跡と SHA を更新する

そのうえで `npx serve dist -l 3002 &` して **Task 9 Step 9 の全項目を 3 route × 2 テーマで再実行する**。`backgroundColor` の 2 値比較だけで済ませない（Task 9 のあとにコンポーネントやトークンが変わっていれば、a11y・keyboard・console・崩れのいずれもが回帰しうる）。確認後 `serve` を止める。

Expected: Task 9 Step 9 の表の全項目が同じ Expected を満たし、Step 10 の色比較が 3 route すべてで異なる

**1 つでも Expected を満たさなければ、その条件を作ったタスクへ戻って直し、`git push` してから本 Step を先頭からやり直す。** 部分的な再確認で済ませない。

結果を `.docs/reviews/2026-07-31-donecriteria.md` に、条件番号・実行したコマンド・実際の出力の 3 列で記録する。**#12 の行には「本タスクの Step 9 で PR 本文へ記録」と書く**（ファイルへ書くと追記コミットがまた未検証の head を作り、終わらなくなる）。

記録をコミットして**push する**。push しないと、この記録は PR に存在せず、CI も検証していない状態のままになる。

```bash
git add .docs/reviews/2026-07-31-donecriteria.md
git commit -m "docs: DoneCriteria の通し確認結果を記録する"
git push
```

- [ ] **Step 9: 最終 head で CI を再確認する（条件 #12）**

Step 7 で確認した run は、Step 8 のコミットを**含まない** head に対するものだった。人間がマージするのは最終 head なので、そこで CI が通っていることを確認する。

```bash
HEAD_SHA=$(git rev-parse HEAD)
gh pr checks --watch
```

run を最終 head に束縛して取り出す。**head が一致しない run を根拠にしない**（これが「緑を見たつもりで別のコミットを見ていた」を防ぐ唯一の手段）。

```bash
gh run list --branch feat/foundation --workflow ci.yml --limit 5 \
  --json databaseId,headSha --jq ".[] | select(.headSha==\"$HEAD_SHA\") | .databaseId" > /tmp/ui-final-run.txt
FINAL_RUN_ID=$(head -1 /tmp/ui-final-run.txt)
```

Run: `test -n "$FINAL_RUN_ID"`
Expected: exit 0（最終 head に対する run が実在する。空なら CI がまだ起動していないか trigger 設定が誤っている）

```bash
gh api "repos/elchika-inc/ui/actions/runs/$FINAL_RUN_ID/jobs" --jq '.jobs[].steps[] | "\(.conclusion)\t\(.name)"' > /tmp/ui-ci-steps.txt
```

Run: Step 7 と同じ 13 ステップ検査の node スクリプト
Expected: `13 ステップすべて success` が出力され exit 0

Run: `gh api "repos/elchika-inc/ui/actions/runs/$FINAL_RUN_ID" --jq '.head_sha'`
Expected: `git rev-parse HEAD` の出力と**同一の SHA**

確認できたら、`.docs/reviews/2026-07-31-donecriteria.md` の #12 行に結果を書く代わりに、**PR 本文の検証証跡節へ追記する**（記録ファイルへ書くと、その追記コミットがまた未検証の head を作り、終わらなくなる）。

現在の本文を取り出し、1 行足して書き戻す。

```bash
gh pr view --json body --jq '.body' > /tmp/ui-pr-remote.md
printf '\n- DoneCriteria #12: run %s（head %s）で CI の 13 ステップすべてが success\n' \
  "$FINAL_RUN_ID" "$HEAD_SHA" >> /tmp/ui-pr-remote.md
gh pr edit --body-file /tmp/ui-pr-remote.md
```

書き戻したあとに**もう一度取得して**確認する（追記前のファイルを grep しても必ず通ってしまう）。

```bash
gh pr view --json body --jq '.body' > /tmp/ui-pr-verify.md
```

Run: `grep -c "$FINAL_RUN_ID" /tmp/ui-pr-verify.md`
Expected: `1` 以上（どの run で 13 ステップを確認したかが PR から辿れる）

Run: `grep -c "$HEAD_SHA" /tmp/ui-pr-verify.md`
Expected: `1` 以上（その run がどの head に対するものかも辿れる）

- [ ] **Step 10: 人間のマージ待ちにする**

条件 #1〜#11 が Step 8 で、#12 が Step 9 で、いずれも Expected どおりであることを確認したうえで、PR をマージ可能として人間へ渡す。**エージェントは `main` へマージしない**（DOCS_OPS §5）。

引き渡し時に次を報告する。

- 最終 head の SHA と、それを検証した run ID
- 記録した逸脱の内訳（`.docs/risk-registry.md` の `## RISK-` 見出しをそのまま列挙する）。`--warning` の受容が含まれる場合は standards 側の修正待ちであること
- サブプロジェクト #2 以降へ持ち越す事項

---

## Self-Review

**Spec coverage**: design §8 の DoneCriteria 12 条件の実装先は次のとおり。#1→Task 2 Step 2 / #2→Task 6 Step 5・5b・6 / #3→Task 3 Step 3・4 / #4→Task 7 Step 5・6・6b / #5→Task 8 Step 8 / #6→Task 9 Step 4〜11 / #7→Task 1 Step 4・5b と Task 8 Step 7・7b / #8→Task 2 Step 5 / #9→Task 1 Step 6・6b / #10→Task 1 Step 8・8b / #11→Task 10 Step 2・4・5 / #12→Task 10 Step 1・7・9。最終状態での通し再実行は #1〜#11 が Task 10 Step 8、#12 が Step 9（Step 8 のコミットを含む head に束縛するため分けている）。未カバーの条件はない。

**Placeholder scan**: `TBD` / `TODO` / 「適切に」の類は使っていない。standards のテンプレートを基にするファイル（`SECURITY.md` / PR テンプレート / `README.md` / `AGENTS.md` / `CLAUDE.md`）は、テンプレート側に残る `<...>` 形式の placeholder の差し替え先を表で確定し、Task 1 Step 7b と Task 10 Step 3b でゼロ件を機械検査する。`CONTRIBUTING.md` と `.github/ISSUE_TEMPLATE/config.yml` は standards にテンプレートが無いため本計画に逐語で置いた。

**Type consistency**: `checkFile(path, source) -> {violations}` を Task 5 で定義し Task 6 で使う。`checkDistribution(item, origin) -> {problems}` を Task 8 で定義し同タスク内で使う（`item` は `shadcn build` が出力した registry item、`origin` は `{ ファイル名: 内容 }`）。`ButtonProps` / `Button` / `buttonVariants` を Task 6 で export し、Task 7 のバレル・`types/dts-contract.ts`・Task 9 のプレビューで使う。`provenance.json` のキー（`sourceUrl` / `upstreamPath` / `upstreamPathSha` / `registryContentSha256` / `registry` / `registryUrl` / `license` / `shadcnVersion` / `fetchedAt`）は Task 2 で定義し、同 Step 5 で fail-closed に検査し、Task 10 Step 6 で PR 本文へ転記する。`.github/workflows/ci.yml` のステップ名は Task 10 Step 1 で定義し同 Step 7・9 の期待値として使う。名前の揺れはない。

**テスト実行形の一貫性**: テストの起動は全箇所で `node --test "scripts/*.test.mjs"`（PR テンプレート・CONTRIBUTING・CI・AGENTS.md の Key Commands）。個別ファイルを指すときだけ明示パスを使う（Task 5 Step 2・4、Task 8 Step 4・6）。裸のディレクトリ指定は 1 箇所も残していない。

**standards 逸脱の一覧**: 本計画が意図的に standards から外れるのは下記。無条件のものは Task 1 Step 8 で、条件付きのものは Task 3 Step 4b で `.docs/risk-registry.md` へ受容エントリとして記録する。①Storybook を置かない（DESIGN.md §7）②Base UI を基底層に採用（DESIGN.md §2）③PR CI をフルセットにする（DOCS_OPS §6）④検証スクリーンショットをリポジトリへコミットする（AI_FIRST §2）⑤実ブラウザ検証を別 worktree で行わない（AI_FIRST §2 手順 1。目的である「PR に入るコードを検証する」はコミット先行と SHA 記録で満たす）。条件付きの 1 件は `--warning` × `--warning-foreground` が AA 未達のまま取り込む件（DESIGN.md §8。standards 側の既知欠陥。Task 3 Step 4b が FAIL を観測したときだけ記録する）。隠して進める逸脱はない。

**「存在」でなく「実体」を見ている箇所**: `test -f` は空ファイルを通すため `test -s` を使う（Task 1 Step 9）。ディレクトリの `test -d` は Git が空ディレクトリを記録しないため `git ls-files` の件数で見る（Task 1 Step 8b）。registry の同梱は `public/r/` への隣接でなく item の `files` と外部 probe への到達で見る（Task 8 Step 7・8）。CI の緑はステップ名と conclusion で見る（Task 10 Step 7・9）。sensor は「通ること」でなく「壊すと落ちること」でも見る（Task 2 Step 5b、Task 8 Step 7b）。

## 既知のリスク

- **Task 1 Step 2 の上流ライセンス探索**: ファイル名とブランチを総当たりするが、上流が両方とも変えた場合は例外で止まる。止まったら実際のパスを確認して `NAMES` / `BRANCHES` に足す。**取得できないまま先へ進まない。**
- **Task 2 Step 3 の上流 SHA 取得**: 未認証の GitHub API は時間あたりの回数制限がある。429 / 403 で止まったら `GH_TOKEN` を `Authorization: Bearer` ヘッダに載せて再実行する。**SHA を手で書いて先へ進まない**（来歴が実態と食い違う）。
- **Task 8 Step 8 / Task 9 Step 7 のポート衝突**: 3001・3002 が使用中なら別番号にする。`npx serve` の出力する実ポートを確認してから URL に使う。
- **Task 10 Step 4 の ruleset API**: 本計画の body は 2026-07-31 時点の API 定義（`POST /repos/{owner}/{repo}/rulesets`、`pull_request` rule の必須 parameters 5 件）に基づく。422 が返った場合はレスポンス body が不足している parameter 名を返すので、**その名前だけを足す**。推測でフィールドを増やさない。
- **ビルド順序への依存**: `registry:build` → `build` の順序は、Astro が `public/` を build 時に `dist/` へコピーする仕様に依存する。将来この挙動が変わったら `Dist registry check` が落ちる。落ちたら順序ではなく Astro 側の仕様変更を疑う（順序を戻して通しても、配信物が欠けたままになる）。
- **Task 10 Step 7・9 の workflow 名依存**: ステップ名の期待値が `.github/workflows/ci.yml` の `name:` と文字列一致する前提。workflow 側の名前を変えるなら期待値の配列も同時に変える。片方だけ変えると、実行されているのに「不足」と判定される（偽失敗）。
- **Task 8 Step 8 の `--overwrite`**: probe は vite テンプレート由来の `button.tsx` を上書きする前提で組んでいる。将来テンプレートが Button を同梱しなくなったら `--overwrite` は無害な no-op になるだけで、検証は成立し続ける。逆に `--overwrite` を外すと非対話 skip で偽の成功になる。**外さない。**
- **`.shadcn-cli-version` の生成**: `npx -y shadcn@latest --version` が版だけを 1 行で返すことに依存する（実測: `4.16.0`）。出力形式が変わったら Task 2 Step 1 の `grep -cE '^[0-9]+\.[0-9]+\.[0-9]+$'` が落ちる。落ちたら出力を確認して抽出方法を直す — **版の記録を省いて先に進まない。**
- **Task 2 Step 5c と上流の更新**: この検査は「記録した内容が現在の配信物と同じか」を見る。上流が更新されれば落ちるが、それは来歴の誤りではない。Task 6 に入る前に落ちたら再記録、入ったあとは**戻らない**（記録は「いつ何を受け取ったか」であり、上流の現在の状態ではない）。最終ゲートはネットワークに依存しない条件 #8 で代替する。
- **Task 9 のフォーカスリング判定**: 透明レイヤーの除外は `rgba(0, 0, 0, 0)` という**計算値の表記**に依存する。ブラウザが表記を変えたら `visible` が過剰に残る。その場合はレイヤーの幅がすべて `0px` かどうかで落とす方式へ切り替える（表記でなく寄与で判定する）。
- **Task 6 Step 3 の見た目の変化**: `bg-[color-mix(...)]` → `hover:bg-secondary/80` と `text-[0.8rem]` → `text-xs` は、上流と**厳密に同じ描画にはならない**。standards のトークンを正本にする方針の帰結であり意図的。Task 9 の実ブラウザ検証で崩れがないことを見る。崩れていたら、arbitrary value へ戻すのではなくトークン側（`templates/design-tokens.css`）の調整として standards へ提起する。
- **Task 1 Step 7b / Task 10 Step 3b の網羅スキャン**: `<...>` の形をした文字列すべてを拾うため、正当な記述が引っかかることがある。その場合も「実値へ差し替える」か「削除する」の 2 択で処理する。検査条件を緩めて通さない（緩めた瞬間に未記入の見落としが復活する）。
