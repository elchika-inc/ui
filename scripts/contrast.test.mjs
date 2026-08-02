import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const contrastUrl = new URL("./contrast.mjs", import.meta.url);
const casesUrl = new URL("./contrast-cases.mjs", import.meta.url);

const loadContrast = () => import(contrastUrl);
const loadCases = () => import(casesUrl);

const themeCss = ({ light, dark, darkSelector = ".dark" }) => `
:root {
${light}
}
${darkSelector} {
${dark}
}
`;

test("destructive/10 を gamma-encoded sRGB channel 上で合成する", async () => {
  const { composite, contrastRatio, parseColor } = await loadContrast();
  const destructive = parseColor("oklch(0.5650 0.1774 22.67)");
  const background = parseColor("oklch(0.9734 0.0013 286.38)");
  const surface = composite({ ...destructive, alpha: 0.1 }, background);

  assert.ok(Math.abs(contrastRatio(destructive, surface) - 4.0193) < 0.001);
});

test(":root と dark selector のどちらかが欠けた CSS を拒否する", async () => {
  const { parseThemes } = await loadContrast();

  assert.match(parseThemes(":root { --foreground: 0 0 0; }").problems.join("\n"), /dark/);
  assert.match(parseThemes(".dark { --foreground: 255 255 255; }").problems.join("\n"), /:root/);
});

test("data-theme dark を読み、同名の dark alias が食い違えば拒否する", async () => {
  const { parseThemes, resolveToken } = await loadContrast();
  const valid = parseThemes(
    themeCss({
      light: "  --foreground: 0 0 0;",
      dark: "  --foreground: 255 255 255;",
      darkSelector: '[data-theme="dark"]',
    }),
  );

  assert.deepEqual(resolveToken(valid, "dark", "foreground").rgb, [1, 1, 1]);

  const conflict = parseThemes(`
    :root { --foreground: 0 0 0; }
    .dark { --foreground: 240 240 240; }
    [data-theme="dark"] { --foreground: 255 255 255; }
  `);
  assert.match(conflict.problems.join("\n"), /foreground.*一致しない/);
});

test("OKLCH intrinsic alpha と RGB triplet を正規化する", async () => {
  const { parseColor } = await loadContrast();
  const translucent = parseColor("oklch(0.5 0.1 30 / 10%)");

  assert.equal(translucent.alpha, 0.1);
  assert.deepEqual(parseColor("255 128 0"), {
    rgb: [1, 128 / 255, 0],
    alpha: 1,
  });
});

test("multi-hop alias と rgb(var() / var()) を解決する", async () => {
  const { parseThemes, resolveToken } = await loadContrast();
  const themes = parseThemes(
    themeCss({
      light: `
        --brand: 47 95 209;
        --alpha: 0.10;
        --selected: rgb(var(--brand) / var(--alpha));
        --alias: var(--selected);`,
      dark: `
        --brand: 110 147 240;
        --alpha: 0.13;
        --selected: rgb(var(--brand) / var(--alpha));
        --alias: var(--selected);`,
    }),
  );

  assert.deepEqual(resolveToken(themes, "light", "alias"), {
    rgb: [47 / 255, 95 / 255, 209 / 255],
    alpha: 0.1,
  });
  assert.equal(resolveToken(themes, "dark", "alias").alpha, 0.13);
});

test("hover tint を selected tint と canvas の順に3層合成する", async () => {
  const { composite, contrastRatio, evaluateCase, parseThemes, resolveToken } =
    await loadContrast();
  const themes = parseThemes(
    themeCss({
      light: `
        --foreground: 20 20 20;
        --background: 255 255 255;
        --brand: 47 95 209;
        --black: 0 0 0;
        --selected-alpha: 0.10;
        --hover-alpha: 0.07;
        --selected: rgb(var(--brand) / var(--selected-alpha));
        --hover: rgb(var(--black) / var(--hover-alpha));`,
      dark: "  --placeholder: 0 0 0;",
    }),
  );
  const inspected = evaluateCase(
    {
      label: "3層 fixture",
      themes: ["light"],
      gate: "text-aa",
      reason: "実際の background-image と background-color の合成順を固定する",
      foreground: { token: "foreground" },
      background: {
        token: "hover",
        underlay: { token: "selected", underlay: "background" },
      },
      sourceClasses: [],
    },
    themes,
  );
  const selected = composite(
    resolveToken(themes, "light", "selected"),
    resolveToken(themes, "light", "background"),
  );
  const hovered = composite(resolveToken(themes, "light", "hover"), selected);
  const expected = contrastRatio(resolveToken(themes, "light", "foreground"), hovered);

  assert.deepEqual(inspected.problems, []);
  assert.ok(Math.abs(inspected.results[0].ratio - expected) < 0.000001);
});

test("missing alias、cycle、未知形式、範囲外 channel を fail-closed にする", async () => {
  const { parseThemes, resolveToken } = await loadContrast();
  const themes = parseThemes(
    themeCss({
      light: `
        --missing: var(--not-found);
        --cycle-a: var(--cycle-b);
        --cycle-b: var(--cycle-a);
        --unknown: color(display-p3 1 0 0);
        --out-of-range: 256 0 0;`,
      dark: "  --placeholder: 0 0 0;",
    }),
  );

  assert.match(resolveToken(themes, "light", "missing").problem, /not-found.*無い/);
  assert.match(resolveToken(themes, "light", "cycle-a").problem, /循環/);
  assert.match(resolveToken(themes, "light", "unknown").problem, /解釈できない/);
  assert.match(resolveToken(themes, "light", "out-of-range").problem, /範囲外/);
});

