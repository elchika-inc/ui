import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

const seedRegistryItems = (root, names) => {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  registry.items.push(...names.map((name) => ({ name, type: "registry:ui" })));
  writeJson(join(root, "registry.json"), registry);
  git(root, ["add", "registry.json"]);
  git(root, ["commit", "-m", "registry item fixture"]);
};

const seedRegistryGraph = (root, items) => {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  registry.items.push(...items);
  writeJson(join(root, "registry.json"), registry);
  git(root, ["add", "registry.json"]);
  git(root, ["commit", "-m", "registry graph fixture"]);
};

const loadModule = async () => {
  assert.ok(existsSync(scriptUrl), "add-component.mjs がまだ無い");
  return import(scriptUrl);
};

test("--modified が無ければ停止する", async () => {
  const { parseArgs } = await loadModule();
  assert.throws(() => parseArgs(["calendar"]), /--modified/);
});

test("--modified の値が次のoptionなら停止する", async () => {
  const { parseArgs } = await loadModule();
  assert.throws(() => parseArgs(["calendar", "--modified", "--force"]), /--modified/);
});

test("同じoptionを重複指定したら停止する", async () => {
  const { parseArgs } = await loadModule();
  assert.throws(
    () => parseArgs(["calendar", "--modified", "変更1", "--modified", "変更2"]),
    /--modified.*1回/,
  );
  assert.throws(
    () => parseArgs(["calendar", "--modified", "変更", "--force", "--force"]),
    /--force.*1回/,
  );
});

test("pin 済み CLI の add command を組み立てる", async () => {
  const { shadcnCommand } = await loadModule();
  assert.deepEqual(shadcnCommand("4.16.0", "/tmp/calendar.json"), {
    command: "npx",
    args: ["shadcn@4.16.0", "add", "--overwrite", "/tmp/calendar.json"],
  });
  assert.throws(() => shadcnCommand("4.16.0", "@shadcn/calendar"), /絶対 path の JSON/);
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

test("registry:hook の target path を追加対象として分類する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);
  mkdirSync(join(root, "src/hooks"), { recursive: true });
  writeFileSync(join(root, "src/hooks/use-mobile.ts"), "export const useMobile = () => false;\n");

  const result = reconcileAddChanges({
    root,
    name: "use-mobile",
    targetPath: "src/hooks/use-mobile.ts",
    packageBefore,
    trackedBefore,
  });

  assert.deepEqual(result.restored, []);
  assert.equal(
    readFileSync(join(root, "src/hooks/use-mobile.ts"), "utf8"),
    "export const useMobile = () => false;\n",
  );
});

test("sidebar が更新した既存 registry hook 依存を復元する", async (t) => {
  const root = createRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { reconcileAddChanges, trackedFiles } = await loadModule();
  mkdirSync(join(root, "src/hooks"), { recursive: true });
  writeFileSync(join(root, "src/hooks/use-mobile.ts"), "hook original\n");
  git(root, ["add", "src/hooks/use-mobile.ts"]);
  git(root, ["commit", "-m", "hook fixture"]);
  const packageBefore = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const trackedBefore = trackedFiles(root);

  writeFileSync(join(root, "src/components/ui/sidebar.tsx"), "sidebar generated\n");
  writeFileSync(join(root, "src/hooks/use-mobile.ts"), "hook overwritten\n");

  const result = reconcileAddChanges({
    root,
    name: "sidebar",
    targetPath: "src/components/ui/sidebar.tsx",
    packageBefore,
    trackedBefore,
  });

  assert.deepEqual(result.restored, ["src/hooks/use-mobile.ts"]);
  assert.equal(
    readFileSync(join(root, "src/components/ui/sidebar.tsx"), "utf8"),
    "sidebar generated\n",
  );
  assert.equal(readFileSync(join(root, "src/hooks/use-mobile.ts"), "utf8"), "hook original\n");
});

test("registry item type と一次 path から target を決める", async () => {
  const { resolveRegistryTarget } = await loadModule();

  assert.deepEqual(
    resolveRegistryTarget("use-mobile", {
      type: "registry:hook",
      files: [{ type: "registry:hook", path: "registry/base-nova/hooks/use-mobile.ts" }],
    }),
    {
      itemType: "registry:hook",
      registryPath: "registry/base-nova/hooks/use-mobile.ts",
      targetPath: "src/hooks/use-mobile.ts",
      upstreamPath: "apps/v4/registry/bases/base/hooks/use-mobile.ts",
    },
  );
});

test("未対応 type と type に合わない一次 path は停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();

  // registry:block は対応済みなので、未対応 type の網羅は実際に未対応な type で保つ。
  // ここを registry:block のままにすると、block 対応の追加でこの検査が空振りする。
  assert.throws(
    () => resolveRegistryTarget("example", { type: "registry:style", files: [] }),
    /未対応の registry item type/,
  );
  assert.throws(
    () => resolveRegistryTarget("example", { files: [] }),
    /未対応の registry item type: なし/,
  );
  assert.throws(
    () =>
      resolveRegistryTarget("use-mobile", {
        type: "registry:hook",
        files: [{ type: "registry:hook", path: "registry/base-nova/ui/use-mobile.ts" }],
      }),
    /一次 file path が想定外/,
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
    type: "registry:ui",
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
  let pinnedItemPath;
  const runCommand = (command, args, options) => {
    pinnedItemPath = args.at(-1);
    assert.equal(readFileSync(pinnedItemPath, "utf8"), JSON.stringify(upstreamItem));
    commands.push({ command, args, cwd: options.cwd });
    writeFileSync(join(root, "src/components/ui/calendar.tsx"), generated);
    writeFileSync(join(root, "src/components/ui/input.tsx"), "input overwritten\n");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    pkg.dependencies["date-fns"] = "^4.1.0";
    writeJson(join(root, "package.json"), pkg);
    writeJson(join(root, "package-lock.json"), { lockfileVersion: 3, packages: { dateFns: {} } });
  };
  // registry 応答は生テキストからも読む（registryContentSha256 の錨が再シリアライズでずれるため）。
  // 実 Response は json / text の両方を持つので、スタブも両方を持たせる。
  const fetchImpl = async (url) => {
    let body;
    if (url.includes("ui.shadcn.com")) body = upstreamItem;
    else if (url.includes("/commits?")) body = [{ sha: "a".repeat(40) }];
    else body = { path: "apps/v4/registry/bases/base/ui/calendar.tsx" };
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  };

  const result = await runAddComponent({
    argv: ["calendar", "--modified", "Props 型を追加。"],
    root,
    fetchImpl,
    runCommand,
    log: (message) => logs.push(message),
  });

  assert.equal(commands.length, 1);
  assert.equal(commands[0].command, "npx");
  assert.deepEqual(commands[0].args.slice(0, 3), ["shadcn@4.16.0", "add", "--overwrite"]);
  assert.equal(commands[0].args.at(-1), pinnedItemPath);
  assert.equal(commands[0].cwd, git(root, ["rev-parse", "--show-toplevel"]).trim());
  assert.equal(existsSync(pinnedItemPath), false);
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
  assert.equal(provenance.components.calendar.modified, "Props 型を追加。");
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  assert.deepEqual(registry.items[0].registryDependencies, ["@elchika/button"]);
  assert.deepEqual(registry.items[0].dependencies, [
    "@base-ui/react",
    "date-fns",
    "shadcn",
    "tw-animate-css",
  ]);
  assert.deepEqual(
    registry.items[0].files.filter(({ target }) => target?.endsWith("tokens.css")),
    [
      {
        path: "src/styles/global.css",
        type: "registry:file",
        target: "~/elchika-ui/tokens.css",
      },
      {
        path: "src/styles/design-system/tokens.css",
        type: "registry:file",
        target: "~/elchika-ui/design-system/tokens.css",
      },
    ],
  );
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
    fetchImpl,
    log: (message) => rerunLogs.push(message),
  });
  assert.deepEqual(rerun, { skipped: true });
  assert.equal(reran, false);
  assert.deepEqual(rerunLogs, ["calendar: 既に記録済み（--force で上書き可能）"]);
});

