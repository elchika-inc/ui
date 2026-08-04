import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "ui-scaffold";

import { useState } from "react";


const initialMessages = [
  { id: "message-1", text: "プロジェクトの目的を確認しました。" },
  { id: "message-2", text: "デザイントークンを先に同期します。" },
  { id: "message-3", text: "Button の公開型を確認しました。" },
  { id: "message-4", text: "Light テーマの表示を検証します。" },
  { id: "message-5", text: "Dark テーマでも同じ操作を確認します。" },
  { id: "message-6", text: "キーボードフォーカスを測定しました。" },
  { id: "message-7", text: "配布物に法務ファイルが含まれています。" },
  { id: "message-8", text: "preview の hydration を確認しました。" },
];

export function Overview() {
  const [messages, setMessages] = useState(initialMessages);

  return (
    <section
      data-slot="message-scroller-preview"
      className="flex w-full max-w-xl flex-col gap-3 p-6"
    >
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="h-72 rounded-lg border border-border bg-card text-card-foreground">
          <MessageScrollerViewport aria-label="会話履歴">
            <MessageScrollerContent className="p-4">
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  className="rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  {message.text}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label="末尾へ移動" />
        </MessageScroller>
      </MessageScrollerProvider>
      <Button
        data-slot="message-scroller-add"
        className="w-fit"
        onClick={() =>
          setMessages((current) => {
            const sequence = current.length - initialMessages.length + 1;
            return [
              ...current,
              { id: `message-added-${sequence}`, text: `追加メッセージ ${sequence}` },
            ];
          })
        }
      >
        メッセージを追加
      </Button>
    </section>
  );
}
