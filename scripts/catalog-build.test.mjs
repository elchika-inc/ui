import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

before(() => {
  for (const directory of ["catalog", "previews", "site"]) {
    const staleDirectory = join(root, "lib", directory);
    mkdirSync(staleDirectory, { recursive: true });
    writeFileSync(join(staleDirectory, "stale.d.ts"), "export type Stale = true;\n");
  }
  writeFileSync(join(root, "public/r/index.json"), '{"stale":true}\n');
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "pipe" });
});

const previewNames = () => {
  const names = readdirSync(join(root, "src/previews"))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort();
  assert.notEqual(names.length, 0, "preview scan が空走している");
  return names;
};

const builtPage = (route) => {
  const path = join(root, "dist", route, "index.html");
  assert.ok(existsSync(path), `/${route}/ の build 出力が無い`);
  return readFileSync(path, "utf8");
};

test("light / dark catalog が全 preview を単一 island に描画する", () => {
  const previews = previewNames();

  for (const route of ["catalog", "catalog-dark"]) {
    const html = builtPage(route);
    const renderedPreviews = [...html.matchAll(/data-catalog-preview="([^"]+)"/g)]
      .map((match) => match[1])
      .sort();
    assert.deepEqual(renderedPreviews, previews, `${route}: preview scan と描画対象が一致する`);
    assert.equal(html.match(/<astro-island\b/g)?.length, 1, `${route}: island は1個`);
    assert.match(html, /data-slot="dialog-trigger"/);
    assert.doesNotMatch(html, /data-slot="dialog-content"/);
  }

  assert.match(builtPage("catalog-dark"), /<html[^>]*class="dark"/);
});

test("index と個別 route が全 preview のcomponentページを列挙する", () => {
  const html = builtPage("");
  assert.match(html, /href="#main-content"/);
  assert.match(html, /<main[^>]*id="main-content"/);

  for (const name of previewNames()) {
    assert.match(html, new RegExp(`href="/components/${name}/"`), `${name}: component link`);
    const componentHtml = builtPage(`components/${name}`);
    assert.match(componentHtml, /href="#main-content"/);
    assert.match(componentHtml, /<main[^>]*id="main-content"/);
    assert.match(componentHtml, new RegExp(`data-component-preview="${name}"`));
    assert.match(componentHtml, new RegExp(`aria-current="page"[^>]*href="/components/${name}/"`));
    assert.match(
      componentHtml,
      new RegExp(`npx shadcn@latest add https://ui\\.elchika\\.dev/r/${name}\\.json`),
    );
    assert.match(componentHtml, new RegExp(`npx shadcn@latest add @elchika/${name}`));
    assert.match(componentHtml, /Props一覧は次段で追加します/);
  }

  for (const name of previewNames()) {
    builtPage(`preview/${name}`);
    builtPage(`preview/${name}-dark`);
  }
});

test("library build が site 専用 declaration を残さない", () => {
  for (const directory of ["catalog", "previews", "site"]) {
    const path = join(root, "lib", directory);
    const declarations = existsSync(path)
      ? readdirSync(path, { recursive: true }).filter((file) => file.endsWith(".d.ts"))
      : [];
    assert.deepEqual(declarations, [], `${directory}: site 専用 declaration が残っている`);
  }
});

test("registry buildがstaleなindexを全itemの一覧へ置換する", () => {
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const index = JSON.parse(readFileSync(join(root, "public/r/index.json"), "utf8"));
  assert.ok(Array.isArray(index), "index.jsonは配列");
  assert.notEqual(index.length, 0, "index走査が空走している");
  assert.deepEqual(
    index.map(({ name }) => name),
    registry.items.map(({ name }) => name).sort((a, b) => a.localeCompare(b)),
  );
});
