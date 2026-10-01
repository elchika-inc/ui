import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const checkerPath = new URL("./check-block-icons.mjs", import.meta.url);

async function loadChecker() {
  assert.ok(existsSync(checkerPath), "check-block-icons.mjs がまだ無い");
  return import(checkerPath);
}

const upstreamItem = (...files) => ({
  files: files.map(([path, content]) => ({ path, type: "registry:component", content })),
});

test("icon 監査対象は実在 directory のうち上流移植品だけから動的に導出する", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "check-block-icons-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src/blocks/sidebar-01"), { recursive: true });
  mkdirSync(join(root, "src/blocks/dashboard-01"));
  mkdirSync(join(root, "src/blocks/dashboard-table"));
  writeFileSync(join(root, "src/blocks/not-a-block.tsx"), "export {}\n");
  writeFileSync(
    join(root, "provenance.json"),
    JSON.stringify({
      blocks: {
        "sidebar-01": { origin: "shadcn/ui registry" },
        "dashboard-01": { origin: "shadcn/ui registry" },
        "dashboard-table": { origin: "elchika original" },
      },
    }),
  );

  const { listIconAuditBlockNames } = await loadChecker();

  assert.deepEqual(listIconAuditBlockNames(root), ["dashboard-01", "sidebar-01"]);
});

test("icon 監査は未知または欠落した origin を fail-closed にする", async (context) => {
  for (const origin of ["unknown-source", undefined]) {
    const root = mkdtempSync(join(tmpdir(), "check-block-icons-origin-"));
    context.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, "src/blocks/example-01"), { recursive: true });
    writeFileSync(
      join(root, "provenance.json"),
      JSON.stringify({
        blocks: {
          "example-01": origin === undefined ? {} : { origin },
        },
      }),
    );
    const { listIconAuditBlockNames } = await loadChecker();

    assert.throws(
      () => listIconAuditBlockNames(root),
      new RegExp(`example-01: icon 監査の origin が未対応: ${String(origin)}`),
    );
  }
});

test("上流 JSON から件数に依存せず lucide の期待集合を導出する", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "login-04",
      item: upstreamItem([
        "registry/base-nova/blocks/login-04/components/login-form.tsx",
        "export function LoginForm() { return <form /> }",
      ]),
    },
    {
      name: "login-05",
      item: upstreamItem([
        "registry/base-nova/blocks/login-05/components/login-form.tsx",
        `
          export function LoginForm() {
            return <>
              <IconPlaceholder lucide="GalleryVerticalEndIcon" className="size-6" />
              <IconPlaceholder
                tabler="IconLayoutRows"
                lucide="GalleryVerticalEndIcon"
              />
              <IconPlaceholder lucide="BadgeIcon" />
            </>
          }
        `,
      ]),
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, {
    blocks: {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          occurrences: [
            { icon: "GalleryVerticalEndIcon", attributes: ['className="size-6"'] },
            { icon: "GalleryVerticalEndIcon", attributes: [] },
            { icon: "BadgeIcon", attributes: [] },
          ],
          orderedOccurrences: [
            { icon: "GalleryVerticalEndIcon", attributes: ['className="size-6"'] },
            { icon: "GalleryVerticalEndIcon", attributes: [] },
            { icon: "BadgeIcon", attributes: [] },
          ],
        },
      ],
    },
    previews: {},
  });
  assert.deepEqual(result.stats, {
    jsonCount: 2,
    blocksWithPlaceholders: 1,
    placeholderCount: 3,
    uniqueIconCount: 2,
    missingLucideCount: 0,
  });
});

test("lucide 属性が無い IconPlaceholder は fail-closed で問題にする", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "sidebar-01",
      item: upstreamItem([
        "registry/base-nova/blocks/sidebar-01/components/app-sidebar.tsx",
        `export const AppSidebar = () => <IconPlaceholder tabler="IconHome" />`,
      ]),
    },
  ]);

  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.deepEqual(result.problems, [
    "sidebar-01: registry/base-nova/blocks/sidebar-01/components/app-sidebar.tsx の IconPlaceholder #1 に lucide 属性が無い",
  ]);
  assert.equal(result.stats.missingLucideCount, 1);
});

