# Input プレビュー実ブラウザ検証

検証した commit: `46a0bdedd49ae19467361c135471d4486523689a`

保存時の実体が JPEG だったため拡張子を実体に合わせた。画像の byte は撮影時のまま。

## 検証条件

- 配信: `npx serve dist -l 3012`
- ブラウザ: Chrome、1512 × 828
- forced theme: ブラウザの開発者プロトコルから一時的に `document.documentElement` の `dark` class を付け外しした
- theme 切替後は 250 ms 待ち、keyboard検証はbodyを明示的な開始位置にしてからTabを押した
- network はページ本体とページが参照する HTTP subresource を対象とし、ブラウザ拡張自身のresourceは対象外とした
- `/favicon.ico` は除外規則としたが、今回の4通りでは要求自体を観測しなかった

## route × theme × チェック項目

| route / theme | screenshot | console | network | DOM / a11y / 状態 | keyboard / focus ring | theme token | 崩れ |
|---|---|---|---|---|---|---|---|
| `/preview/input/` light | ✅ `input-preview-light.jpg` | ✅ error / warning 0件 | ✅ 失敗・4xx / 5xx 0件 | ✅ textbox 3個。名前・値が一致し、「無効」はdisabled、`input-invalid` は `aria-invalid="true"` | ✅ Tab 1回目 `input-value`、2回目はdisabledを飛ばして `input-invalid`。ring各1枚、alpha合成0枚 | ✅ body `oklch(1 0 0)` | ✅ 横scrollなし、3要素すべて 336 × 32 px、文字色≠背景色 |
| `/preview/input/` forced-dark | ✅ `input-preview-light-forced-dark.jpg` | ✅ error / warning 0件 | ✅ 同一読込済みsubresourceに失敗なし | ✅ textbox 3個、名前・値・disabled・invalidはlightと同一 | ✅ 同じTab順。通常ring `oklch(0.556 0 0)`、invalid ring `oklch(0.704 0.191 22.216)`、alpha合成0枚 | ✅ body `oklch(0.145 0 0)` | ✅ 横scrollなし、3要素すべて 336 × 32 px、文字色≠背景色 |
| `/preview/input-dark/` forced-light | ✅ `input-preview-dark-forced-light.jpg` | ✅ error / warning 0件 | ✅ 失敗・4xx / 5xx 0件 | ✅ textbox 3個、名前・値・disabled・invalidはlightと同一 | ✅ 同じTab順。ring各1枚、alpha合成0枚 | ✅ body `oklch(1 0 0)` | ✅ 横scrollなし、3要素すべて 336 × 32 px、文字色≠背景色 |
| `/preview/input-dark/` dark | ✅ `input-preview-dark.jpg` | ✅ error / warning 0件 | ✅ 同一読込済みsubresourceに失敗なし | ✅ textbox 3個、名前・値・disabled・invalidはlightと同一 | ✅ 同じTab順。通常ring `oklch(0.556 0 0)`、invalid ring `oklch(0.704 0.191 22.216)`、alpha合成0枚 | ✅ body `oklch(0.145 0 0)` | ✅ 横scrollなし、3要素すべて 336 × 32 px、文字色≠背景色 |

## network 実測

- 両routeとも Document、CSS、Geist Variable font、Astro / React / Input JavaScriptを取得した
- `/preview/input/`: Document 200、subresource 200または304、`Network.loadingFailed` 0件
- `/preview/input-dark/`: Document / subresource すべて200、`Network.loadingFailed` 0件

## 見た項目と見なかった項目

- 見た: 値、visible labelによる名前、disabled、`aria-invalid`、console、network、theme token、Tab順、通常/invalid focus ring、横scroll、矩形、文字色と背景色、light / darkの描画
- 見なかった: ユーザー入力による値変更、text以外のinput type。今回のパイロットは初期値・disabled・invalidの状態表示を対象とした
- a11y snapshotはdisabledを表示したがinvalidは表示しなかったため、invalidはDOM属性とdestructive focus ringで確認した
