import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { assertPathWithoutSymlinks } from "./path-safety.mjs";

export function findMissingRegistryItems(registry, builtFiles) {
  const built = new Set(
    builtFiles.filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")),
  );
  return (registry.items ?? []).map((item) => item.name).filter((name) => !built.has(name));
}

const REGISTRY_HELPER_JSON = new Set(["index", "registry"]);

export function findUnexpectedRegistryItems(registry, builtFiles) {
  const expected = new Set([
    ...(registry.items ?? []).map((item) => item.name),
    ...REGISTRY_HELPER_JSON,
  ]);
  return builtFiles
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .filter((name) => !expected.has(name))
    .sort();
}

function withoutFileContents(item) {
  return {
    ...item,
    ...(Array.isArray(item?.files)
      ? {
          files: item.files.map(({ content: _content, ...file }) => file),
        }
      : {}),
  };
}

export function registryBuildProblems(registry, builtItems, sourceContents) {
  const problems = [];
  for (const item of registry.items ?? []) {
    const built = builtItems.get(item.name);
    if (built === undefined) {
      problems.push(`${item.name}: 生成 JSON が無い`);
      continue;
    }
    if (!isDeepStrictEqual(withoutFileContents(built), item)) {
      problems.push(`${item.name}: 生成 JSON の manifest が registry.json と一致しない`);
      continue;
    }
    for (const file of built.files ?? []) {
      if (file.content !== sourceContents.get(file.path)) {
        problems.push(`${item.name}: ${file.path} の生成 content が source と一致しない`);
      }
    }
  }
  return problems;
}

export function checkRegistryBuild(root) {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const builtItems = new Map();
  const sourceContents = new Map();
  const problems = [];

  for (const item of registry.items ?? []) {
    const builtPath = join(root, "public/r", `${item.name}.json`);
    if (existsSync(builtPath)) {
      try {
        builtItems.set(item.name, JSON.parse(readFileSync(builtPath, "utf8")));
      } catch {
        problems.push(`${item.name}: 生成 JSON を parse できない`);
      }
    }
    for (const file of item.files ?? []) {
      const sourcePath = assertPathWithoutSymlinks(
        root,
        `${item.name}: registry build の source file`,
        file.path,
      );
      if (!existsSync(sourcePath)) {
        problems.push(`${item.name}: source file が無い: ${file.path}`);
        continue;
      }
      sourceContents.set(file.path, readFileSync(sourcePath, "utf8"));
    }
  }

  return {
    registry,
    problems: [...problems, ...registryBuildProblems(registry, builtItems, sourceContents)],
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const { registry, problems } = checkRegistryBuild(root);
  const builtFiles = readdirSync(join(root, "public/r"));
  const missing = findMissingRegistryItems(registry, builtFiles);
  const unexpected = findUnexpectedRegistryItems(registry, builtFiles);
  const allProblems = [
    ...problems,
    ...(unexpected.length ? [`予期しない生成物: ${unexpected.join(", ")}`] : []),
  ];

  console.log(
    allProblems.length
      ? [
          ...(missing.length ? [`未生成: ${missing.join(", ")}`] : []),
          `生成物不一致:\n  ${allProblems.join("\n  ")}`,
        ].join("\n")
      : "registry.json の全 item が public/r に生成されている（manifest と content も source に一致）",
  );
  process.exit(allProblems.length ? 1 : 0);
}
