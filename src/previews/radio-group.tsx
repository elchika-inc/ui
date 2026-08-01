import { useState } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const plans = [
  { value: "starter", label: "スターター", description: "個人向けの基本プラン" },
  { value: "team", label: "チーム", description: "共同作業向けのプラン" },
  { value: "business", label: "ビジネス", description: "組織向けのプラン" },
  {
    value: "enterprise",
    label: "エンタープライズ",
    description: "現在は選択できません",
    disabled: true,
  },
];

export function RadioGroupPreview() {
  const [plan, setPlan] = useState("starter");

  return (
    <section
      data-slot="radio-group-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="radio-group-preview-title"
    >
      <div className="space-y-1">
        <h1 id="radio-group-preview-title" className="text-base font-medium text-foreground">
          プランを選択
        </h1>
        <p className="text-sm text-muted-foreground">
          ラジオボタンの選択、キーボード移動、無効項目を確認できます。
        </p>
      </div>

      <div className="grid gap-3 text-sm">
        <p id="radio-group-label" className="font-medium text-foreground">
          契約プラン
        </p>
        <RadioGroup
          value={plan}
          onValueChange={setPlan}
          aria-labelledby="radio-group-label"
          data-preview-radio-group="plans"
        >
          {plans.map(({ value, label, description, disabled }) => (
            <label
              className="flex items-start gap-3 text-foreground has-disabled:cursor-not-allowed has-disabled:text-muted-foreground"
              htmlFor={`radio-group-${value}`}
              key={value}
            >
              <RadioGroupItem id={`radio-group-${value}`} value={value} disabled={disabled} />
              <span className="grid gap-0.5">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <output
          data-slot="radio-group-status"
          data-value={plan}
          aria-live="polite"
          className="text-muted-foreground"
        >
          現在のプラン: {plans.find((item) => item.value === plan)?.label}
        </output>
      </div>
    </section>
  );
}
