import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function findMissingRegistryItems(registry, builtFiles) {
  const built = new Set(
    builtFiles.filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")),
  );
  return (registry.items ?? []).map((item) => item.name).filter((name) => !built.has(name));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const registry = JSON.parse(readFileSync("registry.json", "utf8"));
  const missing = findMissingRegistryItems(registry, readdirSync("public/r"));

  console.log(
    missing.length
      ? `未生成: ${missing.join(", ")}`
      : "registry.json の全 item が public/r に生成されている",
  );
  process.exit(missing.length ? 1 : 0);
}
