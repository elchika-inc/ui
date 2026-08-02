import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const loadSerializer = async () => {
  try {
    const path = new URL("../src/components/ui/chart-style.ts", import.meta.url);
    const source = await readFile(path, "utf8");
    const { diagnostics, outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: path.pathname,
      reportDiagnostics: true,
    });
    const errors = diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.deepEqual(errors, [], "Chart CSS serializerのtranspileに失敗した");
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
    return await import(moduleUrl);
  } catch (error) {
    assert.fail(`Chart CSS serializerが読み込めない: ${error}`);
  }
};

test("Chart CSS変数は安全なkeyとcolorを保持する", async () => {
  const module = await loadSerializer();
  assert.equal(typeof module.serializeChartVariable, "function");
  assert.equal(
    module.serializeChartVariable("desktop", "var(--chart-1)"),
    "  --color-desktop: var(--chart-1);",
  );
});

test("Chart CSS変数はrule境界を壊すkeyとcolorを拒否する", async () => {
  const module = await loadSerializer();
  const payload = 'red; } body { background-image: url("https://attacker.invalid/leak") }';
  assert.throws(() => module.serializeChartVariable("desktop; color", "red"), /key/);
  assert.throws(() => module.serializeChartVariable("desktop", payload), /color/);
  assert.throws(
    () => module.serializeChartVariable("desktop", 'url("https://attacker.invalid/pixel")'),
    /color/,
  );
});
