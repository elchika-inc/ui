# Drawer プレビュー検証

verified_impl_sha: c4ddd8cdeec35fee773aa05a3d25e094edcaf404

検証した実装 commit: `c4ddd8cdeec35fee773aa05a3d25e094edcaf404`

## 検証条件

- fresh build後、`npm run preview -- --host 127.0.0.1 --port 4329`で配信した。
- Chrome の 1512 × 828 px viewportで、hydration完了後に確認した。
- stable selector: `[data-slot="drawer-content"]`。
- `drawer-preview-light.jpg`と`drawer-preview-dark.jpg`はともに JPEG/JFIF、1512 × 828 pxであることを`file`で確認した。

## route × theme

| route | selector / sentinel | Portal・ARIA・背景 | focus / 操作 | 寸法・token・console |
| --- | --- | --- | --- | --- |
| `/preview/drawer/` | content / overlay / portal 各1、before / after sentinel各1 | Popupの`role="dialog"`、`aria-modal`はnull。背景`astro-island`は`aria-hidden="true"`、overlayは`pointer-events: auto` | 初期focusは`drawer-popup`。Tabで`drawer-close`へ移動してtrap内に留まる。EscapeとClose後、補間完了時にtriggerへreturnし、clickで再openする | contentは1512 × 116 px、bodyは`oklch(1 0 0)`。console error / warning 0 |
| `/preview/drawer-dark/` | content / overlay / portal 各1、before / after sentinel各1 | lightと同じ実ARIA・背景状態 | 初期focusは`drawer-popup` | contentは1512 × 116 px、bodyは`oklch(0.145 0 0)`。console error / warning 0 |

Base UIの既存Dialog実測と同じく、`aria-modal`属性や`inert`属性ではなく、focus trap、背景`aria-hidden`、overlayのpointer interceptionをモーダル性の根拠として確認した。

## catalog

`/catalog/`のDrawer sectionではpreview 1、before / after sentinel各0、overlay 0、content 0、triggerの`aria-expanded="false"`を確認した。

## 見た範囲

- 見た: defaultOpen、Portal、overlay、dialog role、背景`aria-hidden`、focus trap、Escape、Close、trigger return、click再open、light / dark token、寸法、catalog閉状態、console、JPEG実体。
- 見ていない: swipe gesture、nested Drawer、非modal mode、狭幅viewport、network。
