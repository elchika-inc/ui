import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const generatorUrl = new URL("./registry-index.mjs", import.meta.url);

const loadGenerator = async () => {
  assert.ok(existsSync(generatorUrl), "registry-index.mjs がまだ無い");
  return import(generatorUrl);
};

test("registry itemを上流互換の一覧要素へ変換する", async () => {
  const { createRegistryIndex } = await loadGenerator();

  const result = createRegistryIndex({
    items: [
      {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: "use-mobile",
        type: "registry:hook",
        title: "Use Mobile",
        description: "viewport hook",
        files: [
          { path: "src/hooks/use-mobile.ts", type: "registry:hook" },
          {
            path: "src/styles/global.css",
            type: "registry:file",
            target: "~/elchika-ui/tokens.css",
          },
        ],
        cssVars: { light: { background: "white" } },
      },
      {
        name: "chart",
        type: "registry:ui",
        files: [
          {
            path: "src/components/ui/chart.tsx",
            type: "registry:ui",
            content: "export const Chart = () => null",
          },
          { path: "src/components/ui/chart-style.ts", type: "registry:ui" },
          { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
        ],
        dependencies: ["recharts@3.8.0"],
        registryDependencies: ["@elchika/card"],
      },
    ],
  });

  assert.deepEqual(result, [
    {
      name: "chart",
      type: "registry:ui",
      files: [
        { path: "src/components/ui/chart.tsx", type: "registry:ui" },
        { path: "src/components/ui/chart-style.ts", type: "registry:ui" },
      ],
      dependencies: ["recharts@3.8.0"],
      registryDependencies: ["@elchika/card"],
    },
    {
      name: "use-mobile",
      type: "registry:hook",
      files: [{ path: "src/hooks/use-mobile.ts", type: "registry:hook" }],
    },
  ]);
});

test("registry itemが0件なら空走として停止する", async () => {
  const { createRegistryIndex } = await loadGenerator();

  assert.throws(() => createRegistryIndex({ items: [] }), /registry itemが0件/);
});

test("registry item名が重複していれば停止する", async () => {
  const { createRegistryIndex } = await loadGenerator();
  const duplicate = {
    name: "button",
    type: "registry:ui",
    files: [{ path: "src/components/ui/button.tsx", type: "registry:ui" }],
  };

  assert.throws(
    () => createRegistryIndex({ items: [duplicate, { ...duplicate }] }),
    /button: item名が重複/,
  );
});

test("上流indexに無いitemとfileのキーを拒否する", async () => {
  const { checkRegistryIndex } = await loadGenerator();

  assert.deepEqual(
    checkRegistryIndex([
      {
        name: "button",
        type: "registry:ui",
        title: "Button",
        files: [
          {
            path: "src/components/ui/button.tsx",
            type: "registry:ui",
            target: "~/button.tsx",
          },
        ],
      },
    ]),
    ["button: 上流indexに無いキー title", "button: filesに上流indexに無いキー target"],
  );
});

test("一覧に必須のname・type・filesが欠けたitemを拒否する", async () => {
  const { checkRegistryIndex } = await loadGenerator();

  assert.deepEqual(checkRegistryIndex([{ name: "", type: "", files: [] }]), [
    "index item 1: nameが無い",
    "index item 1: typeが無い",
    "index item 1: filesが0件",
  ]);
});

test("CLIがregistry.jsonからindex.jsonを生成する", (t) => {
  const root = mkdtempSync(join(tmpdir(), "registry-index-"));
  t.after(() => import("node:fs").then(({ rmSync }) => rmSync(root, { recursive: true })));
  const source = join(root, "registry.json");
  const output = join(root, "public/r/index.json");
  writeFileSync(
    source,
    JSON.stringify({
      items: [
        {
          name: "button",
          type: "registry:ui",
          files: [
            { path: "src/components/ui/button.tsx", type: "registry:ui" },
            { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
          ],
        },
      ],
    }),
  );

  execFileSync(process.execPath, [fileURLToPath(generatorUrl), source, output]);

  assert.deepEqual(JSON.parse(readFileSync(output, "utf8")), [
    {
      name: "button",
      type: "registry:ui",
      files: [{ path: "src/components/ui/button.tsx", type: "registry:ui" }],
    },
  ]);
});
