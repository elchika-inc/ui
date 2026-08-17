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
  const runCommand = (command, args, options) => {
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
    fetchImpl: async () => {
      throw new Error("fetch してはならない");
    },
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
    },
  ]);
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
  const generated =
    'import { Button } from "@/components/ui/button";\nexport const LoginForm = Button;\n';
  const logs = [];

  const result = await runAddComponent({
    argv: ["login-01", "--modified", "registry:page を配布から除外"],
    root,
    fetchImpl: blockFetch(JSON.stringify(loginUpstream)),
    // CLI は components alias 直下へフラットに落とす（実測）。既存の tracked component も上書きする。
    runCommand: () => {
      writeFileSync(join(root, "src/components/login-form.tsx"), generated);
      writeFileSync(join(root, "src/components/ui/button.tsx"), "button overwritten\n");
    },
    log: (message) => logs.push(message),
  });

  assert.equal(result.skipped, false);
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

test("block の配布ファイルが移設先に無ければ停止する", async (t) => {
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
    /が生成されなかった/,
  );
});

test("記録済み component の再実行は fetch せずに skip する", async (t) => {
  const root = prepareWrapperRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { runAddComponent } = await loadModule();
  writeJson(join(root, "provenance.json"), { components: { badge: { license: "MIT" } } });
  git(root, ["add", "."]);
  git(root, ["commit", "-m", "badge fixture"]);

  const rerun = await runAddComponent({
    argv: ["badge", "--modified", "同じ変更"],
    root,
    fetchImpl: async () => {
      throw new Error("fetch してはならない");
    },
    runCommand: () => {
      throw new Error("CLI を実行してはならない");
    },
    log: () => {},
  });
  assert.deepEqual(rerun, { skipped: true });
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
