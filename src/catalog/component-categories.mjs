export const componentCategories = [
  {
    name: "アクション",
    items: ["button", "button-group", "toggle", "toggle-group"],
  },
  {
    name: "フォーム",
    items: [
      "calendar",
      "checkbox",
      "combobox",
      "field",
      "input",
      "input-group",
      "input-otp",
      "label",
      "native-select",
      "radio-group",
      "select",
      "slider",
      "switch",
      "textarea",
    ],
  },
  {
    name: "データ表示",
    items: [
      "aspect-ratio",
      "avatar",
      "badge",
      "card",
      "carousel",
      "chart",
      "item",
      "kbd",
      "marker",
      "skeleton",
      "table",
    ],
  },
  {
    name: "ナビゲーション",
    items: ["breadcrumb", "command", "menubar", "navigation-menu", "pagination", "sidebar", "tabs"],
  },
  {
    name: "オーバーレイ",
    items: [
      "alert-dialog",
      "context-menu",
      "dialog",
      "drawer",
      "dropdown-menu",
      "hover-card",
      "popover",
      "sheet",
      "tooltip",
    ],
  },
  {
    name: "フィードバック",
    items: ["alert", "empty", "progress", "sonner", "spinner", "toast"],
  },
  {
    name: "チャット",
    items: ["attachment", "bubble", "message", "message-scroller"],
  },
  {
    name: "レイアウト",
    items: ["accordion", "collapsible", "direction", "resizable", "scroll-area", "separator"],
  },
  // block は部品でなく組み立て済みの雛形なので、部品のカテゴリとは分けて並べる。
  {
    name: "認証",
    items: [
      "login-01",
      "login-02",
      "login-03",
      "login-04",
      "login-05",
      "signup-01",
      "signup-02",
      "signup-03",
      "signup-04",
      "signup-05",
    ],
  },
  {
    name: "アプリシェル",
    items: [
      "dashboard-01",
      "sidebar-01",
      "sidebar-02",
      "sidebar-03",
      "sidebar-04",
      "sidebar-05",
      "sidebar-06",
      "sidebar-07",
      "sidebar-08",
      "sidebar-09",
      "sidebar-10",
      "sidebar-11",
      "sidebar-12",
      "sidebar-13",
      "sidebar-14",
      "sidebar-15",
      "sidebar-16",
    ],
  },
];

export function checkComponentCategories(previewNames, categories = componentCategories) {
  const previewSet = new Set(previewNames);
  const assignments = new Map();

  for (const category of categories) {
    for (const name of category.items) {
      const assignedCategories = assignments.get(name) ?? [];
      assignedCategories.push(category.name);
      assignments.set(name, assignedCategories);
    }
  }

  const problems = [];
  const unclassified = previewNames.filter((name) => !assignments.has(name));
  if (unclassified.length > 0) problems.push(`未分類: ${unclassified.join(", ")}`);

  for (const [name, assignedCategories] of assignments) {
    if (assignedCategories.length > 1) {
      problems.push(`重複分類: ${name} (${assignedCategories.join(", ")})`);
    }
  }

  const unknown = [...assignments.keys()].filter((name) => !previewSet.has(name));
  if (unknown.length > 0) problems.push(`存在しない preview: ${unknown.join(", ")}`);

  return problems;
}

export function categorizePreviewItems(previewItems, categories = componentCategories) {
  const problems = checkComponentCategories(
    previewItems.map((item) => item.name),
    categories,
  );
  if (problems.length > 0) {
    throw new Error(`component category が不正:\n${problems.join("\n")}`);
  }

  const itemsByName = new Map(previewItems.map((item) => [item.name, item]));
  return categories.map((category) => ({
    name: category.name,
    items: category.items.map((name) => itemsByName.get(name)),
  }));
}
