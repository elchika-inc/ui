# 動作検証レポート: Calendar preview

verified_impl_sha: abc381d207f54a41211c62cba88b8b427f0e0885

## 実行環境（再現性の前提）

- 検証日時: 2026-08-02 05:53:07 JST (+0900)
- 対象:
  - Light: `http://127.0.0.1:3013/preview/calendar`
  - Dark: `http://127.0.0.1:3013/preview/calendar-dark`
- OS: macOS 26.3.1 (25D2128), arm64
- Node.js: v26.4.0
- Browser: Google Chrome 150.0.7871.187
- 実行可否: ✅実行した
- Git 状態: 対象 SHA と一致し、検証前後とも `git status --short` は空
- 副作用: リポジトリファイルの変更なし

## 成功基準（rubric・実行前に定義）

- hydration 後に `[data-slot="calendar-preview"]`、`[data-slot="calendar"]`、calendar grid が各1個存在する。
- 2026年8月が日本語表示され、初期選択が2026年8月15日、status が `選択日: 2026年8月15日` になる。
- 別日をクリックすると、選択属性と status が同じ日へ更新される。
- 前月・次月への移動と、設定されたナビゲーション境界状態が一致する。
- Tab で日付へ到達し、矢印キー後の `activeElement`、`data-focused`、`tabindex=0` が同じ移動先を指す。
- Enter / Space でフォーカス中の日付を選択できる。
- 月末から翌月へのキーボード移動で、実 focus と表示月が追随する。
- フォーカス中の日付だけに、computed style 上の幅3px・不透明な ring が表示される。
- Light / Dark が別の背景・前景・選択色を使用する。
- 両ルートの console error が0件である。
- JPEG が実在し、magic bytes、dimensions、SHA-256を取得できる。

## テストケースと結果

| # | 動作パターン | 導出元 | 技法 | リスク | 判定 | 再現率 | 実体エビデンス | 再現手順（コマンド／操作） |
|---|---|---|---|---|---|---|---|---|
| 1 | 対象 SHA と `ref={ref}` の実在 | コード | 構成確認 | High | ✅実測確認 | 1/1 | `git rev-parse HEAD`、`rg -c` が `1` | `git rev-parse HEAD`; `rg -c 'ref=\{ref\}' src/components/ui/calendar.tsx` |
| 2 | Light hydration・calendar DOM | コード・画面 | 0スイッチ | High | ✅実測確認 | 1/1 | preview=1、calendar=1、grid=`8月 2026` | URLを開き、`astro-island[ssr]` の消滅と preview の可視化を待機し DOM snapshot |
| 3 | Dark hydration・calendar DOM | コード・画面 | 0スイッチ | High | ✅実測確認 | 1/1 | preview=1、calendar=1、`html.className="dark"` | Dark URLで同手順 |
| 4 | 日本語2026年8月・初期選択 | コード・画面・スキーマ | 同値分割 | High | ✅実測確認 | 2/2 | 両テーマで selected=`2026/8/15`、status=`選択日: 2026年8月15日` | 各URLを再読込し、selected button と role=status を取得 |
| 5 | 別日をポインター選択 | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | 両テーマで8月20日をクリック後、selected=`2026/8/20`、status=`選択日: 2026年8月20日` | accessible name `2026年8月20日木曜日` の一意性を確認してクリック |
| 6 | 前月・次月移動とナビ境界 | コード・画面 | 状態遷移・境界値 | High | ✅実測確認 | 2/2 | 8月→7月→8月→9月。各月で前後ボタンは `disabled=false`、`aria-disabled` なし | Previous→Next→Next をクリックし caption、grid label、button state を取得 |
| 7 | ArrowRight 後の focus/ref 追随 | コード・画面 | 回帰・状態遷移 | High | ✅実測確認 | 2/2 | 両テーマで active=`2026/8/16`、focused cell=`2026-08-16`、唯一の tabindex=0=`2026/8/16` | 再読込→Tab×3→250ms待機→8/15でArrowRight→250ms待機 |
| 8 | Enter / Space 選択 | 画面 | 状態遷移 | High | ✅実測確認 | 2/2 | Enterで8/16、次のArrowRight+Spaceで8/17を選択。status も一致 | ケース7からEnter→ArrowRight→Space |
| 9 | キーボードで月境界越え | コード・画面 | 境界値・1スイッチ | High | ✅実測確認 | 2/2 | 8月から9月1日へ移動し、active、focused cell、tabindex=0 が9/1で一致。caption=`2026年9月` | 8/17からEnd→ArrowDown→ArrowRight×3 |
| 10 | focus ring の幅・不透明度・単一性 | コード・画面 | computed style | High | ✅実測確認 | 2/2 | ring button は8/16の1個のみ。`oklch(0.556 0 0) 0px 0px 0px 3px`、alpha指定なし | ケース7後に全 day button の `boxShadow` を列挙 |
| 11 | Light / Dark 配色 | コード・画面 | 同値分割 | Medium | ✅実測確認 | 2/2 | Light body/calendar=`oklch(1 0 0)`、Dark=`oklch(0.145 0 0)`。選択背景は Light=`oklch(0.205 0 0)`、Dark=`oklch(0.922 0 0)` | 各テーマで body、calendar、selected、weekday の computed color を取得 |
| 12 | console error | 画面 | 異常系監視 | High | ✅実測確認 | 2/2 | Light=`[]`、Dark=`[]` | 全操作後に Browser dev logs を error level で取得 |
| 13 | JPEG 証跡の実在・形式 | 実体ファイル | 書き出しゲート | High | ✅実測確認 | 2/2 | 下記「JPEG証跡」参照 | Browser screenshot→PNG保存→`sips`変換→`file` / `xxd` / `sips` / `shasum` |

