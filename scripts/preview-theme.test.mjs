import assert from "node:assert/strict";
import { test } from "node:test";

async function loadPreviewTheme() {
  try {
    return await import("../src/previews/preview-theme.ts");
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") return {};
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
