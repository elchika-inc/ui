import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CardPreview() {
  return (
    <div className="grid max-w-2xl gap-6 p-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>プロジェクト概要</CardTitle>
          <CardDescription>共有 UI 基盤の現在の状態</CardDescription>
          <CardAction>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              公開中
            </span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>デザイントークンと component を同じ registry から配布します。</p>
        </CardContent>
        <CardFooter>
          <span className="text-muted-foreground">最終更新: 今日</span>
        </CardFooter>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>小さいカード</CardTitle>
          <CardDescription>密度を上げた表示</CardDescription>
        </CardHeader>
        <CardContent>
          <p>コンパクトな情報表示に利用します。</p>
        </CardContent>
      </Card>
    </div>
  );
}
