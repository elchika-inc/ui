import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

import { CONSUMER_CASES } from "./contrast-cases.mjs";

const GATES = new Map([
  ["text-aa", 4.5],
  ["nontext-ui", 3],
  ["disabled-exempt", null],
  ["decorative", null],
]);

const clamp = (value) => Math.min(Math.max(value, 0), 1);

const parseAlpha = (raw) => {
  const value = raw.trim();
  const percentage = value.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))%$/);
  const number = percentage ? Number(percentage[1]) / 100 : Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    throw new Error(`alpha が範囲外: ${raw}`);
  }
  return number;
};

const linearToGamma = (value) =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

const gammaToLinear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const oklchToGammaSrgb = (lightness, chroma, hue) => {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((channel) => clamp(linearToGamma(clamp(channel))));
};

export function parseColor(raw) {
  const value = raw.trim();
  const oklch = value.match(
    /^oklch\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*([^)]+))?\s*\)$/,
  );
  if (oklch) {
    const [, lightnessRaw, chromaRaw, hueRaw, alphaRaw] = oklch;
    const lightness = Number(lightnessRaw);
    const chroma = Number(chromaRaw);
    const hue = Number(hueRaw);
    if (
      !Number.isFinite(lightness) ||
      !Number.isFinite(chroma) ||
      !Number.isFinite(hue) ||
      lightness < 0 ||
      lightness > 1 ||
      chroma < 0
    ) {
      throw new Error(`OKLCH が範囲外: ${raw}`);
    }
    return {
      rgb: oklchToGammaSrgb(lightness, chroma, hue),
      alpha: alphaRaw === undefined ? 1 : parseAlpha(alphaRaw),
    };
  }

  const triplet = value.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/,
  );
  if (triplet) {
    const channels = triplet.slice(1).map(Number);
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      throw new Error(`RGB channel が範囲外: ${raw}`);
    }
    return { rgb: channels.map((channel) => channel / 255), alpha: 1 };
  }

  const rgb = value.match(
    /^rgb\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*([^)]+))?\s*\)$/,
  );
  if (rgb) {
    const channels = rgb.slice(1, 4).map(Number);
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      throw new Error(`RGB channel が範囲外: ${raw}`);
    }
    return {
      rgb: channels.map((channel) => channel / 255),
      alpha: rgb[4] === undefined ? 1 : parseAlpha(rgb[4]),
    };
  }

  throw new Error(`色の値を解釈できない: ${raw}`);
}

