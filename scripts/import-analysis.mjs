import ts from "typescript";

const EXTERNAL_IMPORT_EXEMPTIONS = new Set(["react", "react-dom"]);

export function dependencyName(specifier) {
  if (specifier.startsWith("@")) {
    const [scope, packagePart] = specifier.split("/");
    return packagePart ? `${scope}/${packagePart.split("@")[0]}` : specifier;
  }
  return specifier.split("@")[0];
}

function packageFromImport(specifier) {
  if (specifier.startsWith("@/")) return undefined;
  if (specifier.startsWith(".") || specifier.startsWith("node:")) return undefined;
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

export function externalPackageFromImport(specifier) {
  const name = packageFromImport(specifier);
  return name && !EXTERNAL_IMPORT_EXEMPTIONS.has(name) ? name : undefined;
}

export function importedModuleSpecifiers(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    throw new Error(`${fileName}: import を解析できない`);
  }
  const specifiers = new Set();
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length !== 1 || !ts.isStringLiteralLike(node.arguments[0])) {
        throw new Error(`${fileName}: 動的 import の指定が文字列リテラルでない`);
      }
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

export function externalImports(source, fileName = "registry item") {
  const packages = new Set();
  for (const specifier of importedModuleSpecifiers(source, fileName)) {
    const name = externalPackageFromImport(specifier);
    if (name) packages.add(name);
  }
  return packages;
}
