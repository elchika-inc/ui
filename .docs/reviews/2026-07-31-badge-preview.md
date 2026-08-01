# Badge プレビュー実ブラウザ検証

verified_impl_sha: f8f3424d9418c61dd5b35d7677bd7f1d4237694b

検証した commit: `f8f3424d9418c61dd5b35d7677bd7f1d4237694b`

保存時の実体が JPEG だったため拡張子を実体に合わせた。画像の byte は撮影時のまま。

## 検証条件

- 配信: `npx serve dist -l 3012`
- ブラウザ: Chrome、1512 × 828
- forced theme: ブラウザの開発者プロトコルから一時的に `document.documentElement` の `dark` class を付け外しした
- theme 切替後は `transition-all` の補間が終わるまで 250 ms 待ってから計算値とスクリーンショットを取得した
- network はページ本体とページが参照する HTTP subresource を対象とし、ブラウザ拡張自身の resource は対象外とした
- `/favicon.ico` は除外規則としたが、今回の4通りでは要求自体を観測しなかった

## route × theme × チェック項目

| route / theme | screenshot | console | network | DOM / a11y | keyboard / focus ring | theme token | 崩れ |
|---|---|---|---|---|---|---|---|
| `/preview/badge/` light | ✅ `badge-preview-light.jpg` | ✅ error / warning 0件 | ✅ 失敗・4xx / 5xx 0件 | ✅ `generic` 5個。「公開中」「下書き」「停止中」「審査待ち」「任意」 | N/A（focusable 0個） | ✅ body `oklch(1 0 0)` | ✅ 横scrollなし、5要素すべて 42–66 × 20 px、文字色≠背景色 |
| `/preview/badge/` forced-dark | ✅ `badge-preview-light-forced-dark.jpg` | ✅ error / warning 0件 | ✅ 同一読込済みsubresourceに失敗なし | ✅ `generic` 5個、名前はlightと同一 | N/A（focusable 0個） | ✅ body `oklch(0.145 0 0)` | ✅ 横scrollなし、5要素すべて 42–66 × 20 px、文字色≠背景色 |
| `/preview/badge-dark/` forced-light | ✅ `badge-preview-dark-forced-light.jpg` | ✅ error / warning 0件 | ✅ 失敗・4xx / 5xx 0件 | ✅ `generic` 5個、名前はlightと同一 | N/A（focusable 0個） | ✅ body `oklch(1 0 0)` | ✅ 横scrollなし、5要素すべて 42–66 × 20 px、文字色≠背景色 |
| `/preview/badge-dark/` dark | ✅ `badge-preview-dark.jpg` | ✅ error / warning 0件 | ✅ 同一読込済みsubresourceに失敗なし | ✅ `generic` 5個、名前はlightと同一 | N/A（focusable 0個） | ✅ body `oklch(0.145 0 0)` | ✅ 横scrollなし、5要素すべて 42–66 × 20 px、文字色≠背景色 |

## network 実測

- 両routeとも Document、CSS、Geist Variable font、Astro / React / Badge JavaScript を取得した
- `/preview/badge/`: Document 200、subresource 200または304、`Network.loadingFailed` 0件
- `/preview/badge-dark/`: Document / subresource すべて200、`Network.loadingFailed` 0件

## 見た項目と見なかった項目

- 見た: 静的Badgeの存在・表示テキスト、実role、console、network、theme token、横scroll、矩形、文字色と背景色、light / darkの描画
- 見なかった: disabled / invalid（Badgeの静的パイロットには状態を置いていない）
- keyboard / focus ring: N/A。previewを静的Badgeだけに限定し、focusable要素が0個であることを実測した
