const previewName = (path) => {
  const name = path.match(/([^/]+)\.tsx$/)?.[1];
  if (!name) throw new Error(`preview path から名前を取得できない: ${path}`);
  return name;
};

const previewTitle = (name) =>
  name
    .split("-")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

export function createPreviewManifest(modules) {
  return Object.entries(modules)
    .map(([path, module]) => {
      const name = previewName(path);
      const previewExports = Object.entries(module).filter(
        ([exportName, value]) => exportName.endsWith("Preview") && typeof value === "function",
      );
      if (previewExports.length === 0) {
        throw new Error(`${name}: Preview export が無い`);
      }
      if (previewExports.length > 1) {
        throw new Error(`${name}: Preview export が複数ある`);
      }
      return {
        name,
        title: previewTitle(name),
        Preview: previewExports[0][1],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