判定ラベル: ✅実測確認 / ⚠️未確認・要人間判断 / 🔁flaky（再現率を併記） / ⏭️未実行（破壊的・要人間実行） / ❌不具合  
導出元ラベル: コード / 画面 / スキーマ（複数可）

## 修正前後の回帰比較

修正前は Light / Dark の双方で次を実測した。

- Tab×3後は active、`data-focused`、`tabindex=0` が8月15日で一致。
- ArrowRight後、内部の `data-focused` だけが8月16日へ移動。
- 実 `activeElement` と `tabindex=0` は8月15日に残留。
- 8月15日と8月16日の両方に3px ringが表示。
- 再現率は2/2。

修正後は、`CalendarDayButton` が保持する内部 ref を `<Button ref={ref}>` へ接続した状態で次を実測した。

- ArrowRight後の active、`data-focused`、`tabindex=0` がすべて8月16日に一致。
- 3px ring は実フォーカス先の8月16日だけに表示。
- Enter / Space による選択と月境界越えも実フォーカスに追随。
- Light / Dark とも再現率2/2。

修正前の異常は、DayPicker内部状態の移動だけが成功し、DOM focus を動かす `ref.current?.focus()` が対象DOMへ到達できない状態と整合する。URISK-046を適用し、自然なTab経路と locator keypress の2経路、および実装ソースを突き合わせて検証手段由来の偽失敗ではないことを確認した。

## JPEG証跡

取得経路:

1. Browser API `tab.screenshot({ format: "png" })` で `Uint8Array` のPNGを取得。
2. PNGを `/private/tmp/calendar-preview-{light,dark}.png` に一時保存。
3. `/usr/bin/sips -s format jpeg -s formatOptions 90 <png> --out <jpg>` でJPEGへ変換。
4. `file`、`xxd -l 16`、`sips -g pixelWidth -g pixelHeight -g format`、`shasum -a 256` で検査。
5. 中間PNGは変換後に削除し、指定されたJPEGだけを残した。

