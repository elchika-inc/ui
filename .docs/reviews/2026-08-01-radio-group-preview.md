# Radio Group preview 実ブラウザ検証

- 検証 SHA: `e3a4b05008aa84b1b4ac2c02172b3cf53653339b`
- 対象 route: `/preview/radio-group/`、`/preview/radio-group-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

light/darkともにselector 1件、item 4件、disabled item 1件、indicator 1件、初期value=`starter`、console error 0件を確認した。初期ARIAはstarter=`aria-checked=true`、team/business=`false`、enterprise=`aria-checked=false`かつ`aria-disabled=true`だった。label clickで`starter`→`team`へ変更し、label associationを確認した。

| theme | ArrowDown / Right / Up / Left | disabled click | activeElement |
| --- | --- | --- | --- |
| light | starter→team / team→business / business→team / team→team | enterprise click後もteamのまま | 各Arrow後は選択されたBase UI radio hidden inputへ移動 |
| dark | starter→team / team→business / business→team / team→starter | enterprise click後もstarterのまま | 各Arrow後は選択されたBase UI radio hidden inputへ移動 |

focus ringはnon-transparent `--ring=oklch(0.556 0 0)`、computed `outline-width=3px` / `outline-color=oklch(0.556 0 0)`で確認した。item寸法は16×16px。lightのcomputed tokenはbackground=`oklch(1 0 0)`、foreground=`oklch(0.145 0 0)`、input=`oklch(0.922 0 0)`、checked item background/border=`oklch(0.205 0 0)`、text=`oklch(0.985 0 0)`。darkはbackground=`oklch(0.145 0 0)`、foreground=`oklch(0.985 0 0)`、input=`oklch(1 0 0 / 15%)`、checked item background/border=`oklch(0.922 0 0)`、text=`oklch(0.205 0 0)`。

## roving tabindex と Tab 離脱

light/darkともに、teamをArrowDownでcheckedにした状態でitemの`tabindex`を実測した。starter=`-1` / `aria-checked=false`、team=`0` / `true`、business=`-1` / `false`、enterprise=`-1` / `false` / `aria-disabled=true`であり、`tabindex=0`はちょうど1件だった。team（`tabindex=0`）へfocusした後にTabを1回送ると、`document.activeElement`はgroup子孫外の`ASTRO-DEV-TOOLBAR`へ移り、group内に追加のTab stopがないことを確認した。

- `2026-08-01-radio-group-preview-light.jpg`: Browser screenshot。
- `2026-08-01-radio-group-preview-dark.jpg`: Browser screenshot。