test("wrapper が registry:hook を独立 item と来歴へ記録する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  const generated =
    'import * as React from "react";\nexport const useIsMobile = () => React.useState(false)[0];\n';
  const served = "registry hook source\n";
  const upstreamItem = {
    type: "registry:hook",
    files: [
      {
        type: "registry:hook",
        path: "registry/base-nova/hooks/use-mobile.ts",
        content: served,
      },
    ],
  };
  const runCommand = () => {
    mkdirSync(join(root, "src/hooks"), { recursive: true });
    writeFileSync(join(root, "src/hooks/use-mobile.ts"), generated);
  };
  const fetchImpl = async (url) => {
    let body;
    if (url.includes("ui.shadcn.com")) body = upstreamItem;
    else if (url.includes("/commits?")) body = [{ sha: "b".repeat(40) }];
    else body = { path: "apps/v4/registry/bases/base/hooks/use-mobile.ts" };
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  };

  const result = await runAddComponent({
    argv: ["use-mobile", "--modified", "hook target を追加"],
    root,
    fetchImpl,
    runCommand,
    log: () => {},
  });

  assert.equal(result.registryItem.type, "registry:hook");
  assert.deepEqual(result.registryItem.files[0], {
    path: "src/hooks/use-mobile.ts",
    type: "registry:hook",
  });
  assert.equal(result.entry.registryPath, "registry/base-nova/hooks/use-mobile.ts");
  assert.equal(result.entry.upstreamPath, "apps/v4/registry/bases/base/hooks/use-mobile.ts");
  assert.equal(existsSync(join(root, "src/components/ui/use-mobile.tsx")), false);
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

const loginUpstream = {
  name: "login-01",
  type: "registry:block",
  files: [
    {
      path: "registry/base-nova/blocks/login-01/page.tsx",
      type: "registry:page",
      target: "app/login/page.tsx",
    },
    {
      path: "registry/base-nova/blocks/login-01/components/login-form.tsx",
      type: "registry:component",
    },
  ],
  registryDependencies: ["button", "card", "input", "label", "field"],
};

const dashboardUpstream = {
  name: "dashboard-01",
  type: "registry:block",
  files: [
    {
      path: "registry/base-nova/blocks/dashboard-01/page.tsx",
      type: "registry:page",
      target: "app/dashboard/page.tsx",
      content: "export default () => null\n",
    },
    {
      path: "registry/base-nova/blocks/dashboard-01/data.json",
      type: "registry:file",
      target: "app/dashboard/data.json",
      content: '[{"id": 1}]\n',
    },
    {
      path: "registry/base-nova/blocks/dashboard-01/components/chart-area-interactive.tsx",
      type: "registry:component",
      content: "export const ChartAreaInteractive = () => null\n",
    },
    {
      path: "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
      type: "registry:component",
      content: 'import { useReactTable } from "@tanstack/react-table";\n',
    },
  ],
  dependencies: [
    "@dnd-kit/core",
    "@dnd-kit/modifiers",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "@tanstack/react-table",
    "zod",
  ],
  registryDependencies: ["button"],
};

test("registry:block の配布ファイルを src/blocks/<name>/ へ解決する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("login-01", loginUpstream);
  assert.equal(target.itemType, "registry:block");
  assert.deepEqual(target.files, [
    {
      registryPath: "registry/base-nova/blocks/login-01/components/login-form.tsx",
      targetPath: "src/blocks/login-01/components/login-form.tsx",
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
      fileType: "registry:component",
    },
  ]);
});

test("registry:page を配布対象から外し droppedFiles へ振り分ける", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("login-01", loginUpstream);
  assert.deepEqual(target.droppedFiles, [
    {
      registryPath: "registry/base-nova/blocks/login-01/page.tsx",
      upstreamPath: "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
      target: "app/login/page.tsx",
    },
  ]);
});

test("block 所有の registry:file を配布対象へ含める", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("dashboard-01", dashboardUpstream);

  assert.deepEqual(
    target.files.find((file) => file.registryPath.endsWith("/data.json")),
    {
      registryPath: "registry/base-nova/blocks/dashboard-01/data.json",
      targetPath: "src/blocks/dashboard-01/data.json",
      upstreamPath: "apps/v4/registry/bases/base/blocks/dashboard-01/data.json",
      fileType: "registry:file",
      upstreamTargetPath: "app/dashboard/data.json",
      cliOutputPath: "src/app/dashboard/data.json",
    },
  );
});

test("registry:file の ~/ 付き target は CLI が repo root 相対へ生成する", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("asset-01", {
    name: "asset-01",
    type: "registry:block",
    files: [
      {
        path: "registry/base-nova/blocks/asset-01/LICENSE",
        type: "registry:file",
        target: "~/elchika-ui/LICENSE",
      },
    ],
  });

  assert.deepEqual(target.files[0], {
    registryPath: "registry/base-nova/blocks/asset-01/LICENSE",
    targetPath: "src/blocks/asset-01/LICENSE",
    upstreamPath: "apps/v4/registry/bases/base/blocks/asset-01/LICENSE",
    fileType: "registry:file",
    upstreamTargetPath: "~/elchika-ui/LICENSE",
    cliOutputPath: "elchika-ui/LICENSE",
  });
  assert.deepEqual(blockRelocationPlan(target), [
    {
      from: "elchika-ui/LICENSE",
      to: "src/blocks/asset-01/LICENSE",
    },
  ]);
});

test("dashboard-01 の data-table.tsx を明示的な dropped file として扱う", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("dashboard-01", dashboardUpstream);

  assert.deepEqual(
    target.droppedFiles.map(({ registryPath, excludeFromCli }) => ({
      registryPath,
      excludeFromCli,
    })),
    [
      {
        registryPath: "registry/base-nova/blocks/dashboard-01/page.tsx",
        excludeFromCli: undefined,
      },
      {
        registryPath: "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
        excludeFromCli: true,
      },
    ],
  );
});

