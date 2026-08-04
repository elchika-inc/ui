import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui-scaffold";

const items = [
  ["account", "アカウント設定", "通知とプロフィールの設定を管理します。"],
  ["billing", "請求設定", "支払い方法と請求書を確認できます。"],
  ["security", "セキュリティ", "二段階認証とログイン履歴を管理します。"],
] as const;

export function Overview() {
  const mode = "isolated";
  return (
    <div data-slot="accordion-preview" className="flex max-w-xl flex-col gap-3 p-6">      <Accordion
        defaultValue={mode === "isolated" ? ["account"] : []}
        className="w-full rounded-lg border border-border px-4"
      >
        {items.map(([value, label, description]) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger>{label}</AccordionTrigger>
            <AccordionContent>
              <p>{description}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>    </div>
  );
}
