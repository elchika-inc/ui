import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  findMissingRegistryItems,
  findUnexpectedRegistryItems,
  registryBuildProblems,
} from "./check-registry-build.mjs";

const scriptPath = fileURLToPath(new URL("./check-registry-build.mjs", import.meta.url));

test("registry item と既知の補助 JSON だけなら生成集合が一致する", () => {
  const registry = {
    items: [{ name: "button" }, { name: "login-01" }],
  };
  const builtFiles = ["button.json", "login-01.json", "index.json", "registry.json"];

  assert.deepEqual(findMissingRegistryItems(registry, builtFiles), []);
  assert.deepEqual(findUnexpectedRegistryItems(registry, builtFiles), []);
});

test("registry から退役した item JSON が生成先に残っていれば検出する", () => {
  const registry = {
    items: [{ name: "button" }],
  };

  assert.deepEqual(
    findUnexpectedRegistryItems(registry, [
      "button.json",
      "index.json",
      "registry.json",
      "retired-item.json",
      "LICENSE",
    ]),
    ["retired-item"],
  );
});

test("registry item に対応する生成物が無ければ item 名を返す", () => {
  const registry = {
    items: [{ name: "button" }, { name: "dashboard-01" }, { name: "dashboard-table" }],
  };

  assert.deepEqual(
    findMissingRegistryItems(registry, [
      "button.json",
      "dashboard-table.json",
      "index.json",
      "registry.json",
    ]),
    ["dashboard-01"],
  );
});

test("既知の補助 JSON が無ければ欠落として検出する", () => {
  const registry = {
    items: [{ name: "button" }],
  };

  assert.deepEqual(findMissingRegistryItems(registry, ["button.json"]), ["index", "registry"]);
});

test("生成 JSON の manifest と files content が source に一致すれば問題なし", () => {
  const registry = {
    items: [
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "src/components/ui/button.tsx", type: "registry:ui" }],
      },
    ],
  };
  const builtItems = new Map([
    [
      "button",
      {
        name: "button",
        type: "registry:ui",
        files: [
          {
            path: "src/components/ui/button.tsx",
            type: "registry:ui",
            content: "export const Button = () => null;\n",
          },
        ],
      },
    ],
  ]);
  const sourceContents = new Map([
    ["src/components/ui/button.tsx", "export const Button = () => null;\n"],
  ]);

  assert.deepEqual(registryBuildProblems(registry, builtItems, sourceContents), []);
});

test("空 JSON と stale な files content を生成済みとして扱わない", () => {
  const registry = {
    items: [
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "src/components/ui/button.tsx", type: "registry:ui" }],
      },
      {
        name: "dashboard-table",
        type: "registry:block",
        files: [
          {
            path: "src/blocks/dashboard-table/components/dashboard-table.tsx",
            type: "registry:component",
          },
        ],
      },
    ],
  };
  const builtItems = new Map([
    ["button", {}],
    [
      "dashboard-table",
      {
        name: "dashboard-table",
        type: "registry:block",
        files: [
          {
            path: "src/blocks/dashboard-table/components/dashboard-table.tsx",
            type: "registry:component",
            content: "古い生成物\n",
          },
        ],
      },
    ],
  ]);
  const sourceContents = new Map([
    ["src/components/ui/button.tsx", "export const Button = () => null;\n"],
    [
      "src/blocks/dashboard-table/components/dashboard-table.tsx",
      "export function DashboardTable() { return null; }\n",
    ],
  ]);

  assert.deepEqual(registryBuildProblems(registry, builtItems, sourceContents), [
    "button: 生成 JSON の manifest が registry.json と一致しない",
    "dashboard-table: src/blocks/dashboard-table/components/dashboard-table.tsx の生成 content が source と一致しない",
  ]);
});

test("CLI は生成物の充足を exit code と実 item 名で通知する", (t) => {
  const root = mkdtempSync(join(tmpdir(), "elchika-registry-build-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "public/r"), { recursive: true });
  mkdirSync(join(root, "src/blocks/dashboard-01"), { recursive: true });
  const registry = {
    items: [
      {
        name: "button",
        type: "registry:ui",
        files: [{ path: "src/button.tsx", type: "registry:ui" }],
      },
      {
        name: "dashboard-01",
        type: "registry:block",
        files: [{ path: "src/blocks/dashboard-01/data.json", type: "registry:file" }],
      },
    ],
  };
  writeFileSync(join(root, "registry.json"), `${JSON.stringify(registry)}\n`);
  writeFileSync(join(root, "src/button.tsx"), "export const Button = () => null;\n");
  writeFileSync(join(root, "src/blocks/dashboard-01/data.json"), "[]\n");
  writeFileSync(
    join(root, "public/r/button.json"),
    `${JSON.stringify({
      ...registry.items[0],
      files: [
        {
          ...registry.items[0].files[0],
          content: "export const Button = () => null;\n",
        },
      ],
    })}\n`,
  );
  writeFileSync(
    join(root, "public/r/dashboard-01.json"),
    `${JSON.stringify({
      ...registry.items[1],
      files: [{ ...registry.items[1].files[0], content: "[]\n" }],
    })}\n`,
  );
  writeFileSync(join(root, "public/r/index.json"), "{}\n");
  writeFileSync(join(root, "public/r/registry.json"), `${JSON.stringify(registry)}\n`);

  const complete = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(complete.status, 0, complete.stderr);
  assert.match(complete.stdout, /全 item が public\/r に生成されている/);

  rmSync(join(root, "public/r/index.json"));
  const missingIndex = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(missingIndex.status, 1);
  assert.match(missingIndex.stdout, /未生成: index/);
  writeFileSync(join(root, "public/r/index.json"), "{}\n");

  rmSync(join(root, "public/r/registry.json"));
  const missingRegistry = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(missingRegistry.status, 1);
  assert.match(missingRegistry.stdout, /未生成: registry/);
  writeFileSync(join(root, "public/r/registry.json"), `${JSON.stringify(registry)}\n`);

  writeFileSync(join(root, "public/r/retired-item.json"), "{}\n");
  const retired = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(retired.status, 1);
  assert.match(retired.stdout, /予期しない生成物: retired-item/);
  rmSync(join(root, "public/r/retired-item.json"));

  rmSync(join(root, "public/r/dashboard-01.json"));
  const missing = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /未生成: dashboard-01/);
});