test("registry:file の target に traversal があれば停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const upstream = structuredClone(dashboardUpstream);
  upstream.files.find((file) => file.type === "registry:file").target = "../outside/data.json";

  assert.throws(
    () => resolveRegistryTarget("dashboard-01", upstream),
    /registry:file の target.*repo 内の通常相対 path でない/,
  );
});

test("registry:file の target が無ければ停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const upstream = structuredClone(dashboardUpstream);
  upstream.files.find((file) => file.type === "registry:file").target = undefined;

  assert.throws(
    () => resolveRegistryTarget("dashboard-01", upstream),
    /registry:file に target が無い/,
  );
});

test("registry:block の配布ファイルが 0 件なら停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        ...loginUpstream,
        files: [loginUpstream.files[0]],
      }),
    /配布対象のファイルが 0 件/,
  );
});

test("block の file path が block ディレクトリ配下でなければ停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        ...loginUpstream,
        files: [{ path: "registry/base-nova/ui/login-form.tsx", type: "registry:component" }],
      }),
    /block の file path が想定外/,
  );
});

test("block の registry:page path に traversal があれば停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        type: "registry:block",
        files: [
          {
            path: "registry/base-nova/blocks/login-01/../other/page.tsx",
            type: "registry:page",
            target: "app/login/page.tsx",
          },
        ],
      }),
    /repo 内の通常相対 path でない/,
  );
});

test("block の registry:component に target があれば停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        type: "registry:block",
        files: [
          {
            path: "registry/base-nova/blocks/login-01/components/login-form.tsx",
            type: "registry:component",
            target: "package.json",
          },
        ],
      }),
    /registry:component に target は指定できない/,
  );
});

test("registry:ui の戻り値は従来どおり単一ファイルの形を保つ", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("badge", {
    name: "badge",
    type: "registry:ui",
    files: [{ path: "registry/base-nova/ui/badge.tsx", type: "registry:ui" }],
  });
  assert.equal(target.targetPath, "src/components/ui/badge.tsx");
  assert.equal(target.files, undefined);
});

test("src/blocks/ 配下の変更を target として分類する", async () => {
  const { classifyPath } = await loadModule();
  assert.equal(
    classifyPath("src/blocks/login-01/components/login-form.tsx", "src/blocks/login-01", new Set()),
    "target",
  );
});

test("別 block ディレクトリの変更は target として分類しない", async () => {
  const { classifyPath } = await loadModule();
  assert.equal(
    classifyPath("src/blocks/login-02/components/login-form.tsx", "src/blocks/login-01", new Set()),
    "unknown",
  );
});

test("block の registry item は配布ファイルだけを files に載せる", async () => {
  const { buildRegistryItem, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("login-01", loginUpstream);
  const item = buildRegistryItem("login-01", loginUpstream, "", target);
  assert.equal(item.type, "registry:block");
  assert.equal(item.title, "Login 01");
  assert.deepEqual(
    item.files.filter((file) => file.type !== "registry:file"),
    [{ path: "src/blocks/login-01/components/login-form.tsx", type: "registry:component" }],
  );
  assert.equal(
    item.files.some((file) => file.type === "registry:page"),
    false,
  );
  assert.deepEqual(item.registryDependencies, [
    "@elchika/button",
    "@elchika/card",
    "@elchika/input",
    "@elchika/label",
    "@elchika/field",
  ]);
});

test("block の registry:file は上流 target を保持し component には target を付けない", async () => {
  const { buildRegistryItem, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("dashboard-01", dashboardUpstream);
  const item = buildRegistryItem("dashboard-01", dashboardUpstream, "", target);

  assert.deepEqual(
    item.files.find((file) => file.path === "src/blocks/dashboard-01/data.json"),
    {
      path: "src/blocks/dashboard-01/data.json",
      type: "registry:file",
      target: "app/dashboard/data.json",
    },
  );
  assert.deepEqual(
    item.files.find(
      (file) => file.path === "src/blocks/dashboard-01/components/chart-area-interactive.tsx",
    ),
    {
      path: "src/blocks/dashboard-01/components/chart-area-interactive.tsx",
      type: "registry:component",
    },
  );
  assert.equal(item.files.find((file) => file.path === "LICENSE")?.target, "~/elchika-ui/LICENSE");
});

test("UI import 由来の registry dependency 補完は block だけに適用する", async () => {
  const { buildRegistryItem, resolveRegistryTarget } = await loadModule();
  const registryItems = [
    { name: "button", type: "registry:ui" },
    { name: "field", type: "registry:ui" },
  ];
  const blockUpstream = { ...loginUpstream, registryDependencies: ["button"] };
  const blockTarget = resolveRegistryTarget("login-01", blockUpstream);
  const generatedSource = [
    'import { Button } from "@/components/ui/button";',
    'import { Field } from "@/components/ui/field";',
  ].join("\n");

  const blockItem = buildRegistryItem(
    "login-01",
    blockUpstream,
    generatedSource,
    blockTarget,
    registryItems,
  );
  assert.deepEqual(blockItem.registryDependencies, ["@elchika/button", "@elchika/field"]);

  const componentUpstream = {
    name: "badge",
    type: "registry:ui",
    files: [{ path: "registry/base-nova/ui/badge.tsx", type: "registry:ui" }],
    registryDependencies: ["button"],
  };
  const componentTarget = resolveRegistryTarget("badge", componentUpstream);
  const componentItem = buildRegistryItem(
    "badge",
    componentUpstream,
    generatedSource,
    componentTarget,
    registryItems,
  );
  assert.deepEqual(componentItem.registryDependencies, ["@elchika/button"]);
});

test("block の UI import に対応する registry item が無ければ停止する", async () => {
  const { buildRegistryItem, resolveRegistryTarget } = await loadModule();
  const upstream = { ...loginUpstream, registryDependencies: ["button"] };
  const target = resolveRegistryTarget("login-01", upstream);

  assert.throws(
    () =>
      buildRegistryItem(
        "login-01",
        upstream,
        'import { Field } from "@/components/ui/field";',
        target,
        [{ name: "button", type: "registry:ui" }],
      ),
    /field.*registry item が存在しない/,
  );
});

test("block の記録済み判定は provenance.blocks を見る", async () => {
  const { shouldSkipRecorded } = await loadModule();
  const provenance = { components: {}, blocks: { "login-01": { license: "MIT" } } };
  assert.equal(shouldSkipRecorded(provenance, "login-01", false, "block"), true);
  assert.equal(shouldSkipRecorded(provenance, "login-02", false, "block"), false);
  assert.equal(shouldSkipRecorded(provenance, "login-01", true, "block"), false);
});

test("component の記録済み判定は従来どおり provenance.components を見る", async () => {
  const { shouldSkipRecorded } = await loadModule();
  const provenance = { components: { badge: { license: "MIT" } }, blocks: {} };
  assert.equal(shouldSkipRecorded(provenance, "badge", false), true);
  assert.equal(shouldSkipRecorded(provenance, "badge", true), false);
});

test("CLI がフラット配置した block ファイルの移設先を basename で決定的に対応付ける", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("login-01", loginUpstream);
  assert.deepEqual(blockRelocationPlan(target), [
    {
      from: "src/components/login-form.tsx",
      to: "src/blocks/login-01/components/login-form.tsx",
    },
  ]);
});

test("上流の兄弟ファイルが複数あっても移設先を全件対応付ける", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("sidebar-07", {
    name: "sidebar-07",
    type: "registry:block",
    files: [
      {
        path: "registry/base-nova/blocks/sidebar-07/page.tsx",
        type: "registry:page",
        target: "app/dashboard/page.tsx",
      },
      {
        path: "registry/base-nova/blocks/sidebar-07/components/app-sidebar.tsx",
        type: "registry:component",
      },
      {
        path: "registry/base-nova/blocks/sidebar-07/components/nav-main.tsx",
        type: "registry:component",
      },
    ],
  });
  assert.deepEqual(blockRelocationPlan(target), [
    {
      from: "src/components/app-sidebar.tsx",
      to: "src/blocks/sidebar-07/components/app-sidebar.tsx",
    },
    { from: "src/components/nav-main.tsx", to: "src/blocks/sidebar-07/components/nav-main.tsx" },
  ]);
});

