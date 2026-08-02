# Avatar 動作検証レポート

verified_impl_sha: 970b8f5e8a2a4d9ea1d5a26a2387819e341a0be7

## 結論

- 判定: GREEN。Avatar固有のLight/Darkプレビューを各3つのfresh tabで実測し、不一致やflakyを検出しなかった。
- 1つ目のAvatarではdata URL画像が可視で、`complete=true`、`naturalWidth=150`、`naturalHeight=150`を確認した。
- 2つ目はpreviewソースで`src`を省略した`AvatarImage`である。hydration後の実DOMでは画像要素を生成せず、上流定義の「画像未提供」経路でfallback `UI`だけが可視になった。画像読み込み失敗を利用した検証ではない。
- 監視下reloadは全6回でHTTP 4xx/5xx、loading failure、console error、pageerror相当が0件だった。

## 実行環境

- 検証日時: 2026-08-02 12:43 JST
- branch: `feat/batch-final`
- 検証HEAD: `94cd60eafd86f681e9af569a2e6409573fb9a841`
- 製品実装の固定SHA: `970b8f5e8a2a4d9ea1d5a26a2387819e341a0be7`
- 開始時worktree: clean
- OS: Darwin 25.3.0 arm64
- Node.js: v26.4.0
- npm: 11.17.0
- Browser: Google Chrome 150.0.7871.187
- viewport: 1280x900
- fresh build: `npm run build` exit 0、125 pages生成
- preview server: `npm run preview -- --host 127.0.0.1 --port 3016`
- 起動前とcleanup後のport 3016: listenerなし（`lsof` exit 1）

## 実行前rubric

1. 固定SHAから検証HEADまでAvatar固有pathに差分がない。
2. fresh `npm run build`がexit 0で完了し、製品pathに差分を残さない。
3. 静的`dist`の`/preview/avatar/`と`/preview/avatar-dark/`がHTTP 200を返す。
4. 各themeを3つのfresh tabで検証し、hydration後の`[data-slot="avatar-preview"]`が1件、`[data-slot="avatar"]`が2件である。
5. 1つ目の画像が可視で、読み込み完了、自然寸法と表示寸法が正である。
6. 2つ目は`src`を省略し、画像読み込み失敗ではなく上流定義の「画像未提供」経路でfallback `UI`が可視である。
7. `html.dark`と`--background`、`--foreground`、`--muted`、`--muted-foreground`がrouteごとの定義値に一致する。
8. 各監視runでHTTP 4xx/5xx、`Network.loadingFailed`、console error、`Runtime.exceptionThrown`、dev errorが0件である。
9. JPGの返却bytesと保存実体がJPEG magicを持ち、1280x900である。
10. cleanup後のbrowser残tabが0、port 3016が空き、worktreeの変更が指定証跡3件だけである。

rubricは実行前に`/private/tmp/avatar-preview-rubric.md`へ固定した。

## 固定SHAとの差分確認

次のAvatar固有pathを`git diff --exit-code 970b8f5e8a2a4d9ea1d5a26a2387819e341a0be7..94cd60eafd86f681e9af569a2e6409573fb9a841 -- <paths>`で比較し、exit 0を確認した。

- `src/components/ui/avatar.tsx`
- `src/previews/avatar.tsx`
- `src/pages/preview/avatar.astro`
- `src/pages/preview/avatar-dark.astro`
- `src/styles/global.css`
- `preview-selectors.json`
- `registry.json`
- `provenance.json`

固定SHAから検証HEADまでの変更は`.docs/component-addition-procedure.md`、`scripts/check-evidence.mjs`、`scripts/check-evidence.test.mjs`の3件だけで、Avatar固有pathに変更はなかった。

## 実行方法と監視境界

1. `npm run build`をfresh実行し、exit 0を確認した。
2. `lsof -nP -iTCP:3016 -sTCP:LISTEN`がexit 1であることを確認した。
3. `npm run preview -- --host 127.0.0.1 --port 3016`で静的`dist`を起動した。
4. `curl`で両routeを個別に取得し、各HTTP 200を確認した。
5. 各theme/attemptで`browser.tabs.new()`を実行した。最初にrouteへ到達後、CDPの`Network`、`Runtime`、`Log`を有効化し、browser cacheを無効化した。
6. event cursor取得後にreloadし、load、root可視、`astro-island[ssr]`消滅を待ってDOM、画像状態、theme tokenを採取した。
7. `Network.responseReceived`、`Network.loadingFailed`、`Runtime.exceptionThrown`、`Runtime.consoleAPICalled`、`Log.entryAdded`、tab dev logsを採取した。
8. 各tabを採取後にcloseし、各themeの3回目でfull-page JPGを撮影した。

Raw CDPはHTTP(S) pageへの初回navigation後に取得する制約があるため、監視値はlistener有効化後のcache無効reloadを対象とする。最初のnavigationは独立した`curl`のHTTP 200、実URL、title、root selectorで補完した。

## 6runの実測結果

| theme | attempt | root | Avatar | image / fallback | theme | monitored responses | HTTP 4xx/5xx | loadingFailed | console error | pageerror | 判定 |
|---|---:|---:|---:|---|---|---:|---:|---:|---:|---:|---|
| Light | 1 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |
| Light | 2 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |
| Light | 3 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |
| Dark | 1 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |
| Dark | 2 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |
| Dark | 3 | 1 | 2 | image 1 / `UI` 1 | 一致 | 21 | 0 | 0 | 0 | 0 | ✅ |

