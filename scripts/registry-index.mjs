const UPSTREAM_ITEM_KEYS = new Set([
  "dependencies",
  "docs",
  "files",
  "meta",
  "name",
  "registryDependencies",
  "type",
]);
const UPSTREAM_FILE_KEYS = new Set(["path", "type"]);

function unknownKeyProblems(value, allowedKeys, label) {
  return Object.keys(value)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => `${label} ${key}`);
}

function checkIndexFile(file, label) {
  const problems = unknownKeyProblems(
    file,
    UPSTREAM_FILE_KEYS,
    `${label}: filesに上流indexに無いキー`,
  );
  if (typeof file.path !== "string" || !file.path) {
    problems.push(`${label}: file pathが無い`);
  }
  if (typeof file.type !== "string" || !file.type) {
    problems.push(`${label}: file typeが無い`);
  }
  return problems;
}

function checkIndexItem(item, itemIndex, names) {
  const label = item.name || `index item ${itemIndex + 1}`;
  const problems = unknownKeyProblems(item, UPSTREAM_ITEM_KEYS, `${label}: 上流indexに無いキー`);

  if (typeof item.name !== "string" || !item.name) {
    problems.push(`${label}: nameが無い`);
  } else if (names.has(item.name)) {
    problems.push(`${item.name}: item名が重複`);
  } else {
    names.add(item.name);
  }
  if (typeof item.type !== "string" || !item.type) {
    problems.push(`${label}: typeが無い`);
  }
  if (!Array.isArray(item.files) || item.files.length === 0) {
    problems.push(`${label}: filesが0件`);
    return problems;
  }

  return [...problems, ...item.files.flatMap((file) => checkIndexFile(file, label))];
}

export function checkRegistryIndex(index) {
  if (!Array.isArray(index) || index.length === 0) {
    return ["registry itemが0件"];
  }

  const names = new Set();
  return index.flatMap((item, itemIndex) => checkIndexItem(item, itemIndex, names));
}

export function createRegistryIndex(registry) {
  const index = (registry.items ?? [])
    .map((item) => ({
      name: item.name,
      type: item.type,
      files: item.files
        .filter((file) => file.type !== "registry:file")
        .map(({ path, type }) => ({ path, type })),
      ...(item.dependencies?.length ? { dependencies: item.dependencies } : {}),
      ...(item.registryDependencies?.length
        ? { registryDependencies: item.registryDependencies }
        : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const problems = checkRegistryIndex(index);
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
  return index;
}

export function writeRegistryIndex(registryPath, outputPath) {
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const index = createRegistryIndex(registry);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const registryPath = resolve(process.argv[2] ?? "registry.json");
    const outputPath = resolve(process.argv[3] ?? "public/r/index.json");
    writeRegistryIndex(registryPath, outputPath);
    console.log("registry index OK");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