test("registry:file は上流 target と CLI 生成先を分離する", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("dashboard-01", dashboardUpstream);

  assert.deepEqual(blockRelocationPlan(target), [
    {
      from: "src/app/dashboard/data.json",
      to: "src/blocks/dashboard-01/data.json",
    },
    {
      from: "src/components/chart-area-interactive.tsx",
      to: "src/blocks/dashboard-01/components/chart-area-interactive.tsx",
    },
  ]);
});

test("registry:file の src/ 始まり target は CLI 生成先で二重化しない", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const upstream = structuredClone(dashboardUpstream);
  upstream.files.find((file) => file.path.endsWith("/data.json")).target =
    "src/app/dashboard/data.json";
  const target = resolveRegistryTarget("dashboard-01", upstream);

  assert.deepEqual(
    target.files.find((file) => file.registryPath.endsWith("/data.json")),
    {
      registryPath: "registry/base-nova/blocks/dashboard-01/data.json",
      targetPath: "src/blocks/dashboard-01/data.json",
      upstreamPath: "apps/v4/registry/bases/base/blocks/dashboard-01/data.json",
      fileType: "registry:file",
      upstreamTargetPath: "src/app/dashboard/data.json",
      cliOutputPath: "src/app/dashboard/data.json",
    },
  );
  assert.deepEqual(blockRelocationPlan(target)[0], {
    from: "src/app/dashboard/data.json",
    to: "src/blocks/dashboard-01/data.json",
  });
});

test("同一 block 内で basename が重複したら移設せず停止する", async () => {
  const { blockRelocationPlan, resolveRegistryTarget } = await loadModule();
  const target = resolveRegistryTarget("broken-01", {
    name: "broken-01",
    type: "registry:block",
    files: [
      {
        path: "registry/base-nova/blocks/broken-01/components/form.tsx",
        type: "registry:component",
      },
      {
        path: "registry/base-nova/blocks/broken-01/widgets/form.tsx",
        type: "registry:component",
      },
    ],
  });
  assert.throws(() => blockRelocationPlan(target), /basename が重複/);
});

const blockFetch = (upstreamText) => async (url) => {
  if (url.includes("ui.shadcn.com")) {
    return { ok: true, status: 200, text: async () => upstreamText };
  }
  if (url.includes("/commits?")) {
    return { ok: true, status: 200, json: async () => [{ sha: "0".repeat(40) }] };
  }
  throw new Error(`想定外の fetch: ${url}`);
};

test("block を add すると移設してから reconcile し provenance.blocks へ書く", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  seedRegistryItems(root, ["button"]);
  const generated =
    'import { Button } from "@/components/ui/button";\nexport const LoginForm = Button;\n';
  const logs = [];
  let pinnedItemPath;

  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    // CLI は components alias 直下へフラットに落とす（実測）。既存の tracked component も上書きする。
    runCommand: (_command, args) => {
      pinnedItemPath = args.at(-1);
      assert.equal(readFileSync(pinnedItemPath, "utf8"), JSON.stringify(loginUpstream));
      writeFileSync(join(root, "src/components/login-form.tsx"), generated);
      writeFileSync(join(root, "src/components/ui/button.tsx"), "button overwritten\n");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(result.skipped, false);
  assert.equal(existsSync(pinnedItemPath), false);
  // 移設が済んでいる
  assert.equal(existsSync(join(root, "src/components/login-form.tsx")), false);
  assert.equal(
    readFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "utf8"),
    generated,
  );
  // 移設を reconcile より前に置いたので、上書きされた既存 component は復元される
  assert.deepEqual(result.reconciled.restored, ["src/components/ui/button.tsx"]);
  assert.equal(
    readFileSync(join(root, "src/components/ui/button.tsx"), "utf8"),
    "button original\n",
  );

  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.ok(provenance.blocks["login-01"]);
  assert.equal(provenance.components["login-01"], undefined);
  assert.equal(provenance.blocks["login-01"].files.filter((f) => f.dropped).length, 1);
  assert.equal(provenance.blocks["login-01"].files.filter((f) => !f.dropped).length, 1);
  assert.equal(
    provenance.blocks["login-01"].files.find((f) => !f.dropped).generatedContentSha256,
    createHash("sha256").update(generated).digest("hex"),
  );
  // registryContentSha256 は受け取った配信物 JSON 全体の錨
  assert.equal(
    provenance.blocks["login-01"].registryContentSha256,
    createHash("sha256").update(JSON.stringify(loginUpstream)).digest("hex"),
  );

  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const item = registry.items.find((i) => i.name === "login-01");
  assert.equal(item.type, "registry:block");
  assert.equal(
    item.files.some((file) => file.type === "registry:page"),
    false,
  );
});

test("block の CLI 生成先が無ければ移設前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {},
      log: () => {},
    }),
    /block の CLI 生成先が存在しない.*src\/components\/login-form\.tsx/,
  );
});

test("registry:file の CLI 生成先が無ければ一部を移設せず停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await assert.rejects(
    runAddComponent({
      argv: ["dashboard-01", "--modified", "data-table.tsx を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(dashboardUpstream)),
      runCommand: () => {
        writeFileSync(
          join(root, "src/components/chart-area-interactive.tsx"),
          "export const ChartAreaInteractive = () => null\n",
        );
      },
      log: () => {},
    }),
    /registry:file の CLI 生成先が存在しない.*src\/app\/dashboard\/data\.json/,
  );

  assert.equal(
    existsSync(join(root, "src/blocks/dashboard-01/components/chart-area-interactive.tsx")),
    false,
  );
});

