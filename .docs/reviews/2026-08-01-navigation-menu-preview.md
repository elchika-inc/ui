# Navigation Menu 実ブラウザ検証

## 対象

- implementation SHA: `feceb58319bd7b3e38b645a2baa60b7cf5bfae18`
- 検証URL: `http://127.0.0.1:4328/preview/navigation-menu/`、`/preview/navigation-menu-dark/`
- fresh build: `npm run build` 後の Astro preview を port `4328` で起動した。
- catalog 横断検証はバッチ末尾で実施する。この検証では Navigation Menu section の閉状態だけを確認した。

## light / dark 共通の実測

- `data-sentinel="before"` と `data-sentinel="after"` は各1件、初期 `defaultValue="products"` により製品 trigger は `aria-expanded="true"`、ガイドは `false` だった。
- Popup は hydration 後に `BODY` 直下の Portal にあり、viewport は Astro island 外だった。製品の viewport は `264 × 84px`、indicator は `8 × 6px`。ガイドを開くと viewport 左端は trigger 左端 `96px` に揃った。
- `aria-modal` は存在せず、focus guard は0件。Portal以外の `BODY` 子要素に `inert` と `aria-hidden` は各0件だった。
- ArrowRight はガイド trigger へ roving focus を移し、Space / Enter はガイドを開いて最初の link `使い方` へ focus を移した。Escape は全triggerを閉じ、transition完了後に開いたガイド trigger へ focus を返した。再開も確認した。
- content内の Tab は `使い方` → `アクセシビリティ` → `更新履歴` → after sentinel と進み、退出後は全triggerが `aria-expanded="false"` だった。
- light / dark の console error / warning は0件だった。

## Viewport inert の観測履歴

初回の旧サーバー観測で閉じたViewport付近に `inert` 1件を観測したが、固定SHAのfresh buildではTab退出直後と50ms後のどちらも `[data-slot="navigation-menu-viewport"]` は `inert=false`、`[inert]` は0件で再現しなかった。上流実装はPositioner有無でViewportのinert処理を分岐するため、この一回限りの観測を恒常契約にしない。非モーダル契約は背景（Portal外）の `inert` / `aria-hidden` がないこととする。

## catalog

`/catalog/` の Navigation Menu section は1件あり、sentinel / content / viewport は各0件、両triggerの `aria-expanded` は `false`、Portal内viewportも0件だった。console error / warning は0件だった。

## 証跡

- `navigation-menu-preview-light.jpg`: JPEG magic bytes `ffd8ff`、初期open状態。
- `navigation-menu-preview-dark.jpg`: JPEG magic bytes `ffd8ff`、初期open状態。
