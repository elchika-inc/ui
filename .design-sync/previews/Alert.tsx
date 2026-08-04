import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "ui-scaffold";

export function Overview() {
  return (
    <div className="grid max-w-xl gap-4 p-6">
      <Alert>
        <AlertTitle>同期が完了しました</AlertTitle>
        <AlertDescription>共有 UI の最新データを取得しました。</AlertDescription>
        <AlertAction>
          <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            完了
          </span>
        </AlertAction>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>接続を確認してください</AlertTitle>
        <AlertDescription>
          registry に接続できませんでした。しばらくしてから再試行してください。
        </AlertDescription>
      </Alert>
    </div>
  );
}