test("dropped な registry:component の icon は生成物へ要求しない", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks(
    [
      {
        name: "dashboard-01",
        item: upstreamItem([
          "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
          '<IconPlaceholder lucide="GripVerticalIcon" />',
        ]),
      },
    ],
    {
      droppedUpstreamPathsByBlock: {
        "dashboard-01": [
          "apps/v4/registry/bases/base/blocks/dashboard-01/components/data-table.tsx",
        ],
      },
    },
  );

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.deepEqual(result.stats, {
    jsonCount: 1,
    blocksWithPlaceholders: 1,
    placeholderCount: 1,
    uniqueIconCount: 1,
    missingLucideCount: 0,
  });
});

test("dropped な registry:component でも lucide 属性の欠損は検出する", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks(
    [
      {
        name: "dashboard-01",
        item: upstreamItem([
          "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
          '<IconPlaceholder tabler="IconGripVertical" />',
        ]),
      },
    ],
    {
      droppedUpstreamPathsByBlock: {
        "dashboard-01": [
          "apps/v4/registry/bases/base/blocks/dashboard-01/components/data-table.tsx",
        ],
      },
    },
  );

  assert.deepEqual(result.problems, [
    "dashboard-01: registry/base-nova/blocks/dashboard-01/components/data-table.tsx の IconPlaceholder #1 に lucide 属性が無い",
  ]);
  assert.equal(result.stats.missingLucideCount, 1);
});

test("dropped path を上流 JSON へ照合できなければ fail-closed で問題にする", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const droppedPath =
    "apps/v4/registry/bases/base/blocks/dashboard-01/components/missing-table.tsx";
  const result = inspectUpstreamBlocks(
    [
      {
        name: "dashboard-01",
        item: upstreamItem([
          "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
          "export function DataTable() { return null }",
        ]),
      },
    ],
    { droppedUpstreamPathsByBlock: { "dashboard-01": [droppedPath] } },
  );

  assert.deepEqual(result.problems, [
    `dashboard-01: dropped file を上流 JSON へ対応付けられない: ${droppedPath}`,
  ]);
});

test("正しい相対 path でも dropped path の上流 prefix が不正なら fail-closed にする", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const droppedPath = "https://evil.invalid/blocks/dashboard-01/components/data-table.tsx";
  const result = inspectUpstreamBlocks(
    [
      {
        name: "dashboard-01",
        item: upstreamItem([
          "registry/base-nova/blocks/dashboard-01/components/data-table.tsx",
          '<IconPlaceholder lucide="GripVerticalIcon" />',
        ]),
      },
    ],
    { droppedUpstreamPathsByBlock: { "dashboard-01": [droppedPath] } },
  );

  assert.deepEqual(result.problems, [
    `dashboard-01: dropped file を上流 JSON へ対応付けられない: ${droppedPath}`,
  ]);
  assert.deepEqual(result.expectedByTarget.blocks["dashboard-01"], [
    {
      path: "src/blocks/dashboard-01/components/data-table.tsx",
      occurrences: [{ icon: "GripVerticalIcon", attributes: [] }],
      orderedOccurrences: [{ icon: "GripVerticalIcon", attributes: [] }],
    },
  ]);
});

