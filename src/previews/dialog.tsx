import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DialogPreview() {
  return (
    <div className="p-6">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>ダイアログを開く</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>共有設定</DialogTitle>
            <DialogDescription>
              ダイアログの見た目と操作を確認するためのプレビューです。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
