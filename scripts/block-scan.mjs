// block レーンの走査根。check-completeness と check-preview-render が共有する。
//
// 走査を CLI ブロックへ直接書くと、配線を壊してもテストが緑のままになる（実測: 引数を
// blocks: [] へ変えても全件 pass した）。しかも block の検査は「対象 0 件なら何も要求しない」
// 形なので fail-open で、CI も緑になる。純関数へ切り出して固定できるようにする。
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const directoryNames = (root) =>
  existsSync(root)
    ? readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

// block 名は add-component の parseArgs と同じ kebab-case を要求する。
// 走査根にディスク以外（JSON のキー）を混ぜた結果、生の文字列がそのまま
// join() へ流れる経路ができた。`..` を含むキーは src/blocks/ の外を走査させる。
const BLOCK_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// 走査根は「ディスク ∪ 来歴の blocks キー」の和集合。
// ディスク単独にすると、台帳に載っているのに実体が消えた block を 0 件へ縮めたまま
// 「N 件の block が全経路に載っている」と実態より強い成功メッセージを出す。
// block レーン導入前は両方とも空なので、既存の「src/blocks が無い状態は正常」は保たれる。
export function scanBlockNames(blocksRoot, provenance = {}, registry = {}) {
  const names = new Set(directoryNames(blocksRoot));
  const fromLedgers = [
    ...Object.keys(provenance.blocks ?? {}),
    // registry.json も走査根に含める。配布物 public/r/<name>.json を実際に生むのは
    // registry.json なので、ここを外すと「registry にだけ在る block item」が
    // 全検査を素通りして配布される（実測: 来歴も preview も証跡も無い block が
    // public/r/ へ出力され、全ゲート緑だった）。
    ...(registry.items ?? [])
      .filter((item) => item.type === "registry:block")
      .map((item) => item.name),
  ];
  for (const name of fromLedgers) {
    // ゲート系なので skip でなく throw。無視すると「台帳に載っているのに
    // 走査対象が縮む」という、この和集合が塞いだのと同じ穴になる。
    if (!BLOCK_NAME.test(name)) {
      throw new Error(`台帳のキーが block 名として不正: ${name}`);
    }
    names.add(name);
  }
  return [...names].sort();
}

// block ディレクトリ配下の実ファイルをリポジトリ相対パスで列挙する。
// 完全性検査の「3 本目の足」で、台帳に載らないまま配布物を壊すファイルを捕まえる。
//
// 生の readdirSync でなく git に聞く。macOS では Finder がディレクトリを開くだけで
// .DS_Store が生え、エディタも一時ファイルを置く。それらを拾うと「コードを直しても
// 消せない赤」になり、原因がコードでないため切り分けようがない（CI の clean checkout
// では出ないのでローカル限定で起きる）。--others --exclude-standard により、
// 未追跡でも ignore されていないファイル（＝この足が捕まえるべき新規 .tsx）は拾い続ける。
export function listBlockFiles(repositoryRoot, name, prefix = `src/blocks/${name}`) {
  if (!existsSync(join(repositoryRoot, prefix))) return [];
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", prefix],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  return (
    output
      .split("\0")
      .filter(Boolean)
      // --cached は index のエントリを返すので、作業ツリーから消えたファイルも含む。
      // 落とさないと「ディスクの足」が「index の足」になり、rm しただけで
      // 台帳との突合が通ってしまう（実測: 唯一の配布ファイルを rm しても緑だった）。
      // 落ちた分は「registry item の X が src/blocks/ に無い」で別途赤くなる。
      .filter((path) => existsSync(join(repositoryRoot, path)))
      .sort()
  );
}
