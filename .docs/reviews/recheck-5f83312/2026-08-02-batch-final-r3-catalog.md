# Batch Final Task 9 R3 Catalog 横断動作検証レポート

verified_impl_sha: 5f8331231ee849330ea0bdd5288338e0f7b5eb1f

## 結論

- 判定: **PASS**
- Light / Darkを各3つのfresh tab、計6/6で実測した。
- hydration後の`[data-catalog-preview]`は全runで61件。コードから機械導出した期待61件と完全一致し、0件化、欠落、余剰、重複、不可視sectionはなかった。
- batch4の19件は全runで19/19が各1section、正の矩形、visibleだった。
- catalog modeでdialog / sheet / menubar / combobox content、toast、Sonner toast、sentinel、画面外fixed blockerは全run 0だった。
- reloadと同時にCDP event cursorを逐次drainする方式で、既定buffer容量に依存せず全requestを収集した。全runで`truncated=false`、request=response、未終端0、全status 200だった。
- console error / pageerror / loading failure / 4xx / 5xxは全run 0だった。
- 指定Light / Dark full-page JPEGをCDPからJPEGとして直接取得し、JFIF magic・形式・寸法・61section全景の一致を確認した。

## 実行環境

| 項目 | 実測値 |
|---|---|
| リポジトリ | `/Users/nishikawa/projects/elchika-inc/ui` |
| branch | `feat/batch-final` |
| 固定HEAD | `5f8331231ee849330ea0bdd5288338e0f7b5eb1f` |
| 検証日時 | 2026-08-02 14:34〜14:50 JST |
| OS | macOS 26.3.1（Build 25D2128）、arm64 |
| Node.js / npm | v26.4.0 / 11.17.0 |
| Browser | Google Chrome 150.0.7871.187 |
| Astro | 7.1.6 |
| viewport | 1440×900 CSS px |
| server | `127.0.0.1:3018`、PID 77895 |
| URL | Light `/catalog/`、Dark `/catalog-dark/` |
| fresh build | `npm run build` exit 0、125 pages生成 |
| 実行可否 | ✅ Light / Darkとも実行 |

## 成功基準（実行前rubric）

1. 各themeを3つのfresh tabで実行する。
2. `src/previews/*.tsx`から導出した期待集合が非空かつ61件である。
3. hydration後のrootが1件、`astro-island[ssr]`が0件、actual集合が期待集合と完全一致する。
4. 全61sectionが正の矩形、display有効、visibility有効、hiddenなしである。
5. batch4 19件が全て存在し、各1件、visibleである。
6. catalog modeでoverlay / toast / sentinelが自動表示されず、横断表示を妨げるfixed blockerがない。
7. reload開始時からCDPイベントを逐次drainし、各chunkで`truncated=false`、全requestにresponseまたはfailure終端がある。
8. 4xx / 5xx、status 0、loading failure、pageerror、console / Log / dev error・warningが0である。
9. Light / Dark theme classとbackground / foregroundが一致する。
10. Light / Dark full-page JPEGが対象ページを表し、拡張子と実形式がJPEGで一致する。

## 期待集合