test("text-aa と nontext-ui だけを閾値で gate する", async () => {
  const { evaluateCase, parseThemes } = await loadContrast();
  const themes = parseThemes(
    themeCss({
      light: "  --fg: 119 119 119;\n  --bg: 255 255 255;",
      dark: "  --fg: 136 136 136;\n  --bg: 0 0 0;",
    }),
  );
  const base = {
    label: "境界 fixture",
    themes: ["light"],
    reason: "通常テキストと操作境界の閾値差を固定する",
    foreground: { token: "fg" },
    background: { token: "bg" },
    sourceClasses: [],
  };

  assert.match(evaluateCase({ ...base, gate: "text-aa" }, themes).problems.join("\n"), /4\.5/);
  assert.deepEqual(evaluateCase({ ...base, gate: "nontext-ui" }, themes).problems, []);
  for (const gate of ["disabled-exempt", "decorative"]) {
    const inspected = evaluateCase({ ...base, gate }, themes);
    assert.deepEqual(inspected.problems, []);
    assert.equal(typeof inspected.results[0].ratio, "number");
  }
});

test("全 consumer case は空でない reason と既知 gate を持つ", async () => {
  const { CONSUMER_CASES } = await loadCases();
  const gates = new Set(["text-aa", "nontext-ui", "disabled-exempt", "decorative"]);

  assert.ok(CONSUMER_CASES.length > 0);
  for (const consumerCase of CONSUMER_CASES) {
    assert.equal(typeof consumerCase.reason, "string", consumerCase.label);
    assert.ok(consumerCase.reason.trim(), consumerCase.label);
    assert.ok(gates.has(consumerCase.gate), consumerCase.label);
  }
});

test("必須consumer caseを1件除くとrepository checkがfail-closedになる", async () => {
  const { checkContrastInRepo } = await loadContrast();
  const { CONSUMER_CASES } = await loadCases();
  const root = fileURLToPath(new URL("..", import.meta.url));
  const withoutPrimary = CONSUMER_CASES.filter(({ label }) => label !== "primary solid");

  const result = await checkContrastInRepo(root, withoutPrimary);

  assert.ok(
    result.problems.some(
      (problem) => problem.includes("primary solid") && problem.includes("必須"),
    ),
  );
});

test("solid destructive と invalid 境界を v1.8 の非透明 token で gate する", async () => {
  const { evaluateCase, parseThemes } = await loadContrast();
  const { CONSUMER_CASES } = await loadCases();
  const css = await Promise.all([
    readFile(new URL("../src/styles/design-system/tokens.css", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
  ]);
  const themes = parseThemes(css.join("\n"));
  const solid = CONSUMER_CASES.find(({ label }) => label === "solid destructive menu focus");
  const invalid = CONSUMER_CASES.find(({ label }) => label === "invalid control boundary");

  assert.ok(solid, "solid destructive case が無い");
  assert.ok(invalid, "invalid control boundary case が無い");
  assert.equal(invalid.gate, "nontext-ui");
  assert.deepEqual(evaluateCase(solid, themes).problems, []);
  assert.deepEqual(evaluateCase(invalid, themes).problems, []);
});

test("AST は opening quote 直後の class を拾い arbitrary variant 内 quote を壊さない", async () => {
  const { extractClassTokens } = await loadContrast();
  const source = `
    const variants = {
      destructive: "bg-destructive/10 text-destructive",
      chart: "[&_.grid_line[stroke='#ccc']]:stroke-border/50 text-xs",
    };
  `;
  const tokens = extractClassTokens(source, "fixture.tsx");

  assert.ok(tokens.has("bg-destructive/10"));
  assert.ok(tokens.has("[&_.grid_line[stroke='#ccc']]:stroke-border/50"));
  assert.equal(tokens.has("]]:stroke-border/50"), false);
});

test("source alpha utility の未分類と stale sourceClasses を双方向で拒否する", async (t) => {
  const { inspectSourceCoverage } = await loadContrast();
  const root = await mkdtemp(join(tmpdir(), "contrast-source-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "src/components/ui"), { recursive: true });
  await writeFile(
    join(root, "src/components/ui/button.tsx"),
    'export const classes = "bg-destructive/10 text-destructive";\n',
  );

  const uncovered = await inspectSourceCoverage(root, []);
  assert.match(uncovered.problems.join("\n"), /button\.tsx.*bg-destructive\/10.*未分類/);

  const stale = await inspectSourceCoverage(root, [
    {
      label: "stale fixture",
      gate: "decorative",
      reason: "source contract の陳腐化を検出する",
      sourceClasses: [
        {
          source: "src/components/ui/button.tsx",
          classes: ["bg-destructive/10", "hover:bg-destructive/20"],
        },
      ],
    },
  ]);
  assert.match(stale.problems.join("\n"), /hover:bg-destructive\/20.*存在しない/);
});

test("RISK-006 は現行 FAIL だけを受容し PASS 後は stale にする", async () => {
  const { evaluateAcceptedRisks } = await loadContrast();
  const accepted = `
## RISK-006: warning
- status: accepted
`;
  const failing = [
    {
      label: "warning pair",
      theme: "light",
      gate: "text-aa",
      ratio: 3.919,
      passed: false,
      risk: "RISK-006",
    },
  ];

  assert.deepEqual(evaluateAcceptedRisks(failing, accepted).problems, []);
  assert.match(evaluateAcceptedRisks(failing, accepted).accepted.join("\n"), /RISK-006/);

  const passing = [{ ...failing[0], ratio: 4.6, passed: true }];
  assert.match(evaluateAcceptedRisks(passing, accepted).problems.join("\n"), /RISK-006.*stale/);
});
