// src/components/ui/*.tsx を正本として、各コンポーネントが
// 消費側の 4 経路すべてに載っていることを検査する。
// Button 固定の検査を一般化したもので、#2 で 50 件足すときの安全網になる。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const pascal = (s) =>
  s
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

export function checkCompleteness({ components, barrel, dts, registry, previewFiles }) {
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
    for (const suffix of ["", "-dark"]) {
      if (!previewFiles.includes(`${name}${suffix}.astro`)) {
        problems.push(`${name}: プレビュー ${name}${suffix}.astro が無い`);
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
  });
  if (problems.length) {
    console.error(`欠落:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`${components.length} 件のコンポーネントが 4 経路すべてに載っている`);
}
