#!/usr/bin/env node
/**
 * elchika — token build
 *
 * design-tokens.html is the single source of truth. This script extracts the
 * token blocks from it, writes tokens.css and brands.css, and then verifies
 * the result. It exits non-zero on any failure, so it can gate a merge.
 *
 *   node build-tokens.mjs            build + verify
 *   node build-tokens.mjs --check    verify only, write nothing
 *
 * Checks performed:
 *   1. every var() referenced anywhere resolves to a defined token
 *   2. every var() referenced by tailwind.config.js resolves
 *   3. text pairs clear WCAG AA (4.5:1) in both themes
 *   4. control boundaries clear 3:1 in both themes
 *
 * No dependencies.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "design-tokens.html");
const OUT_TOKENS = join(HERE, "tokens.css");
const OUT_BRANDS = join(HERE, "brands.css");
const TAILWIND = join(HERE, "tailwind.config.js");

const checkOnly = process.argv.includes("--check");
const problems = [];
const fail = (m) => problems.push(m);

/* ------------------------------------------------------------------ *
 * Extract
 * ------------------------------------------------------------------ */

const html = readFileSync(SRC, "utf8");
const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
if (!style) {
  console.error("could not find the <style> block in design-tokens.html");
  process.exit(1);
}

const version = html.match(/Design Tokens (v[\d.]+)/)?.[1] ?? "v0";

function block(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc + "\\s*\\{([\\s\\S]*?)\\n\\}");
  return style.match(re)?.[1] ?? null;
}

const root = block(":root");
const dark = block('[data-theme="dark"]');
const compact = block('[data-density="compact"]');
const lang = block(":lang(en)");
if (!root || !dark) {
  console.error("missing :root or [data-theme=dark]");
  process.exit(1);
}

const brandNames = [...style.matchAll(/\[data-brand="(\w+)"\]/g)].map((m) => m[1]);
const brands = brandNames.map((n) => ({ name: n, body: block(`[data-brand="${n}"]`) }));

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

const tokensCss = `/* ============================================================
   elchika — Design Tokens ${version} (core)

   GENERATED FILE — do not edit.
   Source of truth: design-tokens.html
   Rebuild with: node build-tokens.mjs
   ============================================================ */

@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap");
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;600&display=swap");

:root {${root}
}

[data-theme="dark"] {${dark}
}

[data-density="compact"] {${compact ?? ""}
}

:lang(en) {${lang ?? ""}
}

/* ============================================================
   BASE
   ============================================================ */
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-normal);
  color: rgb(var(--color-text-primary));
  background: rgb(var(--color-bg-canvas));
}

/* Never remove the ring without replacing it. */
:focus-visible {
  outline: none;
  box-shadow: var(--state-focus-ring);
  border-radius: var(--radius-xs);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const brandsCss = `/* ============================================================
   elchika — Product hue reserve ${version}

   GENERATED FILE — do not edit.
   Source of truth: design-tokens.html

   elchika itself is always the blue. Nothing sets data-brand
   by default; these are the pool a future product draws from.
   Take them in the order documented in design-tokens.html.

   WARNING: indigo sits only ΔE 7.4 from the corporate blue in the
   worst case and is indistinguishable under protanopia. Needing a
   sixth hue is a signal to stop identifying products by colour.
   ============================================================ */