test("記録済み component の再実行は kind 確定後に CLI を実行せず skip する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  writeJson(join(root, "provenance.json"), { components: { badge: { license: "MIT" } } });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "badge fixture"]);

  let fetched = 0;
  const upstream = {
    name: "badge",
    type: "registry:ui",
    files: [{ type: "registry:ui", path: "registry/base-nova/ui/badge.tsx", content: "" }],
  };
  const rerun = await runAddComponent({
    argv: ["badge", "--modified", "同じ変更"],
    root,
    fetchImpl: async () => {
      fetched++;
      return { ok: true, status: 200, text: async () => JSON.stringify(upstream) };
    },
    runCommand: () => {
      throw new Error("CLI を実行してはならない");
    },
    log: () => {},
  });
  assert.deepEqual(rerun, { skipped: true });
  assert.equal(fetched, 1);
});

test("記録済み block の再実行は skip する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  writeJson(join(root, "provenance.json"), {
    components: {},
    blocks: { "login-01": { license: "MIT" } },
  });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "block fixture"]);
  let reran = false;

  const rerun = await runAddComponent({
    argv: ["login-01", "--modified", "同じ変更"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      reran = true;
    },
    log: () => {},
  });
  assert.deepEqual(rerun, { skipped: true });
  assert.equal(reran, false);
});

test("記録済み block は --force で来歴にある既存ファイルを更新する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  const addBlock = async (generated, force = false) =>
    runAddComponent({
      argv: [
        "login-01",
        "--modified",
        force ? "上流の再取得" : "registry:page を配布から除外",
        ...(force ? ["--force"] : []),
      ],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        writeFileSync(join(root, "src/components/login-form.tsx"), generated);
      },
      log: () => {},
    });

  await addBlock("export const version = 1\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "login block fixture"]);

  const result = await addBlock("export const version = 2\n", true);

  assert.equal(result.skipped, false);
  assert.equal(
    readFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "utf8"),
    "export const version = 2\n",
  );
  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.equal(
    provenance.blocks["login-01"].files.find((file) => !file.dropped).generatedContentSha256,
    createHash("sha256").update("export const version = 2\n").digest("hex"),
  );
});

test("block の --force は前回来歴が所有しない新規移設先を上書きしない", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export const version = 1\n");
    },
    log: () => {},
  });
  mkdirSync(join(root, "src/blocks/login-01/components"), { recursive: true });
  writeFileSync(
    join(root, "src/blocks/login-01/components/login-extra.tsx"),
    "利用者が所有するファイル\n",
  );
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "consumer-owned fixture"]);

  const updatedUpstream = structuredClone(loginUpstream);
  updatedUpstream.files.splice(1, 0, {
    path: "registry/base-nova/blocks/login-01/components/login-extra.tsx",
    type: "registry:component",
    content: "export const LoginExtra = true\n",
  });
  let ran = false;
  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "上流の再取得", "--force"],
      root,
      fetchImpl: blockFetch(JSON.stringify(updatedUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /block の移設先が実行前から存在する.*login-extra\.tsx/,
  );
  assert.equal(ran, false);
  assert.equal(
    readFileSync(join(root, "src/blocks/login-01/components/login-extra.tsx"), "utf8"),
    "利用者が所有するファイル\n",
  );
});

test("block の --force は上流移植品以外の origin を上書きしない", async (t) => {
  for (const origin of ["elchika original", "unknown-source", undefined]) {
    const root = prepareWrapperRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, "src/blocks/login-01/components"), { recursive: true });
    writeFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "既存 block\n");
    writeJson(join(root, "provenance.json"), {
      components: {},
      blocks: {
        "login-01": {
          ...(origin === undefined ? {} : { origin }),
          files: [
            {
              path: "src/blocks/login-01/components/login-form.tsx",
              generatedContentSha256: "0".repeat(64),
            },
          ],
        },
      },
    });
    git(root, ["add", "."]);
    git(root, ["commit", "-m", `origin ${String(origin)} fixture`]);
    const { runAddComponent } = await loadModule();
    let ran = false;

    await assert.rejects(
      runAddComponent({
        argv: ["login-01", "--modified", "上流の再取得", "--force"],
        root,
        fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
        runCommand: () => {
          ran = true;
          writeFileSync(join(root, "src/components/login-form.tsx"), "上流の block\n");
        },
        log: () => {},
      }),
      /--force.*origin.*shadcn\/ui registry/,
    );
    assert.equal(ran, false);
    assert.equal(
      readFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "utf8"),
      "既存 block\n",
    );
  }
});

test("block の来歴 API が失敗しても --force 前の実体と台帳を保持する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export const version = 1\n");
    },
    log: () => {},
  });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "preflight failure fixture"]);
  const provenanceBefore = readFileSync(join(root, "provenance.json"), "utf8");
  const registryBefore = readFileSync(join(root, "registry.json"), "utf8");
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "上流の再取得", "--force"],
      root,
      fetchImpl: async (url) => {
        if (url.includes("ui.shadcn.com")) {
          return { ok: true, status: 200, text: async () => JSON.stringify(loginUpstream) };
        }
        return { ok: false, status: 403, json: async () => ({}) };
      },
      runCommand: () => {
        ran = true;
        writeFileSync(join(root, "src/components/login-form.tsx"), "export const version = 2\n");
      },
      log: () => {},
    }),
    /取得に失敗.*403/,
  );
  assert.equal(ran, false);
  assert.equal(
    readFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "utf8"),
    "export const version = 1\n",
  );
  assert.equal(readFileSync(join(root, "provenance.json"), "utf8"), provenanceBefore);
  assert.equal(readFileSync(join(root, "registry.json"), "utf8"), registryBefore);
});

test("block の移設先に symlink 祖先があれば repo 外を書き換えず停止する", async (t) => {
  const root = prepareWrapperRepo();
  const outside = mkdtempSync(join(tmpdir(), "elchika-add-component-outside-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  mkdirSync(join(root, "src/blocks/login-01"), { recursive: true });
  symlinkSync(outside, join(root, "src/blocks/login-01/components"), "dir");
  writeJson(join(root, "provenance.json"), {
    components: {},
    blocks: {
      "login-01": {
        origin: "shadcn/ui registry",
        files: [
          {
            path: "src/blocks/login-01/components/login-form.tsx",
            generatedContentSha256: "0".repeat(64),
          },
        ],
      },
    },
  });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "symlink fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "上流の再取得", "--force"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
        writeFileSync(join(root, "src/components/login-form.tsx"), "repo 外へ出してはならない\n");
      },
      log: () => {},
    }),
    /symlink/,
  );
  assert.equal(ran, false);
  assert.equal(existsSync(join(outside, "login-form.tsx")), false);
});

test("block の CLI 生成先が symlink なら実行前に repo 外上書きを拒否する", async (t) => {
  const root = prepareWrapperRepo();
  const outside = mkdtempSync(join(tmpdir(), "elchika-add-component-cli-outside-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, "login-form.tsx"), "repo 外の既存ファイル\n");
  symlinkSync(join(outside, "login-form.tsx"), join(root, "src/components/login-form.tsx"), "file");
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "CLI source symlink fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
        writeFileSync(join(root, "src/components/login-form.tsx"), "上書き\n");
      },
      log: () => {},
    }),
    /CLI 生成先.*symlink/,
  );
  assert.equal(ran, false);
  assert.equal(readFileSync(join(outside, "login-form.tsx"), "utf8"), "repo 外の既存ファイル\n");
});

