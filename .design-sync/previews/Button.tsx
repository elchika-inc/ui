import { Button } from "ui-scaffold";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button>保存する</Button>
      <Button variant="secondary">キャンセル</Button>
      <Button variant="outline">絞り込み</Button>
      <Button variant="ghost">詳細</Button>
      <Button variant="destructive">削除する</Button>
      <Button variant="link">利用規約</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button size="xs">極小</Button>
      <Button size="sm">小</Button>
      <Button size="default">標準</Button>
      <Button size="lg">大</Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button disabled>送信中</Button>
      <Button variant="outline" disabled>
        編集できません
      </Button>
      <Button variant="destructive" disabled>
        削除できません
      </Button>
    </div>
  );
}

export function OnMutedSurface() {
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-4">
        <Button>muted 面の保存</Button>
        <Button variant="secondary">muted 面のキャンセル</Button>
        <Button variant="destructive">muted 面の削除</Button>
      </div>
    </div>
  );
}
