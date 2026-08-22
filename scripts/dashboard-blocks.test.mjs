import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const readSource = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const parseTsx = (path) => {
  const source = readSource(path);
  return {
    source,
    sourceFile: ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
  };
};

const jsxOpenings = (sourceFile) => {
  const openings = [];
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) openings.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return openings;
};

const jsxAttribute = (opening, name, sourceFile) =>
  opening.attributes.properties
    .find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === name)
    ?.initializer?.getText(sourceFile);

const namedTopLevelFunction = (sourceFile, name) => {
  const declarations = sourceFile.statements.filter(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
  assert.equal(declarations.length, 1, `${name} の top-level function が一意である`);
  return declarations[0];
};

const uniqueVariableInitializer = (scope, sourceFile, name) => {
  const initializers = [];
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === name) {
      initializers.push(node.initializer?.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  assert.equal(initializers.length, 1, `${name} の宣言が対象 scope で一意である`);
  return initializers[0];
};

const loadTsxLogic = (path, names) => {
  const output = ts.transpileModule(readSource(path), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const executable = output
    .replace(/import[\s\S]*?from ["'][^"']+["'];\n/g, "")
    .replaceAll("export ", "");
  return Function(`${executable}\nreturn { ${names.join(", ")} };`)();
};

test("dashboard navigation は受け取った URL を link として描画する", () => {
  const source = readSource("src/blocks/dashboard-01/components/nav-main.tsx");
  assert.match(source, /render={<a href={item\.url} \/>}/);
});

test("dashboard chart は TimeRange から UTC の両端を含む 7/30/90 日だけを描画へ渡す", () => {
  const path = "src/blocks/dashboard-01/components/chart-area-interactive.tsx";
  const { sourceFile } = parseTsx(path);
  const chartComponent = namedTopLevelFunction(sourceFile, "ChartAreaInteractive");
  const { chartData, chartDataForTimeRange } = loadTsxLogic(path, [
    "chartData",
    "chartDataForTimeRange",
  ]);

  for (const [timeRange, days, firstDate] of [
    ["7d", 7, "2024-06-24"],
    ["30d", 30, "2024-06-01"],
    ["90d", 90, "2024-04-02"],
  ]) {
    const filtered = chartDataForTimeRange(chartData, timeRange, "2024-06-30");
    assert.equal(filtered.length, days);
    assert.equal(filtered[0].date, firstDate);
    assert.equal(filtered.at(-1).date, "2024-06-30");
  }

  const unsortedWithFuture = [
    { date: "2024-07-01" },
    { date: "2024-06-24" },
    { date: "2024-06-30" },
    { date: "2024-06-23" },
    { date: "2024-06-29" },
  ];
  assert.deepEqual(
    chartDataForTimeRange(unsortedWithFuture, "7d", "2024-06-30").map((item) => item.date),
    ["2024-06-24", "2024-06-30", "2024-06-29"],
  );

  const areaCharts = jsxOpenings(chartComponent).filter(
    (opening) => opening.tagName.getText(sourceFile) === "AreaChart",
  );
  assert.equal(areaCharts.length, 1, "ChartAreaInteractive 内の AreaChart が一意である");
  assert.equal(
    uniqueVariableInitializer(chartComponent, sourceFile, "filteredData"),
    'chartDataForTimeRange(chartData, timeRange, "2024-06-30")',
  );
  assert.equal(jsxAttribute(areaCharts[0], "data", sourceFile), "{filteredData}");
});

test("dashboard block の配布 manifest は除外後の依存集合と共有依存を保つ", () => {
  const registry = JSON.parse(readSource("registry.json"));
  const dashboard = registry.items.find((item) => item.name === "dashboard-01");
  const table = registry.items.find((item) => item.name === "dashboard-table");

  assert.ok(dashboard, "dashboard-01 registry item がある");
  assert.ok(table, "dashboard-table registry item がある");
  assert.deepEqual([...dashboard.dependencies].sort(), [
    "lucide-react",
    "recharts",
    "shadcn",
    "tw-animate-css",
  ]);
  assert.deepEqual([...dashboard.registryDependencies].sort(), [
    "@elchika/avatar",
    "@elchika/badge",
    "@elchika/button",
    "@elchika/card",
    "@elchika/chart",
    "@elchika/dropdown-menu",
    "@elchika/input",
    "@elchika/select",
    "@elchika/separator",
    "@elchika/sheet",
    "@elchika/sidebar",
    "@elchika/toggle-group",
    "@elchika/use-mobile",
  ]);
  assert.deepEqual([...table.dependencies].sort(), ["shadcn", "tw-animate-css"]);
});

test("dashboard table は部分選択を mixed state として計算する", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");
  const { dashboardTableSelectionState } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["dashboardTableSelectionState"],
  );
  const rows = [{ id: 1 }, { id: 2 }];

  assert.deepEqual(dashboardTableSelectionState(rows, new Set()), {
    allSelected: false,
    someSelected: false,
  });
  assert.deepEqual(dashboardTableSelectionState(rows, new Set([1])), {
    allSelected: false,
    someSelected: true,
  });
  assert.deepEqual(dashboardTableSelectionState(rows, new Set([1, 2])), {
    allSelected: true,
    someSelected: true,
  });
  assert.doesNotMatch(source, /<TableRow[^>]*[\s\S]*?tabIndex={0}/);
  assert.ok(source.includes(`aria-label={\`\${row.header} の詳細を開く\`}`));
});

test("dashboard table は data 更新時に選択 ID と active row を現在データへ束縛する", () => {
  const { reconcileDashboardTableState } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["reconcileDashboardTableState"],
  );

  const sameIdsWithNewValues = [
    { id: 1, header: "更新後" },
    { id: 2, header: "別行" },
  ];
  const retained = reconcileDashboardTableState(new Set([1, 3]), 1, sameIdsWithNewValues);
  assert.deepEqual([...retained.selectedIds], [1]);
  assert.equal(retained.activeRowId, 1);
  assert.equal(retained.activeRow.header, "更新後");

  const removed = reconcileDashboardTableState(new Set([1, 3]), 3, sameIdsWithNewValues);
  assert.deepEqual([...removed.selectedIds], [1]);
  assert.equal(removed.activeRowId, null);
  assert.equal(removed.activeRow, null);
});

