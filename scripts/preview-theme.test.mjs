import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

async function loadPreviewTheme() {
  try {
    const source = await readFile(
      new URL("../src/previews/preview-theme.ts", import.meta.url),
      "utf8",
    );
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    return await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

test("html の class 初期値と変更を theme へ通知する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();
  assert.equal(typeof watchPreviewTheme, "function");

  let dark = false;
  const root = {
    classList: {
      contains: (name) => name === "dark" && dark,
    },
  };
  let observer;
  class TestObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observer = this;
    }

    observe(target, options) {
      this.target = target;
      this.options = options;
    }

    disconnect() {
      this.disconnected = true;
    }
  }

  const themes = [];
  const stop = watchPreviewTheme(root, (theme) => themes.push(theme), TestObserver);

  assert.deepEqual(themes, ["light"]);
  assert.equal(observer.target, root);
  assert.deepEqual(observer.options, { attributes: true, attributeFilter: ["class"] });

  dark = true;
  observer.callback();
  assert.deepEqual(themes, ["light", "dark"]);

  dark = false;
  observer.callback();
  assert.deepEqual(themes, ["light", "dark", "light"]);

  stop();
  assert.equal(observer.disconnected, true);
});
