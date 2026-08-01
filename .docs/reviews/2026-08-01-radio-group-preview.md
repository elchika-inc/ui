# Radio Group preview 実ブラウザ検証

- 検証 SHA: `e3a4b05008aa84b1b4ac2c02172b3cf53653339b`
- 対象 route: `/preview/radio-group/`、`/preview/radio-group-dark/`
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

light/darkともにselector 1件、item 4件、disabled item 1件、indicator 1件、初期value=`starter`、console error 0件を確認した。label clickで`starter`→`team`へ変更し、label associationを確認した。lightではArrowDownで`starter`→`team`、ArrowRightで`business`からdisabledをskipして`starter`、ArrowUpで`starter`→`business`、ArrowLeftで`business`→`team`となり、activeElementも選択radioへ移動した。item寸法は16×16px。darkでもlabel clickで`team`へ変更した。

- `2026-08-01-radio-group-preview-light.jpg`: Browser screenshot。
- `2026-08-01-radio-group-preview-dark.jpg`: Browser screenshot。