test("registry:page の lucide 期待集合は preview 側へ分離する", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks(
    [
      {
        name: "login-02",
        item: {
          files: [
            {
              path: "registry/base-nova/blocks/login-02/page.tsx",
              type: "registry:page",
              content: '<IconPlaceholder lucide="GalleryVerticalEndIcon" />',
            },
            {
              path: "registry/base-nova/blocks/login-02/components/login-form.tsx",
              type: "registry:component",
              content: '<IconPlaceholder lucide="BadgeIcon" />',
            },
          ],
        },
      },
    ],
    {
      droppedUpstreamPathsByBlock: {
        "login-02": ["apps/v4/registry/bases/base/blocks/login-02/page.tsx"],
      },
    },
  );

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, {
    blocks: {
      "login-02": [
        {
          path: "src/blocks/login-02/components/login-form.tsx",
          occurrences: [{ icon: "BadgeIcon", attributes: [] }],
          orderedOccurrences: [{ icon: "BadgeIcon", attributes: [] }],
        },
      ],
    },
    previews: {
      "login-02": [
        {
          path: "src/previews/login-02.tsx",
          occurrences: [{ icon: "GalleryVerticalEndIcon", attributes: [] }],
          orderedOccurrences: [{ icon: "GalleryVerticalEndIcon", attributes: [] }],
        },
      ],
    },
  });
});

test("上流 lucide 値が import alias と必要回数の JSX 使用へ展開されていれば通る", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "login-05": {
        BadgeIcon: 1,
        GalleryVerticalEndIcon: 2,
      },
    },
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          source: `
            import {
              BadgeIcon,
              GalleryVerticalEndIcon as BrandIcon,
            } from "lucide-react"
            export const LoginForm = () => (
              <><BrandIcon /><BrandIcon /><BadgeIcon /></>
            )
          `,
        },
      ],
    },
  );

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.stats, {
    blocksChecked: 1,
    expectedOccurrences: 3,
    matchedOccurrences: 3,
  });
});

test("実アイコンの named import が無ければ検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "login-05": { GalleryVerticalEndIcon: 1 } },
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          source: "export const LoginForm = () => <GalleryVerticalEndIcon />",
        },
      ],
    },
  );

  assert.deepEqual(result.problems, [
    "login-05: GalleryVerticalEndIcon が lucide-react から named import されていない",
  ]);
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("実アイコンの JSX 使用回数が上流の期待回数より少なければ検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "sidebar-01": { SearchIcon: 2 } },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/search-form.tsx",
          source: `
            import { SearchIcon } from "lucide-react"
            export const SearchForm = () => <SearchIcon />
          `,
        },
      ],
    },
  );

  assert.deepEqual(result.problems, [
    "sidebar-01: SearchIcon の JSX 使用が不足している（期待 2 / 実測 1）",
  ]);
  assert.equal(result.stats.matchedOccurrences, 1);
});

test("期待対象 block の生成物が無ければ空走せず検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons({ "sidebar-02": { HomeIcon: 1 } }, {});

  assert.deepEqual(result.problems, ["sidebar-02: 生成物が無い"]);
  assert.equal(result.stats.blocksChecked, 1);
});

