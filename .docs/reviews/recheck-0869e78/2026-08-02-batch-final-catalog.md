# バッチ4 カタログ公開文言変更後の横断動作検証レポート

verified_impl_sha: 0869e7814b30199387df5f135b19b037530b6d70

## 結論

- 判定: GREEN。Light / Darkを各3 fresh tab、計6 runで実測し、全runで期待preview集合とhydrated DOM集合が完全一致した。
- 公開表示はLightがtitle=`カタログ — elchika-inc/ui`、Darkがtitle=`カタログ Dark — elchika-inc/ui`、両themeのh1が`カタログ`だった。旧文言`検証用カタログ`は全runで0件だった。
- 全runで不可視section、sentinel、overlay、active toast、console error / warning、resource failure、status 0、unknown status、HTTP 4xx / 5xxは0件だった。
- component固有実装、preview、個別route、registry、provenanceは対象SHAの直前commitから差分0であり、component固有証跡61件の再取得は不要と判定した。

## 実行環境

- 検証日時: 2026-08-02 JST
- branch: `feat/batch-final`
- 検証対象: 上記の固定実装SHA
- OS: Darwin arm64
- Browser: Google Chrome 150.0.7871.187
- viewport: override要求は1440x900、採用6 runのページ内実測`innerWidth / innerHeight`は1512x772 CSS px
- fresh build: 固定SHAの一時cloneで`npm run build` exit 0、125 pages生成
- preview server: `npm run preview -- --host 127.0.0.1 --port 3016`
- HTTP probe: `/catalog/`と`/catalog-dark/`が各200

## 検証手順

1. `src/previews/*.tsx`から補助moduleを除外して期待集合を機械導出し、空走しないことを確認した。
2. 固定SHAの一時cloneでfresh buildし、port 3016へpreview serverを固定した。
3. Light / Darkを各3 fresh tabで開き、初回load後にcacheを無効化して監視下reloadした。
4. hydration完了後、root、SSR marker、`[data-catalog-preview]`の名前集合・矩形・可視性、sentinel、overlay、toast、title、h1、theme実色をread-onlyに取得した。
5. CDP event bufferは完全性の根拠にせず、各tabの`PerformanceResourceTiming.responseStatus`を全件取得した。consoleはbrowser dev logsのerror / warn / warningを取得した。
6. 各themeの3回目でfull-page画像を取得し、raw PNGからJPEGへ変換した。変換後にbytes、magic、`file`判定、寸法、SHA-256と目視内容を確認した。
7. 全tabとserverを停止し、port 3016にlistenerが残っていないことを確認した。

## 全run結果

| theme | fresh tab | root / hydration | preview集合 | 不可視 | sentinel / overlay / active toast | resource | console |
|---|---:|---|---|---:|---|---|---|
| Light | 3/3 | root 1、SSR marker 0 | 61件、欠落・余剰・重複0 | 0 | 0 / 0 / 0 | 各171件、全200 | error / warning 0 |
| Dark | 3/3 | root 1、SSR marker 0 | 61件、欠落・余剰・重複0 | 0 | 0 / 0 / 0 | 各171件、全200 | error / warning 0 |

空のBase UI toast viewportは各runに1件存在したが、`[data-slot="toast"]`と`[data-sonner-toast]`によるactive toastは0件だった。空viewportを開いたtoastとして数えていない。

## 公開文言とtheme

| theme | URL | title | h1 | 旧文言 | `html.dark` | background | foreground |
|---|---|---|---|---:|---:|---|---|
| Light | `http://127.0.0.1:3016/catalog/` | `カタログ — elchika-inc/ui` | `カタログ` | 0 | false | variable `oklch(100% 0 0)` / root `oklch(1 0 0)` | variable `oklch(14.5% 0 0)` / root `oklch(0.145 0 0)` |
| Dark | `http://127.0.0.1:3016/catalog-dark/` | `カタログ Dark — elchika-inc/ui` | `カタログ` | 0 | true | variable `oklch(14.5% 0 0)` / root `oklch(0.145 0 0)` | variable `oklch(98.5% 0 0)` / root `oklch(0.985 0 0)` |

## JPEG証跡

画像はBrowser Pluginの`await currentTab.screenshot({ fullPage: true })`が返したraw PNGを`node:fs/promises.writeFile`で一時保存し、`sips -s format jpeg -s formatOptions 90 <input.png> --out <output.jpg>`でJPEGへ変換した。取得方法と保存形式を分離して記録し、変換後の実体を正本とする。

| path | bytes | magic / format | 寸法 | SHA-256 |
|---|---:|---|---:|---|
| `2026-08-02-batch-final-catalog-light.jpg` | 1,183,189 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` / JPEG JFIF 1.01 | 1512x9313 | `444ba045960b38286cf039e1143c5781f481da64f8176ea89a7dde90d91e25d9` |
| `2026-08-02-batch-final-catalog-dark.jpg` | 1,195,413 | `ff d8 ff e0 00 10 4a 46 49 46 00 01` / JPEG JFIF 1.01 | 1512x9313 | `9feb9b305c8693cdf19a7581f5ce25893debb8a29f32466e0ddebf5556838d43` |

Light / Darkとも61sectionの全景、先頭のh1=`カタログ`、各theme、末尾Tooltipまでの描画を目視確認した。blank、途中描画、自動overlay遮蔽はなかった。

## 三方向導出とscope

- コード: `src/previews/*.tsx`のbasename、catalog manifest、各Previewへの`mode="catalog"`を追跡した。
- 画面: hydrated DOMの名前集合、矩形、表示状態、公開文言、theme、overlay状態を全runで取得した。
- 通信: Resource Timingの全entryを走査し、全resourceがstatus 200であることを確認した。
- 対象SHAの直前commitから変更された製品pathは`src/pages/catalog.astro`、`src/pages/catalog-dark.astro`、`src/catalog/verification-catalog.tsx`の表示文字列3行だけだった。`src/components/ui`、`src/previews`、`src/pages/preview`、`registry.json`、`provenance.json`に差分はなかった。

## 未実測範囲

- catalog内triggerを操作した後のoverlay、toast生成、isolated mode固有のkeyboard契約は各component固有証跡の責務とした。
- Safari / Firefox、mobile viewport、screen reader全文、pixel baseline比較は未実測である。
- CDP event bufferは容量境界を持つため完全性根拠に使用せず、Resource Timing全件へ切り替えた。

## クリーンアップと差分境界

- browser残tab 0、preview server停止、port 3016 listener 0を確認した。
- 検証用一時cloneの製品実装は固定SHAから不変だった。
- 検証開始後に本体worktreeへ別作業として`.docs/component-addition-procedure.md`の未コミット差分が加わった。ブラウザ検証者はrepoへ書き込んでおらず、検証対象の一時cloneと画像採取結果へ影響しない。
