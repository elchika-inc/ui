# バッチ4 UI component 設計

## 目的

shadcn/ui の未投入キューを、既存の component 追加手順と同じ「生成・正規化・公開・実ブラウザ検証・証跡」の単位で追加する。実行順は委任で指定された順を維持し、既存 component は変更しない。最終的に catalog 横断走査とレビューサイクルを通し、feature branch から PR を作る。

## 正本と停止条件

- 実行手順の正本は `.docs/component-addition-procedure.md` とする。
- 上流 registry の応答、生成コード、実 DOM を事実の正本とし、component 名から挙動を推測しない。
- wrapper が unknown path、既存 dependency の版・区分変更、または指示と実体の矛盾を検出したら、影響範囲を止めて委任元へ報告する。
- 成功条件に、別の定義から導かれる件数を固定しない。空走ガードを維持し、対象名と実出力を照合する。

## 投入順

### 層1

次の順を変えず、5件ごとの切れ目で進捗を報告する。

1. `alert-dialog`
2. `attachment`
3. `button-group`
4. `calendar`
5. `carousel`
6. `chart`
7. `field`
8. `input-group`
9. `item`
10. `menubar`
11. `message-scroller`
12. `pagination`
13. `sheet`
14. `toast`
15. `toggle-group`

### 層2

依存先が投入済みになったあと、`combobox`、`command`、`sidebar` を1件ずつ追加し、各件の完了時に報告する。

- `combobox` は `button` と `input-group` を参照する。
- `command` は `dialog` と `input-group` を参照し、上流 registry が要求する `cmdk` を追加する。
- `sidebar` は既存 UI 群に加えて `use-mobile` を参照する。`use-mobile` は sidebar の files に同梱せず、上流と同じ独立 `registry:hook` として `@elchika/use-mobile` から解決する。

### 描画を持たない item

最後に `direction` を追加する。`DirectionProvider` と `useDirection` 自体は描画を持たないため、Provider 配下の検証用 consumer が `dir` と hook の解決値を可視化する。実装着手前に consumer、selector、light / dark で測る項目を委任元へ報告する。

## 1 component の実装境界

各 UI component は必ず次の順で処理する。

1. 上流 registry item と生成予定コードを読み、dependency、registry dependency、export、Provider / Portal / interaction の実体を確認する。
2. `node scripts/add-component.mjs <name> --modified "実差分"` を実行する。
3. 生成された対象だけを standards に正規化し、全 PascalCase value export に同名の `Props` 型を定義する。
4. `src/index.ts`、component 固有 preview、light / dark route、`preview-selectors.json` を追加する。
5. format、lint、typecheck、script test、build、library build、`check:pre` を実行する。
6. component 実装を明示 path だけ stage して実装 commit を作る。
7. その実装 SHA を固定して light / dark の実ブラウザ検証を行う。
8. 新規 Markdown と JPEG 2枚だけを証跡 commit にし、`check:all` を実行する。

実装 commit 後に component 固有 path を変更した場合、古い証跡を流用せず、新しい実装 SHA でブラウザ検証からやり直す。

## 挙動検証の設計

### 共通

- isolated preview は component の主要状態・操作を観測可能にする。
- catalog preview は横断表示を壊さず、overlay や自動変化を必要以上に起動しない。
- selector は hydration 後に必ず実在する安定属性を使う。
- light / dark の双方で selector、console error、主要操作、視認性を確認する。
- overlay、focus、keyboard、live region などの期待値は、上流実装と実 DOM を読んだあと各 component ごとに定める。

### `toast`

`toast` はモーダルとして扱わない。`createToastManager` / Provider / Portal / Viewport による live notification として、通知追加、自動消滅、読み上げ経路、Action / Close、複数通知の順序と上限、hover 中の自動消滅停止の有無、背景へ到達できることを実測する。focus trap や背景遮蔽が無いことを正常系とする。

### `alert-dialog` と `sheet`

名前による事前分類を置かない。生成された primitive 構成と hydrated DOM を確認してから、open / close、Escape、外側操作、focus 移動、背景の扱いなど、実在する経路だけを検証項目にする。

## `registry:hook` の追加経路

`use-mobile` を独立 item として安全に追加するため、`add-component.mjs` を `registry:ui` と `registry:hook` の一次ファイルに対応させる。

- upstream item の type と一次 file から、生成先を `src/components/ui/<name>.tsx` または `src/hooks/<name>.ts` に決定する。
- 一次 file 以外の unknown path は従来どおり fail-closed にする。
- provenance の registry path、content hash、生成 hash、上流 path と commit SHA は item type に対応した実体から記録する。
- `registry.json` には上流と同じ item type と一次 file を登録する。
- `sidebar` の `registryDependencies` は既存の namespace 正規化で `@elchika/use-mobile` にする。
- unit test は unknown hook の失敗、hook 一次 file の保持、独立 item の生成、sidebar 依存の namespace 正規化を検証する。
- `registry:hook` は `src/components/ui` の正本走査外なので、Props、preview、component 証跡を要求しない。registry build 後の JSON と fresh install probe で hook の到達を検証する。

wrapper の変更と `use-mobile` item は sidebar より先に独立 commit とし、そのあと sidebar の通常の実装 commit と証跡 commit を作る。

## dependency と provenance

追加 dependency は上流 registry と wrapper 出力から実行時に導出し、`package.json` と lockfile の解決版を確認する。今回すでに上流から確認できた対象は `calendar`、`carousel`、`chart`、`message-scroller`、`command` であるが、件数を成功条件にしない。特に `react-day-picker@latest` は実行時の lockfile を正本にする。

`provenance.modified` は予定でなく最終差分を説明する。生成後の正規化、Props 型、アクセシビリティ修正、dependency の実解決を反映し、実装 commit 前に再確認する。

## バッチ末尾

最後の component 証跡 commit 後の SHA を固定し、catalog light / dark を実ブラウザで横断走査する。動的 manifest が列挙した全 preview の描画、console error、selector 到達を確認し、対象名を列挙した新規 catalog 証跡を作る。

その後、リポジトリ全体の format、lint、typecheck、script test、build、library build、`check:all` を実行する。correctness、security、明示要件に関する flag がゼロになるまでレビューサイクルを回し、最終レビュー記録、PR、日本語のバッチ総括を作る。
