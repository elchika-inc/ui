export function normalizeRegistryDependencies(dependencies = []) {
  return dependencies.map((dependency) => {
    if (dependency.startsWith("@") || dependency.includes("://")) return dependency;
    return `@elchika/${dependency}`;
  });
}

export function localRegistryDependencyName(dependency) {
  const normalized = normalizeRegistryDependencies([dependency])[0];
  return normalized.startsWith("@elchika/") ? normalized.slice("@elchika/".length) : undefined;
}
