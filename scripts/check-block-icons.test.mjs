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
