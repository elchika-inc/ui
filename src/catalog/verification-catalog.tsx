import { previewItems } from "@/catalog/previews";

export function VerificationCatalog() {
  return (
    <main
      data-slot="verification-catalog"
      className="min-h-svh bg-background px-6 py-12 text-foreground [&_[data-slot=bubble-preview]_.opacity-70]:opacity-100"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-primary">elchika-inc/ui</p>
          <h1 className="text-3xl font-semibold tracking-tight">カタログ</h1>
          <p className="max-w-3xl text-muted-foreground">
            静的な見た目を横断比較するため、すべての component preview を同じページに描画します。
            overlay はトリガーのみを表示し、開いた状態は隔離プレビューで検証します。
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {previewItems.map(({ name, title, Preview }) => (
            <section
              key={name}
              data-catalog-preview={name}
              className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
            >
              <header className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{name}</p>
              </header>
              <Preview mode="catalog" />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
