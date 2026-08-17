import { LoginForm } from "@/blocks/login-01/components/login-form";
import type { PreviewProps } from "@/catalog/preview-types";
import { cn } from "@/lib/utils";

// 上流 page.tsx のレイアウト枠を isolated 側で再現する。registry:page は standards が
// Next.js を標準スタック外とするため配布しないが、見た目は上流と揃える。
//
// catalog では枠の高さを抑える。min-h-svh を無条件に適用すると、カタログのセル 1 個が
// ビューポート全高になり、同じ行の隣接セルも stretch で引き伸ばされて横断比較が成立しない。
// sidebar.tsx が同じ理由で同じ形の分岐を持つ（block はこの規約に従う）。
export function LoginZeroOnePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <div
      data-slot="login-01-preview"
      data-preview-mode={mode}
      className={cn(
        "flex w-full items-center justify-center p-6 md:p-10",
        catalog ? "h-96 overflow-hidden" : "min-h-svh",
      )}
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
