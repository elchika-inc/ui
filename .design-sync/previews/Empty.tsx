import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "ui-scaffold";

import { Inbox } from "lucide-react";


export function Overview() {
  return (
    <section
      data-slot="empty-preview"
      className="mx-auto max-w-xl p-6"
      aria-labelledby="empty-preview-title"
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle id="empty-preview-title">まだプロジェクトがありません</EmptyTitle>
          <EmptyDescription>
            最初のプロジェクトを作成すると、チームと進捗をここで確認できます。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button data-slot="empty-action">プロジェクトを作成</Button>
        </EmptyContent>
      </Empty>
    </section>
  );
}
