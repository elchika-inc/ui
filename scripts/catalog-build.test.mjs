import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

before(() => {
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "pipe" });
});

const componentNames = () =>
  readdirSync(join(root, "src/components/ui"))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort();

const builtPage = (route) => {
  const path = join(root, "dist", route, "index.html");
  assert.ok(existsSync(path), `/${route}/ の build 出力が無い`);
  return readFileSync(path, "utf8");
};

test("light / dark catalog が全 component を単一 island に描画する", () => {
  const components = componentNames();

  for (const route of ["catalog", "catalog-dark"]) {
    const html = builtPage(route);
    for (const name of components) {
      assert.match(html, new RegExp(`data-catalog-preview="${name}"`), `${route}: ${name}`);
    }
    assert.equal(html.match(/<astro-island\b/g)?.length, 1, `${route}: island は1個`);
    assert.match(html, /data-slot="dialog-trigger"/);
    assert.doesNotMatch(html, /data-slot="dialog-content"/);
  }

  assert.match(builtPage("catalog-dark"), /<html[^>]*class="dark"/);
});

test("index が全 component の light / dark route を列挙する", () => {
  const html = builtPage("");

  for (const name of componentNames()) {
    assert.match(html, new RegExp(`href="/preview/${name}/"`), `${name}: light link`);
    assert.match(html, new RegExp(`href="/preview/${name}-dark/"`), `${name}: dark link`);
  }
});
