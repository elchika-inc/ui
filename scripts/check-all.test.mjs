import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const checkerUrl = new URL("./check-all.mjs", import.meta.url);

const loadModule = async () => {
  assert.ok(existsSync(checkerUrl), "check-all.mjs がまだ無い");
  return import(checkerUrl);
};

test("5 checker を定義順にすべて実行する", async () => {
  const { CHECKS, runChecks } = await loadModule();
  const calls = [];
  runChecks(CHECKS, (command, args) => {
    calls.push([command, ...args]);
    return { status: 0 };
  });

  assert.deepEqual(
    calls,
    [
      "check-standards.mjs",
      "check-completeness.mjs",
      "check-distribution.mjs",
      "check-preview-render.mjs",
      "check-evidence.mjs",
    ].map((script) => [process.execPath, `scripts/${script}`]),
  );
});

test("pre-flight はevidenceを除く先頭4 checkerだけを実行する", async () => {
  const { CHECKS, PRE_FLIGHT_CHECKS, runChecks } = await loadModule();
  assert.deepEqual(PRE_FLIGHT_CHECKS, CHECKS.slice(0, 4));
  assert.doesNotThrow(() =>
    runChecks(
      PRE_FLIGHT_CHECKS,
      (_command, args) => ({
        status: args[0] === "scripts/check-evidence.mjs" ? 1 : 0,
      }),
      "check:pre",
    ),
  );
  assert.throws(
    () =>
      runChecks(CHECKS, (_command, args) => ({
        status: args[0] === "scripts/check-evidence.mjs" ? 1 : 0,
      })),
    /evidence.*exit 1/,
  );
});

test("CLI引数でdefault fullと--preのchecker/prefixを選ぶ", async () => {
  const { CHECKS, PRE_FLIGHT_CHECKS, selectChecksForArgv } = await loadModule();

  assert.deepEqual(selectChecksForArgv([]), { checks: CHECKS, prefix: "check:all" });
  assert.deepEqual(selectChecksForArgv(["--pre"]), {
    checks: PRE_FLIGHT_CHECKS,
    prefix: "check:pre",
  });
});

test("途中の checker が失敗したら後続を実行せず停止する", async () => {
  const { runChecks } = await loadModule();
  const calls = [];
  const checks = [
    { name: "first", command: "node", args: ["first.mjs"] },
    { name: "broken", command: "node", args: ["broken.mjs"] },
    { name: "never", command: "node", args: ["never.mjs"] },
  ];

  assert.throws(
    () =>
      runChecks(checks, (command, args) => {
        calls.push([command, ...args]);
        return { status: args[0] === "broken.mjs" ? 7 : 0 };
      }),
    /broken.*exit 7/,
  );
  assert.deepEqual(calls, [
    ["node", "first.mjs"],
    ["node", "broken.mjs"],
  ]);
});
