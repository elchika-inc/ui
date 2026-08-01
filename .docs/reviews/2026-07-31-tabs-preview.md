# Tabs プレビュー実ブラウザ検証

verified_impl_sha: 996ef81e0d52766f6bc21828991afb7f586efa64

検証した commit: `996ef81e0d52766f6bc21828991afb7f586efa64`

## 検証条件

- 配信: `npx serve dist -l 3012`
- ブラウザ: Chrome、1512 × 828
- forced theme: ブラウザの開発者プロトコルから一時的に `document.documentElement` の `dark` class を付け外しした
- theme 切替後とfocus ringの補間後は 250 ms、tab選択後は 150 ms 待って状態を観測した
- screenshotは `Page.captureScreenshot` に `format: "png"` を明示し、保存後に画像の実体を検査した
- networkはページ本体とページが参照するHTTP subresourceを対象とし、ブラウザ拡張自身のresourceは対象外とした

## route × theme × チェック項目

| route / theme | screenshot | console | network | DOM / a11y / 状態 | keyboard / focus ring | theme token | 崩れ |
|---|---|---|---|---|---|---|---|
| `/preview/tabs/` light | ✅ `tabs-preview-light.png` | ✅ error / warningなし | ✅ 失敗・4xx / 5xxなし | ✅ horizontal tablist、「概要」「設定」のtab、選択tabと対応するtabpanelが存在 | ✅ Tabで「概要」へ到達。ArrowRightで「設定」へfocus移動、Enterで選択・panel切替、ArrowLeft+Enterで復帰。不透明な3px ring | ✅ body `oklch(1 0 0)`、選択tab背景 `oklch(1 0 0)` | ✅ 横scrollなし、root 448 × 60 px |
| `/preview/tabs/` forced-dark | ✅ `tabs-preview-light-forced-dark.png` | ✅ error / warningなし | ✅ 同一読込済みsubresourceに失敗なし | ✅ 選択tabとtabpanelの対応を維持 | ✅ lightで確認したfocus・選択状態を維持 | ✅ body `oklch(0.145 0 0)`、選択tab文字 `oklch(0.985 0 0)` | ✅ 横scrollなし、矩形はlightと同一 |
| `/preview/tabs-dark/` forced-light | ✅ `tabs-preview-dark-forced-light.png` | ✅ error / warningなし | ✅ 読込済みsubresourceに失敗なし | ✅ tablist / tab / tabpanelの構造と選択状態を維持 | ✅ 初期選択は「概要」 | ✅ body `oklch(1 0 0)`、選択tab背景 `oklch(1 0 0)` | ✅ 横scrollなし、矩形はdarkと同一 |
| `/preview/tabs-dark/` dark | ✅ `tabs-preview-dark.png` | ✅ error / warningなし | ✅ 失敗・4xx / 5xxなし | ✅ horizontal tablist、tab、選択tabの `aria-controls` とtabpanel id、tabpanelの `aria-labelledby` を確認 | ✅ 初期選択は「概要」 | ✅ body `oklch(0.145 0 0)`、選択tab文字 `oklch(0.985 0 0)` | ✅ 横scrollなし、root 448 × 60 px |

## 複合コンポーネント挙動の実測

- 初期状態は「概要」が `aria-selected="true"` / `tabindex="0"` で、「設定」は `aria-selected="false"` / `tabindex="-1"` だった
- Tabで「概要」へ入り、ArrowRightではfocusだけが「設定」へ移った。Enter後に「設定」が選択され、「共有 UI の設定を表示しています。」へpanelが切り替わった
- ArrowLeftとEnterで「概要」の選択とpanelへ戻った
- 選択tabの `aria-controls` は可視tabpanelのidと一致し、tabpanelの `aria-labelledby` は対応tabを参照した
- focus ringは補間完了後に `oklch(0.556 0 0) 0 0 0 3px` となり、alpha合成されたstate ringではなかった
- 非選択panelはhidden要素として残らずDOMから外れるため、可視tabpanelと選択tabの対応で状態を検査した

## network 実測

- 両routeともDocument、CSS、Geist Variable font、Astro / React / Tabs JavaScriptを取得した
- `/preview/tabs/`: Document / subresourceは成功応答、`Network.loadingFailed`なし
- `/preview/tabs-dark/`: Document / subresourceは成功応答、`Network.loadingFailed`なし

## 見た項目と見なかった項目

- 見た: tablist、tab、tabpanel、初期選択、roving tabindex、ArrowRight / ArrowLeft、Enter activation、panel切替、ARIA参照、focus ring、console、network、theme token、横scroll、矩形、light / dark描画
- 見なかった: vertical orientation、line variant、disabled tab、動的なtab追加、controlled value。今回のパイロットは既定horizontal構成の合成契約を対象とした
