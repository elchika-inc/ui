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
      if (res.ok) {
        found = { url, text: await res.text() }
        break
      }
    }
    if (found) break
  }
  if (!found) throw new Error(`${s.name}: ライセンスファイルを特定できない`)
  parts.push(`## ${s.name}\n\nSource: ${found.url}\n\n${found.text}`)
}
writeFileSync("THIRD_PARTY_LICENSES", `# Third Party Licenses\n\n${parts.join("\n\n---\n\n")}\n`)
console.log(`${SOURCES.length} 件のライセンスを取得した`)
