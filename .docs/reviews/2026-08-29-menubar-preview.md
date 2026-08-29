verified_impl_sha: a3d9dcdcd5afe97936ef5cb3c04e75d9c95bd1cb

# Menubar preview 実ブラウザ検証（destructive state 追補）

## 検証方法

- `npm run build:site` が exit 0 になった生成物を、`npm run preview -- --host 127.0.0.1 --port 4377` で配信した。
- Chrome で light / dark の隔離 preview を開き、`defaultOpen` で開いた「ファイル」menu を検証した。
- `[data-slot="menubar-item"][data-variant="destructive"]` を対象に、focus 前後の `color` と `background-color` を `getComputedStyle` で取得した。
- menu content の初期 focus から実キーボード操作の `ArrowDown` を7回送り、destructive item「削除」へ focus した。

## 実測結果

| theme / route | DOM | focus 前 `color` | focus 前 `background-color` | focus 操作 | focus 後 `color` | focus 後 `background-color` | console error |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| light / `/preview/menubar/` | `data-variant="destructive"` 1件 | `rgb(178, 51, 56)` | `rgba(0, 0, 0, 0)` | `ArrowDown` × 7 | `rgb(255, 255, 255)` | `rgb(178, 51, 56)` | 0 |
| dark / `/preview/menubar-dark/` | `data-variant="destructive"` 1件 | `rgb(241, 117, 121)` | `rgba(0, 0, 0, 0)` | `ArrowDown` × 7 | `rgb(28, 31, 38)` | `rgb(241, 117, 121)` | 0 |

両 theme とも destructive item 自身が `document.activeElement` になり、focus 前後で `color` と `background-color` が変化した。

既存の `.docs/reviews/2026-08-02-menubar-preview.md` は menu 全体の既存契約を記録する証跡であり、本証跡はそれを置き換えず destructive state の到達性を追補する。

既存の `.docs/reviews/brand-token-migration/2026-08-02-menubar-preview.md` も置き換えず、本証跡は destructive state の到達性のみを追補する。

## 証跡画像

- light: `2026-08-29-menubar-preview-light.jpg` — 1716 × 1289 px / JPEG（magic bytes `FF D8 FF`）
- dark: `2026-08-29-menubar-preview-dark.jpg` — 1716 × 1289 px / JPEG（magic bytes `FF D8 FF`）