全runで`Log.entryAdded` error、tab dev errorも0、event batchは`hasMore=false`、`truncated=false`だった。

## Avatar DOMと画像の実測

両theme・全6回で同じ結果を確認した。

| 対象 | 実DOM / 画像状態 | 表示寸法 | 判定 |
|---|---|---:|---|
| preview root | `data-slot="avatar-preview"`、可視 | - | 1件 |
| 1つ目のAvatar | `aria-label="プロフィール画像"`、`data-size="default"` | 32x32 | 可視 |
| 1つ目の画像 | `alt="青いプロフィール画像"`、data URL、`complete=true`、`naturalWidth=150`、`naturalHeight=150` | 32x32 | 読み込み・表示成功 |
| 2つ目のAvatar | `aria-label="プロフィール画像のフォールバック"`、`data-size="lg"` | 40x40 | 可視 |
| 2つ目の画像経路 | previewソースでは`<AvatarImage alt="" />`で`src`省略。hydration後の2つ目のAvatar内に`avatar-image`なし、`src`属性なし | - | 画像読み込み失敗ではない |
| 2つ目のfallback | `data-slot="avatar-fallback"`、text=`UI` | 40x40内 | 可視 |

ページ全体では`avatar-image`が1件、`avatar-fallback`が1件、`astro-island[ssr]`残数が0件だった。

## theme tokenの実測

| theme | `html.dark` | `--background` | `--foreground` | `--muted` | `--muted-foreground` |
|---|---|---|---|---|---|
| Light | false | `oklch(100% 0 0)` | `oklch(14.5% 0 0)` | `oklch(97% 0 0)` | `oklch(54% 0 0)` |
| Dark | true | `oklch(14.5% 0 0)` | `oklch(98.5% 0 0)` | `oklch(26.9% 0 0)` | `oklch(70.8% 0 0)` |

各値は全3run/themeで一致した。

## 画像証跡

Browserの`tab.screenshot({ fullPage: true })`が返したraw bytesを保存した。拡張子から形式を推測せず、返却bytesと保存後実体を検査した。

| path | bytes | magic | `file` | 寸法 | SHA-256 |
|---|---:|---|---|---:|---|
| `.docs/reviews/2026-08-02-avatar-preview-light.jpg` | 8728 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` | JPEG/JFIF 1.01 | 1280x900 | `505a9c4f43ea6fdcc346eb75ce60ee5277ba5988473662def5b357f259fe0051` |
| `.docs/reviews/2026-08-02-avatar-preview-dark.jpg` | 8742 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` | JPEG/JFIF 1.01 | 1280x900 | `6c2fc9c6ff6e280ec4bfb0da9f79a4809f39bddb279a0b7e347e6eb212dd8395` |

両画像を表示して、Light/Dark背景、青い画像Avatar、`UI` fallbackが写っていることを目視確認した。

## 三方向導出のクロスチェック

- コード: `src/previews/avatar.tsx`はdata URLを持つ1つ目と、`src`を省略する2つ目を定義する。`AvatarFallback delay={0}`によりfallback `UI`を即時表示する。
- 画面: hydrated DOMでroot 1、Avatar 2、画像 1、fallback 1を確認した。1つ目は実画像が可視、2つ目は画像要素なしで`UI`が可視だった。
- 型/上流契約: `AvatarImageProps`は`AvatarPrimitive.Image.Props`を透過し、Base UIのImageが「画像未提供」状態ではDOM画像を生成せずFallbackへ遷移する実挙動を確認した。
- コードにあるが画面から到達できない分岐: `size="sm"`、`AvatarBadge`、`AvatarGroup`、`AvatarGroupCount`、画像URLの読み込み失敗経路は当該previewに導線がない。
- 画面から入力できるがコードで検証していない値: 操作入力は存在しない。
- schemaにあるがコードで扱わないparameter: OpenAPI等の外部schemaは対象外。公開Propsの網羅試験ではなく、当該preview契約を対象とした。

## 検証ハーネスの補足

- 空タブでのCDP取得は`Raw CDP requires an HTTP(S) page`となることを確認したため、製品requestを出さずtabをcloseし、HTTP routeへ到達後にCDPを取得する既知の手順へ戻した。
- 結果格納変数の未宣言による検証ハーネス側エラーで採取結果を一度破棄した。最終証跡には、その後に新規作成したLight 3 tabsとDark 3 tabsの完走結果だけを使用した。いずれもtabは`finally`でcloseし、製品コードや証跡を変更しなかった。
- 上記は製品不具合ではない。エラーを成功扱いせず、完全な6runを再採取して判定した。

## 未確認の残

- `size="sm"`、Badge、Group、GroupCount、遅延fallback、外部画像URLの読み込み失敗は当該previewの対象外で未実行。
- 初回browser navigationより前のCDP監視は接続仕様上未実施。独立`curl`と監視下reloadで補完した。

## 最終checker

- `node scripts/check-evidence.mjs`: exit 0、`証跡形式 OK`。
- `npm run check:all`: exit 0。standards、completeness、distribution、preview render、evidenceの全checkerが通過した。
- evidence checkerは既存52件のstale証跡を警告したが、今回のAvatar証跡についてSHA、magic bytes、寸法、形式の不一致は報告しなかった。

## クリーンアップ

- 各fresh tabをcloseし、Browser finalize直前の残tabは0件だった。
- preview serverを停止し、port 3016のlistenerがないことを確認した。
- cleanup後のHEADは`94cd60eafd86f681e9af569a2e6409573fb9a841`のままで、変更は本MarkdownとLight/Dark JPGの指定証跡3件だけである。
