import { useState } from "react";

import type { PreviewProps } from "@/catalog/preview-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastToaster, toast } from "@/components/ui/toast";

export function ToastPreview(_props: PreviewProps) {
  const [actionCount, setActionCount] = useState(0);

  const addActionToast = () => {
    let id = "";
    id = toast.add({
      title: "変更を保存しました",
      description: "必要なら操作を元に戻せます。",
      type: "success",
      timeout: 0,
      actionProps: {
        children: "元に戻す",
        onClick: () => {
          setActionCount((count) => count + 1);
          toast.close(id);
        },
      },
    });
  };

  const addMultipleToasts = () => {
    for (const index of [1, 2, 3, 4]) {
      toast.add({
        title: `通知 ${index}`,
        description: `複数通知の順序と上限を確認します。`,
        type: "info",
        timeout: 0,
      });
    }
  };

  return (
    <ToastToaster timeout={1800} limit={3}>
      <section data-slot="toast-preview" className="flex max-w-xl flex-col gap-4 p-6">
        <div className="flex flex-wrap gap-2">
          <Button
            data-slot="toast-add"
            onClick={() =>
              toast.add({
                title: "通知を追加しました",
                description: "通常の自動消滅を確認します。",
                type: "info",
              })
            }
          >
            通知を追加
          </Button>
          <Button
            data-slot="toast-hover-add"
            variant="outline"
            onClick={() =>
              toast.add({
                title: "ホバーで一時停止",
                description: "ポインターを重ねて自動消滅を確認します。",
                type: "warning",
                timeout: 1200,
              })
            }
          >
            ホバー検証通知
          </Button>
          <Button data-slot="toast-action-add" variant="outline" onClick={addActionToast}>
            Action付き通知
          </Button>
          <Button data-slot="toast-multiple-add" variant="outline" onClick={addMultipleToasts}>
            複数通知
          </Button>
        </div>
        <label htmlFor="toast-background-input" className="flex max-w-sm flex-col gap-1 text-sm">
          背景入力
          <Input
            id="toast-background-input"
            data-slot="toast-background-input"
            defaultValue="通知中も操作できます"
          />
        </label>
        <output data-slot="toast-action-count" className="text-sm text-muted-foreground">
          Action実行: {actionCount}回
        </output>
      </section>
    </ToastToaster>
  );
}
