type RegistryItem = { name: string; type: string };

// block か component かの判別は registry.json の item type を正本にする
// （src/pages/components/[name].astro が同じ判別で公開ページの kind を決めている）。
// ディスクの src/blocks を走査根にすると、registry に載っていない block が catalog で
// 隔離対象として扱われ、公開ページとの判別がずれる。
export const blockNamesFromRegistry = (registry: { items: RegistryItem[] }) =>
  registry.items.filter((item) => item.type === "registry:block").map((item) => item.name);