test("別ファイルの同名 import alias は期待アイコンを横取りできない", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/search-form.tsx",
          occurrences: [{ icon: "SearchIcon", attributes: [] }],
        },
      ],
    },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/search-form.tsx",
          source: 'import { SearchIcon as Icon } from "lucide-react"; export const Search = Icon;',
        },
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          source:
            'import { HomeIcon as Icon } from "lucide-react"; export const Nav = () => <Icon />;',
        },
      ],
    },
  );

  assert.ok(result.problems.some((problem) => problem.includes("SearchIcon")));
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("IconPlaceholder から引き継ぐ属性が欠けていれば検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          occurrences: [
            {
              icon: "GalleryVerticalEndIcon",
              attributes: ['className="size-6"', "strokeWidth={1}"],
            },
          ],
        },
      ],
    },
    {
      "login-05": [
        {
          path: "src/blocks/login-05/components/login-form.tsx",
          source:
            'import { GalleryVerticalEndIcon } from "lucide-react"; export const Logo = () => <GalleryVerticalEndIcon className="size-6" />;',
        },
      ],
    },
  );

  assert.ok(result.problems.some((problem) => problem.includes("属性")));
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("上流に既存の同一アイコンがあっても未展開 marker の身代わりにしない", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          baselineOccurrences: [{ icon: "SearchIcon", attributes: [] }],
          occurrences: [{ icon: "SearchIcon", attributes: [] }],
        },
      ],
    },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          source:
            'import { SearchIcon } from "lucide-react"; export const Nav = () => <SearchIcon />;',
        },
      ],
    },
  );

  assert.ok(result.problems.some((problem) => problem.includes("SearchIcon")));
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("既存アイコンと marker 展開結果の属性を位置交換しても一致扱いにしない", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          baselineOccurrences: [{ icon: "SearchIcon", attributes: ['className="base"'] }],
          occurrences: [{ icon: "SearchIcon", attributes: ['className="marker"'] }],
          orderedOccurrences: [
            { icon: "SearchIcon", attributes: ['className="base"'] },
            { icon: "SearchIcon", attributes: ['className="marker"'] },
          ],
        },
      ],
    },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          source: `
            import { SearchIcon } from "lucide-react"
            export const Nav = () => <><SearchIcon className="marker" /><SearchIcon className="base" /></>
          `,
        },
      ],
    },
  );

  assert.ok(result.problems.some((problem) => problem.includes("位置")));
  assert.equal(result.stats.matchedOccurrences, 0);
});

test("生成物に IconPlaceholder が残っていれば独立に検出する", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          occurrences: [{ icon: "SearchIcon", attributes: [] }],
        },
      ],
    },
    {
      "sidebar-01": [
        {
          path: "src/blocks/sidebar-01/components/nav-main.tsx",
          source: `
            import { SearchIcon } from "lucide-react"
            export const Nav = () => <><SearchIcon /><IconPlaceholder lucide="SearchIcon" /></>
          `,
        },
      ],
    },
  );

  assert.ok(result.problems.some((problem) => problem.includes("IconPlaceholder が残っている")));
});

const blockFile = (name, relativePath, content) => ({
  path: `registry/base-nova/blocks/${name}/${relativePath}`,
  type: "registry:component",
  content,
});

test("上流 JSON が 0 件のとき、問題も期待値も無く、stats はすべて 0 になる", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();

  assert.deepEqual(inspectUpstreamBlocks([]), {
    problems: [],
    expectedByTarget: { blocks: {}, previews: {} },
    stats: {
      jsonCount: 0,
      blocksWithPlaceholders: 0,
      placeholderCount: 0,
      uniqueIconCount: 0,
      missingLucideCount: 0,
    },
  });
});

test("上流 item の files が配列でないとき、その block を問題にして飛ばし、JSON の件数には数える", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    { name: "a-01", item: {} },
    { name: "b-01", item: undefined },
  ]);

  assert.deepEqual(result.problems, [
    "a-01: 上流 JSON の files が配列でない",
    "b-01: 上流 JSON の files が配列でない",
  ]);
  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.equal(result.stats.jsonCount, 2);
});

test("content が文字列でない上流ファイルは、placeholder の検査から外す", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [{ path: "registry/base-nova/blocks/x-01/a.tsx", type: "registry:component" }],
      },
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.equal(result.stats.placeholderCount, 0);
  assert.equal(result.stats.blocksWithPlaceholders, 0);
});

test("path が文字列でない上流ファイルは、<block>:unknown.tsx の名前で問題にし、生成物へ対応付けない", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          {
            type: "registry:component",
            content: '<><IconPlaceholder lucide="AIcon" /><IconPlaceholder tabler="IconB" /></>',
          },
        ],
      },
    },
  ]);

  assert.deepEqual(result.problems, [
    "x-01: x-01:unknown.tsx を生成物 path へ対応付けられない",
    "x-01: x-01:unknown.tsx の IconPlaceholder #2 に lucide 属性が無い",
  ]);
  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.deepEqual(result.stats, {
    jsonCount: 1,
    blocksWithPlaceholders: 1,
    placeholderCount: 2,
    uniqueIconCount: 1,
    missingLucideCount: 1,
  });
});

