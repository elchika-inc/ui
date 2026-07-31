// oklch(L C H) 文字列 → WCAG 相対輝度 → コントラスト比。
// DESIGN.md §3 が禁じている「暗算・幻覚値での確認した」を避けるための実計算。
const oklchToLinearSrgb = (L, C, H) => {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};
const luminance = (L, C, H) =>
  oklchToLinearSrgb(L, C, H)
    .map((v) => Math.min(Math.max(v, 0), 1))
    .reduce((acc, v, i) => acc + [0.2126, 0.7152, 0.0722][i] * v, 0);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(...a), luminance(...b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// 値を手で写さない。写した定数は CSS が変わっても据え置きになり、
// 「実際に取り込まれたトークン」ではなく「計画時点の定数」を計算してしまう。
// src/styles/global.css の :root ブロックから直接読む。
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/global.css", "utf8");
const root = css.match(/:root\s*\{([\s\S]*?)\n\}/);
if (!root) {
  console.error(":root ブロックを見つけられない");
  process.exit(1);
}
const token = (name) => {
  const m = root[1].match(new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`));
  if (!m) {
    console.error(`トークンが無い: --${name}`);
    process.exit(1);
  }
  const nums = m[1].trim().split(/\s+/).map(Number);
  if (nums.length !== 3 || nums.some(Number.isNaN)) {
    console.error(`--${name} の値を解釈できない: ${m[1]}`);
    process.exit(1);
  }
  return nums;
};

const PAIRS = [
  ["light destructive", "destructive", "destructive-foreground"],
  ["light success", "success", "success-foreground"],
  ["light warning", "warning", "warning-foreground"],
];
for (const [label, bg, fg] of PAIRS) {
  const r = ratio(token(bg), token(fg));
  console.log(`${label}\t${r.toFixed(4)}\t${r >= 4.5 ? "PASS" : "FAIL"}`);
}
