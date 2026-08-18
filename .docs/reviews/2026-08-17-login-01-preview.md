verified_impl_sha: b390284ad38c49b4b9061a0af69749949fe22d52

# login-01（registry:block 1 件目）実ブラウザ証跡

- 検証日: 2026-08-17
- 環境: macOS / Chromium (Playwright) / viewport 1280×900 / scale css
- 対象: `npm run dev`（Astro dev server, port 4322）の isolated preview
- selector: `[data-slot="login-01-preview"]`

block レーンを新設した最初の 1 件。部品（`registry:ui`）と違い barrel に載せないため、
描画経路は preview だけが確認手段になる。

## 実測結果（リポジトリ内 preview）

| Theme | Route | HTTP | ルート要素 | selector 実在 | Console error | JPEG |
|---|---|---|---|---|---|---|
| light | `/preview/login-01/` | 200 | `<html lang="ja" data-theme="light">` | 1 件 | 1（favicon 404、下記） | `2026-08-17-login-01-preview-light.jpg` (1280×900, 30414 bytes) |
| dark | `/preview/login-01-dark/` | 200 | `<html lang="ja" class="dark" data-theme="dark">` | 1 件 | 1（同上） | `2026-08-17-login-01-preview-dark.jpg` (1280×900, 29815 bytes) |

accessibility tree で確認した描画構造（light）:

```
Login to your account / Enter your email below to login to your account
group: Email  → textbox placeholder="m@example.com"
group: Password → link "Forgot your password?" (/forgot-password) / textbox
group: button "Login" / button "Login with Google" / link "Sign up" (/signup)
```

**測った範囲**: 実ブラウザで描画され、accessibility tree に期待どおりの要素が現れ、
light / dark でトークンが切り替わることをスクリーンショットで目視確認した。
キーボード操作とフォーカスリングの computed style は**測っていない**。

## リポジトリ外プロジェクトでの導入（DoneCriteria 4）

`npm create vite@latest -- --template react-ts` の scratch アプリへ、
`npx serve public/r -l 5555` で配信した registry から導入した。

| 段階 | 結果 |
|---|---|
| 1. 配布ファイルが配置される | 到達。`src/components/login-form.tsx`（1933 bytes）。法務ファイル 5 件も `elchika-ui/` へ同梱された |
| 2. `app/login/page.tsx` が作られない | 到達。`ls app` → exit 1。`find -name page.tsx` → 0 件 |
| 3. README の導入手順を通した後に `npm run build` | 到達。exit 0（`✓ 113 modules transformed`） |

`2026-08-17-login-01-consumer.jpg`（1280×900, 28320 bytes）が `vite preview` の実描画。
リポジトリ内 preview と同じ配色で、配布したトークンが consumer 側で効いていることを確認した。

### 3 で 2 回落ちた原因（いずれも consumer 側の配線で、block ではない）

切り分けの根拠を残す。**どちらも block 固有ではなく、既存の `registry:ui` にも同じく起きる。**

| 症状 | 原因 | 判定根拠 |
|---|---|---|
| `Unknown registry "@elchika"` | consumer の `components.json` に `registries` 未定義 | block の `registryDependencies` は `@elchika/*`。README の「@elchika 名前空間」節の設定で解消 |
| `Cannot find module '@/lib/utils'` | `npx shadcn init` を省き `components.json` を手書きしたため `src/lib/utils.ts` が未生成 | **`button.tsx` など既存 `registry:ui` 6 件が同じエラーを出した**。block だけの問題ではない |
| `Option 'baseUrl' is deprecated` | consumer の tsconfig に `baseUrl` を書いた（TS 7 で非推奨） | 配布物に触れず consumer 設定のみで解消 |

## console error 1 件について

両ルートで `Failed to load resource: 404 @ /favicon.ico` が 1 件出る。
**component とは無関係の既存挙動**で、isolated preview のページが `rel="icon"` を
宣言しないためブラウザが `/favicon.ico` を自動要求して 404 になる。
既存の証跡（`2026-08-05-pagination-preview.md` 等）と同じ。

## 共有トークンについて

`src/styles/global.css` / `src/styles/design-system/**` は**変更していない**ため、
`SHARED_TOKEN_IMAGE_SUBJECTS`（14 件 × light/dark = 28 枚）の撮り直しは発生しない。
