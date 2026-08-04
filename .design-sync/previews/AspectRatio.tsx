import {
  AspectRatio,
} from "ui-scaffold";

export function Overview() {
  return (
    <div className="max-w-lg p-6">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          16:9 プレビュー
        </div>
      </AspectRatio>
    </div>
  );
}
