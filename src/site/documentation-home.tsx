import { Button } from "@/components/ui/button";
import { CommandBlock } from "@/site/documentation-shell";
import {
  directInstallCommand,
  MCP_INIT_COMMAND,
  NAMESPACE_REGISTRY_CONFIG,
  namespaceInstallCommand,
} from "@/site/installation.mjs";
import { SiteMasthead } from "@/site/site-masthead";

export function DocumentationHome() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 lg:px-12 lg:pb-40">
      <div data-site-header className="sticky top-0 z-30">
        <SiteMasthead />
        <nav
          data-site-subnav
          aria-label="このページの目次"
          className="mb-16 flex gap-4 overflow-x-auto border-b border-border bg-background/88 py-3 backdrop-blur-md [scrollbar-width:none]"
        >
          {["install", "tokens", "components"].map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="rounded-sm font-mono text-3xs tracking-label text-muted-foreground uppercase hover:text-primary focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              {section}
            </a>
          ))}
        </nav>
      </div>
      <main id="main-content" tabIndex={-1}>
        <header data-site-hero className="pt-6 pb-20">
          <h1 className="max-w-xl font-heading text-4xl font-semibold tracking-display leading-display md:text-5xl">
            取り込んで、所有する。共有 UI の実体。
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Base UI と Tailwind CSS v4 で構築した共有 UI です。shadcn registry 経由で component
            のソースを取り込み、利用側で所有します。
          </p>
        </header>

        <section id="install" aria-labelledby="installation-heading" className="scroll-mt-28 pt-24">
          <span
            data-site-eyebrow
            className="block font-mono text-3xs font-medium tracking-label text-highlight-text uppercase"
          >
            install
          </span>
          <h2
            id="installation-heading"
            className="mt-3 font-heading text-2xl font-semibold tracking-heading leading-display"
          >
            導入手順
          </h2>
          <p className="mt-2 mb-8 max-w-2xl text-sm text-muted-foreground">
            使い方に合わせて、次の3つの経路から component を追加できます。
          </p>

          <ol className="border-y border-border">
            <li className="flex flex-col gap-4 py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">1. 直接 URL</h3>
                <p className="mt-2 leading-normal text-muted-foreground">
                  registry 設定を追加せず、component を1件取得します。
                </p>
              </div>
              <CommandBlock>{directInstallCommand("button")}</CommandBlock>
            </li>
            <li className="flex flex-col gap-4 border-t border-border py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">2. @elchika 名前空間</h3>
                <p className="mt-2 leading-normal text-muted-foreground">
                  components.json に registry を登録し、短い名前で取得します。
                </p>
              </div>
              <CommandBlock>{NAMESPACE_REGISTRY_CONFIG}</CommandBlock>
              <CommandBlock>{namespaceInstallCommand("button")}</CommandBlock>
            </li>
            <li className="flex flex-col gap-4 border-t border-border py-6">
              <div>
                <h3 className="font-heading text-xl font-semibold">3. shadcn MCP</h3>
                <p className="mt-2 leading-normal text-muted-foreground">
                  shadcn CLI 同梱 MCP を初期化し、生成された .mcp.json を有効にするため Claude
                  を再起動します。
                </p>
              </div>
              <CommandBlock>{MCP_INIT_COMMAND}</CommandBlock>
            </li>
          </ol>
        </section>

        <section id="tokens" aria-labelledby="token-heading" className="scroll-mt-28 pt-24">
          <span
            data-site-eyebrow
            className="block font-mono text-3xs font-medium tracking-label text-highlight-text uppercase"
          >
            tokens
          </span>
          <h2
            id="token-heading"
            className="mt-3 font-heading text-2xl font-semibold tracking-heading leading-display"
          >
            トークン置換の注意
          </h2>
          <p className="mt-2 mb-8 max-w-2xl text-sm text-muted-foreground">
            shadcn init が生成した :root / .dark の色 alias を削除し、elchika-ui/tokens.css の
            import に一本化してください。component を add するたびに alias block
            が再追記されるため、その都度再削除が必要です。
          </p>
          <CommandBlock>{'@import "./elchika-ui/tokens.css";'}</CommandBlock>
        </section>

        <section
          id="components"
          aria-labelledby="components-heading"
          className="scroll-mt-28 pt-24"
        >
          <span
            data-site-eyebrow
            className="block font-mono text-3xs font-medium tracking-label text-highlight-text uppercase"
          >
            components
          </span>
          <h2
            id="components-heading"
            className="mt-3 font-heading text-2xl font-semibold tracking-heading leading-display"
          >
            コンポーネント
          </h2>
          <p className="mt-2 mb-8 max-w-2xl text-sm text-muted-foreground">
            利用できる component は、コンポーネント一覧または
            <a
              href="/components/button/"
              className="mx-1 rounded-sm text-primary underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            >
              Button のドキュメント
            </a>
            から確認できます。
          </p>
          <Button render={<a href="/components/" />}>コンポーネント一覧を見る</Button>
        </section>
      </main>
    </div>
  );
}
