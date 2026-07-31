import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const scriptUrl = new URL("./add-component.mjs", import.meta.url);

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const createRepo = () => {
  const root = mkdtempSync(join(tmpdir(), "elchika-add-component-test-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  mkdirSync(join(root, "src/components/ui"), { recursive: true });
  writeFileSync(join(root, "src/components/ui/button.tsx"), "button original\n");
  writeFileSync(join(root, "src/components/ui/input.tsx"), "input original\n");
  writeJson(join(root, "package.json"), {
    dependencies: { react: "^19.0.0" },
    devDependencies: { typescript: "~6.0.0" },
  });
  writeJson(join(root, "package-lock.json"), { lockfileVersion: 3 });
  writeJson(join(root, "components.json"), { style: "base-nova" });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "fixture"]);
  return root;
};

const prepareWrapperRepo = () => {
  const root = createRepo();
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  pkg.dependencies.shadcn = "^4.16.0";
  writeJson(join(root, "package.json"), pkg);
  writeFileSync(join(root, ".gitignore"), "node_modules/\n");
  writeFileSync(join(root, ".shadcn-cli-version"), "4.16.0\n");
  writeJson(join(root, "provenance.json"), { components: {} });
  writeJson(join(root, "registry.json"), { items: [] });
  mkdirSync(join(root, "node_modules/shadcn"), { recursive: true });
  writeJson(join(root, "node_modules/shadcn/package.json"), { version: "4.16.0" });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "wrapper fixture"]);
  return root;
};

const loadModule = async () => {
  assert.ok(existsSync(scriptUrl), "add-component.mjs がまだ無い");
  return import(scriptUrl);
};

test("--modified が無ければ停止する", async () => {
  const { parseArgs } = await loadModule();
  assert.throws(() => parseArgs(["calendar"]), /--modified/);
});

test("pin 済み CLI の add command を組み立てる", async () => {
  const { shadcnCommand } = await loadModule();
  assert.deepEqual(shadcnCommand("4.16.0", "calendar"), {
    command: "npx",
    args: ["shadcn@4.16.0", "add", "--overwrite", "@shadcn/calendar"],
  });
});

test("別コンポーネントの変更を実ファイルから復元する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);

  writeFileSync(join(root, "src/components/ui/button.tsx"), "button generated\n");
  writeFileSync(join(root, "src/components/ui/input.tsx"), "input overwritten\n");

  const result = reconcileAddChanges({ root, name: "button", packageBefore, trackedBefore });

  assert.deepEqual(result.restored, ["src/components/ui/input.tsx"]);
  assert.equal(
    readFileSync(join(root, "src/components/ui/button.tsx"), "utf8"),
    "button generated\n",
  );
  assert.equal(readFileSync(join(root, "src/components/ui/input.tsx"), "utf8"), "input original\n");
});

test("追加依存は名前と版を返して manifest を保持する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);
  const packageAfter = structuredClone(packageBefore);
  packageAfter.dependencies["date-fns"] = "^4.1.0";
  writeJson(join(root, "package.json"), packageAfter);
  writeJson(join(root, "package-lock.json"), { lockfileVersion: 3, packages: { "date-fns": {} } });

  const result = reconcileAddChanges({ root, name: "button", packageBefore, trackedBefore });

  assert.deepEqual(result.addedDependencies, ["dependencies: date-fns@^4.1.0"]);
  assert.equal(
    JSON.parse(readFileSync(join(root, "package.json"), "utf8")).dependencies["date-fns"],
    "^4.1.0",
  );
});

test("既存依存の版が変わったら停止する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);
  const packageAfter = structuredClone(packageBefore);
  packageAfter.dependencies.react = "^18.0.0";
  writeJson(join(root, "package.json"), packageAfter);

  assert.throws(
    () => reconcileAddChanges({ root, name: "button", packageBefore, trackedBefore }),
    /react.*\^19\.0\.0.*\^18\.0\.0/,
  );
});

test("想定外パスの変更があれば復元せず停止する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);
  writeFileSync(join(root, "src/components/ui/input.tsx"), "input overwritten\n");
  writeJson(join(root, "components.json"), { style: "unexpected" });

  assert.throws(
    () => reconcileAddChanges({ root, name: "button", packageBefore, trackedBefore }),
    /想定外パス[\s\S]*components\.json/,
  );
  assert.equal(
    readFileSync(join(root, "src/components/ui/input.tsx"), "utf8"),
    "input overwritten\n",
  );
});

