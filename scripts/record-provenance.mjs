// コンポーネントの来歴を機械可読に記録する（PRODUCT_PLAYBOOK §15）。
// §15 が移植コードへ要求するのは「出典 URL・commit SHA・ライセンス」。
//
// registry 配信物と CLI 生成物は byte 等価ではない（実測）。そこで
//   - 受け取った内容そのものの SHA-256（改ざん・すり替えを検出できる錨）
//   - CLI が手元へ書き出した内容の SHA-256（生成物を追跡する錨）
//   - 元テンプレートのパスと、それを最後に変更した commit SHA
// を個別に記録し、それぞれが何を保証するかを notes に明記する。
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { modifiedFor, parseModifiedInput } from "./provenance-input.mjs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
// scaffold が shadcn をどちらに置くかはテンプレート依存。
// --template astro の実測では dependencies だが、registry の index は
// devDependencies に置く。片方だけを見ると undefined になり、
// JSON.stringify でキーごと脱落して「記録した」と表示されたまま
// 後続の検査で止まる。両方を見て、無ければここで落とす。
const shadcnRange = pkg.dependencies?.shadcn ?? pkg.devDependencies?.shadcn;
if (!shadcnRange) {
  throw new Error(
    "package.json に shadcn の版が無い（dependencies / devDependencies の両方を確認した）",
  );
}

// package.json に入っているのは semver range（実測: "^4.16.0"）であり、
// 実際に生成器として動いた版ではない。
// さらに target repo の node_modules/shadcn も、scaffold を実行した
// npx のパッケージとは別のインストールであり、同じ版とは限らない。
// 来歴に残すべきは「生成器として動いた版」なので、Step 1 が固定して
// 書き出した .shadcn-cli-version を正本にする。
const shadcnCliVersion = readFileSync(".shadcn-cli-version", "utf8").trim();
if (!/^\d+\.\d+\.\d+/.test(shadcnCliVersion)) {
  throw new Error(`実行した shadcn CLI の版を特定できない: ${shadcnCliVersion}`);
}
// target repo の依存として入った版。生成器とは別物なので別キーで残す。
const shadcnVersion = JSON.parse(readFileSync("node_modules/shadcn/package.json", "utf8")).version;
if (!/^\d+\.\d+\.\d+/.test(shadcnVersion)) {
  throw new Error(`依存の shadcn exact version を特定できない: ${shadcnVersion}`);
}
const date = process.env.PROVENANCE_DATE;
if (!date) throw new Error("PROVENANCE_DATE を YYYY-MM-DD で渡すこと");

const STYLE = "base-nova";
const UPSTREAM_REPO = "shadcn-ui/ui";
// 元テンプレートのリポジトリ内パス。registry 応答の path とは別（実測で特定した）。
// **コンポーネントごとに変わる。** 定数に固定すると 2 件目以降が Button の
// 来歴を記録して成功表示する（実測: input の commit SHA は button と異なる）。
const upstreamPathFor = (name) => `apps/v4/registry/bases/base/ui/${name}.tsx`;

const gh = async (p) => {
  const res = await fetch(`https://api.github.com/${p}`, {
    headers: { accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub API ${p}: ${res.status}`);
  return res.json();
};
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const prev = existsSync("provenance.json")
  ? JSON.parse(readFileSync("provenance.json", "utf8"))
  : { components: {} };
const componentFiles = readdirSync("src/components/ui").filter((f) => f.endsWith(".tsx"));
const pendingComponents = componentFiles
  .map((f) => f.replace(/\.tsx$/, ""))
  .filter((name) => !prev.components[name]);
const modifiedByComponent = pendingComponents.length
  ? parseModifiedInput(process.env.PROVENANCE_MODIFIED)
  : {};

for (const f of componentFiles) {
  const name = f.replace(/\.tsx$/, "");
  if (prev.components[name]) continue;

  // 1. registry から配信物そのものを取得する（CLI と同じ URL）。
  const registryUrl = `https://ui.shadcn.com/r/styles/${STYLE}/${name}.json`;
  const res = await fetch(registryUrl);
  if (!res.ok) throw new Error(`registry 取得に失敗: ${registryUrl} ${res.status}`);
  const item = await res.json();
  const served = item.files?.[0]?.content;
  if (!served) throw new Error(`${name}: registry 応答に content が無い`);

  // 2. CLI が手元へ書き出した内容を独立した錨として記録する。
  //    registry 配信物との等価性は主張しない。CLI は import 以外にも
  //    directive・icon・preset 変数を変換するため、正規化比較は false failure になる。
  const local = readFileSync(`src/components/ui/${f}`, "utf8");

  // 3. 元テンプレートを最後に変更した commit を取る。
  const upstreamPath = upstreamPathFor(name);
  // パスが実在することを先に確かめる。存在しないパスへ commits を問い合わせると
  // 空配列が返り、SHA を特定できないまま進みかける。
  const head = await fetch(
    `https://api.github.com/repos/${UPSTREAM_REPO}/contents/${upstreamPath}`,
    {
      headers: { accept: "application/vnd.github+json" },
    },
  );
  if (!head.ok)
    throw new Error(`${name}: 上流パスが見つからない: ${upstreamPath} (${head.status})`);
  const commits = await gh(
    `repos/${UPSTREAM_REPO}/commits?path=${encodeURIComponent(upstreamPath)}&per_page=1`,
  );
  const upstreamPathSha = commits?.[0]?.sha;
  if (!/^[0-9a-f]{40}$/.test(upstreamPathSha ?? "")) {
    throw new Error(`${name}: 元テンプレートの commit SHA を特定できない`);
  }

  prev.components[name] = {
    origin: "shadcn/ui registry",
    sourceUrl: `https://github.com/${UPSTREAM_REPO}`,
    registry: "https://ui.shadcn.com",
    registryUrl,
    registryPath: item.files[0].path,
    registryContentSha256: sha256(served),
    generatedContentSha256: sha256(local),
    addTarget: `@shadcn/${name}`,
    upstreamRepo: UPSTREAM_REPO,
    upstreamPath,
    upstreamPathSha,
    style: STYLE,
    shadcnCliVersion,
    shadcnVersion,
    shadcnRange,
    fetchedAt: date,
    license: "MIT",
    modified: modifiedFor(modifiedByComponent, name),
    notes:
      "registry 配信物と CLI 生成物は byte 等価でない。CLI が use client 除去・import 書き換え・icon 具体化・preset 変数の解決を行うため。" +
      "registryContentSha256 は受け取った配信物、generatedContentSha256 は記録時の手元の生成物の錨であり、両者の byte 一致は主張しない。" +
      "upstreamPathSha は元テンプレートを最後に変更した commit を指す。",
  };
}
writeFileSync("provenance.json", JSON.stringify(prev, null, 2) + "\n");
console.log(`${Object.keys(prev.components).length} 件の来歴を記録した`);
