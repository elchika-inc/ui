import { LoginForm } from "@/blocks/login-05/components/login-form";
import type { PreviewProps } from "@/catalog/preview-types";

export function LoginZeroFivePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="login-05-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}
