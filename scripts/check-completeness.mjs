// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 5 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const pascal = (s) =>
  s
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

// design §8 DoneCriteria 8 が要求する来歴の全項目。Task 2 Step 5 は button 固定
// なので 2 件目以降を担保しない。ここが唯一の一般化されたゲートになる。
//
// **存在（truthy）だけを見ない。** 全キーに "x" を入れれば通ってしまい、
// 形式の要求（40 桁 commit SHA・64 桁ハッシュ・HTTPS URL・exact semver・
// YYYY-MM-DD）が 2 件目以降で fail-open になる。キーごとに形式を持たせる。
const PROVENANCE_SPEC = {
  sourceUrl: /^https:\/\/\S+$/,
  upstreamPath: /^\S+\.tsx$/,
  upstreamPathSha: /^[0-9a-f]{40}$/,
  registry: /^https:\/\/\S+$/,
  registryUrl: /^https:\/\/\S+$/,
  registryContentSha256: /^[0-9a-f]{64}$/,
  normalizedContentSha256: /^[0-9a-f]{64}$/,
  // 末尾を固定する。/^\d+\.\d+\.\d+/ だけだと "4.16.0garbage" を通す（実測）。
  // プレリリース・ビルドメタデータは許す。
  shadcnCliVersion: /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/,
  fetchedAt: /^\d{4}-\d{2}-\d{2}$/,
  license: /^\S+$/,
};

export function checkCompleteness({
  components,
  barrel,
  dts,
  registry,
  previewFiles,
  previewSources,
  provenance,
}) {
  const problems = [];
  for (const name of components) {
    const P = pascal(name);
    if (!barrel.includes(`./components/ui/${name}`)) {
      problems.push(`${name}: src/index.ts から export されていない`);
    }
    if (!dts.includes(`${P}Props`)) problems.push(`${name}: lib/index.d.ts に ${P}Props が無い`);
    if (!registry.items.some((i) => i.name === name)) {
      problems.push(`${name}: registry.json に item が無い`);
    }
    // ルート（.astro）だけでなく中身（src/previews/<name>.tsx）も見る。
    // ルートだけ在って中身が無いと、誤った import でもビルドが通りうる。
    if (!previewSources.includes(`${name}.tsx`)) {
      problems.push(`${name}: src/previews/${name}.tsx が無い`);
    }
    for (const suffix of ["", "-dark"]) {
      if (!previewFiles.includes(`${name}${suffix}.astro`)) {
        problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`);
      }
    }
    // CONTRIBUTING が挙げる 5 項目の 1 つ。DoneCriteria 8 もコンポーネントごとの
    // 来歴を要求するため、ここを見ないと 2 件目以降の欠落を CI が見逃す。
    const p = provenance.components?.[name];
    if (!p) {
      problems.push(`${name}: provenance.json に来歴が無い`);
      continue;
    }
    for (const [k, re] of Object.entries(PROVENANCE_SPEC)) {
      if (!p[k]) {
        problems.push(`${name}: provenance の ${k} が無い`);
        continue;
      }
      if (!re.test(String(p[k]))) {
        problems.push(`${name}: provenance の ${k} が形式に合わない: ${p[k]}`);
      }
    }
  }
  return { problems };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const components = readdirSync("src/components/ui")
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""));
  if (components.length === 0) {
    console.error("コンポーネントが 0 件（走査対象が壊れている）");
    process.exit(1);
  }
  if (!existsSync("lib/index.d.ts")) {
    console.error("lib/index.d.ts が無い（build:lib を先に実行する）");
    process.exit(1);
  }
  const { problems } = checkCompleteness({
    components,
    barrel: readFileSync("src/index.ts", "utf8"),
    dts: readFileSync("lib/index.d.ts", "utf8"),
    registry: JSON.parse(readFileSync("registry.json", "utf8")),
    previewFiles: readdirSync("src/pages/preview"),
    previewSources: readdirSync("src/previews"),
    provenance: JSON.parse(readFileSync("provenance.json", "utf8")),
  });
  if (problems.length) {
    console.error(`欠落:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`${components.length} 件のコンポーネントが 5 経路すべてに載っている`);
}
