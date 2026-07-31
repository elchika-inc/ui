import { Button } from "@/components/ui/button";

export function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <Button>保存する</Button>
      <Button variant="secondary">キャンセル</Button>
      <Button variant="outline">絞り込み</Button>
      <Button variant="ghost">詳細</Button>
      <Button variant="destructive">削除する</Button>
      <Button variant="link">利用規約</Button>
      <Button disabled>送信中</Button>
    </div>
  );
}
