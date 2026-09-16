import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabsPreview() {
  return (
    <div className="grid gap-6 p-6">
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="overview">共有 UI の概要を表示しています。</TabsContent>
        <TabsContent value="settings">共有 UI の設定を表示しています。</TabsContent>
      </Tabs>
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList variant="line">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="overview">下線で選択中のタブを示しています。</TabsContent>
        <TabsContent value="settings">下線が移動して設定を表示しています。</TabsContent>
      </Tabs>
    </div>
  );
}
