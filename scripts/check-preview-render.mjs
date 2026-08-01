// 各コンポーネントの hydrated preview で確認すべき selector が宣言されているかを検査する。
// selector の実在確認は Portal や操作後の DOM を含むため、実ブラウザ検証で行う。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CATALOG_PREVIEW_NAMES = ["catalog", "catalog-dark"];

export const requiredPreviewNames = (components) => [...components, ...CATALOG_PREVIEW_NAMES];

export function checkPreviewRender(components, selectors) {
  const problems = [];

  for (const name of components) {
    const declaration = selectors[name];
    if (declaration === undefined) {
      problems.push(`${name}: preview selector の宣言が無い`);
      continue;
    }
    const selector = typeof declaration === "string" ? declaration : declaration?.selector;
    if (selector === undefined) {
      problems.push(`${name}: preview selector が無い`);
      continue;
    }
    if (typeof selector !== "string") {
      problems.push(`${name}: preview selector は文字列で宣言する`);
      continue;
    }
    if (!selector.trim()) {
      problems.push(`${name}: preview selector が空`);
    }
  }

  return { problems };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifestPath = "preview-selectors.json";
  if (!existsSync(manifestPath)) {
    console.error(`${manifestPath} が無い`);
    process.exit(1);
  }

  const components = readdirSync("src/components/ui")
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""));
  if (components.length === 0) {
    console.error("コンポーネントが 0 件（selector の走査対象が壊れている）");
    process.exit(1);
  }

  const selectors = JSON.parse(readFileSync(manifestPath, "utf8"));
  const { problems } = checkPreviewRender(requiredPreviewNames(components), selectors);
  if (problems.length) {
    console.error(`preview selector の検査に失敗:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }

  console.log("preview selector 宣言 OK");
}
