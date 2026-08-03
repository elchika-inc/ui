import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";

const sourceRoot = new URL("../src/styles/design-system/", import.meta.url);
const files = [
  "README.md",
  "design-tokens.html",
  "build-tokens.mjs",
  "tokens.css",
  "brands.css",
  "tailwind.config.js",
];

const copySource = () => {
  const root = mkdtempSync(join(tmpdir(), "elchika-design-tokens-"));
  for (const file of files) cpSync(new URL(file, sourceRoot), join(root, basename(file)));
  return root;
};

const runBuild = (root, args = []) =>
  spawnSync(process.execPath, ["build-tokens.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
  });

test("--check は stale な生成 CSS を拒否する", (t) => {
  const root = copySource();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  appendFileSync(join(root, "tokens.css"), "\n/* stale artifact */\n");

  const result = runBuild(root, ["--check"]);

  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, /tokens\.css.*生成結果と一致しない/);

  const build = runBuild(root);
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  const check = runBuild(root, ["--check"]);
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`);
});

test("--check は欠落した生成 CSS を拒否する", (t) => {
  const root = copySource();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  rmSync(join(root, "brands.css"));

  const result = runBuild(root, ["--check"]);

  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, /brands\.css.*見つからない/);
});