test("別 block の prefix を持つ上流ファイルの placeholder は、生成物 path へ対応付けられない問題にし、アイコンの種類には数える", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [blockFile("other-01", "components/a.tsx", '<IconPlaceholder lucide="AIcon" />')],
      },
    },
  ]);

  assert.deepEqual(result.problems, [
    "x-01: registry/base-nova/blocks/other-01/components/a.tsx を生成物 path へ対応付けられない",
  ]);
  assert.deepEqual(result.expectedByTarget, { blocks: {}, previews: {} });
  assert.equal(result.stats.uniqueIconCount, 1);
});

test("lucide 欠損の番号はファイルの中の placeholder の順で数え、ファイルが変わると 1 から数え直す", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          blockFile(
            "x-01",
            "a.tsx",
            '<><IconPlaceholder tabler="IconA" /><IconPlaceholder lucide="AIcon" /><IconPlaceholder tabler="IconB" /></>',
          ),
          blockFile("x-01", "b.tsx", '<IconPlaceholder tabler="IconC" />'),
        ],
      },
    },
  ]);

  assert.deepEqual(result.problems, [
    "x-01: registry/base-nova/blocks/x-01/a.tsx の IconPlaceholder #1 に lucide 属性が無い",
    "x-01: registry/base-nova/blocks/x-01/a.tsx の IconPlaceholder #3 に lucide 属性が無い",
    "x-01: registry/base-nova/blocks/x-01/b.tsx の IconPlaceholder #1 に lucide 属性が無い",
  ]);
  assert.deepEqual(result.stats, {
    jsonCount: 1,
    blocksWithPlaceholders: 1,
    placeholderCount: 4,
    uniqueIconCount: 1,
    missingLucideCount: 3,
  });
});

test("開始タグと終了タグを持つ IconPlaceholder も、自己終了タグと同じく期待値に入れる", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [blockFile("x-01", "a.tsx", '<IconPlaceholder lucide="AIcon">x</IconPlaceholder>')],
      },
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget.blocks["x-01"], [
    {
      path: "src/blocks/x-01/a.tsx",
      occurrences: [{ icon: "AIcon", attributes: [] }],
      orderedOccurrences: [{ icon: "AIcon", attributes: [] }],
    },
  ]);
});

test('lucide は文字列リテラルと {"…"} の形を受け付け、空文字と式は欠損として扱う', async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          blockFile(
            "x-01",
            "a.tsx",
            '<><IconPlaceholder lucide={"AIcon"} /><IconPlaceholder lucide="" /><IconPlaceholder lucide={iconName} /></>',
          ),
        ],
      },
    },
  ]);

  assert.deepEqual(result.problems, [
    "x-01: registry/base-nova/blocks/x-01/a.tsx の IconPlaceholder #2 に lucide 属性が無い",
    "x-01: registry/base-nova/blocks/x-01/a.tsx の IconPlaceholder #3 に lucide 属性が無い",
  ]);
  assert.deepEqual(result.expectedByTarget.blocks["x-01"][0].occurrences, [
    { icon: "AIcon", attributes: [] },
  ]);
});

test("上流ファイルが既に lucide-react を使っているとき、既存の使用を baseline に分け、ordered は文書順に並べる", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          blockFile(
            "x-01",
            "a.tsx",
            'import { SearchIcon as Find } from "lucide-react"\nexport const A = () => <><Find className="s" /><IconPlaceholder lucide="AIcon" /><Find /></>',
          ),
        ],
      },
    },
  ]);

  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.expectedByTarget.blocks["x-01"], [
    {
      path: "src/blocks/x-01/a.tsx",
      occurrences: [{ icon: "AIcon", attributes: [] }],
      baselineOccurrences: [
        { icon: "SearchIcon", attributes: ['className="s"'] },
        { icon: "SearchIcon", attributes: [] },
      ],
      orderedOccurrences: [
        { icon: "SearchIcon", attributes: ['className="s"'] },
        { icon: "AIcon", attributes: [] },
        { icon: "SearchIcon", attributes: [] },
      ],
    },
  ]);
  assert.equal(result.stats.uniqueIconCount, 1);
});

