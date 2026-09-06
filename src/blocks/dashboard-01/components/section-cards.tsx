import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>売上高</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">¥1,250,000</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            今月は増加傾向 <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">過去 6 か月の訪問者数</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>新規顧客</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">1,234</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDownIcon />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            今期は 20% 減少 <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">獲得に注意が必要</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>有効アカウント</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">45,678</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            継続率が高い <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">利用率が目標を上回る</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>成長率</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">4.5%</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            安定して伸長 <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">成長予測どおり</div>
        </CardFooter>
      </Card>
    </div>
  );
}
