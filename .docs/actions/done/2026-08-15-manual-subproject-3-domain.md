---
trigger: manual
created: 2026-08-03
autonomy: manual
---

# Phase B — ui.elchika.dev 公開手順

この手順は Phase A の PR が main へ merge された後に、Cloudflare と GitHub の管理権限を持つユーザーが1回だけ実行する。API token の値はリポジトリ、Issue、PR、workflow log へ書かない。

Phase A 完了時点では `ui.elchika.dev` は未公開である。deployment・DNS・公開到達は、この手順の完了後に初めて確認済みとなる。

## 事前条件

- Phase A の PR が `elchika-inc/ui` の main に merge 済み
- `elchika.dev` を管理する Cloudflare account へアクセスできる
- `elchika-inc/ui` の repository secrets を登録できる

## 1. Cloudflare API token を発行する

1. Cloudflare dashboard の Account API tokens を開く。
2. **Create Token** を選ぶ。
3. Permission policies で Custom から **Edit Cloudflare Workers** を選ぶ。
4. token 名を `github-actions-elchika-ui` など用途が分かる名前にする。
5. Account Resources は `elchika.dev` を持つ account だけへ限定する。利用可能なら Zone Resources も `elchika.dev` だけへ限定する。
6. token を作成し、表示された値を password manager など安全な場所へ一時保存する。値は再表示できないため、この画面を閉じる前に保存する。

Cloudflare 公式: <https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/#1-authentication>

## 2. Cloudflare Account ID を取得する

1. Cloudflare dashboard の **Workers & Pages** を開く。
2. **Account details** に表示される Account ID をコピーする。

Cloudflare 公式: <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/#find-account-id-workers-and-pages>

## 3. GitHub Actions secrets を登録する

1. GitHub の `elchika-inc/ui` で **Settings > Secrets and variables > Actions** を開く。
2. **New repository secret** から次の2件を登録する。

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 手順1で発行した token |
| `CLOUDFLARE_ACCOUNT_ID` | 手順2で取得した Account ID |

登録後は secret 名だけが一覧に見え、値を読み戻せないのが正常である。GitHub 公式: <https://docs.github.com/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-a-repository>

## 4. 最初の deploy を実行する

1. GitHub の **Actions > Deploy** を開く。
2. **Run workflow** から main を選んで実行する。これは `.github/workflows/deploy.yml` の `workflow_dispatch` を使う。
3. `npm ci`、`npm run build`、`npx wrangler deploy` の順に成功したことを job log で確認する。
4. log に表示された `*.workers.dev` URL を開き、トップページが表示されることを確認する。

以後は main への push で同じ workflow が自動実行される。

## 5. Custom Domain を設定する

1. Cloudflare dashboard の **Workers & Pages** で Worker `elchika-ui` を選ぶ。
2. **Settings > Domains & Routes > Add > Custom Domain** を選ぶ。
3. `ui.elchika.dev` を入力し、**Add Custom Domain** を選ぶ。

Custom Domain は DNS record と TLS certificate を Cloudflare が作成する。`ui.elchika.dev` に既存の CNAME がある場合は追加できないため、既存 record の用途を確認し、関係のない record を推測で削除しない。

Cloudflare 公式: <https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#set-up-a-custom-domain-in-the-dashboard>

## 6. 公開実体を検証する

次のコマンドは HTTP status、body、Content-Type を別々に検証する。HTTP 200 だけを成功根拠にしない。

```bash
SITE_VERIFY_DIR="$(mktemp -d)"

curl --fail --silent --show-error --dump-header "$SITE_VERIFY_DIR/index.headers" --output "$SITE_VERIFY_DIR/index.json" https://ui.elchika.dev/r/index.json
rg -i '^content-type: application/json' "$SITE_VERIFY_DIR/index.headers"
jq -e 'type == "array" and length > 0 and all(.[]; has("name") and has("type") and has("files"))' "$SITE_VERIFY_DIR/index.json"

curl --fail --silent --show-error --dump-header "$SITE_VERIFY_DIR/button.headers" --output "$SITE_VERIFY_DIR/button.json" https://ui.elchika.dev/r/button.json
rg -i '^content-type: application/json' "$SITE_VERIFY_DIR/button.headers"
jq -e '.name == "button" and .type == "registry:ui" and (.files | length > 0)' "$SITE_VERIFY_DIR/button.json"

curl --fail --silent --show-error --output "$SITE_VERIFY_DIR/index.html" https://ui.elchika.dev/
rg -F 'npx shadcn@latest add https://ui.elchika.dev/r/button.json' "$SITE_VERIFY_DIR/index.html"

curl --fail --silent --show-error --output "$SITE_VERIFY_DIR/component.html" https://ui.elchika.dev/components/button/
rg -F 'data-component-preview="button"' "$SITE_VERIFY_DIR/component.html"
```

すべて exit 0 になれば、registry index、個別 registry item、トップページ、component ページの公開到達を確認できた。失敗した場合は custom domain を付け替えず、最初に失敗した command の response と Deploy workflow の該当 run を確認する。