test("IconPlaceholder の属性は、アイコンライブラリの属性を除き、spread と式を正規化して並べ替えて引き継ぐ", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const result = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          blockFile(
            "x-01",
            "a.tsx",
            '<IconPlaceholder lucide="AIcon" tabler="IconA" className={cn("a", b)} {...props} aria-hidden data-x="1" />',
          ),
        ],
      },
    },
  ]);

  assert.deepEqual(result.expectedByTarget.blocks["x-01"][0].occurrences, [
    {
      icon: "AIcon",
      attributes: ["aria-hidden", 'className={cn("a", b)}', 'data-x="1"', "{...props}"],
    },
  ]);
});

// 次の 1 件は既知のバグを含む現在の振る舞いを固定する（PR 本文「見つけたバグ」参照）。
test("現状: 同じ block に registry:page が 2 つあると、occurrences は足し合わせ、ordered は最後の page で上書きする", async () => {
  const { inspectUpstreamBlocks } = await loadChecker();
  const page = (path, content) => ({
    path: `registry/base-nova/blocks/x-01/${path}`,
    type: "registry:page",
    content,
  });
  const bothWithIcons = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          page("page.tsx", '<IconPlaceholder lucide="AIcon" />'),
          page("other-page.tsx", '<IconPlaceholder lucide="BIcon" />'),
        ],
      },
    },
  ]);
  const secondWithoutIcons = inspectUpstreamBlocks([
    {
      name: "x-01",
      item: {
        files: [
          page("page.tsx", '<IconPlaceholder lucide="AIcon" />'),
          page("other-page.tsx", "export const P = () => null"),
        ],
      },
    },
  ]);

  assert.deepEqual(bothWithIcons.expectedByTarget.previews["x-01"], [
    {
      path: "src/previews/x-01.tsx",
      occurrences: [
        { icon: "AIcon", attributes: [] },
        { icon: "BIcon", attributes: [] },
      ],
      orderedOccurrences: [{ icon: "BIcon", attributes: [] }],
    },
  ]);
  assert.deepEqual(secondWithoutIcons.expectedByTarget.previews["x-01"], [
    {
      path: "src/previews/x-01.tsx",
      occurrences: [{ icon: "AIcon", attributes: [] }],
      orderedOccurrences: [],
    },
  ]);
});

const generatedPathA = "src/blocks/x-01/a.tsx";
const generated = (path, source) => ({ path, source });

test("期待対象の block が 0 件のとき、問題は無く、stats はすべて 0 になる", async () => {
  const { inspectGeneratedIcons } = await loadChecker();

  assert.deepEqual(inspectGeneratedIcons({}, {}), {
    problems: [],
    stats: { blocksChecked: 0, expectedOccurrences: 0, matchedOccurrences: 0 },
  });
});

test("生成物が空配列のとき、生成物が無い問題にし、期待数には数える", async () => {
  const { inspectGeneratedIcons } = await loadChecker();

  assert.deepEqual(inspectGeneratedIcons({ "x-01": { AIcon: 2 } }, { "x-01": [] }), {
    problems: ["x-01: 生成物が無い"],
    stats: { blocksChecked: 1, expectedOccurrences: 2, matchedOccurrences: 0 },
  });
});

test("期待した path の生成物が無いとき、その path を名指しして問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "x-01": [{ path: generatedPathA, occurrences: [{ icon: "AIcon", attributes: [] }] }] },
    {
      "x-01": [
        generated("src/blocks/x-01/b.tsx", 'import { AIcon } from "lucide-react"; <AIcon />'),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: ["x-01: src/blocks/x-01/a.tsx の生成物が無い"],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 0 },
  });
});