const declarations = (body) =>
  new Map(
    [...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );

const blocks = (css, selector) =>
  [...css.matchAll(new RegExp(`${selector}\\s*\\{([^{}]*)\\}`, "g"))].map((match) =>
    declarations(match[1]),
  );

const mergeBlocks = (target, sources) => {
  for (const source of sources) {
    for (const [name, value] of source) target.set(name, value);
  }
};

export function parseThemes(css) {
  const problems = [];
  const rootBlocks = blocks(css, ":root");
  const classDarkBlocks = blocks(css, "\\.dark");
  const dataDarkBlocks = blocks(css, '\\[data-theme\\s*=\\s*["\\\x27]?dark["\\\x27]?\\]');
  if (rootBlocks.length === 0) problems.push(":root block が無い");
  if (classDarkBlocks.length === 0 && dataDarkBlocks.length === 0) {
    problems.push("dark selector（.dark または [data-theme=dark]）が無い");
  }

  const light = new Map();
  const classDark = new Map();
  const dataDark = new Map();
  mergeBlocks(light, rootBlocks);
  mergeBlocks(classDark, classDarkBlocks);
  mergeBlocks(dataDark, dataDarkBlocks);
  for (const [name, classValue] of classDark) {
    const dataValue = dataDark.get(name);
    if (dataValue !== undefined && dataValue !== classValue) {
      problems.push(`--${name}: .dark と data-theme dark の値が一致しない`);
    }
  }
  const dark = new Map(light);
  mergeBlocks(dark, classDarkBlocks);
  mergeBlocks(dark, dataDarkBlocks);
  return { light, dark, problems };
}

const tokenName = (name) => name.replace(/^--/, "");

const rawToken = (themes, theme, name) => themes[theme]?.get(tokenName(name));

const resolveScalar = (themes, theme, name, seen) => {
  const normalized = tokenName(name);
  if (seen.has(`scalar:${normalized}`)) {
    return { problem: `--${normalized}: alias が循環している` };
  }
  const raw = rawToken(themes, theme, normalized);
  if (raw === undefined) return { problem: `--${normalized}: token が無い` };
  const nextSeen = new Set(seen).add(`scalar:${normalized}`);
  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
  if (alias) return resolveScalar(themes, theme, alias[1], nextSeen);
  try {
    return { value: parseAlpha(raw) };
  } catch (error) {
    return { problem: `--${normalized}: ${error.message}` };
  }
};

export function resolveToken(themes, theme, name, seen = new Set()) {
  const normalized = tokenName(name);
  if (!themes?.[theme]) return { problem: `theme が不正: ${theme}` };
  if (seen.has(normalized)) return { problem: `--${normalized}: alias が循環している` };
  const raw = rawToken(themes, theme, normalized);
  if (raw === undefined) return { problem: `--${normalized}: token が無い` };
  const nextSeen = new Set(seen).add(normalized);

  const alias = raw.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
  if (alias) return resolveToken(themes, theme, alias[1], nextSeen);

  const rgbAlias = raw.match(
    /^rgb\(\s*var\(\s*(--[a-z0-9-]+)\s*\)(?:\s*\/\s*(var\(\s*(--[a-z0-9-]+)\s*\)|[^)]+))?\s*\)$/i,
  );
  if (rgbAlias) {
    const base = resolveToken(themes, theme, rgbAlias[1], nextSeen);
    if (base.problem) return base;
    let alpha = 1;
    if (rgbAlias[2]) {
      if (rgbAlias[3]) {
        const scalar = resolveScalar(themes, theme, rgbAlias[3], new Set());
        if (scalar.problem) return scalar;
        alpha = scalar.value;
      } else {
        try {
          alpha = parseAlpha(rgbAlias[2]);
        } catch (error) {
          return { problem: `--${normalized}: ${error.message}` };
        }
      }
    }
    return { rgb: base.rgb, alpha: base.alpha * alpha };
  }

  try {
    return parseColor(raw);
  } catch (error) {
    return { problem: `--${normalized}: ${error.message}` };
  }
}

export function composite(foreground, background) {
  const foregroundAlpha = foreground.alpha ?? 1;
  const backgroundAlpha = background.alpha ?? 1;
  const alpha = foregroundAlpha + backgroundAlpha * (1 - foregroundAlpha);
  if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 };
  return {
    rgb: foreground.rgb.map(
      (channel, index) =>
        (channel * foregroundAlpha +
          background.rgb[index] * backgroundAlpha * (1 - foregroundAlpha)) /
        alpha,
    ),
    alpha,
  };
}

const relativeLuminance = (color) =>
  color.rgb
    .map(gammaToLinear)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

export function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const resolvePaint = (specification, themes, theme, fallbackUnderlay) => {
  if (!specification?.token) return { problem: "paint token が無い" };
  const resolved = resolveToken(themes, theme, specification.token);
  if (resolved.problem) return resolved;
  const color = {
    ...resolved,
    alpha: resolved.alpha * (specification.alpha ?? 1),
  };
  if (color.alpha >= 1) return color;
  const underlayName = specification.underlay ?? fallbackUnderlay;
  if (!underlayName) {
    return { problem: `${specification.token}: alpha 合成先が無い` };
  }
  const underlay = resolveToken(themes, theme, underlayName);
  if (underlay.problem) return underlay;
  return composite(color, underlay);
};

