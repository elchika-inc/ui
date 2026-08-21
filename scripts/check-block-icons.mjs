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

function sortedCounts(counts) {
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
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
    const countsByTarget = { blocks: new Map(), previews: new Map() };
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
            const counts = countsByTarget[target];
            counts.set(icon, (counts.get(icon) ?? 0) + 1);
            uniqueIcons.add(icon);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(parsed);
    }
    if (blockPlaceholderCount > 0) {
      blocksWithPlaceholders++;
      for (const target of ["blocks", "previews"]) {
        const counts = countsByTarget[target];
        if (counts.size > 0) expectedByTarget[target][name] = sortedCounts(counts);
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

function inspectGeneratedSources(files) {
  const imports = new Map();
  const usages = new Map();

  for (const { path, source } of files) {
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
            const locals = imports.get(imported) ?? new Set();
            locals.add(element.name.text);
            imports.set(imported, locals);
          }
        }
      }
      if (
        (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
        ts.isIdentifier(node.tagName)
      ) {
        const local = node.tagName.text;
        usages.set(local, (usages.get(local) ?? 0) + 1);
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
  }

  return { imports, usages };
}

export function inspectGeneratedIcons(expectedByBlock, generatedByBlock) {
  const problems = [];
  let expectedOccurrences = 0;
  let matchedOccurrences = 0;
  const entries = Object.entries(expectedByBlock);

  for (const [name, expectedIcons] of entries) {
    const files = generatedByBlock[name];
    const blockExpected = Object.values(expectedIcons).reduce((sum, count) => sum + count, 0);
    expectedOccurrences += blockExpected;
    if (!Array.isArray(files) || files.length === 0) {
      problems.push(`${name}: 生成物が無い`);
      continue;
    }
    const { imports, usages } = inspectGeneratedSources(files);
    for (const [icon, expectedCount] of Object.entries(expectedIcons)) {
      const locals = imports.get(icon);
      if (!locals || locals.size === 0) {
        problems.push(`${name}: ${icon} が lucide-react から named import されていない`);
        continue;
      }
      const actualCount = [...locals].reduce((sum, local) => sum + (usages.get(local) ?? 0), 0);
      matchedOccurrences += Math.min(actualCount, expectedCount);
      if (actualCount < expectedCount) {
        problems.push(
          `${name}: ${icon} の JSX 使用が不足している（期待 ${expectedCount} / 実測 ${actualCount}）`,
        );
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
