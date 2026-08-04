import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "ui-scaffold";

export function Overview() {
  return (
    <div className="p-6">
      <Tabs defaultValue="overview" className="w-full max-w-md">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">共有 UI の概要を表示しています。</TabsContent>
        <TabsContent value="settings">共有 UI の設定を表示しています。</TabsContent>
      </Tabs>
    </div>
  );
}
