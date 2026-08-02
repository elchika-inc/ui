// DESIGN.md §5 の 2 規定を機械検知する。
// 1. フォーカスリングに透明度合成を使わない（WCAG 1.4.11 の 3:1 を割るため）
// 2. 値系ユーティリティの arbitrary value を使わない。
//    例外は ring-[3px] と @custom-variant dark のみ。
//    variant 構文（data-[...] / aria-[...] / [&_svg]:...）は AUDIT.md の
//    規定どおり対象外。
// AUDIT.md は components/ui/ を検査対象外としているが、それは shadcn から
// コピーして所有するだけのプロジェクト向けの規定。本リポジトリは
// components/ui/ そのものを standards へ正規化して配布する側なので、
// ここは意図的に対象へ含める。
import { globSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// 同じクラストークン内に focus / invalid の状態語があるリングだけを対象にする。
// variant の前後や arbitrary variant の内外には依存しない。無条件の
// ring-foreground/10 のような装飾リングは WCAG 1.4.11 の状態表示ではない。
// 色名は [a-z0-9-]+（[a-z-]+ だと ring-red-500/50 を見逃す）。
// 不透明度の指定は Tailwind v4 が 4 形式を受けるため全部拾う（実測で確認）:
//   /50  /12.5  /[50%]  /[.5]  /(--ring-alpha)
// \d+ だけだと角括弧・丸括弧の形式を見逃し、透明度禁止を迂回できる。
// arbitrary 検査にも掛からないので、ここが唯一の検出経路になる。
// 色側も v4 の変数短縮 ring-(--brand) と任意値 ring-[#f00] を拾う。
// 色側を [a-z0-9-]+ だけにすると ring-(--brand)/50 を見逃す（実測）。
const STATEFUL_RING = /(?:focus|invalid)/;
const RING_OPACITY =
  /ring-(?:ring|[a-z0-9-]+|\([^)]+\)|\[[^\]]+\])\/(?:\d+(?:\.\d+)?%?|\[[^\]]+\]|\([^)]+\))/g;
const STRING_LITERAL = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;

// 値系ユーティリティだけを対象にする。プレフィックスの列挙は AUDIT.md の
// arbitrary value 検査コマンドから逐語で写した。
// has-data-[...] / in-data-[...] / not-aria-[...] / [&_svg]:... は
// 正当な variant 構文であり、この列挙に含まれないので自然に除外される。
const ARBITRARY =
  /\b(?:w|h|size|p[trblxy]?|m[trblxy]?|text|gap|z|top|left|right|bottom|inset|rounded|duration|leading|tracking|ring|border|shadow|bg|fill|stroke)-\[[^\]]+\]/g;
const ALLOWED_ARBITRARY = new Set(["ring-[3px]"]);
const BOOLEAN_DATA_INSET = /data-inset=\{inset\}/g;

