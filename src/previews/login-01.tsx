import { LoginForm } from "@/blocks/login-01/components/login-form";
import type { PreviewProps } from "@/catalog/preview-types";

// 上流 page.tsx のレイアウト枠をここで再現する。registry:page は standards が
// Next.js を標準スタック外とするため配布しないが、見た目は上流と揃える。
export function LoginZeroOnePreview(_props: PreviewProps) {
  return (
    <div
      data-slot="login-01-preview"
      className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
