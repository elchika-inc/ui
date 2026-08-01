import type { PreviewMode } from "@/catalog/preview-types";

export type PreviewSentinelProps = {
  mode: PreviewMode;
  position: "before" | "after";
};

export function PreviewSentinel({ mode, position }: PreviewSentinelProps) {
  if (mode !== "isolated") return null;

  return (
    <button
      type="button"
      data-sentinel={position}
      className="rounded-md border border-border px-3 py-2 text-sm"
    >
      {position === "before" ? "前の操作要素" : "次の操作要素"}
    </button>
  );
}
