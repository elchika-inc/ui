# Sonner プレビュー実ブラウザ検証

verified_impl_sha: 1c8170e6d70ba53f22ee81810076553552dd9629

検証した commit: `1c8170e6d70ba53f22ee81810076553552dd9629`

## 検証条件

- 配信: `npx serve dist -l 3012`
- ブラウザ: Chrome、1512 × 828
- OS theme との偶然の一致を除外するため、light route では `prefers-color-scheme: dark`、dark route では `prefers-color-scheme: light` をエミュレートした
- forced theme: ブラウザの開発者プロトコルから一時的に `document.documentElement` の `dark` class を付け外しした
- route 読込後は 300 ms、toast 表示後と theme 切替後は 300 ms 待って状態を観測した
- screenshot は `Page.captureScreenshot` に `format: "png"` を明示し、保存後に PNG magic bytes と画像の実体を検査した
- network は Navigation / Resource Timing が返すページ本体と HTTP subresource の `responseStatus` を検査した

## route × theme × チェック項目

| route / theme | screenshot | console | network | DOM / a11y / 状態 | keyboard / focus | theme token / internal theme | 崩れ |
|---|---|---|---|---|---|---|---|
| `/preview/sonner/` light（OS dark） | ✅ `sonner-preview-light.png` | ✅ error / warning なし | ✅ Document / subresource はすべて 200 | ✅ success toast、icon、title、description、polite live region が存在 | ✅ Tab で button へ到達し Enter で表示、focus は button に維持 | ✅ `html.dark=false`、`data-sonner-theme="light"`、toast 背景 `oklch(1 0 0)`、文字 `oklch(0.145 0 0)` | ✅ 横 scroll なし、toast 356 × 73.695 px |
| `/preview/sonner/` forced-dark（OS dark） | ✅ `sonner-preview-light-forced-dark.png` | ✅ error / warning なし | ✅ 読込済み resource に失敗なし | ✅ 同じ toast と live region を維持 | ✅ light で確認した focus を維持 | ✅ `html.dark=true`、`data-sonner-theme="dark"`、toast 背景 `oklch(0.205 0 0)`、文字 `oklch(0.985 0 0)` | ✅ 横 scroll なし、矩形は light と同一 |
| `/preview/sonner-dark/` forced-light（OS light） | ✅ `sonner-preview-dark-forced-light.png` | ✅ error / warning なし | ✅ 読込済み resource に失敗なし | ✅ success toast と live region を維持 | ✅ button から表示可能 | ✅ `html.dark=false`、`data-sonner-theme="light"`、description `rgb(63, 63, 63)` | ✅ 横 scroll なし、矩形は dark と同一 |
| `/preview/sonner-dark/` dark（OS light） | ✅ `sonner-preview-dark.png` | ✅ error / warning なし | ✅ Document / subresource はすべて 200 | ✅ success toast、icon、title、description、polite live region が存在 | ✅ button から表示可能 | ✅ `html.dark=true`、`data-sonner-theme="dark"`、description `rgb(232, 232, 232)` | ✅ 横 scroll なし、toast 356 × 73.695 px |

## theme wrapper の実測

- 修正前は ThemeProvider が無いため `useTheme()` が `system` へフォールバックし、light route × OS dark で `data-sonner-theme="dark"`、dark route × OS light で `data-sonner-theme="light"` となった
- preview 専用 wrapper は初期表示で `html.dark` を読み、`class` 属性の MutationObserver によって forced theme の変更にも追従した
- 修正後は OS theme を route と逆にしても、4 状態すべてで `html.dark` と `data-sonner-theme` が一致した
- 配布対象の `src/components/ui/sonner.tsx` は変更せず、利用者側の契約は RISK-010 のとおり `next-themes` の ThemeProvider を前提として受容した

## keyboard / a11y 実測

- Tab で「通知を表示」button へ到達し、focus ring は `oklch(0.556 0 0) 0 0 0 3px` で alpha 合成された state ringではなかった
- Enter で「保存しました」「共有 UI の通知プレビューです。」を持つ success toast が表示され、focus はbuttonに残った
- 通知領域は `SECTION aria-label="Notifications alt+T" aria-live="polite" tabindex="-1"` で、accessibility tree では region 配下の list として toast 文言を読めた

## screenshot 実体

- 4 ファイルとも `PNG image data, 1512 x 828, 8-bit/color RGB, non-interlaced`
- 4 ファイルとも先頭 8 bytes は PNG magic `89504e470d0a1a0a`
- 同じ theme の描画は route に依存せず、dark 2 状態と light 2 状態でそれぞれ SHA-256 が一致した

## 見た項目と見なかった項目

- 見た: hydration 後のbutton、pointer / keyboard activation、success toast、icon、title、description、live region、focus 維持、focus ring、console、network、OS theme と逆の route、class 強制切替、Sonner internal theme、computed token、横 scroll、矩形、PNG 実体
- 見なかった: 複数 toast、手動 dismiss、action / cancel、promise / loading、position variant、mobile viewport、reduced-motion。今回のパイロットは単一 success toast と theme wrapper の契約を対象とした
