import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const checkerUrl = new URL("./check-all.mjs", import.meta.url);
const EXPECTED_CHECK_ARGS = [
  ["scripts/check-standards.mjs"],
  ["src/styles/design-system/build-tokens.mjs", "--check"],
  ["scripts/contrast.mjs"],
  ["scripts/check-completeness.mjs"],
  ["scripts/check-distribution.mjs"],
  ["scripts/check-preview-render.mjs"],
  ["scripts/check-evidence.mjs"],
];

const loadModule = async () => {
  assert.ok(existsSync(checkerUrl), "check-all.mjs がまだ無い");
  return import(checkerUrl);
};

test("7 checker を定義順にすべて実行する", async () => {
  const { CHECKS, runChecks } = await loadModule();
  const calls = [];
  runChecks(CHECKS, (command, args) => {
    calls.push([command, ...args]);
    return { status: 0 };
  });

  assert.deepEqual(
    calls,
    EXPECTED_CHECK_ARGS.map((args) => [process.execPath, ...args]),
  );
});

test("pre-flight はevidenceだけを除き token build と contrast を実行する", async () => {
  const { CHECKS, PRE_FLIGHT_CHECKS, runChecks } = await loadModule();
  assert.deepEqual(PRE_FLIGHT_CHECKS, CHECKS.slice(0, -1));
  assert.deepEqual(
    PRE_FLIGHT_CHECKS.map(({ args }) => args),
    EXPECTED_CHECK_ARGS.slice(0, -1),
  );
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
  assert.deepEqual(
    selectChecksForArgv([]).checks.map(({ args }) => args),
    EXPECTED_CHECK_ARGS,
  );
  assert.deepEqual(
    selectChecksForArgv(["--pre"]).checks.map(({ args }) => args),
    EXPECTED_CHECK_ARGS.slice(0, -1),
  );
});

test("token build または contrast が失敗したら後続を実行しない", async () => {
  const { CHECKS, runChecks } = await loadModule();

  for (const failedPath of ["src/styles/design-system/build-tokens.mjs", "scripts/contrast.mjs"]) {
    const calls = [];
    assert.throws(
      () =>
        runChecks(CHECKS, (command, args) => {
          calls.push([command, ...args]);
          return { status: args[0] === failedPath ? 9 : 0 };
        }),
      /exit 9/,
    );
    const failedIndex = EXPECTED_CHECK_ARGS.findIndex(([path]) => path === failedPath);
    assert.deepEqual(
      calls,
      EXPECTED_CHECK_ARGS.slice(0, failedIndex + 1).map((args) => [process.execPath, ...args]),
    );
  }
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
