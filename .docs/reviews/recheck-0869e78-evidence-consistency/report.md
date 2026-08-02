# 動作検証レポート: recheck-0869e78 証跡整合性

verified_impl_sha: 0b57ea1c36ff303686d7f957fe5b126b0d626f2e

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 JST
- 対象HEAD: `0b57ea1c36ff303686d7f957fe5b126b0d626f2e`
- 実装SHA: `0869e7814b30199387df5f135b19b037530b6d70`
- 実行可否: ✅実行した
- 開始・終了時ともworktreeはclean

## 成功基準（rubric・実行前に定義）

- 記録値が採用済みのブラウザ実測値と一致する。
- JPEGのbytes、寸法、magic、SHA-256が実ファイルと一致する。
- 実装SHAからHEADまでが指定された文書・証跡4ファイルのみで、製品差分がない。
- 証跡検査が実際に成功する。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | Light/Dark各3 runのDOM・resource・console値 | 画面・資料 | 状態比較 | High | ✅実測確認 | 6/6 | 対象Markdown | 採用済み6 runの測定結果と全表を照合 |
| 2 | viewport記録 | 画面・資料 | 実測値比較 | High | ❌不具合 | 6/6 | Markdown 19行目、JPEG寸法 | 実測`innerWidth/innerHeight`およびJPEG幅と照合 |
| 3 | JPEG形式・寸法・hash | 資料・ファイル | 境界値 | High | ✅実測確認 | 2/2 | Light/Dark JPEG | `wc -c`、`sips`、`file`、`shasum -a 256` |
| 4 | 文書のみの差分 | コード | 差分検査 | High | ✅実測確認 | 1/1 | Git差分 | `git diff --name-status 0869e78..0b57ea1`、製品pathへの`git diff --exit-code` |
| 5 | 証跡ゲート | コード・資料 | CLI実行 | High | ✅実測確認 | 1/1 | CLI標準出力 | `node scripts/check-evidence.mjs` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: 今回は証跡整合性レビューのため対象外。
- 画面から得た値と資料の不一致: viewportのみ不一致。
- スキーマにあるがコードで扱っていないパラメータ: 対象なし。

## 未到達分岐（網羅の穴・機械的な証拠）

- ブラウザ再実行は依頼上不要であり、既存の採用済み6 runを正本として照合した。

## 発見した不具合

- 対象Markdown 19行目は`viewport: 1440x900 CSS px`と記録している。
- 実際はLight/Dark各3 runの全6 runで`innerWidth=1512`、`innerHeight=772`だった。
- JPEG実寸も`1512x9313`であり、幅1512を裏付ける。
- requested overrideとobserved viewportを区別して記載し、実測環境値を`1512x772 CSS px`へ訂正する必要がある。
- `INSPECTION_STATUS: flag=1 optional=0`

## 未列挙・未検証の残（正直な限界）

- viewport誤記修正後のclean roundは未実施。
- ブラウザ自体の再実行は行っていない。

## クリーンアップ

- ファイル変更なし。
- 終了HEADは開始時と同一。
- `git status --short`は空。
