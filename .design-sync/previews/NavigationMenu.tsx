import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "ui-scaffold";

export function Overview() {
  const mode = "isolated";
  return (
    <section data-slot="navigation-menu-preview" className="flex max-w-xl flex-col gap-3 p-6">      <NavigationMenu defaultValue={mode === "isolated" ? "products" : undefined}>
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>
              製品
              <NavigationMenuIndicator />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid min-w-64 gap-1" aria-label="製品のリンク">
                <li>
                  <NavigationMenuLink href="#components">コンポーネント</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#tokens">デザイントークン</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="guides">
            <NavigationMenuTrigger>ガイド</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid min-w-64 gap-1" aria-label="ガイドのリンク">
                <li>
                  <NavigationMenuLink href="#usage">使い方</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#accessibility">アクセシビリティ</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#changelog">更新履歴</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>    </section>
  );
}