function classNameExpressions(path, source) {
  if (!path.endsWith(".tsx")) return [];
  const isAttributeFragment = !source.includes("<");
  const prefix = isAttributeFragment ? "<div " : "";
  const parsedSource = isAttributeFragment ? `${prefix}${source} />` : source;
  const virtualPath = "/__elchika_check__/input.tsx";
  const sourceFile = ts.createSourceFile(
    virtualPath,
    parsedSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const compilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    noLib: true,
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const host = {
    fileExists: (fileName) => fileName === virtualPath,
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => "/",
    getDefaultLibFileName: () => "",
    getDirectories: () => [],
    getNewLine: () => "\n",
    getSourceFile: (fileName) => (fileName === virtualPath ? sourceFile : undefined),
    readFile: (fileName) => (fileName === virtualPath ? parsedSource : undefined),
    useCaseSensitiveFileNames: () => true,
    writeFile: () => {},
  };
  const checker = ts.createProgram([virtualPath], compilerOptions, host).getTypeChecker();
  const expressions = [];
  const symbolKeys = new WeakMap();
  let nextSymbolKey = 1;
  const symbolKey = (symbol) => {
    if (!symbolKeys.has(symbol)) symbolKeys.set(symbol, nextSymbolKey++);
    return symbolKeys.get(symbol);
  };
  const unwrapCondition = (expression, truthy) => {
    let current = expression;
    let required = truthy;
    while (ts.isParenthesizedExpression(current)) current = current.expression;
    while (
      ts.isPrefixUnaryExpression(current) &&
      current.operator === ts.SyntaxKind.ExclamationToken
    ) {
      required = !required;
      current = current.operand;
      while (ts.isParenthesizedExpression(current)) current = current.expression;
    }
    const location = ts.isPropertyAccessExpression(current) ? current.name : current;
    const symbol = checker.getSymbolAtLocation(location);
    const key = symbol
      ? `symbol:${symbolKey(symbol)}`
      : `expression:${current.getStart(sourceFile)}:${current.getText(sourceFile)}`;
    return { key, required };
  };

  const withRequirement = (candidates, requirement) =>
    candidates.flatMap((candidate) => {
      const existing = candidate.requirements.get(requirement.key);
      if (existing !== undefined && existing !== requirement.required) return [];
      const requirements = new Map(candidate.requirements);
      requirements.set(requirement.key, requirement.required);
      return [{ ...candidate, requirements }];
    });

  const mergeCandidates = (left, right) => {
    const requirements = new Map(left.requirements);
    for (const [key, required] of right.requirements) {
      const existing = requirements.get(key);
      if (existing !== undefined && existing !== required) return undefined;
      requirements.set(key, required);
    }
    return { nodes: [...left.nodes, ...right.nodes], requirements };
  };

  const combineCandidateSets = (sets) =>
    sets.reduce(
      (combined, candidates) =>
        combined.flatMap((left) =>
          candidates.flatMap((right) => {
            const merged = mergeCandidates(left, right);
            return merged ? [merged] : [];
          }),
        ),
      [{ nodes: [], requirements: new Map() }],
    );

  const declarationInitializers = (expression) => {
    const location = ts.isPropertyAccessExpression(expression) ? expression.name : expression;
    const symbol = checker.getSymbolAtLocation(location);
    if (!symbol) return {};
    const initializers = (symbol.declarations ?? [])
      .filter(
        (declaration) =>
          (ts.isVariableDeclaration(declaration) ||
            ts.isParameter(declaration) ||
            ts.isBindingElement(declaration) ||
            ts.isPropertyAssignment(declaration) ||
            ts.isPropertyDeclaration(declaration)) &&
          declaration.initializer,
      )
      .map((declaration) => declaration.initializer);
    return { symbol, initializers };
  };

  const candidatesForExpression = (expression, resolving = new Set()) => {
    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression) ||
      ts.isNonNullExpression(expression)
    ) {
      return candidatesForExpression(expression.expression, resolving);
    }
    if (ts.isConditionalExpression(expression)) {
      return [
        ...withRequirement(
          candidatesForExpression(expression.whenTrue, resolving),
          unwrapCondition(expression.condition, true),
        ),
        ...withRequirement(
          candidatesForExpression(expression.whenFalse, resolving),
          unwrapCondition(expression.condition, false),
        ),
      ];
    }
    if (ts.isBinaryExpression(expression)) {
      if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return [
          ...withRequirement(
            [{ nodes: [], requirements: new Map() }],
            unwrapCondition(expression.left, false),
          ),
          ...withRequirement(
            candidatesForExpression(expression.right, resolving),
            unwrapCondition(expression.left, true),
          ),
        ];
      }
      if (expression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        return [
          ...withRequirement(
            [{ nodes: [], requirements: new Map() }],
            unwrapCondition(expression.left, true),
          ),
          ...withRequirement(
            candidatesForExpression(expression.right, resolving),
            unwrapCondition(expression.left, false),
          ),
        ];
      }
      if (
        expression.operatorToken.kind === ts.SyntaxKind.PlusToken ||
        expression.operatorToken.kind === ts.SyntaxKind.CommaToken
      ) {
        return combineCandidateSets([
          candidatesForExpression(expression.left, resolving),
          candidatesForExpression(expression.right, resolving),
        ]);
      }
    }
    if (ts.isCallExpression(expression)) {
      if (
        ts.isPropertyAccessExpression(expression.expression) &&
        expression.expression.name.text === "join" &&
        ts.isArrayLiteralExpression(expression.expression.expression)
      ) {
        return candidatesForExpression(expression.expression.expression, resolving);
      }
      return combineCandidateSets(
        expression.arguments.map((argument) => candidatesForExpression(argument, resolving)),
      );
    }
    if (ts.isArrayLiteralExpression(expression)) {
      return combineCandidateSets(
        expression.elements.map((element) => candidatesForExpression(element, resolving)),
      );
    }
    if (
      ts.isIdentifier(expression) ||
      ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)
    ) {
      const { symbol, initializers = [] } = declarationInitializers(expression);
      if (symbol && initializers.length && !resolving.has(symbol)) {
        const nextResolving = new Set(resolving).add(symbol);
        return initializers.flatMap((initializer) =>
          candidatesForExpression(initializer, nextResolving),
        );
      }
    }
    return [{ nodes: [expression], requirements: new Map() }];
  };

  const expressionFragments = (expression) => {
    const candidates = candidatesForExpression(expression);
    return candidates.map((candidate) => {
      const fragments = new Map();
      for (const node of candidate.nodes) {
        const key = `${node.getStart(sourceFile)}:${node.getEnd()}`;
        fragments.set(key, {
          text: node.getText(sourceFile),
          offset: Math.max(0, node.getStart(sourceFile) - prefix.length),
        });
      }
      return [...fragments.values()];
    });
  };
  const visit = (node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sourceFile) === "className" &&
      node.initializer
    ) {
      const value = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (value) {
        expressions.push(...expressionFragments(value));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return expressions;
}

function statefulRingFragmentViolations(fragments, source) {
  const literals = fragments.flatMap((fragment) => {
    const literalMatches = [...fragment.text.matchAll(STRING_LITERAL)];
    return literalMatches.length
      ? literalMatches.map((match) => ({
          text: match[0].slice(1, -1),
          offset: fragment.offset + (match.index ?? 0) + 1,
        }))
      : [{ text: fragment.text, offset: fragment.offset }];
  });
  const tokens = literals.flatMap((literal) => literal.text.split(/\s+/));
  if (!tokens.some((token) => STATEFUL_RING.test(token) && token.includes("ring-"))) {
    return [];
  }
  return literals.flatMap((literal) =>
    [...literal.text.matchAll(RING_OPACITY)].map((match) => ({
      rule: "focus-ring-opacity",
      line: source.slice(0, literal.offset + (match.index ?? 0)).split("\n").length,
      text: match[0],
    })),
  );
}

function statefulRingViolations(text, source, offset) {
  return statefulRingFragmentViolations([{ text, offset }], source);
}

export function checkFile(path, source) {
  const violations = [];
  let lineOffset = 0;
  source.split("\n").forEach((line, i) => {
    const currentLineOffset = lineOffset;
    lineOffset += line.length + 1;
    if (line.includes("@custom-variant dark")) return;
    violations.push(...statefulRingViolations(line, source, currentLineOffset));
    for (const m of line.matchAll(ARBITRARY)) {
      if (ALLOWED_ARBITRARY.has(m[0])) continue;
      violations.push({ rule: "arbitrary-value", line: i + 1, text: m[0] });
    }
    for (const m of line.matchAll(BOOLEAN_DATA_INSET)) {
      violations.push({ rule: "boolean-data-inset", line: i + 1, text: m[0] });
    }
  });
  for (const fragments of classNameExpressions(path, source)) {
    violations.push(...statefulRingFragmentViolations(fragments, source));
  }
  const unique = new Map(
    violations.map((violation) => [
      `${violation.rule}:${violation.line}:${violation.text}`,
      violation,
    ]),
  );
  return { violations: [...unique.values()] };
}

// pathToFileURL を使う。`file://${process.argv[1]}` の素朴な連結は
// パスに特殊文字を含む環境で一致しない。
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = globSync("src/**/*.{tsx,css}");
  if (files.length === 0) {
    console.error("走査対象が 0 件（glob が壊れている）");
    process.exit(1);
  }
  let total = 0;
  for (const f of files) {
    const { violations } = checkFile(f, readFileSync(f, "utf8"));
    for (const v of violations) {
      console.error(`${f}:${v.line}  ${v.rule}  ${v.text}`);
      total++;
    }
  }
  if (total) {
    console.error(`\n${total} 件の standards 違反`);
    process.exit(1);
  }
  console.log(`standards 適合（${files.length} ファイルを検査）`);
}
