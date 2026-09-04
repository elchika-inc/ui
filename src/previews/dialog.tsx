import type { PreviewProps } from "@/catalog/preview-types";
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

export function DialogPreview({ mode = "isolated" }: PreviewProps) {
  return (
    <div className="flex flex-wrap gap-3 p-6">
      <Dialog defaultOpen={mode === "isolated"}>
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
      <Dialog modal={false}>
        <DialogTrigger render={<Button variant="outline" />}>補足を開く</DialogTrigger>
        <DialogContent modal={false} closeLabel="補足を閉じる">
          <DialogHeader>
            <DialogTitle>補足</DialogTitle>
            <DialogDescription>非モーダルの Dialog です。背景は暗転しません。</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton closeLabel="補足を閉じる" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
