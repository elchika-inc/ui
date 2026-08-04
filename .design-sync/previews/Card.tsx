import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui-scaffold";

export function Standard() {
  return (
    <div className="max-w-lg p-6">
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
          <p>
            デザイントークンと component を同じ registry から配布します。利用側は shadcn CLI
            で取り込み、トークンはそのまま継承されます。
          </p>
        </CardContent>
        <CardFooter>
          <span className="text-muted-foreground">最終更新: 今日</span>
        </CardFooter>
      </Card>
    </div>
  );
}

export function Compact() {
  return (
    <div className="max-w-sm p-6">
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

export function WithActions() {
  return (
    <div className="max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle>公開の確認</CardTitle>
          <CardDescription>この変更は利用者全員へ即座に反映されます</CardDescription>
        </CardHeader>
        <CardContent>
          <p>公開すると registry の配信内容が更新されます。取り消しには再デプロイが必要です。</p>
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap items-center gap-3">
            <Button>公開する</Button>
            <Button variant="outline">下書きに戻す</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
