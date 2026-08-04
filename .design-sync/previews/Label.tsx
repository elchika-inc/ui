import {
  Label,
} from "ui-scaffold";

export function Overview() {
  return (
    <div className="grid max-w-sm gap-6 p-6">
      <div className="grid gap-2">
        <Label htmlFor="label-email">メールアドレス</Label>
        <input
          id="label-email"
          type="email"
          placeholder="name@example.com"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        />
      </div>
      <div className="group grid gap-2" data-disabled="true">
        <Label htmlFor="label-disabled">無効な項目</Label>
        <input
          id="label-disabled"
          type="text"
          disabled
          value="編集できません"
          readOnly
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm opacity-50"
        />
      </div>
    </div>
  );
}