`src/previews`の`.tsx` basenameをsortして61件を機械導出した。

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `attachment`, `avatar`, `badge`, `breadcrumb`, `bubble`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `direction`, `drawer`, `dropdown-menu`, `empty`, `field`, `hover-card`, `input`, `input-group`, `input-otp`, `item`, `kbd`, `label`, `marker`, `menubar`, `message`, `message-scroller`, `native-select`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`

batch4 19件:

`alert-dialog`, `attachment`, `button-group`, `calendar`, `carousel`, `chart`, `combobox`, `command`, `direction`, `field`, `input-group`, `item`, `menubar`, `message-scroller`, `pagination`, `sheet`, `sidebar`, `toast`, `toggle-group`

## 3/3 DOM結果

| theme | fresh tab | root / sections | 集合差分 | 不可視 | batch4 | overlay等 |
|---|---:|---|---|---:|---:|---|
| Light | 3/3 | 各1 / 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 |
| Dark | 3/3 | 各1 / 61 | 欠落0・余剰0・重複0 | 0 | 19/19 | 全0 |

全runで`astro-island[ssr]=0`だった。

代表runのbatch4矩形:

| component | width | height |
|---|---:|---:|
| alert-dialog | 410.664 | 287 |
| attachment | 410.664 | 333.867 |
| button-group | 410.664 | 459 |
| calendar | 410.664 | 459 |
| carousel | 410.664 | 420 |
| chart | 410.664 | 420 |
| combobox | 410.664 | 331 |
| command | 410.664 | 411 |
| direction | 410.664 | 365 |
| field | 410.664 | 459.75 |
| input-group | 410.664 | 343 |
| item | 410.664 | 312.5 |
| menubar | 410.664 | 475 |
| message-scroller | 410.664 | 571 |
| pagination | 410.664 | 351 |
| sheet | 410.664 | 324 |
| sidebar | 410.664 | 403 |
| toast | 410.664 | 535 |
| toggle-group | 410.664 | 535 |

## overlay / 自動通知

全6runで次がDOM 0件・visible 0件だった。

- `[data-slot="alert-dialog-content"]`
- `[data-slot="sheet-content"]`
- `[data-slot="menubar-content"]`
- `[data-slot="combobox-content"]`
- `[data-slot="dialog-content"]`
- `[data-slot="toast"]`
- `[data-sonner-toast]`
- `[data-sentinel]`

さらに、`main`外で`position: fixed`かつ高z-index、正の矩形を持つ表示妨害要素は0件だった。

## buffer非依存の全resource評価

CDPイベントはreloadをawaitせず開始し、同時に`afterSequence` cursorを50ms単位で前進させた。各取得は最大1000件で、14〜18回に分けてdrainした。reload完了後もtailをdrainし、全runで次を確認した。

| theme / run | request | response | loopback response | status | truncated | failure / 未終端 |
|---|---:|---:|---:|---|---|---|
| Light 1 | 175 | 175 | 172 | 全200 | false | 0 / 0 |
| Light 2 | 175 | 175 | 172 | 全200 | false | 0 / 0 |
| Light 3 | 175 | 175 | 172 | 全200 | false | 0 / 0 |
| Dark 1 | 174 | 174 | 172 | 全200 | false | 0 / 0 |
| Dark 2 | 174 | 174 | 172 | 全200 | false | 0 / 0 |
| Dark 3 | 175 | 175 | 172 | 全200 | false | 0 / 0 |

総数にはChrome extensionのcursor画像1件等のbrowser側resourceも含まれる。loopbackの172 responseは全runで一定だった。全監視対象をstatus評価し、4xx / 5xx / status 0は0だった。

全runで次も0だった。

- `Network.loadingFailed`
- `Runtime.exceptionThrown`
- `Runtime.consoleAPICalled` error / warning
- `Log.entryAdded` error / warning
- browser dev logs error / warn / warning

## theme

| theme | html.dark | `--background` / 実背景 | `--foreground` / 実前景 |
|---|---|---|---|
| Light | false | `oklch(100% 0 0)` / `oklch(1 0 0)` | `oklch(14.5% 0 0)` / `oklch(0.145 0 0)` |
| Dark | true | `oklch(14.5% 0 0)` / `oklch(0.145 0 0)` | `oklch(98.5% 0 0)` / `oklch(0.985 0 0)` |

全3runで同値だった。

## JPEG証跡

取得方法はChrome DevTools Protocolの`Page.getLayoutMetrics`でfull-page寸法を取得後、`Page.captureScreenshot({ format: "jpeg", quality: 90, captureBeyondViewport: true, clip })`を呼び、返却base64を`.jpg`へ直接保存した。

| 画像名 | bytes | 実寸 | magic / format | SHA-256 |
|---|---:|---:|---|---|
| `2026-08-02-batch-final-r3-catalog-light.jpg` | 854,978 | 1440×9269 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `c2533a2a147bb3c9ab8aaa5850b93a261a50b3334681f533fdb2ac29f42d6b31` |
| `2026-08-02-batch-final-r3-catalog-dark.jpg` | 875,921 | 1440×9269 | `ff d8 ff e0 00 10 4a 46` / JPEG JFIF 1.01 | `703c8f799c915c097c0dd4bfd91a1ead6420a5593ee21055a933662ab2c89aed` |

`file`、`sips format=jpeg`、JFIF magicが一致した。画像はLight / Darkの61section全景、3列layout、overlay非表示を目視確認した。

## 三方向導出のクロスチェック

- コード: `import.meta.glob("../previews/*.tsx", { eager: true })`とmanifestが全previewを名前順に列挙し、catalogが各Previewへ`mode="catalog"`を渡す。
- 画面: hydrated DOMのactual name集合、矩形、表示状態、overlay slot、themeを全runで取得した。
- 型・契約: `PreviewMode = "isolated" | "catalog"`。overlay defaultOpen、sentinel、command dialog trigger、sidebar分岐がcatalog側へ倒れていることを実DOMで確認した。
- コードにあるがcatalogから未到達: isolated専用sentinel、overlay defaultOpen、command dialog trigger、sidebar collapse操作。
- 画面から操作可能だが今回は未操作: overlay trigger、toast生成button、combobox open。catalog成功基準は初期横断表示を妨げないことであり、open後の機能は個別preview証跡の責務。
- OpenAPI等の外部schemaは対象に存在しない。

## 検証ハーネス上の不採用run

- 初回の完了後一括CDP読取はDOM自体は61/61だったが`truncated=true`だったため、通信完全性の根拠に採用しなかった。
- navigation前のResource Timing buffer拡張script注入は、このraw CDP接続でunsupportedだった。該当tabは不採用・破棄した。
- 最終採用6runは、reloadとCDP cursor drainを並行実行する方式へ変更し、全chunk `truncated=false`、request=response、未終端0を確認したfresh tabだけで構成した。

## 未検証範囲

- catalog内triggerを開いた後の各overlay操作
- toast / Sonner通知を生成した後の表示・消滅
- 各componentのisolated固有keyboard契約
- Safari / Firefox
- mobile幅のcatalog全景
- screenshot baselineとの自動pixel diff

## 再現手順

```bash
cd /Users/nishikawa/projects/elchika-inc/ui
git rev-parse HEAD
git branch --show-current
git status --short
lsof -nP -iTCP:3018 -sTCP:LISTEN
npm run build
npm run preview -- --host 127.0.0.1 --port 3018
```

1. Light / Dark URLを各3つのfresh tabで開く。
2. CDP Network / Runtime / Logをenableし、cacheを無効化する。
3. 1440×900を設定し、CDP cursorを取得する。
4. reloadをawaitせず開始し、並行して`readEvents(afterSequence=cursor, limit=1000)`を逐次実行する。
5. reload完了後もtailをdrainし、全chunkの`truncated=false`、request=response、failure / 未終端0を確認する。
6. hydration後、expected 61件とactual集合、全矩形、batch4 19件、overlay / toast / sentinelを取得する。
7. console / pageerror / network statusを判定する。
8. 3回目にfull-page JPEGをCDPから直接取得する。

## evidence checker

Markdown未保存状態で`node scripts/check-evidence.mjs`を実行し、exit 1を確認した。

- 共有面変更より古い既存証跡: 53件
- component固有stale:
  - `recheck-7ef427b/2026-08-02-sidebar-preview.md`
  - `2026-08-02-toggle-group-preview.md`

これは依頼時に成功要求されていない既知のstale状態であり、今回の採用runを合格へ昇格する根拠には使っていない。

## クリーンアップ

- 永続データ作成、外部送信、削除、課金なし。
- 採用tab・不採用tabを全てcloseした。
- Browser finalize直前のtab数は0。
- viewport overrideをreset後、Browser sessionをfinalizeした。
- preview serverを停止し、3018 LISTENなし、停止後curl exit 7を確認した。
- 終了HEADは`5f8331231ee849330ea0bdd5288338e0f7b5eb1f`で開始時から不変。
- branchは`feat/batch-final`から不変。
- `git diff --exit-code`、`git diff --cached --exit-code`はいずれもexit 0。
- `git ls-files --others --exclude-standard`は指定6 JPEGだけだった。
- 製品コード変更・commitなし。
