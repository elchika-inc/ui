import {
  Spinner,
} from "ui-scaffold";

const spinnerSizes = [
  { label: "小", className: "size-4" },
  { label: "標準", className: "size-6" },
  { label: "大", className: "size-8" },
] as const;

export function Overview() {
  return (
    <section
      data-slot="spinner-preview"
      className="max-w-xl space-y-6 p-6"
      aria-labelledby="spinner-title"
    >
      <div className="space-y-1">
        <h1 id="spinner-title" className="text-base font-medium text-foreground">
          読み込み表示
        </h1>
        <p className="text-sm text-muted-foreground">
          処理中であることを、単独またはラベルと組み合わせて伝えます。
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Spinner className="size-6" />
          <span className="text-sm text-muted-foreground">単独の読み込み表示</span>
        </div>
        <div className="flex items-center gap-3" aria-live="polite">
          <Spinner aria-hidden="true" aria-label={undefined} />
          <span className="text-sm text-muted-foreground">データを同期しています</span>
        </div>
        <div className="flex items-center gap-5">
          {spinnerSizes.map(({ label, className }) => (
            <div key={label} className="flex items-center gap-2">
              <Spinner className={className} aria-label={`${label}の読み込み表示`} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
