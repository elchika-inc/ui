# 動作検証レポート: Task 16 バッチ末尾 catalog 横断検証

verified_impl_sha: 03f451135830675652a5c1df08d92c31cab5226c

## 結論

製品実装固定 SHA `03f451135830675652a5c1df08d92c31cab5226c` を対象に再検証し、Task 16 の catalog 横断検証基準をすべて満たした。

- fresh `npm run build`: exit `0`、registry 42件、Astro 87 pages
- `src/previews/*.tsx` から機械導出した期待集合: 42件（0件 guard 通過）
- Light / Dark の hydration 後 catalog DOM: 各42 section
- 期待集合との差分: Light / Dark とも欠落0、余剰0
- 正の幅・高さを持つ可視section: Light / Dark とも42/42
- 今回追加した12件は Light / Dark とも sentinel 0
- Portal 8件は Light / Dark とも閉状態で、Portal content / overlay 0
- Accordion / Collapsible は閉状態
- Scroll Area / Resizable は必須slotが存在し、正の矩形を持つ
- Context Menu trigger は Light / Dark とも `BUTTON` で、正の矩形を持つ
- console error / warning: Light / Dark とも0
- full-page JPEG 2件は取得bytesを無変換で保存し、magic・拡張子・寸法を確認済み
- Chrome、preview server、repository由来のAstro process、portを終了済み

## 実行環境

- repository: `/Users/nishikawa/projects/elchika-inc/ui`
- 検証開始時HEAD: `433553de43e8d10e1385a5b882c5eba725346927`
- 検証終了時HEAD: `433553de43e8d10e1385a5b882c5eba725346927`
- 製品実装固定SHA: `03f451135830675652a5c1df08d92c31cab5226c`
- host / port: `127.0.0.1:4319`
- Light URL: `http://127.0.0.1:4319/catalog/`
- Dark URL: `http://127.0.0.1:4319/catalog-dark/`
- 開始worktree: clean
- 検証中の親セッションによる手順・検査器変更は、本検証の対象外として保持した

## 成功基準

1. previewファイル名から期待component集合を機械導出し、0件なら失敗する。
2. hydration後の `[data-catalog-preview]` 集合が期待集合と完全一致する。
3. 全sectionが正の幅・高さを持ち、可視である。
4. hydration完了を `astro-island` の `ssr` 属性除去で確認する。
5. Light / Dark のroot classと背景色・前景色がテーマに対応する。
6. 今回の12件ではcatalog modeのsentinelが0件である。
7. Portal 8件ではcomponent固有slotのcontent / popup / viewport / overlayが0件である。
8. Portal 8件のtriggerが開状態属性を持たない。
9. Accordion / Collapsibleが閉状態である。
10. Scroll Area / Resizableの必須slotが存在し、正の矩形を持つ。
11. console error / warningが0件である。
12. full-page画像の実bytes、magic、拡張子、寸法が一致する。
13. 検証後にブラウザ、server、process、portを終了する。

## 期待集合とcatalog DOM

期待集合は `src/previews/*.tsx` のうち補助module `preview-theme.ts` を除く通常componentファイルから導出した。

```text
accordion, alert, aspect-ratio, avatar, badge, breadcrumb, bubble, button,
card, checkbox, collapsible, context-menu, dialog, drawer, dropdown-menu,
empty, hover-card, input, input-otp, kbd, label, marker, message,
native-select, navigation-menu, popover, progress, radio-group, resizable,
scroll-area, select, separator, skeleton, slider, sonner, spinner, switch,
table, tabs, textarea, toggle, tooltip
```

| 検査 | Light | Dark |
|---|---:|---:|
| 期待集合 | 42 | 42 |
| hydration後section | 42 | 42 |
| 欠落 | 0 | 0 |
| 余剰 | 0 | 0 |
| 可視section | 42/42 | 42/42 |
| `astro-island[ssr]` | 0 | 0 |
| console error | 0 | 0 |
| console warning | 0 | 0 |

## 今回追加した12件

| component | Light sentinel | Dark sentinel | 閉状態・静的表示の確認 |
|---|---:|---:|---|
| Accordion | 0 | 0 | trigger `aria-expanded=false`、展開content 0 |
| Collapsible | 0 | 0 | trigger `aria-expanded=false`、展開content 0 |
| Scroll Area | 0 | 0 | 必須slotが存在し正の矩形 |
| Resizable | 0 | 0 | 必須slotが存在し正の矩形 |
| Context Menu | 0 | 0 | Portal 0、triggerは `BUTTON` |
| Dropdown Menu | 0 | 0 | Portal 0、閉状態 |
| Drawer | 0 | 0 | Portal / overlay 0、閉状態 |
| Hover Card | 0 | 0 | Portal 0、閉状態 |
| Navigation Menu | 0 | 0 | viewport 0、閉状態 |
| Popover | 0 | 0 | Portal 0、閉状態 |
| Select | 0 | 0 | popup 0、閉状態 |
| Tooltip | 0 | 0 | popup 0、閉状態 |

Context Menu triggerの実測値は、Light / Darkとも `tagName=BUTTON`、`type=button`、幅 `360.664px`、高さ `118px` だった。

Scroll Areaでは `scroll-area`、`scroll-area-viewport`、`scroll-area-content`、`scroll-area-scrollbar`、`scroll-area-thumb`、`scroll-area-corner` を確認した。Resizableでは `resizable-panel-group`、`resizable-panel`、`resizable-handle` を確認した。

## 画像証跡

Chromeのfull-page screenshot APIが返したbytesを変換せず `.jpg` として保存した。API名から形式を仮定せず、実bytesのJPEG/JFIF magicと拡張子の対応を確認した。

| ファイル | bytes | 寸法 | magic | SHA-256 |
|---|---:|---:|---|---|
| `batch-overlay-catalog-light.jpg` | 458,033 | 1512×5833 | `ffd8ffe000104a464946000101000001` | `8688586b47858609b9c87c18cc6630be61d00f675c334fe30554c00b8e6f102e` |
| `batch-overlay-catalog-dark.jpg` | 462,815 | 1512×5833 | `ffd8ffe000104a464946000101000001` | `bd21bbf521f1bade692c17e7e5d1c7beea6018bda9b70038d769547b757e57c7` |

## 再現手順

```bash
npm run build
npx astro preview --host 127.0.0.1 --port 4319
```

1. `http://127.0.0.1:4319/catalog/` と `http://127.0.0.1:4319/catalog-dark/` をChromeで開く。
2. hydration後に期待集合、section集合、矩形、theme、sentinel、component固有slot、trigger属性、consoleを評価する。
3. full-page screenshotを取得し、bytesを無変換で `.jpg` に保存してmagic・寸法・hashを検査する。
4. Chromeタブを閉じ、Astro previewを停止し、repository由来process・port・HTTP疎通を確認する。

## cleanup実測

- Chromeタブ: close済み
- `npx astro dev stop`: exit `0`（running serverなし）
- repository由来Astro process: 0
- `lsof` によるport 4319 listener確認: 0件（`lsof` exit `1`）
- `curl http://127.0.0.1:4319/catalog/`: exit `7`

## 固定SHAと差分

本報告は製品実装固定 SHA `03f451135830675652a5c1df08d92c31cab5226c` を検証対象とする。検証開始時HEADまでの差分は証跡Markdownと画像のみで、component、preview、registry、catalog実装に差分がないことを対象path指定の `git diff` で確認した。

## 未実測

- 本検証はcatalog modeの閉状態・静的表示を対象とし、isolated modeの操作は各component固有の証跡を正本とする。
- ブラウザ・OSの組み合わせを変えた互換性検証は実施していない。
