export const REGISTRY_ORIGIN = "https://ui.elchika.dev";
export const MCP_INIT_COMMAND = "npx shadcn@latest mcp init --client claude";
export const NAMESPACE_REGISTRY_CONFIG = JSON.stringify(
  {
    registries: {
      "@elchika": `${REGISTRY_ORIGIN}/r/{name}.json`,
    },
  },
  null,
  2,
);

const assertComponentName = (name) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`component名が不正: ${name}`);
  }
};

export function directInstallCommand(name) {
  assertComponentName(name);
  return `npx shadcn@latest add ${REGISTRY_ORIGIN}/r/${name}.json`;
}

export function namespaceInstallCommand(name) {
  assertComponentName(name);
  return `npx shadcn@latest add @elchika/${name}`;
}
