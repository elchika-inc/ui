verified_impl_sha: 59a5d6d5a4c7ee14eb37189705ee8222c05e1a5f

# item のモーショントークン移行検証

- 成功基準: `.docs/plans/2026-09-15-overlay-motion.md` §4・§Eおよび司令塔裁定。
- 実測日: 2026-09-16（JST）。headless Chromium 153.0.8010.36、1440×900、deviceScaleFactor 1、build済みサイトをport 4395で配信。
- 変更: duration-100 → duration-fast。
- 操作と共通環境・検証限界は[共有report](report.md)。全画像の実体一覧は[image-manifest.json](image-manifest.json)。

| theme | route | selector | 件数 | HTTP | console / favicon / pageerror | 画像 |
|---|---|---|---:|---:|---|---|
| light | `/preview/item/` | `[data-slot="item-preview"]` | 1 | 200 | 0 / 0 / 0 | [2026-09-16-item-preview-light.jpg](2026-09-16-item-preview-light.jpg) |
| dark | `/preview/item-dark/` | `[data-slot="item-preview"]` | 1 | 200 | 0 / 0 / 0 | [2026-09-16-item-preview-dark.jpg](2026-09-16-item-preview-dark.jpg) |

両テーマでselectorがvisible、dark classがテーマと一致、横overflowなし、dev toolbar 0件。JPEGは各1440×900、署名FF D8 FF、decode成功。画像の対象部品を目視した。

## computed styleの生値

```json
[
  {
    "theme": "light",
    "computed": [
      {
        "tag": "DIV",
        "slot": "item",
        "duration": "0.12s",
        "timing": "cubic-bezier(0.2, 0, 0, 1)",
        "property": "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to",
        "animation": "none",
        "animationDuration": "0s",
        "animationTiming": "ease",
        "active": null
      },
      {
        "tag": "A",
        "slot": "item",
        "duration": "0.12s",
        "timing": "cubic-bezier(0.2, 0, 0, 1)",
        "property": "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to",
        "animation": "none",
        "animationDuration": "0s",
        "animationTiming": "ease",
        "active": null
      }
    ]
  },
  {
    "theme": "dark",
    "computed": [
      {
        "tag": "DIV",
        "slot": "item",
        "duration": "0.12s",
        "timing": "cubic-bezier(0.2, 0, 0, 1)",
        "property": "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to",
        "animation": "none",
        "animationDuration": "0s",
        "animationTiming": "ease",
        "active": null
      },
      {
        "tag": "A",
        "slot": "item",
        "duration": "0.12s",
        "timing": "cubic-bezier(0.2, 0, 0, 1)",
        "property": "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to",
        "animation": "none",
        "animationDuration": "0s",
        "animationTiming": "ease",
        "active": null
      }
    ]
  }
]
```

測定段階はDOMと画像の存在、navigationと操作の実行、上記computed styleの動作。popup開閉属性（data-starting-style / data-ending-style / data-instant）は担当変更に該当しないためN/A。
