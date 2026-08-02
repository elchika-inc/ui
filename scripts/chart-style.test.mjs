import assert from "node:assert/strict";
import { test } from "node:test";

const loadSerializer = async () => {
  try {
    return await import("../src/components/ui/chart-style.ts");
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
