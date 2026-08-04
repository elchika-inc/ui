import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "ui-scaffold";

const actionClassName = "text-xs text-primary underline underline-offset-3 hover:text-foreground";

export function Overview() {
  return (
    <section
      data-slot="message-preview"
      className="max-w-xl space-y-4 p-6"
      aria-labelledby="message-preview-title"
    >
      <h1 id="message-preview-title" className="text-base font-medium text-foreground">
        プロジェクトの会話
      </h1>
      <MessageGroup aria-label="プロジェクトの会話">
        <Message align="start" data-preview-variant="assistant">
          <MessageAvatar aria-label="アシスタントのアバター">AI</MessageAvatar>
          <MessageContent>
            <MessageHeader>
              <span>アシスタント</span>
              <time className="ml-2" dateTime="2026-08-01T09:41:00+09:00">
                09:41
              </time>
            </MessageHeader>
            <p className="rounded-lg bg-muted px-3 py-2 text-foreground">
              設計レビューの準備ができました。確認したい項目を共有します。
            </p>
            <MessageFooter>
              <button type="button" className={actionClassName}>
                コピー
              </button>
            </MessageFooter>
          </MessageContent>
        </Message>
        <Message align="end" data-preview-variant="user">
          <MessageAvatar aria-label="あなたのアバター">あ</MessageAvatar>
          <MessageContent>
            <MessageHeader>
              <span>あなた</span>
              <time className="ml-2" dateTime="2026-08-01T09:43:00+09:00">
                09:43
              </time>
            </MessageHeader>
            <p className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              ありがとうございます。アクセシビリティの確認もお願いします。
            </p>
            <MessageFooter>
              <button type="button" className={actionClassName}>
                編集
              </button>
            </MessageFooter>
          </MessageContent>
        </Message>
        <Message align="start" data-preview-variant="ghost" data-variant="ghost">
          <MessageAvatar aria-label="システムのアバター">●</MessageAvatar>
          <MessageContent>
            <MessageHeader>
              <span>システム</span>
              <time className="ml-2" dateTime="2026-08-01T09:44:00+09:00">
                09:44
              </time>
            </MessageHeader>
            <p className="text-muted-foreground">会話の参加者が全員オンラインです。</p>
            <MessageFooter>
              <button type="button" className={actionClassName}>
                詳細
              </button>
            </MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    </section>
  );
}
