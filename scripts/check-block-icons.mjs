// 上流 registry JSON の IconPlaceholder が lucide 属性を持ち、shadcn CLI の
// 生成物に対応する実アイコンの import と JSX 使用があることを検査する。
// 上流はライブな配信物なので、マーカー件数や対象 block の集合は固定しない。
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { listBlockFiles } from "./block-scan.mjs";

const BLOCK_NAMES = [
  ...Array.from({ length: 4 }, (_, index) => `login-${String(index + 2).padStart(2, "0")}`),
  ...Array.from({ length: 5 }, (_, index) => `signup-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 16 }, (_, index) => `sidebar-${String(index + 1).padStart(2, "0")}`),
];

function sourceFile(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function tagName(node) {
  return ts.isIdentifier(node.tagName) ? node.tagName.text : node.tagName.getText();
}

function stringAttribute(node, name) {
  const attribute = node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.getText() === name,
  );
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) return undefined;
  if (ts.isStringLiteral(attribute.initializer))
    return attribute.initializer.text.trim() || undefined;
  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    ts.isStringLiteral(attribute.initializer.expression)
  ) {
    return attribute.initializer.expression.text.trim() || undefined;
  }
  return undefined;
}

const ICON_LIBRARY_ATTRIBUTES = new Set(["lucide", "tabler", "hugeicons", "phosphor", "remixicon"]);

function normalizedAttribute(property) {
  if (ts.isJsxSpreadAttribute(property)) return `{...${property.expression.getText().trim()}}`;
  const name = property.name.getText();
  if (!property.initializer) return name;
  if (ts.isStringLiteral(property.initializer)) {
    return `${name}=${JSON.stringify(property.initializer.text)}`;
  }
  if (ts.isJsxExpression(property.initializer)) {
    return `${name}={${property.initializer.expression?.getText().trim() ?? ""}}`;
  }
  return `${name}=${property.initializer.getText().trim()}`;
}

function preservedAttributes(node) {
  return node.attributes.properties
    .filter(
      (property) =>
        ts.isJsxSpreadAttribute(property) || !ICON_LIBRARY_ATTRIBUTES.has(property.name.getText()),
    )
    .map(normalizedAttribute)
    .sort();
}

function generatedPath(name, file, target) {
  if (target === "previews") return `src/previews/${name}.tsx`;
  const prefix = `registry/base-nova/blocks/${name}/`;
  return typeof file.path === "string" && file.path.startsWith(prefix)
    ? `src/blocks/${name}/${file.path.slice(prefix.length)}`
    : undefined;
}

export function inspectUpstreamBlocks(entries) {
  const problems = [];
  const expectedByTarget = { blocks: {}, previews: {} };
  const uniqueIcons = new Set();
  let blocksWithPlaceholders = 0;
  let placeholderCount = 0;
  let missingLucideCount = 0;

  for (const { name, item } of entries) {
    if (!Array.isArray(item?.files)) {
      problems.push(`${name}: 上流 JSON の files が配列でない`);
      continue;
    }
    const filesByTarget = { blocks: new Map(), previews: new Map() };
    let blockPlaceholderCount = 0;
    for (const file of item.files) {
      if (typeof file?.content !== "string") continue;
      const path = typeof file.path === "string" ? file.path : `${name}:unknown.tsx`;
      const target = file.type === "registry:page" ? "previews" : "blocks";
      const parsed = sourceFile(path, file.content);
      let filePlaceholderIndex = 0;
      const visit = (node) => {
        if (
          (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
          tagName(node) === "IconPlaceholder"
        ) {
          filePlaceholderIndex++;
          blockPlaceholderCount++;
          placeholderCount++;
          const icon = stringAttribute(node, "lucide");
          if (!icon) {
            missingLucideCount++;
            problems.push(
              `${name}: ${path} の IconPlaceholder #${filePlaceholderIndex} に lucide 属性が無い`,
            );
          } else {
            const targetPath = generatedPath(name, file, target);
            if (!targetPath) {
              problems.push(`${name}: ${path} を生成物 path へ対応付けられない`);
            } else {
              const expectedFile = filesByTarget[target].get(targetPath) ?? {
                occurrences: [],
              };
              expectedFile.occurrences.push({ icon, attributes: preservedAttributes(node) });
              filesByTarget[target].set(targetPath, expectedFile);
            }
            uniqueIcons.add(icon);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(parsed);
      for (const files of Object.values(filesByTarget)) {
        const expectedFile = files.get(
          generatedPath(name, file, file.type === "registry:page" ? "previews" : "blocks"),
        );
        if (!expectedFile) continue;
        const baselineOccurrences = inspectGeneratedSource({
          path,
          source: file.content,
        }).occurrences;
        if (baselineOccurrences.length > 0) expectedFile.baselineOccurrences = baselineOccurrences;
      }
    }
    if (blockPlaceholderCount > 0) {
      blocksWithPlaceholders++;
      for (const target of ["blocks", "previews"]) {
        const files = filesByTarget[target];
        if (files.size > 0) {
          expectedByTarget[target][name] = [...files.entries()].map(([path, expectedFile]) => ({
            path,
            ...expectedFile,
          }));
        }
      }
    }
  }

  return {
    problems,
    expectedByTarget,
    stats: {
      jsonCount: entries.length,
      blocksWithPlaceholders,
      placeholderCount,
      uniqueIconCount: uniqueIcons.size,
      missingLucideCount,
    },
  };
}

