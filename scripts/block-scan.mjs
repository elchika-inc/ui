// block レーンの走査根。check-completeness と check-preview-render が共有する。
//
// 走査を CLI ブロックへ直接書くと、配線を壊してもテストが緑のままになる（実測: 引数を
// blocks: [] へ変えても全件 pass した）。しかも block の検査は「対象 0 件なら何も要求しない」
// 形なので fail-open で、CI も緑になる。純関数へ切り出して固定できるようにする。
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const directoryNames = (root) =>
  existsSync(root)
    ? readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

// 走査根は「ディスク ∪ 来歴の blocks キー」の和集合。
// ディスク単独にすると、台帳に載っているのに実体が消えた block を 0 件へ縮めたまま
// 「N 件の block が全経路に載っている」と実態より強い成功メッセージを出す。
// block レーン導入前は両方とも空なので、既存の「src/blocks が無い状態は正常」は保たれる。
export function scanBlockNames(blocksRoot, provenance = {}) {
  const names = new Set(directoryNames(blocksRoot));
  for (const name of Object.keys(provenance.blocks ?? {})) names.add(name);
  return [...names].sort();
}

// block ディレクトリ配下の実ファイルをリポジトリ相対パスで再帰列挙する。
// 完全性検査の「3 本目の足」で、台帳に載らないまま配布物を壊すファイルを捕まえる。
export function listBlockFiles(blocksRoot, name, prefix = `src/blocks/${name}`) {
  const root = join(blocksRoot, name);
  if (!existsSync(root)) return [];
  const walk = (directory, relative) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const next = `${relative}/${entry.name}`;
      if (entry.isDirectory()) return walk(join(directory, entry.name), next);
      return [next];
    });
  return walk(root, prefix).sort();
}
