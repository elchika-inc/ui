import { execFileSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const LEGACY_SHA = /(?:^|[^0-9a-f])([0-9a-f]{40})(?![0-9a-f])/;
const STRUCTURED_FIELD = /^verified_impl_sha:.*$/gm;
const STRUCTURED_VALUE = /^verified_impl_sha:\s*([0-9a-f]{40})\s*$/;

export function legacyVerificationSha(markdown) {
  const withoutStructuredField = markdown.replace(STRUCTURED_FIELD, "");
  return withoutStructuredField.match(LEGACY_SHA)?.[1];
}

export function structuredVerificationSha(markdown) {
  const fields = markdown.match(STRUCTURED_FIELD) ?? [];
  if (fields.length === 0) throw new Error("verified_impl_sha が無い");
  if (fields.length > 1) throw new Error("verified_impl_sha が複数ある");
  const matched = fields[0].match(STRUCTURED_VALUE);
  if (!matched) throw new Error("verified_impl_sha は40桁の小文字SHAでなければならない");
  return matched[1];
}

export function migrateMarkdown(markdown) {
  const fields = markdown.match(STRUCTURED_FIELD) ?? [];
  if (fields.length > 1) throw new Error("verified_impl_sha が複数ある");
  if (fields.length === 1) {
    structuredVerificationSha(markdown);
    return markdown;
  }

  const legacySha = legacyVerificationSha(markdown);
  if (!legacySha) throw new Error("旧ロジックで40桁SHAを導出できない");
  const firstNewline = markdown.indexOf("\n");
  if (firstNewline === -1) return `${markdown}\n\nverified_impl_sha: ${legacySha}\n`;
  return `${markdown.slice(0, firstNewline + 1)}\nverified_impl_sha: ${legacySha}\n${markdown.slice(firstNewline + 1)}`;
}

function markdownFiles(root, directory = "") {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(root, path);
    if (!entry.isFile()) throw new Error(`${path}: 通常ファイルではないため移行できない`);
    if (extname(entry.name) !== ".md") return [];
    return [path];
  });
}

export function migrateEvidence(
  reviewsRoot,
  { write = false, repositoryRoot = resolve(reviewsRoot, "..", "..") } = {},
) {
  const status = lstatSync(reviewsRoot, { throwIfNoEntry: false });
  const reviewsRelativePath = status
    ? relative(realpathSync(repositoryRoot), realpathSync(reviewsRoot))
    : "..";
  if (
    !status?.isDirectory() ||
    reviewsRelativePath.startsWith("..") ||
    isAbsolute(reviewsRelativePath)
  ) {
    throw new Error(".docs/reviews はrepo 内の通常ディレクトリでなければならない");
  }
  const files = markdownFiles(reviewsRoot).sort((left, right) => left.localeCompare(right));
  if (files.length === 0) throw new Error("証跡Markdownが0件（移行が空走している）");

  const migrations = files.map((file) => {
    const path = join(reviewsRoot, file);
    const before = readFileSync(path, "utf8");
    const fields = before.match(STRUCTURED_FIELD) ?? [];
    if (fields.length > 1) throw new Error(`${file}: verified_impl_sha が複数ある`);
    const legacySha = legacyVerificationSha(before);
    if (!legacySha) throw new Error(`${file}: 旧ロジックで40桁SHAを導出できない`);
    if (fields.length === 1 && structuredVerificationSha(before) !== legacySha) {
      throw new Error(`${file}: 構造化欄と旧ロジックのSHAが一致しない`);
    }
    return { file, path, before, after: migrateMarkdown(before), legacySha };
  });

  if (write) {
    for (const migration of migrations) writeFileSync(migration.path, migration.after);
  }

  for (const migration of migrations) {
    const actual = write ? readFileSync(migration.path, "utf8") : migration.after;
    if (structuredVerificationSha(actual) !== migration.legacySha) {
      throw new Error(`${migration.file}: 移行後のSHAが旧ロジックと一致しない`);
    }
  }

  return {
    files: migrations.map(({ file }) => file),
    changed: migrations.filter(({ before, after }) => before !== after).map(({ file }) => file),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const reviewsRoot = join(repositoryRoot, ".docs/reviews");
  const write = process.argv.includes("--write");
  const result = migrateEvidence(reviewsRoot, { write, repositoryRoot });
  const relativeRoot = relative(repositoryRoot, reviewsRoot);
  console.log(
    `${relativeRoot} の全Markdownで構造化SHAと旧ロジックの値が一致（対象 ${result.files.length}、変更 ${result.changed.length}）`,
  );
  if (!write && result.changed.length) {
    console.log("書き込みは未実施。移行するには --write を指定する");
  }
}
