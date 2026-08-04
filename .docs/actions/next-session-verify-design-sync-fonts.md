---
trigger: next-session
created: 2026-08-05
autonomy: manual
---

# claude.ai/design 側で IBM Plex が実際に適用されているか確認する

2026-08-04 の design-sync（PR #21・345 component を投入）で、書体は Google Fonts の remote `@import` 経由で供給する構成のまま同期した。ローカルの headless chromium では `document.fonts.check('16px "IBM Plex Sans JP"')` が `true` で解決を実測できたが、**同期先のレンダリング環境から `fonts.googleapis.com` へ到達できるかは未検証**。

到達できない場合、この design system で生成される**すべてのデザインがフォールバックフォントで描画される**。design agent もユーザーも気付かないまま進むため、実体で一度確認する必要がある。

## 確認方法

1. https://claude.ai/design/p/937f6779-85d0-4b7e-b4bb-9ec8d0660b4f を開く。
2. DS ペインのカード（`Card` / `Message` / `Bubble` など日本語テキスト量の多いもの）で字形を見る。IBM Plex Sans JP かシステムフォント（ヒラギノ等）かを判別する。
3. 判別に迷う場合は、design agent に簡単な画面を作らせて `getComputedStyle` の `font-family` と実際の描画を比べる。

## フォールバックだった場合の対応

`cfg.extraFonts` で IBM Plex の woff2 を同梱する方針へ切り替える。IBM Plex は OFL なので再配布可能。`@fontsource` 系パッケージから woff2 を取得してリポ内へ置き、`extraFonts` にその `@font-face` CSS を指定して再同期する。

## 完了条件

- 同期先での実際の描画書体を確認し、結果を `.design-sync/NOTES.md` の Re-sync risks へ「検証済み」として反映する。
- フォールバックだった場合は `extraFonts` を設定して再同期し、再確認まで済ませる。
- 確認後、この Action を `actionctl done` で archive する。