test("block の CLI 一時生成先に既存ファイルがあれば内容を保持して停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "src/components/login-form.tsx"), "block が所有しない既存ファイル\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "existing CLI source fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /block の CLI 生成先が実行前から存在する.*src\/components\/login-form\.tsx/,
  );
  assert.equal(ran, false);
  assert.equal(
    readFileSync(join(root, "src/components/login-form.tsx"), "utf8"),
    "block が所有しない既存ファイル\n",
  );
});

test("registry:file の ~/ target は共有法務ファイル以外の管理領域を拒否する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const upstream = structuredClone(dashboardUpstream);
  upstream.files[1].target = "~/.git/hooks/post-checkout";

  assert.throws(
    () => resolveRegistryTarget("dashboard-01", upstream),
    /registry:file の CLI 生成先が許可領域外/,
  );
});

test("block の --force は上流から消えた前回来歴のファイルを削除する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  const initialUpstream = structuredClone(loginUpstream);
  initialUpstream.files.splice(1, 0, {
    path: "registry/base-nova/blocks/login-01/components/login-extra.tsx",
    type: "registry:component",
    content: "export const LoginExtra = true\n",
  });

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(initialUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export const version = 1\n");
      writeFileSync(join(root, "src/components/login-extra.tsx"), "export const extra = 1\n");
    },
    log: () => {},
  });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "login block with extra fixture"]);

  const logs = [];
  await runAddComponent({
    argv: ["login-01", "--modified", "上流で extra を削除", "--force"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export const version = 2\n");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(existsSync(join(root, "src/blocks/login-01/components/login-extra.tsx")), false);
  assert.ok(
    logs.includes(
      "上流から消えた block file を削除: src/blocks/login-01/components/login-extra.tsx",
    ),
  );
});

test("CLI が作った配布しない page を reconcile より前に削除する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  const logs = [];

  // 削除を reconcile の後に置くと、app/login/page.tsx がどの分類ルールにも一致せず
  // reconcile が先に停止するため、この防御へ到達しない（実測で確認した失敗モード）。
  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export {}\n");
      mkdirSync(join(root, "app/login"), { recursive: true });
      writeFileSync(join(root, "app/login/page.tsx"), "export default () => null\n");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(result.skipped, false);
  assert.equal(existsSync(join(root, "app/login/page.tsx")), false);
  assert.ok(logs.includes("配布しない page を削除: app/login/page.tsx"));
});

test("別 block 配下の registry:page は CLI 実行前に停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  const upstream = structuredClone(loginUpstream);
  upstream.files[0].path = "registry/base-nova/blocks/other/page.tsx";
  upstream.files[0].target = "package.json";

  assert.throws(
    () => resolveRegistryTarget("login-01", upstream),
    /login-01: block の file path が想定外/,
  );
});

test("配布しない page の target が実行前から存在すれば CLI より前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  mkdirSync(join(root, "app/login"), { recursive: true });
  writeFileSync(join(root, "app/login/page.tsx"), "既存 page\n");
  git(root, ["add", "app/login/page.tsx"]);
  git(root, ["commit", "-m", "existing page fixture"]);
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /registry:page の target が実行前から存在する/,
  );
  assert.equal(ran, false);
  assert.equal(readFileSync(join(root, "app/login/page.tsx"), "utf8"), "既存 page\n");
});

test("component と同名の block は kind 確定後に衝突として停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(join(root, "provenance.json"), {
    components: { "login-01": { license: "MIT" } },
    blocks: {},
  });
  git(root, ["add", "provenance.json"]);
  git(root, ["commit", "-m", "component collision fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /component と block の同名衝突/,
  );

  assert.equal(ran, false);
});

test("component と同名の registry item があれば来歴欠落でも CLI 前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeJson(join(root, "registry.json"), {
    items: [{ name: "login-01", type: "registry:ui" }],
  });
  git(root, ["add", "registry.json"]);
  git(root, ["commit", "-m", "registry collision fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /component と block の同名衝突/,
  );

  assert.equal(ran, false);
});

test("同名 registry item が複数あれば type と順序によらず CLI 前に停止する", async (t) => {
  for (const reverse of [false, true]) {
    const root = prepareWrapperRepo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const items = [
      { name: "login-01", type: "registry:block" },
      { name: "login-01", type: "registry:ui" },
    ];
    writeJson(join(root, "registry.json"), { items: reverse ? items.reverse() : items });
    git(root, ["add", "registry.json"]);
    git(root, ["commit", "-m", "duplicate registry fixture"]);
    const { runAddComponent } = await loadModule();
    let ran = false;

    await assert.rejects(
      runAddComponent({
        argv: ["login-01", "--modified", "registry:page を配布から除外"],
        root,
        fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
        runCommand: () => {
          ran = true;
        },
        log: () => {},
      }),
      /registry item が重複/,
    );

    assert.equal(ran, false);
  }
});

test("component と同名の disk 実体があれば来歴欠落でも CLI 前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "src/components/ui/login-01.tsx"), "export const Login = null;\n");
  git(root, ["add", "src/components/ui/login-01.tsx"]);
  git(root, ["commit", "-m", "disk collision fixture"]);
  const { runAddComponent } = await loadModule();
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--modified", "registry:page を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /component と block の同名衝突/,
  );

  assert.equal(ran, false);
});

test("block の registry item は配布ファイルの import から npm 依存を補う", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  // 上流 item の dependencies 宣言が漏れていても生成物の import から拾い直す。
  // block で generatedSource を空文字にすると、この安全網が黙って無効になる
  // （上流 dashboard-01 は実際に recharts / sonner の宣言を欠く）。
  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(
        join(root, "src/components/login-form.tsx"),
        'import { toast } from "sonner";\nexport const LoginForm = toast;\n',
      );
    },
    log: () => {},
  });

  assert.ok(result.registryItem.dependencies.includes("sonner"));
  assert.deepEqual(result.registryItem.dependencies, ["shadcn", "sonner", "tw-animate-css"]);
});

test("block の registry item は配布ファイルの UI import から宣言漏れを補う", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  seedRegistryItems(root, ["field"]);
  const upstream = { ...loginUpstream, registryDependencies: ["button"] };

  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(upstream)),
    runCommand: () => {
      writeFileSync(
        join(root, "src/components/login-form.tsx"),
        'import { Field } from "@/components/ui/field";\nexport const LoginForm = Field;\n',
      );
    },
    log: () => {},
  });

  assert.deepEqual(result.registryItem.registryDependencies, ["@elchika/button", "@elchika/field"]);
});