| Theme | 保存先 | magic / format | dimensions | size | SHA-256 |
|---|---|---|---|---:|---|
| Light | `/private/tmp/calendar-preview-light.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×828 | 37,449 bytes | `f5faa51b5d48cefb5a9c563611bc560fb6bcd9b190d0c008cc2b9d550faef63e` |
| Dark | `/private/tmp/calendar-preview-dark.jpg` | `ff d8 ff e0` / JFIF JPEG | 1512×772 | 36,649 bytes | `a2ec23f3c827ad4ae102ca08b17f45b0fc734766c50f05553118095b18bb56e5` |

目視でも、8月15日の選択表示と8月16日の単一focus ring、Light/Dark背景の切替を確認した。

## 三方向導出のクロスチェック結果

- コードにあるが画面から到達できない分岐:
  - `range_start` / `range_middle` / `range_end`
  - `showWeekNumber`
  - `captionLayout="dropdown"` 系
  - disabled / hidden day
  - RTL用アイコン回転
  - 複数月表示、カスタムcomponents、別button variant
- 画面から入力できるがコードで検証していない値:
  - 自由入力欄はなく、日付buttonのイベントはDayPickerのDate値をcontrolled stateへ渡すため該当なし。
- スキーマにあるがコードで扱っていないパラメータ:
  - `CalendarProps` はDayPickerの広いpropsを公開するが、本previewは `mode="single"`、`locale`、`defaultMonth`、`selected`、`onSelect` だけを使う。公開propsの未使用分はpreview網羅外であり、実装乖離とは判定しない。
- 画面側の観測差分:
  - 月・曜日・日付・statusは日本語だが、前後月buttonのaccessible nameは英語の `Go to the Previous Month` / `Go to the Next Month`。
  - 当日8月2日のaccessible nameは `Today, 2026年8月2日日曜日` で、`Today`だけ英語。
  - 今回の明示要件は日本語の月・日付・statusであり合格としたが、完全なa11y文言日本語化を求める場合は追加対応が必要。

## 未到達分岐（網羅の穴・機械的な証拠）

- range modeの開始・中間・終了表示
- week number表示
- dropdown caption
- start/end monthを設定した有限ナビゲーション
- disabled / hidden / matcher指定
- multiple mode
- 複数月表示
- RTL
- カスタムcomponents / formatters
- `showOutsideDays=false`
- `autoFocus`
- shift+矢印、PageUp / PageDown、Homeの全組み合わせ

## 発見した不具合（あれば）

現 SHA の対象ケースでは新たな機能不具合を検出しなかった。

ただし、`provenance.json` が固定する shadcn/ui base-nova Calendar 上流実装には、`CalendarDayButton` の内部 ref がButtonへ接続されない既知バグが記録されている。ローカルの `ref={ref}` はその回避差分である。

上流が修正した場合は、二重処理や不要差分を残さないため、ローカルref接続差分が不要になったかを再評価すること。

## 未列挙・未検証の残（正直な限界）

- macOS上のGoogle Chrome以外のブラウザ、OS、モバイル、touch
- range / multiple / week number / dropdown / multiple months
- disabled、hidden、日付matcher、有限start/end month
- RTL、タイムゾーン差、DST境界
- zoom、forced-colors、prefers-reduced-motion
- 全42日すべての個別クリック
- 長期間・極端な年月への反復ナビゲーション
- accessible nameの完全日本語化要否は要件判断が必要

## クリーンアップ

- アプリケーションデータの作成・削除なし。
- 中間PNG 2件を `/private/tmp` から削除済み。
- 指定JPEG 2件のみ保存。
- リポジトリの変更なし。
- `.docs/actions/` への登録候補: 上流Calendarがref接続を修正した際にローカル差分を再評価する。
- brainへの記録候補: 状態上のfocusと実DOM focusを別々に検査し、`activeElement`・roving tabindex・可視ringの一致を完了ゲートにする。
