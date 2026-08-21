# registry:block Phase 2 レビューサイクル

verified_impl_sha: 7116c97172241d2fc241fab75b35550c89362a54

## 対象

- 実装範囲: login-02〜05、signup-01〜05、sidebar-01〜16
- 除外: dashboard-01
- 最終実装検証 SHA: `7116c97172241d2fc241fab75b35550c89362a54`
- 手順明確化 commit: `abcbc1940ceaaa655415c9ff88dd5135522a21c5`
- レビュー上限: 5 round
- 終了判定: Round 5 の全 flag を修正し、残存 flag 0

## Round 1

Core Logic、Security / Registry / Provenance、Tests / Evidence、Frontend / Domain、Ambiguity / Requirements、Fresh Eyes の6観点で実施した。

主な flag:

- 外部 `registry:page.target` による repo 内既存 file 削除
- completeness の item / file type false-green
- IconPlaceholder の別 file・同名 icon 横取り
- upstream kind 判定前の記録済み skip
- provenance.modified の IconPlaceholder 展開記録不足
- browser runner が route failure を exit code へ反映しない
- aggregate report の `verified_impl_sha` 形式不一致
- catalog 実ブラウザ証跡不足と固定 id 重複
- sidebar の catalog auto-open、hydration 時刻差、accessible name / label 不足
- 恒久 IconPlaceholder 手順の旧記述

対応:

- CLI 前 preflight、type 検査、file 単位 icon 照合、証跡 runner fail-closed 化を追加
- `useId`、deterministic date、accessible name、catalog mode 分岐を実装
- provenance.modified と恒久手順を実態へ同期

## Round 2

主な flag:

- component / block 異 lane 同名の silent overwrite
- 非 code file type の許容漏れ
- 同一 file 内の既存 icon 横取り
- dropped page path traversal
- wrapper が検証した JSON と CLI が再取得する JSON の TOCTOU
- `registry:component.target` の未検査

対応:

- lane 判定、path 正規化、file type、target を CLI 前に fail-closed 化
- upstream response bytes を一時 local JSON へ固定し、CLI 入力と provenance hash を同じ bytes へ束縛
- baseline icon occurrence を導入

## Round 3

主な flag:

- lane 衝突判定が provenance だけに依存
- icon の既存位置と placeholder 位置の属性交換が unordered 照合を通る

対応:

- provenance / registry / disk の三者で反対 lane を検査
- completeness に component type と lane 交差検査を追加
- 上流と生成物の ordered icon occurrence を file 単位で照合し、残存 IconPlaceholder も独立拒否

実ブラウザ検証で追加検出した問題:

- sidebar-05 / 10 / 11 / 15 の list / listitem 構造
- sidebar-10 / 15 の icon-only action name
- sidebar-08 / 16 の target size
- catalog 内 Bubble label の contrast
- isolated preview の暗黙 favicon 404

対応:

- block call site の list DOM、aria-label、Collapsible composition、24px action sizeを修正
- catalog 表示だけの contrast 補正と対象50 routeの明示 faviconを追加

## Round 4

主な flag:

- provenance 両 lane 重複と registry 同名 item 重複が `Set` / `find` に隠れる
- 初回 target-size 修正が実際の `nav-main` selectorでなく `nav-projects` を変更していた

対応:

- provenance-only、同 type 重複、異 type 両順序の fixtureを追加し、変換前配列で重複拒否
- axe selectorを最終DOMから call siteへ再対応付けし、sidebar-08 / 16 の `nav-main` を修正
- 効かなかった `nav-projects` 差分は戻し、provenance hashとmodifiedを実態へ再同期

## Round 5

最終固定 blobに対する結果:

- Core Logic / Silent Failure: flags 0
- Security / Registry / Provenance: flags 0
- Frontend / Domain: flags 0
- Ambiguity / Requirements: live icon auditの実行手順欠落を修正後、residual flags 0
- Tests / Evidence: aggregate `report.md` 追加後に `check-evidence` を再実行し、residual flags 0

最終の実ブラウザ検証:

- isolated 50/50、catalog 2/2
- axe 52/52 routeでcritical/serious 0
- keyboard 3/3
- JPEG 52/52、全件目視
- pageerror / console error / HTTP 4xx・5xx / request failure 0
- server停止、port 4327のLISTENなし
- 最終27 Markdown集合で `node scripts/check-evidence.mjs` exit 0

## 非採用 optional

- 一時 JSON の作成途中にI/O failureが起きた場合の空directory回収: 通常の配布 correctness と外部入力境界に影響せず、今回のscope外
- live icon checker の対象を共有scan根から自動導出: Phase 2の明示25件を検査する現在契約に一致し、将来block追加時に再検討
- `SidebarMenuAction` の24px既定化: 既存61 componentの共有contractへ変更範囲を広げず、違反を実測したblock call siteだけで修正
- 記録済みitemのupstream fetch不要化: 書込み冪等性とfail-closed性に影響せず、上流kind確定を優先

## 明示した運用境界

- `check-block-icons.mjs` はlive upstream / networkへ依存するため、repo-localな `check:pre` / `check:all` / CIには含めない。
- 代わりにblock実装commit前とPR作成前の独立必須auditとして恒久手順へ明記した。
- 設計書と実装計画はユーザーが訂正する予約文書のため、この実装では書き換えていない。
- 既存証跡のshared stale advisoryは形式・immutability検査を通過した既知履歴であり、今回証跡の不合格ではない。

## ACCEPTED_RISKS

なし。高確度 flag はすべて修正し、Round 5 内の修正確認で残存0を確認した。
