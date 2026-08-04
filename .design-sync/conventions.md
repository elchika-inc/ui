## この design system の使い方

すべての component は `window.ElchikaUI.<Name>` から取る（root の `_ds_bundle.js` が読み込む）。
基盤は Base UI + Tailwind CSS v4。日本語 UI 前提で、既定の書体は IBM Plex Sans JP / IBM Plex Sans / IBM Plex Mono。

### ラップと初期設定

**大半の component は provider 無しでそのまま使える。** 例外は次のものだけ:

| Provider | ラップが必要な対象 |
|---|---|
| `SidebarProvider` | `Sidebar` とその配下（`SidebarMenu` / `SidebarInset` など）。無しでは開閉状態を読めず描画が壊れる |
| `TooltipProvider` | 複数の `Tooltip` を共存させる場合 |
| `DirectionProvider` | RTL を扱う場合のみ |
| `ToastProvider` | `Toast` を使う場合。`Toaster`（sonner 系）は provider 不要で、`sonner` の `toast()` と組で使う |

**ダークモードはルート要素の `class="dark"` で切り替わる**（`@custom-variant dark (&:is(.dark *))`）。
個々の component に dark 用の props は無く、祖先に `.dark` があるかどうかだけで決まる。

```jsx
const { SidebarProvider, Sidebar, SidebarContent } = window.ElchikaUI;

<div className="dark">
  <SidebarProvider>
    <Sidebar><SidebarContent>…</SidebarContent></Sidebar>
  </SidebarProvider>
</div>
```

### スタイリングの語彙 —— ここが最重要

同梱の `styles.css` は、この design system の実サイトから Tailwind が **JIT で生成した CSS**（約 1850 セレクタ）。
**そこに含まれないクラス名は、正しい Tailwind の書き方でも一切効かない。** 以下は実測で確認した使用可能な語彙。

**セマンティックカラー**（このリストが全て。プレフィックスごとに有無が違う点に注意）

| | 使えるトークン |
|---|---|
| `bg-` | `background` `border` `card` `destructive-subtle` `foreground` `input` `muted` `overlay` `popover` `primary` `primary-foreground` `primary-hover` `secondary` `sidebar` `sidebar-border` `state-hover` `state-selected` |
| `text-` | `background` `card-foreground` `destructive` `destructive-subtle-foreground` `foreground` `muted-foreground` `popover-foreground` `primary` `primary-foreground` `secondary-foreground` `sidebar-foreground` |
| `border-` | `border` `destructive` `input` `ring` `sidebar-border` |
| `ring-` | `background` `border` `card` `destructive` `ring` `sidebar-ring` |

`bg-destructive` は**存在しない**（`text-destructive` と `bg-destructive-subtle` はある）。
`bg-success` `bg-warning` `bg-accent` `text-chart-1` 等もクラスとしては無い。
ただし CSS 変数そのものは定義済みなので、必要なら `style={{ background: "var(--success)" }}` のように直接参照する。
使える変数: `--success` `--warning` `--accent` `--chart-1`〜`--chart-5` ほか。

**レイアウトと余白**（充実している範囲）

- flex 系は揃っている: `flex` `inline-flex` `flex-col` `flex-wrap` `items-center` `justify-between` `justify-center` `justify-start`
- 間隔: `gap-1` `gap-2` `gap-3` `gap-4` `gap-6` `gap-8`
- 余白: `p-0,1,2,4,5,6,7,8,16` / `px-2,3,4` / `py-1,2,4`
- 文字: `text-xs`〜`text-3xl` `font-medium` `font-semibold` `font-bold`
- 角丸・枠: `rounded-md` `rounded-lg` `rounded-xl` `rounded-full` `border` `shadow-sm` `shadow-md` `shadow-lg`
- 幅: `w-full` `max-w-sm`〜`max-w-2xl` `h-full`

**存在しないので避けるもの**: ベース版の `grid-cols-*`（`sm:grid-cols-2` `md:grid-cols-2` `lg:grid-cols-2` は使える）、
`justify-end`（`sm:justify-end` のみ）、`p-3` `p-12` `py-8` `border-2` `min-h-screen`。

**したがってレイアウトは flex を主軸に組む。** 多カラムが要るときは `sm:grid-cols-2` 系を使うか、
`style` で直接指定する。迷ったら新しいクラス名を発明せず、上の表にある語彙だけで組むこと。

### 事実の在り処

- スタイルの正本: `_ds/<folder>/styles.css` とその `@import` 先（`_ds_bundle.css` にトークン定義と全クラスが入っている）
- 各 component の API: `components/general/<Name>/<Name>.d.ts`（`<Name>Props` が契約）
- 各 component の使い方: `components/general/<Name>/<Name>.prompt.md`
- 設計意図とブランド人格: `guidelines/DESIGN.md`

**迷ったら要約ではなく上の実ファイルを読むこと。** 特に variant / size の取りうる値は `.d.ts` に列挙されている。

### component の分類（全 345 件は単一グループに並ぶため、探す手がかりとして）

- **操作**: Button ButtonGroup Toggle ToggleGroup
- **入力**: Input Textarea Checkbox RadioGroup Select NativeSelect Switch Slider Label Field InputGroup InputOTP Combobox Calendar
- **オーバーレイ**: Dialog AlertDialog Drawer Sheet Popover HoverCard Tooltip ContextMenu DropdownMenu Menubar Command
- **ナビゲーション**: Breadcrumb NavigationMenu Pagination Tabs Sidebar
- **データ表示**: Table ChartContainer Avatar Badge Card Item Empty Skeleton Progress Spinner Marker Kbd Separator AspectRatio
- **フィードバック**: Alert Toast Toaster
- **レイアウト**: Accordion Collapsible Carousel Resizable ScrollArea
- **チャット/AI**: Message MessageScroller Bubble Attachment

`Accordion` に対する `AccordionItem` `AccordionTrigger` `AccordionContent` のように、
親の名前を接頭辞に持つ部品が一式で提供される。組み立ては親の `.prompt.md` を参照すること。

### 典型的な組み立て

```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } = window.ElchikaUI;

<div className="flex flex-col gap-4 p-6">
  <Card>
    <CardHeader>
      <CardTitle>公開の確認</CardTitle>
      <CardDescription>この変更は利用者全員へ即座に反映されます</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">公開すると registry の配信内容が更新されます。</p>
    </CardContent>
    <CardFooter>
      <div className="flex flex-wrap items-center gap-3">
        <Button>公開する</Button>
        <Button variant="outline">下書きに戻す</Button>
      </div>
    </CardFooter>
  </Card>
</div>
```

`Button` の `variant` は `default` `secondary` `outline` `ghost` `destructive` `link`、
`size` は `default` `xs` `sm` `lg` と icon 系（`icon` `icon-xs` `icon-sm` `icon-lg`）。
