import {
  Toggle,
} from "ui-scaffold";

import { useState } from "react";


const variants = ["default", "outline"] as const;
const sizes = ["sm", "default", "lg"] as const;

export function Overview() {
  const [pressed, setPressed] = useState(false);

  return (
    <section
      data-slot="toggle-preview"
      className="grid max-w-md gap-6 p-6"
      aria-labelledby="toggle-preview-title"
    >
      <div className="space-y-1">
        <h1 id="toggle-preview-title" className="text-base font-medium text-foreground">
          表示設定
        </h1>
        <p className="text-sm text-muted-foreground">
          クリックとSpaceキーで押下状態を切り替えられます。
        </p>
      </div>

      <div className="grid gap-3 text-sm">
        <h2 className="font-medium text-foreground">制御状態</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle data-preview-toggle="controlled" pressed={pressed} onPressedChange={setPressed}>
            お気に入り
          </Toggle>
          <Toggle data-preview-toggle="disabled" disabled>
            無効
          </Toggle>
        </div>
        <output
          data-slot="toggle-status"
          data-pressed={pressed}
          aria-live="polite"
          className="text-muted-foreground"
        >
          お気に入り: {pressed ? "オン" : "オフ"}
        </output>
      </div>

      <div className="grid gap-3 text-sm">
        <h2 className="font-medium text-foreground">Variants</h2>
        <div className="flex flex-wrap items-center gap-3">
          {variants.map((variant) => (
            <Toggle key={variant} data-preview-toggle={`variant-${variant}`} variant={variant}>
              {variant}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        <h2 className="font-medium text-foreground">Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <Toggle key={size} data-preview-toggle={`size-${size}`} size={size}>
              {size}
            </Toggle>
          ))}
        </div>
      </div>
    </section>
  );
}
