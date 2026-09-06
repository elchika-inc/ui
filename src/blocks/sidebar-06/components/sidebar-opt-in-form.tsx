import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInput } from "@/components/ui/sidebar";

export function SidebarOptInForm() {
  return (
    <Card className="gap-2 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">ニュースレターを購読</CardTitle>
        <CardDescription>新機能やお知らせをメールで受け取ります。</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <form>
          <div className="grid gap-2.5">
            <SidebarInput aria-label="メールアドレス" type="email" placeholder="メールアドレス" />
            <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none">
              購読を登録
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
