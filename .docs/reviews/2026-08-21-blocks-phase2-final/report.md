# 動作検証レポート: Blocks Phase 2 最終実ブラウザ検証

verified_impl_sha: 7116c97172241d2fc241fab75b35550c89362a54

## 結論

最終候補コミットから dev server を新規起動し、実 Chrome 上で clean full rerun を実施した。対象集合から導出した隔離 preview 50 route と catalog 2 route は全件合格した。

- 隔離 preview: 50/50 合格
- catalog: 2/2 合格
- axe WCAG 2.2 AA 相当: 52/52 route で critical/serious 0
- keyboard: 3/3 flow 合格
- JPEG: 52/52 作成・形式確認・目視確認済み
- pageerror / console error / HTTP 4xx・5xx / request failure: 全 route 0
- dev server: 停止済み、port 4327 の LISTEN なし
- `check-evidence`: exit 0、`証跡形式 OK`

## 実行環境（再現性の前提）

- 検証日時: 2026-08-21 13:47–13:59 JST
- 対象 URL: `http://127.0.0.1:4327`
- OS: Darwin 25.3.0 arm64
- Node.js: v26.7.0
- npm: 11.19.0
- Browser: Google Chrome 151.0.7922.170
- axe-core: 4.10.3
- viewport: 1512×828
- deviceScaleFactor: 1
- 認証・検証データ: 不要
- repository の `package.json` / `package-lock.json`: axe 導入による変更なし

axe は一時ディレクトリへ次のコマンドで導入した。

```sh
npm install --prefix /tmp/blocks-phase2-axe.U3Zf8f --no-save --package-lock=false axe-core@4.10.3
```

## 成功基準（rubric・実行前に定義）

### 対象集合

対象 block は範囲指定から導出し、固定値50を一次情報にしない。

- `login-02`〜`login-05`: 4件
- `signup-01`〜`signup-05`: 5件
- `sidebar-01`〜`sidebar-16`: 16件
- theme: light / dark
- catalog: `/catalog/`、`/catalog-dark/`

### 隔離 preview

各 route が次をすべて満たすこと。

- route file が存在する
- main Document が HTTP 200
- 対象 `preview-selectors` が1件可視
- selector の `data-preview-mode` が `isolated`
- light/dark theme が期待値と一致
- viewport 1512×828、DPR 1
- 横 overflow なし
- `pageerror`、console error、HTTP 4xx/5xx、request failure がすべて0
- axe critical/serious 0
- JPEG が存在し、JPEG magic bytes を持つ
- 目視で重大な欠落・重なり・クリップがない

### catalog

各 catalog route が次をすべて満たすこと。

- main Document が HTTP 200
- Phase 2 の25 selectorが同一DOM内ですべて可視
- selector の `data-preview-mode` が `catalog`
- 固定 `id` の重複なし
- `sidebar-10` actions trigger の `aria-expanded` が `false`
- `sidebar-10` と関連付く開いた popover overlay が0件
- console/network/page error 0
- axe critical/serious 0
- JPEG が存在し、目視で重大な問題がない

### fail-closed

route failure、selector、theme、overflow、JPEG、route file、axe、catalog述語、console/network のいずれかが失敗した場合は runner が exit 1 になること。失敗を集計だけして exit 0 にしないこと。

## 実行コマンドと終了コード

```sh
npm run dev -- --host 127.0.0.1 --port 4327
```

```sh
BLOCKS_BASE_URL=http://127.0.0.1:4327 \
AXE_SOURCE_PATH=/tmp/blocks-phase2-axe.U3Zf8f/node_modules/axe-core/axe.min.js \
node .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-browser-runner.mjs \
> .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-browser-runner.log 2>&1
```

- runner exit code: `0`
- runner summary: `SUMMARY PASS: isolated 50/50, catalog 2/2, axe 52/52, keyboard 3/3, JPEG 52/52`

```sh
node scripts/check-evidence.mjs \
> .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-check-evidence.log 2>&1
```

- exit code: `0`
- 最終出力: `証跡形式 OK`

```sh
lsof -nP -iTCP:4327 -sTCP:LISTEN
```

- server停止後の exit code: `1`
- stdout: 空
- 判定: port 4327 の LISTEN process なし

## route と画像の対応

| block | light | dark |
|---|---|---|
| login-02 | `login-02-case01-light.jpg` | `login-02-case02-dark.jpg` |
| login-03 | `login-03-case03-light.jpg` | `login-03-case04-dark.jpg` |
| login-04 | `login-04-case05-light.jpg` | `login-04-case06-dark.jpg` |
| login-05 | `login-05-case07-light.jpg` | `login-05-case08-dark.jpg` |
| signup-01 | `signup-01-case09-light.jpg` | `signup-01-case10-dark.jpg` |
| signup-02 | `signup-02-case11-light.jpg` | `signup-02-case12-dark.jpg` |
| signup-03 | `signup-03-case13-light.jpg` | `signup-03-case14-dark.jpg` |
| signup-04 | `signup-04-case15-light.jpg` | `signup-04-case16-dark.jpg` |
| signup-05 | `signup-05-case17-light.jpg` | `signup-05-case18-dark.jpg` |
| sidebar-01 | `sidebar-01-case19-light.jpg` | `sidebar-01-case20-dark.jpg` |
| sidebar-02 | `sidebar-02-case21-light.jpg` | `sidebar-02-case22-dark.jpg` |
| sidebar-03 | `sidebar-03-case23-light.jpg` | `sidebar-03-case24-dark.jpg` |
| sidebar-04 | `sidebar-04-case25-light.jpg` | `sidebar-04-case26-dark.jpg` |
| sidebar-05 | `sidebar-05-case27-light.jpg` | `sidebar-05-case28-dark.jpg` |
| sidebar-06 | `sidebar-06-case29-light.jpg` | `sidebar-06-case30-dark.jpg` |
| sidebar-07 | `sidebar-07-case31-light.jpg` | `sidebar-07-case32-dark.jpg` |
| sidebar-08 | `sidebar-08-case33-light.jpg` | `sidebar-08-case34-dark.jpg` |
| sidebar-09 | `sidebar-09-case35-light.jpg` | `sidebar-09-case36-dark.jpg` |
| sidebar-10 | `sidebar-10-case37-light.jpg` | `sidebar-10-case38-dark.jpg` |
| sidebar-11 | `sidebar-11-case39-light.jpg` | `sidebar-11-case40-dark.jpg` |
| sidebar-12 | `sidebar-12-case41-light.jpg` | `sidebar-12-case42-dark.jpg` |
| sidebar-13 | `sidebar-13-case43-light.jpg` | `sidebar-13-case44-dark.jpg` |
| sidebar-14 | `sidebar-14-case45-light.jpg` | `sidebar-14-case46-dark.jpg` |
| sidebar-15 | `sidebar-15-case47-light.jpg` | `sidebar-15-case48-dark.jpg` |
| sidebar-16 | `sidebar-16-case49-light.jpg` | `sidebar-16-case50-dark.jpg` |
| catalog | `catalog-case51-light.jpg` | `catalog-case52-dark.jpg` |