test("dashboard table は DnD による行順変更を実装しない", () => {
  const source = readSource("src/blocks/dashboard-table/components/dashboard-table.tsx");

  assert.doesNotMatch(source, /@dnd-kit|sortable/i);
  assert.doesNotMatch(source, /\bdraggable\b|onDrag(?:Start|End|Over)|drag handle/i);
  assert.doesNotMatch(source, /GripVertical|並べ替えハンドル/);
  assert.doesNotMatch(source, /on(?:Pointer|Mouse|Touch|Key)(?:Down|Move|Up)|setPointerCapture/);
  assert.doesNotMatch(source, /cursor-grab|touch-none|aria-roledescription=["']sortable["']/i);
  assert.doesNotMatch(source, /\b(?:setRows|setOrder|moveRow|reorderRows)\b/);
});

test("dashboard table は数値と非数値の target を全順序で安定して並べる", () => {
  const { compareRows, dashboardMetricValues } = loadTsxLogic(
    "src/blocks/dashboard-table/components/dashboard-table.tsx",
    ["compareRows", "dashboardMetricValues"],
  );
  const base = {
    id: 1,
    header: "Document",
    type: "Narrative",
    status: "Done",
    limit: "5",
    reviewer: "Reviewer",
  };
  const unavailable = { ...base, target: "N/A" };
  const numeric = { ...base, id: 2, target: "10" };
  const rows = [
    { ...base, id: 1, target: "2" },
    { ...base, id: 2, target: "10" },
    { ...base, id: 3, target: "1x" },
  ];
  const permutations = [
    [rows[0], rows[1], rows[2]],
    [rows[0], rows[2], rows[1]],
    [rows[1], rows[0], rows[2]],
    [rows[1], rows[2], rows[0]],
    [rows[2], rows[0], rows[1]],
    [rows[2], rows[1], rows[0]],
  ];

  assert.equal(dashboardMetricValues(unavailable), null);
  for (const permutation of permutations) {
    assert.deepEqual(
      [...permutation]
        .sort((left, right) => compareRows(left, right, "target"))
        .map((row) => row.target),
      ["2", "10", "1x"],
    );
    assert.deepEqual(
      [...permutation]
        .sort((left, right) => -compareRows(left, right, "target"))
        .map((row) => row.target),
      ["1x", "10", "2"],
    );
  }
  for (const [key, leftValue, rightValue] of [
    ["header", "Alpha", "Beta"],
    ["status", "Done", "In Process"],
    ["reviewer", "Alice", "Bob"],
  ]) {
    const left = { ...base, [key]: leftValue };
    const right = { ...base, id: 2, [key]: rightValue };
    assert.ok(compareRows(left, right, key) < 0, `${key} ascending`);
    assert.ok(-compareRows(left, right, key) > 0, `${key} descending`);
  }
  assert.deepEqual(dashboardMetricValues(numeric), {
    values: [5, 10, 7.5, 10, 10],
    maximum: 10,
  });
});

test("dashboard table の helper 結果は checkbox・drawer・詳細 button へ配線される", () => {
  const { sourceFile } = parseTsx("src/blocks/dashboard-table/components/dashboard-table.tsx");
  const tableComponent = namedTopLevelFunction(sourceFile, "DashboardTable");
  const dataTableComponent = namedTopLevelFunction(sourceFile, "DashboardDataTable");
  const rowComponent = namedTopLevelFunction(sourceFile, "DashboardTableDataRow");
  const tableOpenings = jsxOpenings(tableComponent);
  const dataTableOpenings = jsxOpenings(dataTableComponent);
  const rowOpenings = jsxOpenings(rowComponent);
  const byTableTag = (tag) =>
    tableOpenings.filter((opening) => opening.tagName.getText(sourceFile) === tag);
  const byDataTableTag = (tag) =>
    dataTableOpenings.filter((opening) => opening.tagName.getText(sourceFile) === tag);
  const byRowTag = (tag) =>
    rowOpenings.filter((opening) => opening.tagName.getText(sourceFile) === tag);

  assert.match(
    uniqueVariableInitializer(tableComponent, sourceFile, "reconciledState"),
    /reconcileDashboardTableState\(selectedIds, activeRowId, data\)/,
  );
  assert.equal(
    uniqueVariableInitializer(tableComponent, sourceFile, "selectedIdsInData"),
    "reconciledState.selectedIds",
  );
  assert.equal(
    uniqueVariableInitializer(tableComponent, sourceFile, "activeRow"),
    "reconciledState.activeRow",
  );
  assert.equal(
    uniqueVariableInitializer(tableComponent, sourceFile, "comparison"),
    "compareRows(left, right, sort.key)",
  );

  const headerCheckbox = byDataTableTag("Checkbox").find(
    (opening) => jsxAttribute(opening, "aria-label", sourceFile) === '"表示中の行をすべて選択"',
  );
  assert.ok(headerCheckbox, "header checkbox がある");
  assert.equal(jsxAttribute(headerCheckbox, "checked", sourceFile), "{allSelected}");
  assert.equal(
    jsxAttribute(headerCheckbox, "indeterminate", sourceFile),
    "{someSelected && !allSelected}",
  );

  const detailButton = byRowTag("Button").find((opening) =>
    jsxAttribute(opening, "aria-label", sourceFile)?.includes("の詳細を開く"),
  );
  assert.ok(detailButton, "accessible name 付き詳細 button がある");
  assert.match(jsxAttribute(detailButton, "onClick", sourceFile), /onOpen\(row\)/);

  const table = byTableTag("DashboardDataTable")[0];
  assert.equal(jsxAttribute(table, "selectedIds", sourceFile), "{selectedIdsInData}");
  const drawer = byTableTag("Drawer")[0];
  assert.equal(jsxAttribute(drawer, "open", sourceFile), "{activeRow !== null}");
  const detailChart = byTableTag("DetailChart")[0];
  assert.equal(jsxAttribute(detailChart, "row", sourceFile), "{activeRow}");
});

test("dashboard table の詳細 chart は Recharts のゼロ寸法 wrapper に依存せず表示する", () => {
  const { sourceFile } = parseTsx("src/blocks/dashboard-table/components/dashboard-table.tsx");
  const openings = jsxOpenings(sourceFile);
  const chartContainer = openings.find(
    (opening) => opening.tagName.getText(sourceFile) === "ChartContainer",
  );
  assert.ok(chartContainer, "詳細 chart の ChartContainer がある");
  assert.ok(ts.isJsxElement(chartContainer.parent), "ChartContainer が子要素を持つ");

  const svg = jsxOpenings(chartContainer.parent).find(
    (opening) => opening.tagName.getText(sourceFile) === "svg",
  );

  assert.ok(svg, "詳細 chart の SVG が ChartContainer の子孫にある");
  assert.match(jsxAttribute(chartContainer, "className", sourceFile), /\brelative\b/);
  assert.match(jsxAttribute(svg, "className", sourceFile), /\babsolute\b/);
  assert.match(jsxAttribute(svg, "className", sourceFile), /\binset-0\b/);
  assert.match(jsxAttribute(svg, "className", sourceFile), /\bh-full\b/);
  assert.match(jsxAttribute(svg, "className", sourceFile), /\bw-full\b/);
});