function inspectGeneratedSource({ path, source }) {
  const importsByLocal = new Map();
  const importedIcons = new Set();
  const occurrences = [];
  const parsed = sourceFile(path, source);
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "lucide-react"
    ) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const imported = element.propertyName?.text ?? element.name.text;
          importsByLocal.set(element.name.text, imported);
          importedIcons.add(imported);
        }
      }
    }
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      ts.isIdentifier(node.tagName)
    ) {
      const local = node.tagName.text;
      const icon = importsByLocal.get(local);
      if (icon) occurrences.push({ icon, attributes: preservedAttributes(node) });
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return { path, importedIcons, occurrences };
}

function normalizedExpectedFiles(expected) {
  if (Array.isArray(expected)) return expected;
  return [
    {
      path: undefined,
      occurrences: Object.entries(expected).flatMap(([icon, count]) =>
        Array.from({ length: count }, () => ({ icon, attributes: undefined })),
      ),
    },
  ];
}

function sameAttributes(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function inspectGeneratedIcons(expectedByBlock, generatedByBlock) {
  const problems = [];
  let expectedOccurrences = 0;
  let matchedOccurrences = 0;
  const entries = Object.entries(expectedByBlock);

  for (const [name, expected] of entries) {
    const files = generatedByBlock[name];
    const expectedFiles = normalizedExpectedFiles(expected);
    const blockExpected = expectedFiles.reduce((sum, file) => sum + file.occurrences.length, 0);
    expectedOccurrences += blockExpected;
    if (!Array.isArray(files) || files.length === 0) {
      problems.push(`${name}: 生成物が無い`);
      continue;
    }
    const inspected = files.map(inspectGeneratedSource);
    for (const expectedFile of expectedFiles) {
      const candidates = expectedFile.path
        ? inspected.filter((file) => file.path === expectedFile.path)
        : inspected;
      if (candidates.length === 0) {
        problems.push(`${name}: ${expectedFile.path} の生成物が無い`);
        continue;
      }
      const importedIcons = new Set(candidates.flatMap((file) => [...file.importedIcons]));
      const actual = candidates.flatMap((file) => file.occurrences).map((item) => ({ ...item }));
      for (const baseline of expectedFile.baselineOccurrences ?? []) {
        const match = actual.findIndex(
          (candidate) =>
            candidate.icon === baseline.icon &&
            sameAttributes(candidate.attributes, baseline.attributes),
        );
        if (match >= 0) actual.splice(match, 1);
      }
      for (const occurrence of expectedFile.occurrences) {
        if (!importedIcons.has(occurrence.icon)) {
          problems.push(
            `${name}: ${expectedFile.path ? `${expectedFile.path} の ` : ""}${occurrence.icon} が lucide-react から named import されていない`,
          );
          continue;
        }
        const match = actual.findIndex(
          (candidate) =>
            candidate.icon === occurrence.icon &&
            (occurrence.attributes === undefined ||
              sameAttributes(candidate.attributes, occurrence.attributes)),
        );
        if (match >= 0) {
          actual.splice(match, 1);
          matchedOccurrences++;
          continue;
        }
        if (actual.some((candidate) => candidate.icon === occurrence.icon)) {
          problems.push(
            `${name}: ${expectedFile.path ? `${expectedFile.path} の ` : ""}${occurrence.icon} の属性が一致しない（期待 ${occurrence.attributes.join(" ") || "属性なし"}）`,
          );
        } else {
          const expectedCount = expectedFile.occurrences.filter(
            (candidate) => candidate.icon === occurrence.icon,
          ).length;
          const actualCount = candidates
            .flatMap((file) => file.occurrences)
            .filter((candidate) => candidate.icon === occurrence.icon).length;
          problems.push(
            `${name}: ${expectedFile.path ? `${expectedFile.path} の ` : ""}${occurrence.icon} の JSX 使用が不足している（期待 ${expectedCount} / 実測 ${actualCount}）`,
          );
        }
      }
    }
  }

  return {
    problems,
    stats: {
      blocksChecked: entries.length,
      expectedOccurrences,
      matchedOccurrences,
    },
  };
}

async function fetchUpstreamBlocks() {
  const entries = [];
  for (const name of BLOCK_NAMES) {
    const url = `https://ui.shadcn.com/r/styles/base-nova/${name}.json`;
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`${name}: 上流 JSON の取得に失敗 (${response.status})`);
    const item = await response.json();
    if (item?.type !== "registry:block") {
      throw new Error(`${name}: 上流 item の type が registry:block でない`);
    }
    entries.push({ name, item });
  }
  return entries;
}