test("裸の registry dependency だけを @elchika namespace へ付け替える", async () => {
  const { normalizeRegistryDependencies } = await loadModule();
  assert.deepEqual(
    normalizeRegistryDependencies([
      "button",
      "@elchika/dialog",
      "https://example.com/r/input.json",
    ]),
    ["@elchika/button", "@elchika/dialog", "https://example.com/r/input.json"],
  );
});

test("既存来歴は force なしなら再実行しない", async () => {
  const { shouldSkipRecorded } = await loadModule();
  assert.equal(shouldSkipRecorded({ components: { button: {} } }, "button", false), true);
  assert.equal(shouldSkipRecorded({ components: { button: {} } }, "button", true), false);
});

test("wrapper が pin add から2つの hash・来歴・registryまで記録し再実行はno-op", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  const generated = [
    'import { Calendar } from "@base-ui/react/calendar";',
    'import { format } from "date-fns";',
    "export { Calendar, format };",
    "",
  ].join("\n");
  const served = "registry calendar source\n";
  const upstreamItem = {
    dependencies: ["date-fns"],
    registryDependencies: ["button"],
    files: [
      {
        type: "registry:ui",
        path: "registry/base-nova/ui/calendar.tsx",
        content: served,
      },
    ],
  };
  const commands = [];
  const logs = [];
  const runCommand = (command, args, options) => {
    commands.push({ command, args, cwd: options.cwd });
    writeFileSync(join(root, "src/components/ui/calendar.tsx"), generated);
    writeFileSync(join(root, "src/components/ui/input.tsx"), "input overwritten\n");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    pkg.dependencies["date-fns"] = "^4.1.0";
    writeJson(join(root, "package.json"), pkg);
    writeJson(join(root, "package-lock.json"), { lockfileVersion: 3, packages: { dateFns: {} } });
  };
  const fetchImpl = async (url) => {
    let body;
    if (url.includes("ui.shadcn.com")) body = upstreamItem;
    else if (url.includes("/commits?")) body = [{ sha: "a".repeat(40) }];
    else body = { path: "apps/v4/registry/bases/base/ui/calendar.tsx" };
    return { ok: true, status: 200, json: async () => body };
  };

  const result = await runAddComponent({
    argv: ["calendar", "--modified", "Props 型を追加"],
    root,
    fetchImpl,
    runCommand,
    log: (message) => logs.push(message),
  });

  assert.deepEqual(commands, [
    {
      command: "npx",
      args: ["shadcn@4.16.0", "add", "--overwrite", "@shadcn/calendar"],
      cwd: git(root, ["rev-parse", "--show-toplevel"]).trim(),
    },
  ]);
  assert.deepEqual(result.reconciled.restored, ["src/components/ui/input.tsx"]);
  assert.equal(readFileSync(join(root, "src/components/ui/input.tsx"), "utf8"), "input original\n");
  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.equal(
    provenance.components.calendar.generatedContentSha256,
    createHash("sha256").update(generated).digest("hex"),
  );
  assert.equal(
    provenance.components.calendar.registryContentSha256,
    createHash("sha256").update(served).digest("hex"),
  );
  assert.equal(provenance.components.calendar.modified, "Props 型を追加");
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  assert.deepEqual(registry.items[0].registryDependencies, ["@elchika/button"]);
  assert.deepEqual(registry.items[0].dependencies, ["@base-ui/react", "date-fns"]);
  assert.ok(logs.includes("復元: src/components/ui/input.tsx"));
  assert.ok(logs.includes("追加依存: dependencies: date-fns@^4.1.0"));

  git(root, ["add", "."]);
  git(root, ["commit", "-m", "calendar fixture"]);
  let reran = false;
  const rerunLogs = [];
  const rerun = await runAddComponent({
    argv: ["calendar", "--modified", "同じ変更"],
    root,
    runCommand: () => {
      reran = true;
    },
    fetchImpl: async () => {
      throw new Error("fetch してはならない");
    },
    log: (message) => rerunLogs.push(message),
  });
  assert.deepEqual(rerun, { skipped: true });
  assert.equal(reran, false);
  assert.deepEqual(rerunLogs, ["calendar: 既に記録済み（--force で上書き可能）"]);
});

test("汚れた worktree では add を実行する前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  writeJson(join(root, "components.json"), { style: "dirty" });
  let called = false;

  await assert.rejects(
    runAddComponent({
      argv: ["calendar", "--modified", "Props 型を追加"],
      root,
      runCommand: () => {
        called = true;
      },
    }),
    /worktree が汚れている/,
  );
  assert.equal(called, false);
});
