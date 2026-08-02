import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { cleanLib, rewriteDeclarationSource, rewriteDeclarationTree } from "./lib-build.mjs";

const withTempDir = async (run) => {
  const root = await mkdtemp(path.join(tmpdir(), "ui-lib-build-"));
  try {
    await run(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
};

test("d.tsのmodule specifierだけをlib内の相対pathへ書き換える", () => {
  const libDir = "/repo/lib";
  const declarationPath = "/repo/lib/components/ui/consumer.d.ts";
  const source = [
    'import { Button } from "@/components/ui/button";',
    'export type { InputProps } from "@/components/ui/input";',
    'export type MobileHook = import("@/hooks/use-mobile").UseMobile;',
    'export type Literal = "@/components/ui/not-a-module";',
    '// import { Fake } from "@/components/ui/comment";',
    "",
  ].join("\n");

  assert.equal(
    rewriteDeclarationSource({ declarationPath, libDir, source }),
    [
      'import { Button } from "./button.js";',
      'export type { InputProps } from "./input.js";',
      'export type MobileHook = import("../../hooks/use-mobile.js").UseMobile;',
      'export type Literal = "@/components/ui/not-a-module";',
      '// import { Fake } from "@/components/ui/comment";',
      "",
    ].join("\n"),
  );
});

test("lib外へ逸脱するaliasはfail-closedにする", () => {
  assert.throws(
    () =>
      rewriteDeclarationSource({
        declarationPath: "/repo/lib/components/ui/consumer.d.ts",
        libDir: "/repo/lib",
        source: 'import type { Secret } from "@/../secret";\n',
      }),
    /lib外/,
  );
});

test("構文不正なdeclarationは書き換えずfail-closedにする", () => {
  assert.throws(
    () =>
      rewriteDeclarationSource({
        declarationPath: "/repo/lib/broken.d.ts",
        libDir: "/repo/lib",
        source: 'import { Button from "@/components/ui/button";\n',
      }),
    /parse/,
  );
});

test("declaration treeを再帰走査しaliasを残さない", async () => {
  await withTempDir(async (root) => {
    const libDir = path.join(root, "lib");
    const declarationPath = path.join(libDir, "components/ui/consumer.d.ts");
    await mkdir(path.dirname(declarationPath), { recursive: true });
    await writeFile(declarationPath, 'import { Button } from "@/components/ui/button";\n');
    await writeFile(path.join(libDir, "index.js"), "export {};\n");

    await rewriteDeclarationTree(libDir);

    assert.equal(
      await readFile(declarationPath, "utf8"),
      'import { Button } from "./button.js";\n',
    );
    assert.equal(await readFile(path.join(libDir, "index.js"), "utf8"), "export {};\n");
  });
});

test("cleanは残存libを再帰削除し未作成でも成功する", async () => {
  await withTempDir(async (root) => {
    const libDir = path.join(root, "lib");
    await mkdir(libDir);
    await writeFile(path.join(libDir, "stale.d.ts"), "export {};\n");

    await cleanLib(libDir);
    await cleanLib(libDir);

    await assert.rejects(readFile(path.join(libDir, "stale.d.ts"), "utf8"), /ENOENT/);
  });
});
