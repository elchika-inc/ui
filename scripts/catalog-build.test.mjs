import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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
    assert.match(componentHtml, /プレビューを読み込む/);
    assert.doesNotMatch(componentHtml, /<iframe\b/, `${name}: previewを初期mountしない`);
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

test("トップとcomponentページが同じdocs shellとサイドバー導線を使う", () => {
  const homeHtml = builtPage("");
  const componentHtml = builtPage("components/button");

  for (const html of [homeHtml, componentHtml]) {
    assert.match(html, /data-docs-shell="true"/);
    assert.match(html, /aria-label="ドキュメントナビゲーション"/);
    assert.match(html, /href="\/"[^>]*><span>はじめに<\/span>/);
  }

  assert.match(homeHtml, /aria-current="page"[^>]*href="\/"/);
  assert.doesNotMatch(componentHtml, /aria-current="page"[^>]*href="\/"/);
});

test("トップがLP要素なしで3経路とtoken置換を順に案内する", () => {
  const html = builtPage("");
  const sections = [
    "elchika-inc/ui",
    "導入手順",
    "1. 直接 URL",
    "2. @elchika 名前空間",
    "3. shadcn MCP",
    "トークン置換の注意",
  ];

  let previousIndex = -1;
  for (const section of sections) {
    const index = html.indexOf(section);
    assert.ok(index > previousIndex, `${section}: 文書順序が正しい`);
    previousIndex = index;
  }

  assert.match(html, /Base UI[^<]*Tailwind CSS v4/);
  assert.match(html, /shadcn registry[^<]*ソース/);
  assert.match(html, /npx shadcn@latest add https:\/\/ui\.elchika\.dev\/r\/button\.json/);
  assert.match(html, /npx shadcn@latest add @elchika\/button/);
  assert.match(html, /npx shadcn@latest mcp init --client claude/);
  assert.match(html, /add するたびに[^<]*再削除/);
  assert.match(html, /href="\/components\/button\/"/);
  assert.doesNotMatch(html, /Shared interface registry/i);
  assert.doesNotMatch(html, /Components を見る/);
  assert.doesNotMatch(html, />Installation</);
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

test("registry index生成がstaleなindexを全itemの一覧へ置換する", (t) => {
  const generatedRoot = mkdtempSync(join(tmpdir(), "elchika-catalog-registry-"));
  t.after(() => rmSync(generatedRoot, { recursive: true, force: true }));
  const indexPath = join(generatedRoot, "public/r/index.json");
  mkdirSync(dirname(indexPath), { recursive: true });
  writeFileSync(indexPath, '{"stale":true}\n');
  execFileSync(
    "node",
    [join(root, "scripts/registry-index.mjs"), join(root, "registry.json"), indexPath],
    { cwd: root, stdio: "pipe" },
  );

  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  assert.ok(Array.isArray(index), "index.jsonは配列");
  assert.notEqual(index.length, 0, "index走査が空走している");
  assert.deepEqual(
    index.map(({ name }) => name),
    registry.items.map(({ name }) => name).sort((a, b) => a.localeCompare(b)),
  );
});