各 block の Document、selector、theme、overflow、console/network、axe、JPEG の詳細値は同階層の25件の component-specific Markdown と `evidence/case00-route-results.json` に記録した。catalog の詳細は `2026-08-21-blocks-phase2-catalog.md` と `evidence/case00-catalog-results.json` に記録した。

## keyboard

### login-02 auth form

- `Email` / `Password` label の `htmlFor` が対応する input を参照
- Tab 順は Acme link → Email → Forgot password → Password → Login → GitHub → Sign up
- 期待順と実測順が一致

### sidebar-10 actions trigger

- 初期状態は isolated preview の仕様どおり open
- Escape で closeし triggerへfocus復帰
- Enterでopenし、対応overlay 1件、`Customize Page`へfocus移動
- 再度Escapeでcloseし、overlay 0件、triggerへfocus復帰

### sidebar-16 toggle

- 初期状態は expanded
- Enterでcollapsed、focus保持
- Spaceでexpanded、focus保持

## 目視確認

52枚すべてを目視した。login、signup、sidebarをlight/darkのcontact sheetで横断確認し、catalog light/darkはfull-page画像でも確認した。直近修正対象のsidebar-08とsidebar-16は原寸画像を個別確認した。

- 重大な要素欠落: なし
- 意図しない要素重なり: なし
- 主要領域のクリップ: なし
- light/darkの明白なtheme不一致: なし
- catalog内Bubbleの明白な不可視化: なし

## 三方向導出のクロスチェック結果

- コード: Phase 2 block実装、preview route、catalog統合、selector定義、keyboard状態遷移を確認
- 画面: 実ChromeのDOM、可視性、操作可能要素、focus、overlay、スクリーンショットを確認
- schema/registry: `registry.json`、`provenance.blocks`、preview selector、route fileの集合をrunner preflightで照合
- registry欠落、provenance欠落、selector欠落、route file欠落: すべて0
- コードにあるが画面から到達できない必須分岐: 今回の必須範囲では観測なし
- auth送信自体は副作用回避のため実行対象外

## 未到達分岐

今回のviewportはdesktop固定であるため、mobile判定に依存するsidebar分岐は未到達。全sidebar内の全リンク・全dropdown itemの遷移、auth formのsubmit後処理、外部認証、外部リンク遷移も必須範囲外として実行していない。

## 発見した不具合

最終対象コミットのclean full rerunでは不具合を検出しなかった。中間コミットで検出したaxe target-size、list構造、action label、catalog Bubble可視性の問題は実装修正後の最終runで再測定し、古い結果を合格根拠へ流用していない。

keyboard runnerの初期key合成が実ブラウザの入力経路と一致しない問題にはURISK-046を適用し、実装を誤修正せずrunner側のCDP key eventを修正してからclean full rerunした。

## `check-evidence` 結果と既知advisory

`node scripts/check-evidence.mjs` は約4分6秒でexit 0となり、今回の26 Markdownを含む証跡形式検査は合格した。

```text
2 件の証跡が共有面の変更より古い:
  2026-08-05-index-page.md: src/previews
  過去履歴の shared stale: 90 件（形式・immutability は全件検査済み）
証跡形式 OK
```

これは既存履歴に関するadvisoryであり、今回作成した証跡の形式不合格ではない。

## 作成ファイル

- component-specific / catalog Markdown: 26件
- 集約 `report.md`: 1件
- 機械可読証跡・runner・ログ: 15件
- JPEG: 52件（isolated 50枚、catalog 2枚）

## 未列挙・未検証の残

- Chrome desktop 1512×828のみ。Firefox、Safari、mobile viewportは未検証
- axeによる自動検査であり、実スクリーンリーダー利用者による評価ではない
- keyboardは主要3 flowの代表検証であり、全操作要素の総当たりではない
- auth submit、GitHub認証、外部リンク遷移は副作用回避のため未実行
- visual regressionのpixel diffではなく、人間が再確認可能なJPEGを用いた目視判定
- 現SHAでは失敗がなかったためflaky再試行は発生していない

## クリーンアップ

- アプリケーションデータの作成なし
- Chrome temporary profile: 削除済み
- Chrome runner process: 正常終了
- axe一時導入先: 削除済み、absence check exit 0
- dev server: 停止済み
- port 4327: `lsof` exit 1、LISTENなし
- repositoryのpackage/lock変更: なし
- `.docs/actions/`登録候補: なし
