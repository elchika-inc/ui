import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui-scaffold";

export function Open() {
  return (
    <div className="p-6">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>ダイアログを開く</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>共有設定</DialogTitle>
            <DialogDescription>
              このプロジェクトを閲覧できる相手を選びます。設定は保存した時点で反映されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button>保存する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
