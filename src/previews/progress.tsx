import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

const progressItems = [
  { label: "プロフィールを入力", value: 25 },
  { label: "書類を確認", value: 50 },
  { label: "公開準備を完了", value: 75 },
] as const;

export function ProgressPreview() {
  return (
    <section
      data-slot="progress-preview"
      className="max-w-xl space-y-6 p-6"
      aria-labelledby="progress-title"
    >
      <div className="space-y-1">
        <h1 id="progress-title" className="text-base font-medium text-foreground">
          進行状況
        </h1>
        <p className="text-sm text-muted-foreground">各手順の完了割合を確認できます。</p>
      </div>
      <div className="space-y-5">
        {progressItems.map(({ label, value }) => (
          <Progress key={label} value={value} data-preview-value={value}>
            <ProgressLabel>{label}</ProgressLabel>
            <ProgressValue />
          </Progress>
        ))}
      </div>
    </section>
  );
}
