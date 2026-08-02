# 動作検証レポート: recheck-0869e78 証跡整合性 clean round

verified_impl_sha: dd9a4a7b25529883684416ac41d63c4f23cc7e43

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 JST
- 対象HEAD: `dd9a4a7b25529883684416ac41d63c4f23cc7e43`
- 実測対象SHA: `0869e7814b30199387df5f135b19b037530b6d70`
- 開始HEAD: `dd9a4a7b25529883684416ac41d63c4f23cc7e43`
- 終了HEAD: `dd9a4a7b25529883684416ac41d63c4f23cc7e43`
- 開始・終了時の`git status --short`: 空
- 実行可否: ✅実行した
- ブラウザ再実行: 依頼により不要。採用済み6 runの実測値と保存証跡を照合した。

## 成功基準（rubric・実行前に定義）

- 前回flagのviewport記録が、要求値とページ内実測値を明確に分離している。
- ページ内実測値が保存画像の幅と一致する。
- 前回確認済みの実測値、画像、scopeに後続差分がない。
- `0869e78..dd9a4a7`が指定された文書・証跡4ファイルのみで、製品差分がない。
- `check-evidence`と`git diff --check`が成功する。
- 開始・終了HEADが一致し、worktreeがcleanである。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順 |
|---|---|---|---|---|---|---|---|---|
| 1 | viewport要求値と実測値の分離 | 画面・資料 | 実測値比較 | High | ✅実測確認 | 1/1 | 対象Markdown 19行目 | `nl -ba .docs/reviews/recheck-0869e78/2026-08-02-batch-final-catalog.md` |
| 2 | 実測viewportとJPEG幅の整合 | 画面・ファイル | クロスチェック | High | ✅実測確認 | 2/2 | Light/Dark JPEG | `sips -g pixelWidth -g pixelHeight .docs/reviews/recheck-0869e78/*.jpg` |
| 3 | JPEG bytes・寸法・SHA-256の不変性 | 資料・ファイル | 完全性検査 | High | ✅実測確認 | 2/2 | Light/Dark JPEG | `wc -c .../*.jpg`、`sips ...`、`shasum -a 256 .../*.jpg` |
| 4 | 前回指摘後の変更範囲 | コード・資料 | 差分検査 | High | ✅実測確認 | 1/1 | Git差分 | `git diff 0b57ea1 dd9a4a7 -- <report.md>` |
| 5 | 実装SHAから対象HEADまでのscope | コード | 差分検査 | High | ✅実測確認 | 1/1 | Git差分 | `git diff --name-status 0869e78 dd9a4a7`および製品pathへの`git diff --exit-code` |
| 6 | 証跡形式ゲート | コード・資料 | CLI実行 | High | ✅実測確認 | 1/1 | CLI標準出力 | `node scripts/check-evidence.mjs` |
| 7 | whitespace/error差分ゲート | コード | CLI実行 | Medium | ✅実測確認 | 1/1 | CLI終了コード | `git diff --check 0869e78 dd9a4a7` |
| 8 | HEAD固定・worktree clean | コード | 状態検査 | High | ✅実測確認 | 2/2 | Git状態 | 開始・終了時に`git rev-parse HEAD`と`git status --short` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky / ⏭️未実行 / ❌不具合

## 実測結果

- viewport記録は「override要求は1440x900」「採用6 runのページ内実測`innerWidth / innerHeight`は1512x772 CSS px」と分離されている。
- Light/Dark JPEGはいずれも幅1512、高さ9313で、ページ内実測幅1512と一致した。
- Light JPEG:
  - bytes: `1,183,189`
  - SHA-256: `444ba045960b38286cf039e1143c5781f481da64f8176ea89a7dde90d91e25d9`
- Dark JPEG:
  - bytes: `1,195,413`
  - SHA-256: `9feb9b305c8693cdf19a7581f5ce25893debb8a29f32466e0ddebf5556838d43`
- `0b57ea1..dd9a4a7`の後続差分は対象Markdownのviewport 1行のみだった。
- `0869e78..dd9a4a7`は次の4ファイルのみだった:
  - `.docs/component-addition-procedure.md`
  - `.docs/reviews/recheck-0869e78/2026-08-02-batch-final-catalog.md`
  - `.docs/reviews/recheck-0869e78/2026-08-02-batch-final-catalog-light.jpg`
  - `.docs/reviews/recheck-0869e78/2026-08-02-batch-final-catalog-dark.jpg`
- 製品pathの差分検査はexit 0だった。
- `node scripts/check-evidence.mjs`はexit 0で、既知の陳腐化一覧55件を表示後に`証跡形式 OK`を出力した。
- `git diff --check 0869e78 dd9a4a7`はexit 0だった。
- `INSPECTION_STATUS: flag=0 optional=0`

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐: 今回は証跡整合性レビューのため対象外。
- 画面実測と資料の不一致: なし。
- スキーマにあるがコードで扱っていないパラメータ: 対象なし。
- 要求viewport、ページ内実測viewport、JPEG寸法の関係は資料上で正しく区別されている。

## 未到達分岐（網羅の穴・機械的な証拠）

- clean roundの確認項目に未到達分岐なし。
- ブラウザ操作分岐は採用済み6 runを正本とし、今回は再実行していない。

## 発見した不具合（あれば）

- なし。
- 前回flagは解消済み。

## 未列挙・未検証の残（正直な限界）

- ブラウザ自体は再実行していない。
- 対象レポートに明記されたSafari、Firefox、mobile viewport、screen reader全文、pixel baseline比較は引き続き未実測。

## クリーンアップ

- ファイル変更なし。
- 開始・終了HEADは同一。
- 終了時の`git status --short`は空。