test("path 付きの期待で import が無いとき、期待した回数だけ path 付きで問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          occurrences: [
            { icon: "AIcon", attributes: [] },
            { icon: "AIcon", attributes: [] },
          ],
        },
      ],
    },
    { "x-01": [generated(generatedPathA, "export const A = () => <AIcon />")] },
  );

  assert.deepEqual(result, {
    problems: [
      "x-01: src/blocks/x-01/a.tsx の AIcon が lucide-react から named import されていない",
      "x-01: src/blocks/x-01/a.tsx の AIcon が lucide-react から named import されていない",
    ],
    stats: { blocksChecked: 1, expectedOccurrences: 2, matchedOccurrences: 0 },
  });
});

test("生成物に IconPlaceholder が残るとき、path 付きの期待は「<path> に」、旧形式は path なしで箇所数を問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const withPath = inspectGeneratedIcons(
    { "x-01": [{ path: generatedPathA, occurrences: [{ icon: "AIcon", attributes: [] }] }] },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon } from "lucide-react"; <><AIcon /><IconPlaceholder lucide="BIcon" /><IconPlaceholder /></>',
        ),
      ],
    },
  );
  const legacy = inspectGeneratedIcons(
    { "x-01": { AIcon: 1 } },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon } from "lucide-react"; <><AIcon /><IconPlaceholder lucide="BIcon" /></>',
        ),
      ],
    },
  );

  assert.deepEqual(withPath.problems, [
    "x-01: src/blocks/x-01/a.tsx に IconPlaceholder が残っている（2 箇所）",
  ]);
  assert.deepEqual(legacy.problems, ["x-01: IconPlaceholder が残っている（1 箇所）"]);
});

// 次の 1 件は既知のバグを含む現在の振る舞いを固定する（PR 本文「見つけたバグ」参照）。
test("現状: 順序なしの比較では、IconPlaceholder が残っていても一致数に数える", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "x-01": [{ path: generatedPathA, occurrences: [{ icon: "AIcon", attributes: [] }] }] },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon } from "lucide-react"; <><AIcon /><IconPlaceholder lucide="BIcon" /></>',
        ),
      ],
    },
  );

  assert.deepEqual(result.stats, {
    blocksChecked: 1,
    expectedOccurrences: 1,
    matchedOccurrences: 1,
  });
});

const orderedPair = [
  { icon: "AIcon", attributes: [] },
  { icon: "BIcon", attributes: ['className="b"'] },
];

test("順序付きの比較で実測が短いとき、最初に欠けた位置を「実測 なし」として問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        { path: generatedPathA, occurrences: [orderedPair[1]], orderedOccurrences: orderedPair },
      ],
    },
    {
      "x-01": [generated(generatedPathA, 'import { AIcon, BIcon } from "lucide-react"; <AIcon />')],
    },
  );

  assert.deepEqual(result, {
    problems: [
      'x-01: src/blocks/x-01/a.tsx の アイコン位置 #2 が一致しない（期待 BIcon className="b" / 実測 なし）',
    ],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 0 },
  });
});

test("順序付きの比較で実測が長いとき、余った位置を「期待 なし」として問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          occurrences: [orderedPair[0]],
          orderedOccurrences: [orderedPair[0]],
        },
      ],
    },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon, BIcon } from "lucide-react"; <><AIcon /><BIcon className="b" /></>',
        ),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: [
      'x-01: src/blocks/x-01/a.tsx の アイコン位置 #2 が一致しない（期待 なし / 実測 BIcon className="b"）',
    ],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 0 },
  });
});

test("順序付きの比較で並びが一致しても、IconPlaceholder が残るときは一致数に数えない", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          occurrences: [orderedPair[0]],
          orderedOccurrences: [orderedPair[0]],
        },
      ],
    },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon } from "lucide-react"; <><AIcon /><IconPlaceholder /></>',
        ),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: ["x-01: src/blocks/x-01/a.tsx に IconPlaceholder が残っている（1 箇所）"],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 0 },
  });
});

