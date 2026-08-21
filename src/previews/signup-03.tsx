import { GalleryVerticalEndIcon } from "lucide-react";
import { SignupForm } from "@/blocks/signup-03/components/signup-form";
import type { PreviewProps } from "@/catalog/preview-types";

export function SignupZeroThreePreview({ mode = "isolated" }: PreviewProps) {
  const catalog = mode === "catalog";

  return (
    <section
      data-slot="signup-03-preview"
      data-preview-mode={mode}
      className={catalog ? "h-96 overflow-hidden rounded-lg border" : "min-h-svh overflow-hidden"}
    >
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            Acme
          </a>
          <SignupForm />
        </div>
      </div>
    </section>
  );
}
