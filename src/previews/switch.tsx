import { useState } from "react";

import { Switch } from "@/components/ui/switch";

export function SwitchPreview() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <section
      data-slot="switch-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="switch-preview-title"
    >
      <div className="space-y-1">
        <h1 id="switch-preview-title" className="text-base font-medium text-foreground">
          通知設定
        </h1>
        <p className="text-sm text-muted-foreground">
          クリックとSpaceキーで通知の有効状態を切り替えられます。
        </p>
      </div>

      <div className="grid gap-4 text-sm">
        <label className="flex w-fit items-center gap-3" htmlFor="switch-notifications">
          <Switch
            id="switch-notifications"
            data-preview-switch="enabled"
            checked={notificationsEnabled}
            onCheckedChange={(checked) => setNotificationsEnabled(checked)}
          />
          更新通知
        </label>
        <output
          data-slot="switch-status"
          data-checked={notificationsEnabled}
          aria-live="polite"
          className="text-muted-foreground"
        >
          更新通知: {notificationsEnabled ? "オン" : "オフ"}
        </output>

        <label
          className="flex w-fit items-center gap-3 text-muted-foreground"
          htmlFor="switch-disabled"
        >
          <Switch id="switch-disabled" data-preview-switch="disabled" defaultChecked disabled />
          管理者によって固定
        </label>
      </div>
    </section>
  );
}
