export function parseModifiedInput(raw) {
  if (!raw?.trim()) {
    throw new Error(
      "PROVENANCE_MODIFIED に component 名をキー、実際の変更内容を値とする JSON object を渡すこと",
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("PROVENANCE_MODIFIED は JSON object で渡すこと");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("PROVENANCE_MODIFIED は JSON object で渡すこと");
  }

  for (const [name, modified] of Object.entries(parsed)) {
    if (!name.trim() || typeof modified !== "string" || !modified.trim()) {
      throw new Error("PROVENANCE_MODIFIED の component 名と変更内容は空にできない");
    }
  }

  return parsed;
}

export function modifiedFor(values, name) {
  const modified = values[name];
  if (typeof modified !== "string" || !modified.trim()) {
    throw new Error(`${name}: PROVENANCE_MODIFIED に実際の変更内容が無い`);
  }
  return modified.trim();
}
