---
trigger: next-session
created: 2026-08-03
autonomy: auto-pr
---

# 公開 state へ到達できる preview を追加する

ContextMenu / DropdownMenu / Menubar の destructive item、Badge / BubbleContent の interactive hover、InputGroup の disabled state を preview の実 DOM から操作できるようにする。

今回のブランドトークン移行では component source の class 契約と contrast sensor は確認できたが、現行 preview に該当 state がなく browser computed style を実測できなかった。測定済みとして扱わず、別作業で preview を拡充する。

## 走査方法

1. `src/components/ui/*.tsx` の公開 Props、variant union、状態 selector、disabled 契約を抽出する。
2. 対応する `src/previews/*.tsx` の rendered element、prop、操作で同じ状態へ到達できるか比較する。
3. 到達不能な公開 state を名前で列挙し、件数を Expected に固定しない。
4. 追加した state を light / dark の実 pointer / keyboard event で作り、DOM、computed color / background / opacity、contrast、console、overflow を確認する。

## 完了条件

- 上記の既知未到達 state が preview DOM から操作可能である。
- 走査で見つかった同型の未到達 state を同じ作業で扱うか、理由を記録して別 Action に残す。
- component 固有 light / dark evidence を新規追加し、既存証跡を上書きしない。
- format、lint、targeted test、`npm run check:all`、review cycle が通る。
- PR 作成後、この Action を `actionctl done` で archive する。
