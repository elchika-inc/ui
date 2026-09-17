import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const roots = ["src/components/ui", "src/blocks", "src/site", "src/previews"];

// spec §B.1 と司令塔裁定: 密度の高い UI 9箇所、変更対象外のデモ注釈3箇所。
// ファイル名と class 文字列の組で固定し、同じファイルへの別用途の追加も検知する。
const allowedTextXs = [
  [
    "src/components/ui/button.tsx",
    "h-6 gap-1 rounded-sm px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  ],
  [
    "src/components/ui/button.tsx",
    "h-control-sm gap-1 rounded-sm px-2.5 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  ],
  [
    "src/components/ui/toggle.tsx",
    "h-7 min-w-7 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  ],
  ["src/components/ui/sidebar.tsx", "h-7 text-xs"],
  [
    "src/components/ui/sidebar.tsx",
    "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
  ],
  [
    "src/components/ui/attachment.tsx",
    "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
  ],
  [
    "src/components/ui/attachment.tsx",
    "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
  ],
  [
    "src/components/ui/avatar.tsx",
    "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
  ],
  [
    "src/components/ui/item.tsx",
    "line-clamp-2 text-left text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
  ],
  ["src/previews/card.tsx", "rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"],
  ["src/previews/bubble.tsx", "mt-1 text-xs opacity-70"],
  ["src/previews/alert.tsx", "rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"],
];

function readSources(directory) {
  return readdirSync(new URL(`../${directory}/`, import.meta.url), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) return readSources(path);
      if (!/\.[jt]sx?$/.test(entry.name)) return [];
      return [{ path, source: readFileSync(new URL(`../${path}`, import.meta.url), "utf8") }];
    });
}

function strings(sources) {
  return sources.flatMap(({ path, source }) => {
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found = [];
    function visit(node) {
      if (ts.isStringLiteralLike(node)) {
        found.push({
          path,
          value: node.text,
          line: ast.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    return found;
  });
}

function assertNoLegacy(entries) {
  const legacy =
    /(?:^|[^A-Za-z0-9-])(?:tracking-(?:tighter|tight|wide|wider|widest)|leading-[0-9]+)(?=$|[^A-Za-z0-9-])/;
  assert.deepEqual(
    entries.filter(({ value }) => legacy.test(value)),
    [],
    "旧名の組版 utility が残っている",
  );
}

function assertAllowedTextXs(entries) {
  const unexpected = entries.filter(
    ({ path, value }) =>
      /(?:^|[^A-Za-z0-9-])text-xs(?=$|[^A-Za-z0-9-])/.test(value) &&
      !allowedTextXs.some(
        ([allowedPath, allowedClass]) => path === allowedPath && value === allowedClass,
      ),
  );
  assert.deepEqual(unexpected, [], "許可されていない text-xs が残っている");
}

const entries = strings(roots.flatMap(readSources));

test("旧名 tracking と数値 leading を使用しない", () => {
  assertNoLegacy(entries);
});

test("text-xs は裁定済みのファイルと class 文字列だけで使用する", () => {
  assertAllowedTextXs(entries);
});

test("許可された text-xs は12箇所がそれぞれ1回だけ存在する", () => {
  assert.equal(allowedTextXs.length, 12);
  for (const [path, value] of allowedTextXs) {
    assert.equal(
      entries.filter((entry) => entry.path === path && entry.value === value).length,
      1,
      `${path}: ${value}`,
    );
  }
});

test("陽性対照: 走査文字列へ tracking-widest を足すと検査が失敗する", () => {
  const clean = [{ path: "src/previews/probe.tsx", source: '<span className="text-2xs" />' }];
  assertNoLegacy(strings(clean));
  const mutated = clean.map((entry) => ({
    ...entry,
    source: entry.source.replace("text-2xs", "text-2xs tracking-widest"),
  }));
  assert.throws(() => assertNoLegacy(strings(mutated)), { code: "ERR_ASSERTION" });
});

test("陽性対照: variant 付きの旧名・数値行間・text-xs も検知する", () => {
  for (const utility of ["hover:tracking-tight", "md:leading-7", "[&>span]:tracking-wider"]) {
    const source = `<span className="${utility}" />`;
    assert.throws(() => assertNoLegacy(strings([{ path: "src/previews/probe.tsx", source }])), {
      code: "ERR_ASSERTION",
    });
  }
  const source = '<span className="group-data-[size=sm]/probe:text-xs" />';
  assert.throws(() => assertAllowedTextXs(strings([{ path: "src/previews/probe.tsx", source }])), {
    code: "ERR_ASSERTION",
  });
});

test("許可 class の別ファイルへの転用と同一ファイルでの変更を拒否する", () => {
  const [path, value] = allowedTextXs[0];
  assertAllowedTextXs([{ path, value }]);
  assert.throws(() => assertAllowedTextXs([{ path: "src/previews/probe.tsx", value }]), {
    code: "ERR_ASSERTION",
  });
  assert.throws(() => assertAllowedTextXs([{ path, value: `${value} font-mono` }]), {
    code: "ERR_ASSERTION",
  });
});
