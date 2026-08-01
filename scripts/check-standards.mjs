// DESIGN.md §5 の 2 規定を機械検知する。
// 1. フォーカスリングに透明度合成を使わない（WCAG 1.4.11 の 3:1 を割るため）
// 2. 値系ユーティリティの arbitrary value を使わない。
//    例外は ring-[3px] と @custom-variant dark のみ。
//    variant 構文（data-[...] / aria-[...] / [&_svg]:...）は AUDIT.md の
//    規定どおり対象外。
// AUDIT.md は components/ui/ を検査対象外としているが、それは shadcn から
// コピーして所有するだけのプロジェクト向けの規定。本リポジトリは
// components/ui/ そのものを standards へ正規化して配布する側なので、
// ここは意図的に対象へ含める。
import { globSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// 状態表示の variant が前置されたリングだけを対象にする。無条件の
// ring-foreground/10 のような装飾リングは WCAG 1.4.11 の状態表示ではない。
// 色名は [a-z0-9-]+（[a-z-]+ だと ring-red-500/50 を見逃す）。
// 不透明度の指定は Tailwind v4 が 4 形式を受けるため全部拾う（実測で確認）:
//   /50  /12.5  /[50%]  /[.5]  /(--ring-alpha)
// \d+ だけだと角括弧・丸括弧の形式を見逃し、透明度禁止を迂回できる。
// arbitrary 検査にも掛からないので、ここが唯一の検出経路になる。
// 色側も v4 の変数短縮 ring-(--brand) と任意値 ring-[#f00] を拾う。
// 色側を [a-z0-9-]+ だけにすると ring-(--brand)/50 を見逃す（実測）。
const RING_OPACITY =
  /\b(?:focus|focus-visible|focus-within|aria-invalid|data-invalid|invalid)(?:-[a-z-]+)?:(?:[a-z0-9-]+:)*ring-(?:ring|[a-z0-9-]+|\([^)]+\)|\[[^\]]+\])\/(?:\d+(?:\.\d+)?%?|\[[^\]]+\]|\([^)]+\))/g;

// 値系ユーティリティだけを対象にする。プレフィックスの列挙は AUDIT.md の
// arbitrary value 検査コマンドから逐語で写した。
// has-data-[...] / in-data-[...] / not-aria-[...] / [&_svg]:... は
// 正当な variant 構文であり、この列挙に含まれないので自然に除外される。
const ARBITRARY =
  /\b(?:w|h|size|p[trblxy]?|m[trblxy]?|text|gap|z|top|left|right|bottom|inset|rounded|duration|leading|tracking|ring|border|shadow|bg|fill|stroke)-\[[^\]]+\]/g;
const ALLOWED_ARBITRARY = new Set(["ring-[3px]"]);
const BOOLEAN_DATA_INSET = /data-inset=\{inset\}/g;

export function checkFile(path, source) {
  const violations = [];
  source.split("\n").forEach((line, i) => {
    if (line.includes("@custom-variant dark")) return;
    for (const m of line.matchAll(RING_OPACITY)) {
      violations.push({ rule: "focus-ring-opacity", line: i + 1, text: m[0] });
    }
    for (const m of line.matchAll(ARBITRARY)) {
      if (ALLOWED_ARBITRARY.has(m[0])) continue;
      violations.push({ rule: "arbitrary-value", line: i + 1, text: m[0] });
    }
    for (const m of line.matchAll(BOOLEAN_DATA_INSET)) {
      violations.push({ rule: "boolean-data-inset", line: i + 1, text: m[0] });
    }
  });
  return { violations };
}

// pathToFileURL を使う。`file://${process.argv[1]}` の素朴な連結は
// パスに特殊文字を含む環境で一致しない。
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = globSync("src/**/*.{tsx,css}");
  if (files.length === 0) {
    console.error("走査対象が 0 件（glob が壊れている）");
    process.exit(1);
  }
  let total = 0;
  for (const f of files) {
    const { violations } = checkFile(f, readFileSync(f, "utf8"));
    for (const v of violations) {
      console.error(`${f}:${v.line}  ${v.rule}  ${v.text}`);
      total++;
    }
  }
  if (total) {
    console.error(`\n${total} 件の standards 違反`);
    process.exit(1);
  }
  console.log(`standards 適合（${files.length} ファイルを検査）`);
}
