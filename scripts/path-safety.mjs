import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

// registry と provenance から来る path は、その後の read/write の境界になる。
// 文字列上の containment と、実ファイルシステム上の symlink 不在を別々に検証する。
export function assertContainedPath(label, path) {
  const normalized = relative(".", resolve(".", path));
  if (
    isAbsolute(path) ||
    !normalized ||
    normalized === ".." ||
    normalized.startsWith(`..${sep}`) ||
    normalized !== path
  ) {
    throw new Error(`${label}: repo 内の通常相対 path でない: ${path}`);
  }
  return path;
}

export function assertPathWithoutSymlinks(root, label, path) {
  assertContainedPath(label, path);
  const canonicalRoot = realpathSync(root);
  let current = canonicalRoot;
  for (const segment of path.split("/")) {
    current = join(current, segment);
    const status = lstatSync(current, { throwIfNoEntry: false });
    if (status?.isSymbolicLink()) {
      throw new Error(`${label} に symlink を含められない: ${path}`);
    }
  }
  return path;
}
