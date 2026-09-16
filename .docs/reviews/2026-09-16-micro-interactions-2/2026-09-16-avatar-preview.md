verified_impl_sha: 1e4ab738edc86a2a46f168769ed75e3f07e51b35

# avatar preview 実ブラウザ検証（マイクロインタラクション）

## 検証方法

- 検証日: 2026-09-16。成功基準は [委任仕様 §4・§C](../../plans/2026-09-16-micro-interactions.md)。
- `npm run build:site`（exit 0、271ページ）の成果物を `npx astro preview --host 127.0.0.1 --port 52872` で配信した。
- Playwright MCP から Chromium 153.0.8010.48 を `browserType().launch({ headless: true, channel: "chrome" })` で新規起動した。viewport 1440×900、deviceScaleFactor 1、reducedMotion `no-preference`。
- navigation 前に console error / pageerror の収集を開始し、`goto` の `domcontentloaded` 直後に Field を測定した。他の操作は hydration 完了、`document.fonts.ready`、200ms を待って行った。
- 操作前に `setInterval(sample, 16)` を開始し、対象の存在、starting / ending 属性、computed style、`getAnimations()` の種別とプロパティ・名前、`effect.getTiming()` の duration / easing を取得した。操作後400msまで採取した。
- 時刻はポーリング開始からの相対値で、click の準備時間を含むため duration そのものとは区別する。
- preview selector: `[data-slot="avatar-preview"]`。

## 表示・エラー

| theme | route | HTTP | selector件数 | console error（favicon除外） | favicon 404 | pageerror | dark class | reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | `/preview/avatar/` | 200 | 1 | 0 | 0 | 0 | false | false |
| dark | `/preview/avatar-dark/` | 200 | 1 | 0 | 0 | 0 | true | false |

## AvatarGroup の hover / pointer leave

`[data-slot="avatar-group"]` に hover し、その後 pointer を `(1300, 800)` へ移動した。先頭の子 Avatar を測定した。全テーマで Avatar 3件と AvatarGroupCount 1件を確認した。

| theme | 状態 | transition-property | duration | easing | margin-inline-end |
| --- | --- | --- | --- | --- | --- |
| light | rest | `margin` | `0.18s` | `cubic-bezier(0.34, 3.85, 0.64, 1)` | `-8px` |
| light | hovered | `margin` | `0.18s` | `cubic-bezier(0.2, 0, 0, 1)` | `-2px` |
| light | left | `margin` | `0.18s` | `cubic-bezier(0.34, 3.85, 0.64, 1)` | `-8px` |
| dark | rest | `margin` | `0.18s` | `cubic-bezier(0.34, 3.85, 0.64, 1)` | `-8px` |
| dark | hovered | `margin` | `0.18s` | `cubic-bezier(0.2, 0, 0, 1)` | `-2px` |
| dark | left | `margin` | `0.18s` | `cubic-bezier(0.34, 3.85, 0.64, 1)` | `-8px` |

司令塔裁定（2026-09-16）: Chromium の `transitionProperty` は `margin-right` という物理 longhand を返した。computed `margin-inline-end` の `-8px → -2px → -8px` を根拠に、論理プロパティの実測として合格とする。spec 自体は変更しない。

## getAnimations の実測

| theme | 操作 | 種別 | transitionProperty | duration（ms） | easing |
| --- | --- | --- | --- | --- | --- |
| light | hover | CSSTransition | margin-right | 180 | `cubic-bezier(0.2, 0, 0, 1)` |
| light | leave | CSSTransition | margin-right | 180 | `cubic-bezier(0.34, 3.85, 0.64, 1)` |
| dark | hover | CSSTransition | margin-right | 180 | `cubic-bezier(0.2, 0, 0, 1)` |
| dark | leave | CSSTransition | margin-right | 180 | `cubic-bezier(0.34, 3.85, 0.64, 1)` |

## 生成 CSS の selector

実行コマンド（exit 0）。指定式は `}` を除外しないため、前の宣言末尾も出力に含む。生出力を以下に残す。対象 selector は `:is(.hover\:\*\:ease-standard:hover>*)` で、group の hover が子へ効く。

```bash
grep -o '[^{]*hover[^{]*ease-standard[^{]*{' dist/_astro/global.BPAn7D1u.css
```