test("順序付きの比較で並びが一致したとき、occurrences の件数だけ一致数に数える", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          baselineOccurrences: [orderedPair[0]],
          occurrences: [orderedPair[1]],
          orderedOccurrences: orderedPair,
        },
      ],
    },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon, BIcon } from "lucide-react"; <><AIcon /><BIcon className="b" /></>',
        ),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: [],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 1 },
  });
});

test("順序なしの比較で同じアイコンの属性が違うとき、期待した属性（無ければ「属性なし」）を問題にする", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          occurrences: [
            { icon: "AIcon", attributes: ['className="a"'] },
            { icon: "BIcon", attributes: [] },
          ],
        },
      ],
    },
    {
      "x-01": [
        generated(
          generatedPathA,
          'import { AIcon, BIcon } from "lucide-react"; <><AIcon className="z" /><BIcon className="b" /></>',
        ),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: [
      'x-01: src/blocks/x-01/a.tsx の AIcon の属性が一致しない（期待 className="a"）',
      "x-01: src/blocks/x-01/a.tsx の BIcon の属性が一致しない（期待 属性なし）",
    ],
    stats: { blocksChecked: 1, expectedOccurrences: 2, matchedOccurrences: 0 },
  });
});

// 次の 1 件は既知のバグを含む現在の振る舞いを固定する（PR 本文「見つけたバグ」参照）。
test("現状: 順序なしの比較で不足を報告するとき、実測数は baseline を差し引く前の数になる", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    {
      "x-01": [
        {
          path: generatedPathA,
          baselineOccurrences: [{ icon: "AIcon", attributes: [] }],
          occurrences: [
            { icon: "AIcon", attributes: [] },
            { icon: "AIcon", attributes: [] },
          ],
        },
      ],
    },
    {
      "x-01": [
        generated(generatedPathA, 'import { AIcon } from "lucide-react"; <><AIcon /><AIcon /></>'),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: ["x-01: src/blocks/x-01/a.tsx の AIcon の JSX 使用が不足している（期待 2 / 実測 2）"],
    stats: { blocksChecked: 1, expectedOccurrences: 2, matchedOccurrences: 1 },
  });
});

test("path を指定した期待は、別ファイルにある同じアイコンの使用を数えない", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "x-01": [{ path: generatedPathA, occurrences: [{ icon: "AIcon", attributes: [] }] }] },
    {
      "x-01": [
        generated(generatedPathA, 'import { AIcon } from "lucide-react"; export const A = AIcon;'),
        generated("src/blocks/x-01/b.tsx", 'import { AIcon } from "lucide-react"; <AIcon />'),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: ["x-01: src/blocks/x-01/a.tsx の AIcon の JSX 使用が不足している（期待 1 / 実測 0）"],
    stats: { blocksChecked: 1, expectedOccurrences: 1, matchedOccurrences: 0 },
  });
});

test("複数 block の stats は、block 数・期待数・一致数をそれぞれ足し合わせる", async () => {
  const { inspectGeneratedIcons } = await loadChecker();
  const result = inspectGeneratedIcons(
    { "x-01": { AIcon: 1 }, "y-01": { BIcon: 2 } },
    {
      "x-01": [generated(generatedPathA, 'import { AIcon } from "lucide-react"; <AIcon />')],
      "y-01": [
        generated("src/blocks/y-01/a.tsx", 'import { BIcon } from "lucide-react"; <BIcon />'),
      ],
    },
  );

  assert.deepEqual(result, {
    problems: ["y-01: BIcon の JSX 使用が不足している（期待 2 / 実測 1）"],
    stats: { blocksChecked: 2, expectedOccurrences: 3, matchedOccurrences: 2 },
  });
});
