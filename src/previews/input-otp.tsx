import { useState } from "react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function InputOTPPreview() {
  const [value, setValue] = useState("");

  return (
    <section
      data-slot="input-otp-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="input-otp-preview-title"
    >
      <div className="space-y-1">
        <h1 id="input-otp-preview-title" className="text-base font-medium text-foreground">
          確認コード
        </h1>
        <p className="text-sm text-muted-foreground">
          6桁の確認コードを入力すると、現在位置と入力値が更新されます。
        </p>
      </div>

      <div className="grid gap-3 text-sm">
        <label className="font-medium text-foreground" htmlFor="input-otp-default">
          認証コード
        </label>
        <div className="flex items-center gap-3">
          <button
            data-preview-otp-control="before"
            className="text-muted-foreground underline"
            type="button"
          >
            前のcontrol
          </button>
          <InputOTP
            id="input-otp-default"
            data-preview-input-otp="default"
            maxLength={6}
            pattern="^[0-9]+$"
            value={value}
            onChange={setValue}
            aria-describedby="input-otp-status"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <button
            data-preview-otp-control="after"
            className="text-muted-foreground underline"
            type="button"
          >
            次のcontrol
          </button>
        </div>
        <output
          id="input-otp-status"
          data-slot="input-otp-status"
          data-value={value}
          aria-live="polite"
          className="text-muted-foreground"
        >
          現在のコード: {value || "未入力"}
        </output>
      </div>
    </section>
  );
}