```css
--brand-100:227 234 251;--brand-300:143 172 245;--brand-400:110 147 240;--brand-600:47 95 209;--brand-700:30 58 143;--accent-100:252 241 210;--accent-400:245 208 101;--accent-500:242 194 48;--accent-900:74 58 5;--accent-text:133 105 10;--color-success-500:28 148 103;--color-danger-500:224 85 90;--color-warning-500:194 97 12;--color-bg-canvas:246 246 247;--color-bg-surface:255 255 255;--color-bg-surface-raised:237 238 240;--color-border-default:222 224 227;--color-border-strong:199 202 207;--color-border-control:126 132 142;--color-text-primary:26 28 33;--color-text-secondary:91 95 104;--color-text-muted:99 103 111;--color-brand-primary:var(--brand-600);--color-brand-primary-hover:var(--brand-700);--color-brand-subtle:var(--brand-100);--color-accent-highlight:var(--accent-500);--color-accent-highlight-bg:var(--accent-100);--color-accent-highlight-text:var(--accent-text);--color-status-success:var(--color-success-500);--color-status-success-bg:220 243 234;--color-status-success-text:20 108 74;--color-status-danger:var(--color-danger-500);--color-status-danger-bg:251 227 228;--color-status-danger-text:178 51 56;--color-status-warning:var(--color-warning-500);--color-status-warning-bg:252 233 214;--color-status-warning-text:143 70 8;--color-status-info:var(--color-brand-primary);--color-status-info-bg:var(--brand-100);--color-status-info-text:var(--brand-700);--font-display:"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif;--font-body:"IBM Plex Sans JP", "IBM Plex Sans", system-ui, sans-serif;--font-mono:"IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace;--font-code:"IBM Plex Mono", "IBM Plex Sans JP", ui-monospace, monospace;--text-3xs:.6875rem;--text-2xs:.75rem;--text-xs:.8125rem;--text-sm:.875rem;--text-base:1rem;--text-lg:1.125rem;--text-xl:1.3125rem;--text-2xl:1.5625rem;--text-3xl:1.875rem;--text-4xl:2.25rem;--text-5xl:2.75rem;--text-6xl:3.375rem;--font-weight-regular:400;--font-weight-medium:500;--font-weight-semibold:600;--leading-none:1;--leading-tight:1.25;--leading-display:1.35;--leading-snug:1.5;--leading-normal:1.75;--leading-relaxed:1.9;--tracking-display:-.02em;--tracking-heading:-.01em;--tracking-normal:.02em;--tracking-label:.08em;--numeric-tabular:tabular-nums;--numeric-proportional:proportional-nums;--space-0:0;--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--space-12:3rem;--space-16:4rem;--space-20:5rem;--space-24:6rem;--space-32:8rem;--space-40:10rem;--space-inline-tight:var(--space-2);--space-inline:var(--space-3);--space-stack-tight:var(--space-2);--space-stack:var(--space-4);--space-stack-loose:var(--space-8);--space-section:var(--space-24);--space-section-lg:var(--space-32);--space-gutter:var(--space-5);--space-gutter-lg:var(--space-12);--container-prose:68ch;--container-content:60rem;--container-wide:70rem;--rounding-xs:.25rem;--radius-xs:var(--rounding-xs);--rounding-sm:.375rem;--radius-sm:var(--rounding-sm);--rounding-md:.5rem;--radius-md:var(--rounding-md);--rounding-lg:.75rem;--radius-lg:var(--rounding-lg);--rounding-xl:1rem;--radius-xl:var(--rounding-xl);--rounding-full:9999px;--radius-full:var(--rounding-full);--border-hairline:.5px;--border-thin:1px;--border-thick:2px;--elevation-xs:0 1px 2px #1a1c210a;--shadow-xs:var(--elevation-xs);--elevation-sm:0 1px 3px #1a1c210f, 0 1px 2px #1a1c210a;--shadow-sm:var(--elevation-sm);--elevation-md:0 4px 12px #1a1c2114;--shadow-md:var(--elevation-md);--elevation-lg:0 12px 32px #1a1c211a;--shadow-lg:var(--elevation-lg);--shadow-focus:0 0 0 3px rgb(var(--brand-600) / .28);--duration-instant:0s;--duration-fast:.12s;--duration-base:.18s;--duration-slow:.26s;--duration-slower:.4s;--duration-stagger:40ms;--duration-micro:80ms;--duration-emphasis:.5s;--curve-standard:cubic-bezier(.2, 0, 0, 1);--curve-entrance:cubic-bezier(.16, 1, .3, 1);--curve-exit:cubic-bezier(.4, 0, 1, 1);--curve-bounce:cubic-bezier(.34, 1.36, .64, 1);--curve-bounce-strong:cubic-bezier(.34, 3.85, .64, 1);--ease-standard:var(--curve-standard);--ease-entrance:var(--curve-entrance);--ease-exit:var(--curve-exit);--ease-bounce:var(--curve-bounce);--ease-bounce-strong:var(--curve-bounce-strong);--motion-distance-sm:4px;--motion-distance-md:8px;--motion-distance-lg:12px;--motion-scale-lg:.96;--motion-scale-md:.97;--motion-scale-sm:.98;--motion-blur-sm:2px;--motion-blur-lg:8px;--state-tint:26 28 33;--state-hover-alpha:.05;--state-press-alpha:.1;--state-hover-bg:rgb(var(--state-tint) / var(--state-hover-alpha));--state-press-bg:rgb(var(--state-tint) / var(--state-press-alpha));--state-selected-bg:rgb(var(--color-brand-primary) / .1);--state-selected-border:rgb(var(--color-brand-primary));--state-focus-ring:var(--shadow-focus);--state-disabled-opacity:var(--opacity-disabled);--state-invalid-border:rgb(var(--color-status-danger));--state-invalid-bg:rgb(var(--color-status-danger-bg));--state-skeleton-bg:rgb(var(--color-bg-surface-raised));--state-transition:background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);--control-height-sm:1.75rem;--control-height-md:2.25rem;--control-height-lg:2.75rem;--control-padding-x:var(--space-4);--control-radius:var(--radius-md);--control-border-width:var(--border-thin);--chart-series-1:47 95 209;--chart-series-2:188 42 105;--chart-series-3:167 41 187;--chart-series-4:180 40 148;--chart-series-5:133 63 213;--chart-dash-1:none;--chart-dash-2:6 3;--chart-dash-3:2 3;--chart-dash-4:10 4 2 4;--chart-dash-5:1 4;--chart-seq-0:236 241 252;--chart-seq-1:195 210 244;--chart-seq-2:150 176 236;--chart-seq-3:105 142 229;--chart-seq-4:55 105 220;--chart-seq-5:29 71 166;--chart-div-neg3:172 40 98;--chart-div-neg2:222 95 150;--chart-div-neg1:242 173 203;--chart-div-mid:238 239 241;--chart-div-pos1:172 193 241;--chart-div-pos2:100 137 223;--chart-div-pos3:45 88 190;--chart-grid:var(--color-border-default);--chart-axis:var(--color-border-strong);--chart-label:var(--color-text-muted);--chart-baseline:var(--color-text-secondary);--chart-band-alpha:.12;--chart-series-width:2px;--chart-point-size:3px;--chart-tooltip-bg:var(--color-bg-surface);--chart-tooltip-border:var(--color-border-strong);--density-row-height:2.75rem;--density-cell-py:var(--space-3);--density-gap:var(--space-3);--density-control-height:var(--control-height-md);--density-font-size:var(--text-sm);--font-feature-display:"palt" 1;--z-base:0;--z-dropdown:1000;--z-sticky:1100;--z-overlay:1200;--z-modal:1300;--z-popover:1400;--z-toast:1500;--opacity-disabled:.4;--opacity-muted:.65;--opacity-overlay:.6}[data-theme=dark]{
--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}:is(.hover\:\*\:ease-standard:hover>*){
```

## 証跡画像と判定範囲

- light: [2026-09-16-avatar-preview-light.jpg](2026-09-16-avatar-preview-light.jpg)
- dark: [2026-09-16-avatar-preview-dark.jpg](2026-09-16-avatar-preview-dark.jpg)

画像は各 route で新規撮影した1440×900の JPEG（magic bytes `FF D8 FF`）であり、既存画像の複製ではない。目視で本文・操作部品の欠落や切断を認めなかった。

存在（selector・画像形式）、実行（build・HTTP・console / pageerror）、動作（computed style・getAnimations・指定の属性遷移）まで検証した。全 props の組合せ、全キーボード操作、reduced-motion の網羅検証は含まない。
