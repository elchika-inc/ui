import {
  CommandBlock,
  DocumentationShell,
  type NavigationCategory,
} from "@/site/documentation-shell";
import {
  directInstallCommand,
  MCP_INIT_COMMAND,
  NAMESPACE_REGISTRY_CONFIG,
  namespaceInstallCommand,
} from "@/site/installation.mjs";

type DocumentationHomeProps = {
  categories: NavigationCategory[];
};

export function DocumentationHome({ categories }: DocumentationHomeProps) {
  return (
    <DocumentationShell categories={categories} home>
      <article className="flex max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">elchika-inc/ui</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Base UI と Tailwind CSS v4 で構築した共有 UI です。shadcn registry 経由で component
            のソースを取り込み、利用側で所有します。
          </p>
        </header>

        <section aria-labelledby="installation-heading" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="installation-heading" className="font-heading text-2xl font-semibold">
              導入手順
            </h2>
            <p className="leading-7 text-muted-foreground">
              使い方に合わせて、次の3つの経路から component を追加できます。
            </p>
          </div>

          <ol className="border-y border-border">
            <li className="flex flex-col gap-4 py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">1. 直接 URL</h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  registry 設定を追加せず、component を1件取得します。
                </p>
              </div>
              <CommandBlock>{directInstallCommand("button")}</CommandBlock>
            </li>
            <li className="flex flex-col gap-4 border-t border-border py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">2. @elchika 名前空間</h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  components.json に registry を登録し、短い名前で取得します。
                </p>
              </div>
              <CommandBlock>{NAMESPACE_REGISTRY_CONFIG}</CommandBlock>
              <CommandBlock>{namespaceInstallCommand("button")}</CommandBlock>
            </li>
            <li className="flex flex-col gap-4 border-t border-border py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">3. shadcn MCP</h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  shadcn CLI 同梱 MCP を初期化し、生成された .mcp.json を有効にするため Claude
                  を再起動します。
                </p>
              </div>
              <CommandBlock>{MCP_INIT_COMMAND}</CommandBlock>
            </li>
          </ol>
        </section>

        <section aria-labelledby="token-heading" className="flex flex-col gap-4">
          <h2 id="token-heading" className="font-heading text-2xl font-semibold">
            トークン置換の注意
          </h2>
          <p className="leading-7 text-muted-foreground">
            shadcn init が生成した :root / .dark の色 alias を削除し、elchika-ui/tokens.css の
            import に一本化してください。component を add するたびに alias block
            が再追記されるため、その都度再削除が必要です。
          </p>
          <CommandBlock>{'@import "./elchika-ui/tokens.css";'}</CommandBlock>
        </section>

        <section
          aria-labelledby="components-heading"
          className="flex flex-col gap-3 border-t border-border pt-8"
        >
          <h2 id="components-heading" className="font-heading text-2xl font-semibold">
            コンポーネント
          </h2>
          <p className="leading-7 text-muted-foreground">
            利用できる component は、サイドバーの一覧または
            <a
              href="/components/button/"
              className="mx-1 rounded-sm text-primary underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              Button のドキュメント
            </a>
            から確認できます。
          </p>
        </section>
      </article>
    </DocumentationShell>
  );
}
