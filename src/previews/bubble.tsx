import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";

const conversations = [
  { variant: "default", label: "default", message: "送信済みのメッセージです。", align: "end" },
  { variant: "secondary", label: "secondary", message: "相手からの返信です。", align: "start" },
  { variant: "muted", label: "muted", message: "補足のメッセージです。", align: "start" },
  { variant: "tinted", label: "tinted", message: "強調した提案です。", align: "end" },
  { variant: "outline", label: "outline", message: "確認待ちのメッセージです。", align: "start" },
  { variant: "ghost", label: "ghost", message: "システムからのお知らせです。", align: "start" },
  { variant: "destructive", label: "destructive", message: "送信に失敗しました。", align: "end" },
] as const;

export function BubblePreview() {
  return (
    <div data-slot="bubble-preview">
      <BubbleGroup className="max-w-xl p-6">
        {conversations.map(({ variant, label, message, align }, index) => (
          <Bubble key={variant} variant={variant} align={align} data-preview-variant={variant}>
            <BubbleContent>
              <p>{message}</p>
              <p className="mt-1 text-xs opacity-70">{label}</p>
            </BubbleContent>
            {index < 2 ? (
              <BubbleReactions
                align={index === 0 ? "end" : "start"}
                side={index === 0 ? "bottom" : "top"}
              >
                {index === 0 ? "✓" : "👍"}
              </BubbleReactions>
            ) : null}
          </Bubble>
        ))}
        <Bubble variant="default">
          <BubbleContent render={<button type="button" data-preview-state="interactive-default" />}>
            詳細を確認する
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}
