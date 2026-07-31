import { defineConfig } from "tsup"

// 出力先は lib/。dist/ は Astro の outDir 既定値であり奪い合うと成果物が消える。
// ESM のみ。CJS を出さないのは PRODUCT_PLAYBOOK §15 が警告する
// exports マップの片側だけ壊れる失敗面を作らないため。
//
// dts: false — tsup 8.5.1 の DTS ビルドは baseUrl を内部注入し、
// TypeScript 6 では TS5101 で必ず落ちる（実測）。.d.ts は tsc が作る。
export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "lib",
  format: ["esm"],
  dts: false,
  external: ["react", "react-dom", "@base-ui/react"],
  // esbuild は tsconfig の paths を自動では読まないため alias を明示する。
  // これが無いと `@/lib/utils` を解決できず Build failed になる（実測）。
  esbuildOptions(options) {
    options.alias = { ...(options.alias ?? {}), "@": new URL("src/", import.meta.url).pathname }
  },
})
