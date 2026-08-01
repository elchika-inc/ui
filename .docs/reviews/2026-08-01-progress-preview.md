# Progress preview 実ブラウザ検証

verified_impl_sha: fbcab83afbca5cb96ad5f01f75f2fd497885638f

- 検証 SHA: `fbcab83afbca5cb96ad5f01f75f2fd497885638f`
- Browser: Chrome
- server: `http://localhost:4330`（固定 SHA の worktree を起動）
- catalog: 未訪問。バッチ末尾の横断検証で実施する。

| route | theme | selector | progressbar | ARIA | indicator / track | dimensions / tokens | console |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/preview/progress/` | light | `[data-slot="progress-preview"]` 1件 | 3件 | role=`progressbar`、min=0、max=100、values=25/50/75、各labelと関連付け | widths=132/264/396px、track=528px | track=4px、radius=`0.625rem`、`--primary=oklch(0.205 0 0)`、`--muted=oklch(0.97 0 0)` | error/warning 0件 |
| `/preview/progress-dark/` | dark | `[data-slot="progress-preview"]` 1件 | 3件 | role=`progressbar`、min=0、max=100、values=25/50/75、各labelと関連付け | widths=132/264/396px、track=528px | track=4px、radius=`0.625rem`、`--primary=oklch(0.922 0 0)`、`--muted=oklch(0.269 0 0)` | error/warning 0件 |

- screenshot: `2026-08-01-progress-preview-light.jpg`、`2026-08-01-progress-preview-dark.jpg`（Chrome screenshot の JPEG 実体を保存）。