export function evaluateCase(consumerCase, themes) {
  const problemDetails = [];
  const results = [];
  if (!consumerCase?.label) {
    problemDetails.push({ kind: "structure", message: "case label が空" });
  }
  if (!consumerCase?.reason?.trim()) {
    problemDetails.push({ kind: "structure", message: `${consumerCase?.label}: reason が空` });
  }
  if (!GATES.has(consumerCase?.gate)) {
    problemDetails.push({
      kind: "structure",
      message: `${consumerCase?.label}: gate が不正: ${consumerCase?.gate}`,
    });
  }
  const selectedThemes = consumerCase?.themes ?? ["light", "dark"];
  for (const theme of selectedThemes) {
    const background = resolvePaint(
      consumerCase.background,
      themes,
      theme,
      consumerCase.background?.underlay,
    );
    if (background.problem) {
      problemDetails.push({
        kind: "resolve",
        message: `${consumerCase.label} (${theme}): background ${background.problem}`,
      });
      continue;
    }
    const foreground = resolvePaint(
      consumerCase.foreground,
      themes,
      theme,
      consumerCase.background?.token,
    );
    if (foreground.problem) {
      problemDetails.push({
        kind: "resolve",
        message: `${consumerCase.label} (${theme}): foreground ${foreground.problem}`,
      });
      continue;
    }
    const ratio = contrastRatio(foreground, background);
    const threshold = GATES.get(consumerCase.gate);
    const passed = threshold === null || ratio >= threshold;
    const result = {
      label: consumerCase.label,
      theme,
      gate: consumerCase.gate,
      reason: consumerCase.reason,
      ratio,
      passed,
      risk: consumerCase.risk,
    };
    results.push(result);
    if (!passed) {
      problemDetails.push({
        kind: "threshold",
        risk: consumerCase.risk,
        message: `${consumerCase.label} (${theme}): ${ratio.toFixed(4)} < ${threshold}`,
      });
    }
  }
  return {
    results,
    problemDetails,
    problems: problemDetails.map((detail) => detail.message),
  };
}

