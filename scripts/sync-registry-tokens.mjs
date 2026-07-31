// src/styles/global.css の :root と .dark を読み、registry.json の各 item へ
// cssVars として流し込む。値を手で写さないための機構。
import { readFileSync, writeFileSync } from "node:fs";

const css = readFileSync("src/styles/global.css", "utf8");
const block = (sel) => {
  const m = css.match(new RegExp(`${sel}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!m) throw new Error(`${sel} ブロックが見つからない`);
  return Object.fromEntries(
    [...m[1].matchAll(/^\s*--([\w-]+):\s*([^;]+);/gm)].map(([, k, v]) => [k, v.trim()]),
  );
};
const light = block(":root");
const dark = block("\\.dark");
if (Object.keys(light).length === 0) throw new Error(":root からトークンを 1 件も読めていない");

const reg = JSON.parse(readFileSync("registry.json", "utf8"));
for (const item of reg.items) item.cssVars = { light, dark };
writeFileSync("registry.json", `${JSON.stringify(reg, null, 2)}\n`);
console.log(`${reg.items.length} item に ${Object.keys(light).length} 個のトークンを載せた`);
