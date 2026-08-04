import {
  Slider,
} from "ui-scaffold";

import { useState } from "react";
export function Overview() {
  const [value, setValue] = useState([40]);
  return (
    <section
      data-slot="slider-preview"
      className="max-w-sm space-y-5 p-6"
      aria-labelledby="slider-title"
    >
      <div>
        <h1 id="slider-title" className="text-base font-medium">
          音量
        </h1>
        <p className="text-sm text-muted-foreground">矢印キーで調整できます。</p>
      </div>
      <label htmlFor="slider-default" className="font-medium">
        音量
      </label>
      <Slider
        id="slider-default"
        value={value}
        onValueChange={(nextValue) =>
          setValue(Array.isArray(nextValue) ? [...nextValue] : [nextValue])
        }
        aria-labelledby="slider-title"
      />
      <output data-slot="slider-status" data-value={value[0]}>
        {value[0]}
      </output>
      <Slider defaultValue={[30]} disabled aria-label="無効な音量" />
    </section>
  );
}
