import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export function SonnerPreview() {
  return (
    <div className="p-6">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("保存しました", {
            description: "共有 UI の通知プレビューです。",
            duration: Number.POSITIVE_INFINITY,
          })
        }
      >
        通知を表示
      </Button>
      <Toaster position="top-center" />
    </div>
  );
}