${brands.map((b) => `[data-brand="${b.name}"] {${b.body}\n}`).join("\n\n")}
`;

if (!checkOnly) {
  writeFileSync(OUT_TOKENS, tokensCss);
  writeFileSync(OUT_BRANDS, brandsCss);
}

function verifyGeneratedArtifact(path, expected, label) {
  try {
    const actual = readFileSync(path);
    if (!actual.equals(Buffer.from(expected, "utf8"))) {
      fail(`${label} が生成結果と一致しない`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail(`${label} が見つからない`);
      return;
    }
    throw error;
  }
}

verifyGeneratedArtifact(OUT_TOKENS, tokensCss, "tokens.css");
verifyGeneratedArtifact(OUT_BRANDS, brandsCss, "brands.css");

/* ------------------------------------------------------------------ *
 * Verify: resolution
 * ------------------------------------------------------------------ */

const defined = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
for (const b of brands) {
  for (const m of b.body.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
}

for (const m of style.matchAll(/var\((--[a-z0-9-]+)/g)) {
  if (!defined.has(m[1])) fail(`spec page references undefined token: ${m[1]}`);
}

try {
  const tw = readFileSync(TAILWIND, "utf8");
  for (const m of tw.matchAll(/var\((--[a-z0-9-]+)/g)) {
    if (!defined.has(m[1])) fail(`tailwind.config.js references undefined token: ${m[1]}`);
  }
} catch {
  fail("tailwind.config.js not found");
}

/* ------------------------------------------------------------------ *
 * Verify: tailwind coverage
 *
 * tailwind.config.js is hand-maintained on purpose — mapping a token to a
 * utility name is a naming decision, not something derivable. But it drifts,
 * so report tokens that exist and are not exposed. Warning, not failure.
 * ------------------------------------------------------------------ */

const warnings = [];
try {
  const tw = readFileSync(TAILWIND, "utf8");
  const exposed = new Set([...tw.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const shouldExpose = [...defined].filter(
    (t) =>
      /^--(color|chart|state|control|space|text|leading|tracking|radius|border|shadow|duration|ease|z|opacity|container|density)-/.test(t) &&
      !exposed.has(t)
  );
  if (shouldExpose.length) {
    warnings.push(
      `${shouldExpose.length} token(s) not exposed in tailwind.config.js: ${shouldExpose.slice(0, 8).join(", ")}${shouldExpose.length > 8 ? ", …" : ""}`
    );
  }
} catch {
  /* already reported above */
}

/* ------------------------------------------------------------------ *
 * Verify: contrast
 * ------------------------------------------------------------------ */

function tokenMap(body) {
  const map = new Map();
  for (const m of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

const rootMap = tokenMap(root);
const darkMap = tokenMap(dark);

function resolve(name, theme, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = (theme === "dark" ? darkMap.get(name) : undefined) ?? rootMap.get(name);
  if (!raw) return null;
  const ref = raw.match(/var\((--[a-z0-9-]+)\)/);
  if (ref) return resolve(ref[1], theme, seen);
  const t = raw.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  return t ? [+t[1], +t[2], +t[3]] : null;
}

const relLum = (rgb) =>
  rgb
    .map((x) => x / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)))
    .reduce((a, c, i) => a + [0.2126, 0.7152, 0.0722][i] * c, 0);

const contrast = (a, b) => {
  const la = relLum(a);
  const lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// Every surface a foreground can land on. Checking only --color-bg-surface
// hides the most common case: text on the page background. A foreground that
// clears 4.5:1 on white can sit at 3.9:1 on a raised panel.
const SURFACES = [
  "--color-bg-canvas",
  "--color-bg-surface",
  "--color-bg-surface-raised",
];

// Foregrounds that must clear the threshold on EVERY surface above.
// --color-border-default / --color-border-strong are decorative dividers and
// carry no 3:1 requirement; --color-border-control marks "a control is here"
// and does.
const ON_EVERY_SURFACE = [
  ["--color-text-primary", 4.5],
  ["--color-text-secondary", 4.5],
  ["--color-text-muted", 4.5],
  ["--color-brand-primary", 4.5],
  ["--chart-label", 4.5],
  ["--color-border-control", 3.0],
  ["--color-status-success", 3.0],
  ["--color-status-danger", 3.0],
];

// Pairs whose background is fixed by the pairing itself.
const FIXED_PAIRS = [
  ["--color-bg-surface", "--color-brand-primary", 4.5],
  ["--color-accent-highlight-text", "--color-accent-highlight-bg", 4.5],
  ["--color-status-success-text", "--color-status-success-bg", 4.5],
  ["--color-status-warning-text", "--color-status-warning-bg", 4.5],
  ["--color-status-danger-text", "--color-status-danger-bg", 4.5],
  ["--color-status-info-text", "--color-status-info-bg", 4.5],
];

const PAIRS = [
  ...ON_EVERY_SURFACE.flatMap(([fg, need]) =>
    SURFACES.map((bg) => [fg, bg, need]),
  ),
  ...FIXED_PAIRS,
];

const report = [];
for (const theme of ["light", "dark"]) {
  for (const [fg, bg, need] of PAIRS) {
    const a = resolve(fg, theme);
    const b = resolve(bg, theme);
    if (!a || !b) {
      fail(`could not resolve ${fg} / ${bg} in ${theme}`);
      continue;
    }
    const r = contrast(a, b);
    report.push([theme, fg, bg, r, need]);
    if (r < need) {
      fail(`contrast ${r.toFixed(2)} < ${need} — ${fg} on ${bg} (${theme})`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const pad = (s, n) => String(s).padEnd(n);
console.log(`elchika design tokens ${version}${checkOnly ? " (check only)" : ""}\n`);
if (!checkOnly) {
  console.log(`  wrote tokens.css  (${tokensCss.length} bytes)`);
  console.log(`  wrote brands.css  (${brandsCss.length} bytes, ${brands.length} hues)\n`);
}
console.log(`  ${defined.size} tokens defined`);
for (const theme of ["light", "dark"]) {
  const rows = report.filter((r) => r[0] === theme);
  const worst = rows.reduce((m, r) => (r[3] / r[4] < m[3] / m[4] ? r : m), rows[0]);
  console.log(
    `  ${pad(theme, 6)} ${rows.length} contrast pairs checked, tightest ${worst[3].toFixed(2)} vs ${worst[4]} (${worst[1]})`
  );
}

if (warnings.length) {
  console.log("");
  for (const w of warnings) console.log(`  ! ${w}`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("\n  all checks passed");
