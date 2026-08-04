import {
  Input,
} from "ui-scaffold";

export function Overview() {
  return (
    <div className="grid max-w-sm gap-4 p-6">
      <label className="grid gap-2 text-sm" htmlFor="input-value">
        入力済み
        <Input id="input-value" defaultValue="入力済みの値" />
      </label>
      <label className="grid gap-2 text-sm" htmlFor="input-disabled">
        無効
        <Input id="input-disabled" defaultValue="編集できない値" disabled />
      </label>
      <label className="grid gap-2 text-sm" htmlFor="input-invalid">
        入力エラー
        <Input id="input-invalid" defaultValue="不正な値" aria-invalid="true" />
      </label>
    </div>
  );
}
