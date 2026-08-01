# 検証用カタログ実ブラウザ検証

verified_impl_sha: ad97ea4e5cf30e66c3edad3ba50f4fdc4e4f7249

検証した commit: `ad97ea4e5cf30e66c3edad3ba50f4fdc4e4f7249`

## 検証条件

- 配信: `npx serve dist -l 3192`
- ブラウザ: Chrome、1512 × 830 の full-page screenshot
- 対象 route: `/catalog/`、`/catalog-dark/`
- DOM と console は各 route の load と hydration 完了後に確認した
- SSR は同じ commit の `dist/catalog/index.html`、`dist/catalog-dark/index.html` と全個別 preview の生成 HTML を直接検査した

## route × theme の実測

| route | screenshot | theme | scan 由来の preview | island / hydration | Dialog overlay | console |
|---|---|---|---|---|---|---|
| `/catalog/` | `2026-08-01-catalog-light.jpg` | `html.className` は空 | `badge`、`button`、`dialog`、`input`、`sonner`、`tabs` | `astro-island` は単一で hydration 完了 | trigger あり、content なし、`aria-expanded="false"` | error なし |
| `/catalog-dark/` | `2026-08-01-catalog-dark.jpg` | `html.className="dark"` | `badge`、`button`、`dialog`、`input`、`sonner`、`tabs` | `astro-island` は単一で hydration 完了 | trigger あり、content なし、`aria-expanded="false"` | error なし |

両 route とも `[data-slot="verification-catalog"]` が存在し、`[data-catalog-preview]` の名前は preview scan の出力と一致した。Dialog はカタログ用の `mode="catalog"` によりトリガーだけを描画し、開いた状態は個別 preview へ隔離されている。

## SSR と island 粒度

- カタログの生成 HTML には `<astro-island ... ssr client="load">` と、上記すべての `data-catalog-preview` markup が実在した。カタログは SSR 出力を持ち、ブラウザでは単一 island として hydration された。
- `import.meta.glob({ eager: true })` は参照の引き方が動的でも、build 時に静的 import 群へ解決される。そのため wrapper 内の React ツリーも Astro が完全に SSR できる。
- カタログは全 preview を単一 island に含むため、横断的な SSR markup とカタログ全体の hydration 成功を示す。一方で hydration は全か無かであり、component ごとの hydration 独立性は示さない。
- 個別 light / dark preview route はそれぞれ component を直接 `client:load` し、生成 HTML に component ごとの `<astro-island ... ssr>` と固有 markup が実在した。component ごとの hydration 独立性は個別 route が担う。

カタログと個別 route の差は SSR の有無ではなく island の粒度である。カタログの実測は個別 route の hydration 証跡を置き換えない。

## 見た項目と見なかった項目

- 見た: light / dark route、catalog root、scan 由来の preview 名、全 preview の可視描画、単一 island の hydration、Dialog の閉状態、console error、生成 HTML の SSR island と component markup、JPEG screenshot の保存と magic bytes
- 見なかった: カタログ内の各 component を個別 island として hydration できること、Dialog をカタログ上で開くこと、各 component の詳細 interaction。これらはカタログの責務外であり、個別 preview の証跡が担う
