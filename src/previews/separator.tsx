import { Separator } from "@/components/ui/separator";

export function SeparatorPreview() {
  return (
    <div className="grid max-w-lg gap-6 p-6">
      <section className="grid gap-3" aria-labelledby="separator-horizontal-heading">
        <h2 id="separator-horizontal-heading" className="text-sm font-medium">
          水平
        </h2>
        <p className="text-sm text-muted-foreground">上下の内容を区切る水平線</p>
        <Separator />
        <p className="text-sm text-muted-foreground">区切り線より下の内容</p>
      </section>
      <section className="grid gap-3" aria-labelledby="separator-vertical-heading">
        <h2 id="separator-vertical-heading" className="text-sm font-medium">
          垂直
        </h2>
        <div className="flex h-10 items-center gap-4 text-sm">
          <span>左</span>
          <Separator orientation="vertical" />
          <span>右</span>
        </div>
      </section>
    </div>
  );
}
