import { Badge } from "@/components/ui/badge";

export function BadgePreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Badge>公開中</Badge>
      <Badge variant="secondary">下書き</Badge>
      <Badge variant="destructive">停止中</Badge>
      <Badge variant="outline">審査待ち</Badge>
      <Badge variant="ghost">任意</Badge>
      <Badge
        variant="default"
        render={<a href="#badge-interactive" data-preview-state="interactive-default" />}
      >
        詳細を見る
      </Badge>
    </div>
  );
}
