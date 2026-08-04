import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "ui-scaffold";

import { useState } from "react";


const fruitNames: Record<string, string> = {
  apple: "りんご",
  grape: "ぶどう",
  orange: "オレンジ",
};

export function Overview() {
  const [fruit, setFruit] = useState("apple");
  const [changeCount, setChangeCount] = useState(0);

  return (
    <section
      data-slot="native-select-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="native-select-preview-title"
    >
      <div className="space-y-1">
        <h1 id="native-select-preview-title" className="text-base font-medium text-foreground">
          選択メニュー
        </h1>
        <p className="text-sm text-muted-foreground">
          native select のサイズ、状態、キーボード操作を確認できます。
        </p>
      </div>

      <div className="grid gap-5 text-sm">
        <div className="grid gap-2">
          <label className="font-medium text-foreground" htmlFor="native-select-default">
            果物
          </label>
          <NativeSelect
            id="native-select-default"
            data-preview-native-select="default"
            value={fruit}
            onChange={(event) => {
              setFruit(event.currentTarget.value);
              setChangeCount((count) => count + 1);
            }}
          >
            <NativeSelectOption value="apple">りんご</NativeSelectOption>
            <NativeSelectOption value="grape">ぶどう</NativeSelectOption>
            <NativeSelectOption value="orange">オレンジ</NativeSelectOption>
          </NativeSelect>
          <output
            className="text-muted-foreground"
            aria-live="polite"
            data-slot="native-select-change-output"
            data-selected-value={fruit}
          >
            現在: {fruitNames[fruit]}（変更 {changeCount} 回）
          </output>
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-foreground" htmlFor="native-select-small">
            小さいサイズ
          </label>
          <NativeSelect id="native-select-small" data-preview-native-select="small" size="sm">
            <NativeSelectOptGroup label="デスクトップ">
              <NativeSelectOption value="linux">Linux</NativeSelectOption>
              <NativeSelectOption value="mac">macOS</NativeSelectOption>
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label="モバイル">
              <NativeSelectOption value="android">Android</NativeSelectOption>
              <NativeSelectOption value="ios">iOS</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-muted-foreground" htmlFor="native-select-disabled">
            無効
          </label>
          <NativeSelect
            id="native-select-disabled"
            data-preview-native-select="disabled"
            defaultValue="locked"
            disabled
          >
            <NativeSelectOption value="locked">変更できません</NativeSelectOption>
            <NativeSelectOption value="other">別の値</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-destructive" htmlFor="native-select-invalid">
            入力エラー
          </label>
          <NativeSelect
            id="native-select-invalid"
            data-preview-native-select="invalid"
            defaultValue="expired"
            aria-invalid="true"
            aria-describedby="native-select-invalid-message"
          >
            <NativeSelectOption value="expired">期限切れ</NativeSelectOption>
            <NativeSelectOption value="active">有効</NativeSelectOption>
          </NativeSelect>
          <p id="native-select-invalid-message" className="text-destructive">
            有効な状態を選択してください。
          </p>
        </div>
      </div>
    </section>
  );
}
