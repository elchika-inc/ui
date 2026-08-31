verified_impl_sha: 5648110e8f45d3b32a257d1250d1fa044ddba5e1

# InputGroup preview 実ブラウザ検証（disabled state 追補）

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npm run preview -- --host 127.0.0.1 --port 4382` で配信した。
- Chrome で light / dark の隔離 preview を開き、`[data-slot="input-group"][data-preview-state="disabled"]` と既存の非 disabled group を比較した。
- 追加 control の `disabled` attribute と DOM property を確認し、disabled / 非 disabled の group それぞれで `background-color` と `opacity` を `getComputedStyle` から取得した。
- disabled group が見える状態でスクリーンショットを撮影した。

## 実測結果

| theme / route | control | 非 disabled group `background-color` / `opacity` | disabled group `background-color` / `opacity` | console error |
| --- | --- | --- | --- | ---: |
| light / `/preview/input-group/` | `<input disabled>`、DOM property `true` | `rgb(255, 255, 255)` / `1` | `rgb(237, 238, 240)` / `0.4` | 0 |
| dark / `/preview/input-group-dark/` | `<input disabled>`、DOM property `true` | `rgb(28, 31, 38)` / `1` | `rgb(38, 42, 51)` / `0.4` | 0 |

両 theme とも disabled control により group の背景が `bg-muted` 相当へ変化し、group の opacity が `opacity-disabled` 相当の `0.4` へ変化した。

`InputGroupAddon` の `group-data-[disabled=true]/input-group:opacity-50` は、親 `InputGroup` 自身の `data-disabled="true"` を必要とする別契約である。disabled control から親へ `data-disabled` を伝播する実装はなく、今回の DOM でも親の `data-disabled` は `null` だったため、本証跡の合格対象には含めない。

本証跡はトップレベル、`brand-token-migration/`、`recheck-3df37ed/` にある既存証跡を変更・置換せず、disabled state の到達性だけを追補する。

## 証跡画像

- light: `2026-08-31-input-group-preview-light.jpg` — 1716 × 1289 px / JPEG（magic bytes `FF D8 FF`）/ disabled 表示
- dark: `2026-08-31-input-group-preview-dark.jpg` — 1716 × 1233 px / JPEG（magic bytes `FF D8 FF`）/ disabled 表示
