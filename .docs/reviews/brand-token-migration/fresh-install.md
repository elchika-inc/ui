# ブランドトークン fresh install 検証

verified_impl_sha: f022b7ceca51604d09cefe052981240cd4d37dd3

- registry URL: `http://127.0.0.1:3013/r/button.json` / `http://127.0.0.1:3013/r/select.json`
- shadcn exact version: `4.16.0`
- source 到達: `src/components/ui/button.tsx` と `src/components/ui/select.tsx` を `test -s` で確認し、Button の `bg-primary-hover` / `destructive-subtle` / `state-hover` と Select の `bg-card` / `border-input` を実出力で確認した
- alias / generated token: `elchika-ui/tokens.css` と host `src/styles/global.css`、`elchika-ui/design-system/tokens.css` と host generated token が byte 一致した。alias の light / dark key set と全 value、`./design-system/tokens.css` の relative import、自己 import がないことも確認した
- legal file: `elchika-ui/LICENSE` と `elchika-ui/THIRD_PARTY_LICENSES` を `test -s` で確認した
- consumer build: `npm run build` は exit 0。build output CSS に `--color-bg-canvas`、`--state-hover-bg`、`--primary-hover` が含まれ、import 解決 error はなかった
- 利用契約: shadcn 生成の `:root` / `.dark` 色 alias を削除し、`@import "../elchika-ui/tokens.css";` に一本化した。併存時は後続の利用側 alias が勝ち、fixture が既定 shadcn 値になることを確認した
- theme selector light: generated canvas `246 246 247`、computed background `rgb(246, 246, 247)`、`color-scheme: light`
- theme selector class only: generated canvas `246 246 247`、computed background `rgb(246, 246, 247)`、`color-scheme: dark`
- theme selector data only: generated canvas `21 23 28`、computed background `rgb(21, 23, 28)`、`color-scheme: light`
- theme selector synchronized dark: generated canvas `21 23 28`、computed background `rgb(21, 23, 28)`、`color-scheme: dark`
- ブランド実効値 assertion: 4状態すべてで fixture の computed background が、その状態の `--color-bg-canvas` を解決した `rgb(...)` と一致した
- component 追加後: Badge を同じ registry から追加すると `src/index.css` へ `:root` / `.dark` alias block が再追記された。再削除後は0件に戻り、`npm run build` exit 0 と4状態のブランド実効値 assertion を再確認した