test("block の registry item は hook import とその推移的依存を補完する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  seedRegistryGraph(root, [
    {
      name: "use-mobile",
      type: "registry:hook",
      registryDependencies: ["@elchika/input"],
    },
    { name: "input", type: "registry:ui" },
    { name: "label", type: "registry:ui" },
  ]);
  const upstream = structuredClone(dashboardUpstream);
  upstream.files.find((file) => file.path.endsWith("/chart-area-interactive.tsx")).content =
    'import { useIsMobile } from "@/hooks/use-mobile";\nexport const Chart = useIsMobile;\n';
  upstream.files.find((file) => file.path.endsWith("/data-table.tsx")).content =
    'import { Label } from "@/registry/base-nova/ui/label";\nexport const Table = Label;\n';
  upstream.registryDependencies = ["input", "label"];

  const result = await runAddComponent({
    argv: ["dashboard-01", "--modified", "data-table.tsx を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(upstream)),
    runCommand: () => {
      writeFileSync(
        join(root, "src/components/chart-area-interactive.tsx"),
        'import { useIsMobile } from "@/hooks/use-mobile";\nexport const Chart = useIsMobile;\n',
      );
      mkdirSync(join(root, "src/app/dashboard"), { recursive: true });
      writeFileSync(join(root, "src/app/dashboard/data.json"), "[]\n");
    },
    log: () => {},
  });

  assert.deepEqual(result.registryItem.registryDependencies, [
    "@elchika/input",
    "@elchika/use-mobile",
  ]);
});

test("hook import に対応する registry item が無ければ fail-closed で停止する", async () => {
  const { completeBlockRegistryDependencies } = await loadModule();
  assert.throws(
    () =>
      completeBlockRegistryDependencies(
        "dashboard-01",
        [],
        'import { useIsMobile } from "@/hooks/use-mobile";',
        [],
      ),
    /@\/hooks\/use-mobile に対応する registry item が存在しない（期待 type: registry:hook）/,
  );
});

test("hook import と同名の item が registry:hook でなければ fail-closed で停止する", async () => {
  const { completeBlockRegistryDependencies } = await loadModule();
  assert.throws(
    () =>
      completeBlockRegistryDependencies(
        "dashboard-01",
        [],
        'import { useIsMobile } from "@/hooks/use-mobile";',
        [{ name: "use-mobile", type: "registry:ui" }],
      ),
    /use-mobile の type が registry:hook でない/,
  );
});

test("block の来歴は上流パスを記録する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export {}\n");
    },
    log: () => {},
  });

  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  const files = provenance.blocks["login-01"].files;
  assert.equal(
    files.find((f) => !f.dropped).upstreamPath,
    "apps/v4/registry/bases/base/blocks/login-01/components/login-form.tsx",
  );
  assert.equal(
    files.find((f) => f.dropped).upstreamPath,
    "apps/v4/registry/bases/base/blocks/login-01/page.tsx",
  );
});

test("block の複数配布ファイルを移設し全件の生成を確認する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  seedRegistryItems(root, ["button"]);
  const multiUpstream = {
    name: "sidebar-07",
    type: "registry:block",
    files: [
      {
        path: "registry/base-nova/blocks/sidebar-07/page.tsx",
        type: "registry:page",
        target: "app/dashboard/page.tsx",
      },
      {
        path: "registry/base-nova/blocks/sidebar-07/components/app-sidebar.tsx",
        type: "registry:component",
      },
      {
        path: "registry/base-nova/blocks/sidebar-07/components/nav-main.tsx",
        type: "registry:component",
      },
    ],
  };
  const logs = [];
  const appSidebar =
    'import { NavMain } from "@/components/nav-main";\n' +
    'import { Button } from "@/components/ui/button";\n' +
    "export const AppSidebar = () => <><NavMain /><Button /></>;\n";

  await runAddComponent({
    argv: ["sidebar-07", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(multiUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/app-sidebar.tsx"), appSidebar);
      writeFileSync(join(root, "src/components/nav-main.tsx"), "export {}\n");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(existsSync(join(root, "src/blocks/sidebar-07/components/app-sidebar.tsx")), true);
  assert.equal(existsSync(join(root, "src/blocks/sidebar-07/components/nav-main.tsx")), true);
  assert.equal(
    readFileSync(join(root, "src/blocks/sidebar-07/components/app-sidebar.tsx"), "utf8"),
    appSidebar.replace('"@/components/nav-main"', '"./nav-main"'),
  );
  assert.ok(
    logs.includes(
      "移設: src/components/app-sidebar.tsx -> src/blocks/sidebar-07/components/app-sidebar.tsx",
    ),
  );
  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.equal(provenance.blocks["sidebar-07"].files.filter((f) => !f.dropped).length, 2);
});

test("block registry item に法務ファイルを同梱する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export {}\n");
    },
    log: () => {},
  });

  for (const target of [
    "~/elchika-ui/LICENSE",
    "~/elchika-ui/THIRD_PARTY_LICENSES",
    "~/elchika-ui/tokens.css",
  ]) {
    assert.ok(
      result.registryItem.files.some((file) => file.target === target),
      target,
    );
  }
});

test("block の未対応 file type は配布せず停止する", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("dashboard-01", {
        name: "dashboard-01",
        type: "registry:block",
        files: [
          {
            path: "registry/base-nova/blocks/dashboard-01/route.ts",
            type: "registry:route",
          },
        ],
      }),
    /block の file type が未対応: registry:route/,
  );
});

test("block の移設先に既存ファイルがあれば CLI 実行前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  mkdirSync(join(root, "src/blocks/dashboard-01"), { recursive: true });
  writeFileSync(join(root, "src/blocks/dashboard-01/data.json"), "既存データ\n");
  git(root, ["add", "src/blocks/dashboard-01/data.json"]);
  git(root, ["commit", "-m", "existing block file fixture"]);
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["dashboard-01", "--modified", "data-table.tsx を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(dashboardUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /移設先が実行前から存在する.*src\/blocks\/dashboard-01\/data\.json/,
  );

  assert.equal(ran, false);
  assert.equal(
    readFileSync(join(root, "src/blocks/dashboard-01/data.json"), "utf8"),
    "既存データ\n",
  );
});

test("registry:file の CLI 生成先に既存ファイルがあれば CLI 実行前に停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  mkdirSync(join(root, "src/app/dashboard"), { recursive: true });
  writeFileSync(join(root, "src/app/dashboard/data.json"), "既存データ\n");
  git(root, ["add", "src/app/dashboard/data.json"]);
  git(root, ["commit", "-m", "existing registry file target fixture"]);
  let ran = false;

  await assert.rejects(
    runAddComponent({
      argv: ["dashboard-01", "--modified", "data-table.tsx を配布から除外"],
      root,
      fetchImpl: blockFetch(JSON.stringify(dashboardUpstream)),
      runCommand: () => {
        ran = true;
      },
      log: () => {},
    }),
    /registry:file の CLI 生成先が実行前から存在する.*src\/app\/dashboard\/data\.json/,
  );

  assert.equal(ran, false);
  assert.equal(readFileSync(join(root, "src/app/dashboard/data.json"), "utf8"), "既存データ\n");
});

