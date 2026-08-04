import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  const isolated = mode === "isolated";

  return (
    <div data-slot="alert-dialog-preview" className="flex flex-col gap-4 p-6">
      {isolated && (
        <button type="button" data-sentinel="before">
          前のフォーカス位置
        </button>
      )}
      <AlertDialog defaultOpen={isolated}>
        <AlertDialogTrigger render={<Button variant="outline" />}>
          削除を確認する
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この項目を削除しますか</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。確認後に削除を実行してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction>削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isolated && (
        <button type="button" data-sentinel="after">
          後のフォーカス位置
        </button>
      )}
    </div>
  );
}
