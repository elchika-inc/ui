import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const runner = fileURLToPath(
  new URL("../.docs/reviews/catalog-index-r2/evidence/case00-browser-runner.mjs", import.meta.url),
);

test("browser runner は恒常証跡を上書きせず実行ごとの一時出力先を使う", (t) => {
  assert.match(readFileSync(runner, "utf8"), /--print-evidence-dir/);
  const outputDirectories = Array.from({ length: 2 }, () =>
    execFileSync(process.execPath, [runner, "--print-evidence-dir"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).trim(),
  );
  for (const directory of outputDirectories) {
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    assert.ok(existsSync(directory), `${directory} が作られていない`);
    assert.ok(!directory.startsWith(`${repositoryRoot}.docs/reviews/`));
  }
  assert.notEqual(outputDirectories[0], outputDirectories[1]);
});
