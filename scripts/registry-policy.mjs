// 全 registry item へ同梱する共有配布物と、それ自体が要求する npm 依存。
// 生成側と常設 completeness が同じ定義を参照し、片方だけの更新を防ぐ。
export const SHARED_DEPENDENCIES = ["tw-animate-css", "shadcn"];

export const SHARED_REGISTRY_FILES = [
  {
    path: "src/styles/global.css",
    type: "registry:file",
    target: "~/elchika-ui/tokens.css",
  },
  {
    path: "src/styles/design-system/tokens.css",
    type: "registry:file",
    target: "~/elchika-ui/design-system/tokens.css",
  },
  {
    path: "src/styles/design-system/brands.css",
    type: "registry:file",
    target: "~/elchika-ui/design-system/brands.css",
  },
  { path: "LICENSE", type: "registry:file", target: "~/elchika-ui/LICENSE" },
  {
    path: "THIRD_PARTY_LICENSES",
    type: "registry:file",
    target: "~/elchika-ui/THIRD_PARTY_LICENSES",
  },
];
