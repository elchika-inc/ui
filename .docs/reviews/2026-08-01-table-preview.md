# Table preview 実ブラウザ検証

- 検証 SHA: `a4d66c53f761a63309426091bf4149246b7ce7bd`
- Browser: Chrome
- server: `http://127.0.0.1:4332`（固定 SHA の worktree を起動）
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

| route | theme | selector | native semantics / scope | counts | dimensions / overflow | borders / tokens | console |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/preview/table/` | light | `[data-slot="table-preview"]` 1件 | Accessibility tree で table / caption / 3 rowgroup / row / columnheader / cell を確認。`TABLE` / `CAPTION` / `THEAD` / `TBODY` / `TFOOT`、全 `th` の `scope=col` | table/caption/thead/tbody/tfoot=各1、tr=4、th=3、td=8 | scroll container=382px、table=623.49px、scrollWidth=623px、height=186.5px、`overflow-x: auto` | 外枠・footer top border=各1px、`--border=oklch(0.922 0 0)`、`--muted=oklch(0.97 0 0)`、footer background=`oklab(0.97 0 0 / 0.5)` | error/warning 0件 |
| `/preview/table-dark/` | dark | `[data-slot="table-preview"]` 1件 | Accessibility tree で table / caption / 3 rowgroup / row / columnheader / cell を確認。`TABLE` / `CAPTION` / `THEAD` / `TBODY` / `TFOOT`、全 `th` の `scope=col` | table/caption/thead/tbody/tfoot=各1、tr=4、th=3、td=8 | scroll container=382px、table=623.49px、scrollWidth=623px、height=186.5px、`overflow-x: auto` | 外枠・footer top border=各1px、`--border=oklch(1 0 0 / 10%)`、`--muted=oklch(0.269 0 0)`、footer background=`oklab(0.269 0 0 / 0.5)` | error/warning 0件 |

## 証跡

- `2026-08-01-table-preview-light.jpg`: JPEG / JFIF、1512 × 828px、magic bytes `ffd8ff`
- `2026-08-01-table-preview-dark.jpg`: JPEG / JFIF、1512 × 828px、magic bytes `ffd8ff`
