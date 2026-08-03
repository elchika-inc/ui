import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
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

const createRoot = ({ classDark = false, dataTheme = "light" } = {}) => ({
  classList: {
    contains: (name) => name === "dark" && classDark,
  },
  getAttribute: (name) => (name === "data-theme" ? dataTheme : null),
});

class TestObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
    TestObserver.latest = this;
  }

  observe(target, options) {
    this.target = target;
    this.options = options;
  }

  disconnect() {
    this.disconnected = true;
  }
}

test("light の class と data-theme が一致すると通知する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();
  assert.equal(typeof watchPreviewTheme, "function");
  const themes = [];

  const stop = watchPreviewTheme(createRoot(), (theme) => themes.push(theme), TestObserver);

  assert.deepEqual(themes, ["light"]);
  assert.deepEqual(TestObserver.latest.options, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  stop();
  assert.equal(TestObserver.latest.disconnected, true);
});

test("dark の class と data-theme が一致すると通知する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();
  const themes = [];

  watchPreviewTheme(
    createRoot({ classDark: true, dataTheme: "dark" }),
    (theme) => themes.push(theme),
    TestObserver,
  );

  assert.deepEqual(themes, ["dark"]);
});

test("dark class だけなら例外へ surface する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();

  assert.throws(
    () =>
      watchPreviewTheme(
        createRoot({ classDark: true, dataTheme: null }),
        () => assert.fail("不一致を theme として通知してはならない"),
        TestObserver,
      ),
    /class と data-theme が不一致/,
  );
});

test("dark data-theme だけなら例外へ surface する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();

  assert.throws(
    () =>
      watchPreviewTheme(
        createRoot({ classDark: false, dataTheme: "dark" }),
        () => assert.fail("不一致を theme として通知してはならない"),
        TestObserver,
      ),
    /class と data-theme が不一致/,
  );
});

test("未知の data-theme は例外へ surface する", async () => {
  const { watchPreviewTheme } = await loadPreviewTheme();

  assert.throws(
    () => watchPreviewTheme(createRoot({ dataTheme: "sepia" }), () => {}, TestObserver),
    /未知の data-theme/,
  );
});

test("全 isolated preview route は class と data-theme を同期する", async () => {
  const routeRoot = new URL("../src/pages/preview/", import.meta.url);
  const routes = (await readdir(routeRoot)).filter((file) => file.endsWith(".astro"));
  assert.ok(routes.length > 0, "preview route が0件");

  for (const route of routes) {
    const source = await readFile(new URL(route, routeRoot), "utf8");
    const html = source.match(/<html\b[^>]*>/)?.[0];
    assert.ok(html, `${route}: html 要素が無い`);
    const dark = route.endsWith("-dark.astro");
    assert.match(html, new RegExp(`data-theme=["']${dark ? "dark" : "light"}["']`), route);
    if (dark) assert.match(html, /class=["'][^"']*\bdark\b[^"']*["']/, route);
    else assert.doesNotMatch(html, /class=["'][^"']*\bdark\b[^"']*["']/, route);
  }
});
