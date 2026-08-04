// registry の「配布物」に法務ファイルが中身つきで同梱されているかを検査する。
// 配布物とは `npx shadcn add` が利用者の手元へ書き込むもの、すなわち
// registry item の files に列挙されたもの。public/r/ にファイルが
// 隣接しているだけでは install されないため要件を満たさない
// （PRODUCT_PLAYBOOK §15「リポジトリのルートに置くだけでは要件を満たさない」と同じ理由）。
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REQUIRED = [
  {
    label: "alias CSS",
    source: "src/styles/global.css",
    target: "~/elchika-ui/tokens.css",
  },
  {
    label: "design-system token",
    source: "src/styles/design-system/tokens.css",
    target: "~/elchika-ui/design-system/tokens.css",
  },
  {
    label: "design-system brands",
    source: "src/styles/design-system/brands.css",
    target: "~/elchika-ui/design-system/brands.css",
  },
  { label: "LICENSE", source: "LICENSE", target: "~/elchika-ui/LICENSE" },
  {
    label: "THIRD_PARTY_LICENSES",
    source: "THIRD_PARTY_LICENSES",
    target: "~/elchika-ui/THIRD_PARTY_LICENSES",
  },
];

// item:   shadcn build が出力した registry item（public/r/<name>.json をパースしたもの）
// origin: リポジトリ内の原本の { source path: 内容 }
export function checkDistribution(item, origin) {
  const problems = [];
  const files = item?.files ?? [];
  for (const required of REQUIRED) {
    const { label, source, target } = required;
    const e = files.find((file) => file.target === target);
    if (!e) {
      problems.push(`${label}: registry item の files に無い（install されない）`);
      continue;
    }
    if (e.type !== "registry:file") {
      problems.push(`${label}: type が registry:file でない`);
      continue;
    }
    if (!e.content) {
      problems.push(`${label}: content が空`);
      continue;
    }
    if (e.content !== origin[source]) {
      problems.push(`${label}: 原本と内容が一致しない`);
    }
  }
  return { problems };
}

export function checkDistributionItems(entries, origin) {
  const problems = [];
  for (const { name, item } of entries) {
    for (const problem of checkDistribution(item, origin).problems) {
      problems.push(`${name}: ${problem}`);
    }
  }
  return { problems };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync("registry.json")) {
    console.error("registry.json が無い");
    process.exit(1);
  }
  const registry = JSON.parse(readFileSync("registry.json", "utf8"));
  const entries = [];
  for (const { name } of registry.items ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      console.error(`registry item名が不正: ${name}`);
      process.exit(1);
    }
    const itemPath = `public/r/${name}.json`;
    if (!existsSync(itemPath)) {
      console.error(`${itemPath} が無い（registry:build を先に実行する）`);
      process.exit(1);
    }
    entries.push({ name, item: JSON.parse(readFileSync(itemPath, "utf8")) });
  }
  if (entries.length === 0) {
    console.error("registry item が 0 件（走査が空走している）");
    process.exit(1);
  }
  const origin = {};
  for (const { source } of REQUIRED) {
    if (!existsSync(source)) {
      console.error(`原本 ${source} が無い`);
      process.exit(1);
    }
    origin[source] = readFileSync(source, "utf8");
  }
  const { problems } = checkDistributionItems(entries, origin);
  if (problems.length) {
    console.error(`配布物の検査に失敗:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  // 件数を出力に含めない。files が増えるたびに Expected とずれ、実際に 5 回ずれた。
  console.log(`配布物 OK（${REQUIRED.map(({ label }) => label).join(" / ")} が原本と一致）`);
}