function readGeneratedBlocks(expectedByBlock, root = ".") {
  return Object.fromEntries(
    Object.keys(expectedByBlock).map((name) => [
      name,
      listBlockFiles(root, name).map((path) => ({ path, source: readFileSync(path, "utf8") })),
    ]),
  );
}

function readGeneratedPreviews(expectedByPreview) {
  return Object.fromEntries(
    Object.keys(expectedByPreview).map((name) => {
      const path = `src/previews/${name}.tsx`;
      return [name, existsSync(path) ? [{ path, source: readFileSync(path, "utf8") }] : []];
    }),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const upstream = inspectUpstreamBlocks(await fetchUpstreamBlocks());
    console.log(
      `上流検査: JSON ${upstream.stats.jsonCount} 件 / IconPlaceholder ${upstream.stats.placeholderCount} 箇所 / 対象 block ${upstream.stats.blocksWithPlaceholders} 件 / lucide ${upstream.stats.uniqueIconCount} 種 / lucide 欠損 ${upstream.stats.missingLucideCount} 件`,
    );
    if (upstream.problems.length > 0) {
      console.error(`上流 IconPlaceholder の検査に失敗:\n  ${upstream.problems.join("\n  ")}`);
      process.exitCode = 1;
    } else {
      const generated = inspectGeneratedIcons(
        upstream.expectedByTarget.blocks,
        readGeneratedBlocks(upstream.expectedByTarget.blocks),
      );
      console.log(
        `生成物突合 (block): block ${generated.stats.blocksChecked} 件 / 期待 ${generated.stats.expectedOccurrences} 箇所 / 一致 ${generated.stats.matchedOccurrences} 箇所`,
      );
      const previews = inspectGeneratedIcons(
        upstream.expectedByTarget.previews,
        readGeneratedPreviews(upstream.expectedByTarget.previews),
      );
      console.log(
        `生成物突合 (preview): block ${previews.stats.blocksChecked} 件 / 期待 ${previews.stats.expectedOccurrences} 箇所 / 一致 ${previews.stats.matchedOccurrences} 箇所`,
      );
      const generatedProblems = [
        ...generated.problems.map((problem) => `block: ${problem}`),
        ...previews.problems.map((problem) => `preview: ${problem}`),
      ];
      if (generatedProblems.length > 0) {
        console.error(`CLI の lucide 展開実体の検査に失敗:\n  ${generatedProblems.join("\n  ")}`);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
