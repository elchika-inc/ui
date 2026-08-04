import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "ui-scaffold";

const orders = [
  { number: "ORD-240801-001", product: "ワイヤレスキーボード", amount: "¥12,800" },
  {
    number: "ORD-240801-002",
    product: "長い商品名でも横スクロールで確認できるディスプレイスタンド",
    amount: "¥8,400",
  },
] as const;

export function Overview() {
  return (
    <section
      data-slot="table-preview"
      className="max-w-xl space-y-6 p-6"
      aria-labelledby="table-preview-title"
    >
      <div className="space-y-1">
        <h1 id="table-preview-title" className="text-base font-medium text-foreground">
          注文一覧
        </h1>
        <p className="text-sm text-muted-foreground">
          見出し、本文、合計を native table の意味論で関連付けます。
        </p>
      </div>
      <div className="max-w-sm overflow-hidden rounded-md border">
        <Table className="w-max">
          <TableCaption>2026年8月の注文</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">注文番号</TableHead>
              <TableHead scope="col">商品</TableHead>
              <TableHead scope="col" className="text-right">
                金額
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.number}>
                <TableCell>{order.number}</TableCell>
                <TableCell>{order.product}</TableCell>
                <TableCell className="text-right tabular-nums">{order.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>合計</TableCell>
              <TableCell className="text-right tabular-nums">¥21,200</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  );
}
