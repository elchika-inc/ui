import assert from "node:assert/strict";
import { test } from "node:test";
import { modifiedFor, parseModifiedInput } from "./provenance-input.mjs";

test("modified の入力が未指定なら停止する", () => {
  assert.throws(() => parseModifiedInput(undefined), /PROVENANCE_MODIFIED/);
});

test("modified の入力が JSON object でなければ停止する", () => {
  for (const input of ["not-json", "[]", '"text"']) {
    assert.throws(() => parseModifiedInput(input), /PROVENANCE_MODIFIED/, input);
  }
});

test("component の modified が無ければ停止する", () => {
  const values = parseModifiedInput('{"button":"focus ring を修正"}');
  assert.throws(() => modifiedFor(values, "sonner"), /sonner/);
});

test("component ごとの modified を返す", () => {
  const values = parseModifiedInput(
    '{"button":"focus ring を修正","sonner":"変更なし（生成直後のまま）"}',
  );
  assert.equal(modifiedFor(values, "sonner"), "変更なし（生成直後のまま）");
});