export function extractClassTokens(source, path = "source.tsx") {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const tokens = new Set();
  const collect = (text) => {
    for (const token of text.split(/\s+/)) {
      if (token) tokens.add(token);
    }
  };
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      collect(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return tokens;
}

const isSemanticAlphaUtility = (token) =>
  /(?:^|:)(?:bg|text|border|ring|stroke|fill)-[a-z][a-z0-9-]*\/[0-9]+$/.test(token);

export async function inspectSourceCoverage(root, consumerCases) {
  const problems = [];
  const componentRoot = join(root, "src/components/ui");
  let names;
  try {
    names = (await readdir(componentRoot)).filter((name) => name.endsWith(".tsx")).sort();
  } catch (error) {
    return { problems: [`component source を読めない: ${error.message}`] };
  }
  if (names.length === 0) return { problems: ["component source が 0 件"] };

  const tokensByPath = new Map();
  const actualAlpha = new Set();
  for (const name of names) {
    const path = `src/components/ui/${name}`;
    const tokens = extractClassTokens(await readFile(join(root, path), "utf8"), path);
    tokensByPath.set(path, tokens);
    for (const token of tokens) {
      if (isSemanticAlphaUtility(token)) actualAlpha.add(`${path}\0${token}`);
    }
  }

  const expected = new Set();
  for (const consumerCase of consumerCases) {
    for (const entry of consumerCase.sourceClasses ?? []) {
      const sourceTokens = tokensByPath.get(entry.source);
      if (!sourceTokens) {
        problems.push(`${consumerCase.label}: ${entry.source} が存在しない`);
        continue;
      }
      for (const className of entry.classes) {
        expected.add(`${entry.source}\0${className}`);
        if (!sourceTokens.has(className)) {
          problems.push(`${consumerCase.label}: ${entry.source} の ${className} が存在しない`);
        }
      }
    }
  }
  for (const actual of actualAlpha) {
    if (!expected.has(actual)) {
      const [path, className] = actual.split("\0");
      problems.push(`${path}: ${className} が consumer case で未分類`);
    }
  }
  return { problems, actualAlpha, expected };
}

const riskStatus = (markdown, risk) => {
  const escaped = risk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`^## ${escaped}:.*$`, "m").exec(markdown);
  if (!heading) return undefined;
  const afterHeading = markdown.slice(heading.index + heading[0].length);
  const nextHeading = afterHeading.search(/^## /m);
  const section = nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
  return section?.match(/^- status:\s*(\S+)\s*$/m)?.[1];
};

export function evaluateAcceptedRisks(results, markdown) {
  const problems = [];
  const accepted = [];
  const acceptedRiskIds = new Set();
  const grouped = new Map();
  for (const result of results) {
    if (!result.risk) continue;
    const entries = grouped.get(result.risk) ?? [];
    entries.push(result);
    grouped.set(result.risk, entries);
  }
  for (const [risk, entries] of grouped) {
    if (riskStatus(markdown, risk) !== "accepted") continue;
    if (entries.some((entry) => !entry.passed)) {
      acceptedRiskIds.add(risk);
      accepted.push(`${risk}: 現行 FAIL を accepted risk として受容`);
    } else {
      problems.push(`${risk}: PASS 後も accepted のままで stale`);
    }
  }
  return { problems, accepted, acceptedRiskIds };
}

export async function checkContrastInRepo(root) {
  const problems = [];
  const cssPaths = ["src/styles/design-system/tokens.css", "src/styles/global.css"];
  const cssSources = [];
  for (const path of cssPaths) {
    const absolute = join(root, path);
    if (path.includes("design-system") && !existsSync(absolute)) continue;
    try {
      cssSources.push(await readFile(absolute, "utf8"));
    } catch (error) {
      problems.push(`${path} を読めない: ${error.message}`);
    }
  }
  const themes = parseThemes(cssSources.join("\n"));
  problems.push(...themes.problems);

  const inspectedCases = CONSUMER_CASES.map((consumerCase) => ({
    consumerCase,
    inspected: evaluateCase(consumerCase, themes),
  }));
  const results = inspectedCases.flatMap(({ inspected }) => inspected.results);
  let riskMarkdown = "";
  try {
    riskMarkdown = await readFile(join(root, ".docs/risk-registry.md"), "utf8");
  } catch (error) {
    problems.push(`risk registry を読めない: ${error.message}`);
  }
  const risks = evaluateAcceptedRisks(results, riskMarkdown);
  problems.push(...risks.problems);
  for (const { inspected } of inspectedCases) {
    for (const detail of inspected.problemDetails) {
      if (detail.kind === "threshold" && detail.risk && risks.acceptedRiskIds.has(detail.risk)) {
        continue;
      }
      problems.push(detail.message);
    }
  }
  const coverage = await inspectSourceCoverage(root, CONSUMER_CASES);
  problems.push(...coverage.problems);
  return { problems, results, accepted: risks.accepted };
}

const runCli = async () => {
  const root = process.cwd();
  const inspected = await checkContrastInRepo(root);
  const acceptedLabels = new Set(inspected.accepted.map((entry) => entry.split(":")[0]));
  for (const result of inspected.results) {
    const status = result.passed
      ? "PASS"
      : result.risk && acceptedLabels.has(result.risk)
        ? "ACCEPTED"
        : "FAIL";
    console.log(
      `${status}\t${result.gate}\t${result.label} (${result.theme})\t${result.ratio.toFixed(4)}\t${result.reason}`,
    );
  }
  for (const entry of inspected.accepted) console.log(`ACCEPTED RISK\t${entry}`);
  if (inspected.problems.length) {
    console.error(`contrast 検査に失敗:\n  ${inspected.problems.join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log("実利用配色 OK");
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
