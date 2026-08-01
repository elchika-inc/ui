import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";

const markers = [
  { variant: "default", text: "新しいメッセージがあります" },
  { variant: "separator", text: "2026年8月1日" },
  { variant: "border", text: "更新履歴を確認する" },
] as const;

export function MarkerPreview() {
  return (
    <section
      data-slot="marker-preview"
      className="max-w-xl space-y-4 p-6"
      aria-labelledby="marker-title"
    >
      <h1 id="marker-title" className="text-base font-medium text-foreground">
        更新のお知らせ
      </h1>
      {markers.map(({ variant, text }) => (
        <Marker key={variant} variant={variant} data-preview-variant={variant}>
          {variant === "default" ? <MarkerIcon>●</MarkerIcon> : null}
          <MarkerContent>{text}</MarkerContent>
        </Marker>
      ))}
    </section>
  );
}