test("dashboard-01 は配布ファイルの registry 依存閉包だけを pin と最終 item に残す", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  seedRegistryGraph(root, [
    {
      name: "sidebar",
      type: "registry:ui",
      registryDependencies: ["input"],
    },
    {
      name: "input",
      type: "registry:ui",
      registryDependencies: ["@elchika/sheet"],
    },
    { name: "sheet", type: "registry:ui" },
    { name: "label", type: "registry:ui" },
    { name: "breadcrumb", type: "registry:ui" },
  ]);
  const upstream = structuredClone(dashboardUpstream);
  upstream.files.find((file) => file.path.endsWith("/chart-area-interactive.tsx")).content =
    'import { Sidebar } from "@/registry/base-nova/ui/sidebar";\nexport const ChartAreaInteractive = Sidebar;\n';
  upstream.files.find((file) => file.path.endsWith("/data-table.tsx")).content =
    'import { Label } from "@/registry/base-nova/ui/label";\nimport { useReactTable } from "@tanstack/react-table";\nexport const DataTable = Label;\n';
  upstream.registryDependencies = ["sidebar", "@elchika/input", "sheet", "label", "breadcrumb"];
  let pinnedItemPath;

  const result = await runAddComponent({
    argv: ["dashboard-01", "--modified", "data-table.tsx を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(upstream)),
    runCommand: (_command, args) => {
      pinnedItemPath = args.at(-1);
      const pinned = JSON.parse(readFileSync(pinnedItemPath, "utf8"));
      assert.equal(
        pinned.files.some((file) => file.path.endsWith("/data-table.tsx")),
        false,
      );
      assert.equal(
        pinned.files.some((file) => file.path.endsWith("/data.json")),
        true,
      );
      assert.deepEqual(pinned.dependencies ?? [], []);
      assert.deepEqual(pinned.registryDependencies, ["sidebar", "@elchika/input", "sheet"]);
      writeFileSync(
        join(root, "src/components/chart-area-interactive.tsx"),
        'import { Sidebar } from "@/components/ui/sidebar";\nexport const ChartAreaInteractive = Sidebar;\n',
      );
      mkdirSync(join(root, "src/app/dashboard"), { recursive: true });
      writeFileSync(join(root, "src/app/dashboard/data.json"), '[{"id": 1}]\n');
    },
    log: () => {},
  });

  assert.equal(existsSync(pinnedItemPath), false);
  assert.equal(existsSync(join(root, "src/components/data-table.tsx")), false);
  assert.equal(existsSync(join(root, "src/blocks/dashboard-01/data.json")), true);
  assert.deepEqual(
    result.registryItem.files
      .filter((file) => file.path.startsWith("src/blocks/dashboard-01/"))
      .map(({ path, type, target }) => ({ path, type, target })),
    [
      {
        path: "src/blocks/dashboard-01/data.json",
        type: "registry:file",
        target: "app/dashboard/data.json",
      },
      {
        path: "src/blocks/dashboard-01/components/chart-area-interactive.tsx",
        type: "registry:component",
        target: undefined,
      },
    ],
  );
  assert.equal(result.entry.files.filter((file) => file.dropped).length, 2);
  assert.equal(
    result.registryItem.dependencies.some((dependency) => dependency.startsWith("@dnd-kit/")),
    false,
  );
  assert.deepEqual(result.registryItem.registryDependencies, [
    "@elchika/sidebar",
    "@elchika/input",
    "@elchika/sheet",
  ]);
  assert.equal(
    result.entry.modified,
    "data-table.tsx を配布から除外。上流 manifest から除外した dependencies: @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable, @dnd-kit/utilities, @tanstack/react-table, zod。上流 manifest から除外した registryDependencies: breadcrumb, label",
  );
  assert.match(
    result.entry.notes,
    /dropped: true の file は配布しない上流 file を表し、理由は modified に記録する/,
  );
  assert.doesNotMatch(result.entry.notes, /dropped: true の file は registry:page/);
});

test("prefix が先頭以外にある block の file path を通さない", async () => {
  const { resolveRegistryTarget } = await loadModule();
  assert.throws(
    () =>
      resolveRegistryTarget("login-01", {
        name: "login-01",
        type: "registry:block",
        files: [
          {
            path: "vendor/registry/base-nova/blocks/login-01/x.tsx",
            type: "registry:component",
          },
        ],
      }),
    /block の file path が想定外/,
  );
});

// 正規化（biome 整形・standards 適合）を行うと、CLI 生成物から取ったハッシュとずれる。
// --force は CLI を再実行するので正規化を上書きしてしまい、lint を直すと再びずれる。
// 正規化と来歴を同時に満たす経路として --resync を持つ。
test("--resync は CLI も通信もせず来歴のハッシュを実体へ揃える", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), 'export const a = "raw"\n');
    },
    log: () => {},
  });

  // 正規化を模す（整形して内容が変わる）。この時点で来歴のハッシュはずれる。
  const normalized = 'export const a = "normalized";\n';
  writeFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), normalized);

  const before = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8")).blocks["login-01"]
    .modified;
  const logs = [];
  const result = await runAddComponent({
    argv: ["login-01", "--resync"],
    root,
    fetchImpl: async () => {
      throw new Error("fetch してはならない");
    },
    runCommand: () => {
      throw new Error("CLI を実行してはならない");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(result.resynced, true);
  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  const file = provenance.blocks["login-01"].files.find((f) => !f.dropped);
  assert.equal(file.generatedContentSha256, createHash("sha256").update(normalized).digest("hex"));
  // --modified を渡さなければ既存の来歴を保つ。上流から何を変えたかの唯一の記録なので、
  // ハッシュの取り直しのたびに 1 行へ潰れてはいけない。
  assert.equal(provenance.blocks["login-01"].modified, before);
  // 正規化した実体が CLI 生成物で上書きされていない（--force との違い）
  assert.equal(
    readFileSync(join(root, "src/blocks/login-01/components/login-form.tsx"), "utf8"),
    normalized,
  );
  assert.ok(logs.some((message) => message.startsWith("ハッシュを更新:")));
});

test("--resync は --modified を渡したときだけ来歴を上書きする", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), "export {}\n");
    },
    log: () => {},
  });

  await runAddComponent({
    argv: ["login-01", "--resync", "--modified", "a11y 適合を追記"],
    root,
    fetchImpl: async () => {
      throw new Error("fetch してはならない");
    },
    runCommand: () => {},
    log: () => {},
  });

  const provenance = JSON.parse(readFileSync(join(root, "provenance.json"), "utf8"));
  assert.equal(provenance.blocks["login-01"].modified, "a11y 適合を追記");
});

test("--resync は来歴が無ければ停止する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();

  await assert.rejects(
    runAddComponent({
      argv: ["login-01", "--resync"],
      root,
      fetchImpl: async () => {
        throw new Error("fetch してはならない");
      },
      runCommand: () => {},
      log: () => {},
    }),
    /provenance.blocks に来歴が無い/,
  );
});

test("--resync と --force は同時に指定できない", async () => {
  const { parseArgs } = await loadModule();
  assert.throws(() => parseArgs(["login-01", "--resync", "--force"]), /同時に指定できない/);
});
