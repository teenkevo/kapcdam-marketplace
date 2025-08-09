import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ExternalLink, FileText, RefreshCcw, Eye } from "lucide-react"

type OrderItem = {
  id: string
  title: string
  image: string
  alt: string
  returnClosedOn: string
  quantity?: number
}

const defaultItems: OrderItem[] = [
  {
    id: "1",
    title:
      "MOSISO Compatible with MacBook Pro 14 inch Case 2025 2024 2023 2022 2021 M4 M3 M2 M1 A3112 A3185 A3401 A2918 A2992 A2779 A2442, Plastic Hard Shell & Keyboard Cover & Screen Film & Pouch, Black",
    image: "/placeholder.svg?height=92&width=92",
    alt: "Black hard shell case for MacBook Pro 14 inch",
    returnClosedOn: "19 April 2025",
  },
  {
    id: "2",
    title:
      "Rubik NFC Cards 215 Chip (10 Cards), Blank Programmable Ntag215 PVC NFC Business Smart Card Tags Compatible with All NFC Enabled Mobile Phones & Devices, 504 Bytes Memory (10 Cards)",
    image: "/placeholder.svg?height=92&width=92",
    alt: "Pack of blank NFC PVC cards",
    returnClosedOn: "19 April 2025",
  },
  {
    id: "3",
    title:
      "BENECREAT 25Pcs 10ml Mini Fine Mist Spray Bottle Transparent Glass Travel Empty Atomiser Spray Bottles with Plastic Lid for Perfume, Toiletries Liquid, Cosmetic",
    image: "/placeholder.svg?height=92&width=92",
    alt: "Set of small transparent glass spray bottles",
    returnClosedOn: "19 April 2025",
    quantity: 2,
  },
]

export default function OrderComponent({
  orderPlaced = "3 April 2025",
  total = "AED 304.07",
  shipTo = "Lukundo Calvin Louis",
  orderNumber = "# 404-7197098-5068338",
  items = defaultItems,
}: {
  orderPlaced?: string
  total?: string
  shipTo?: string
  orderNumber?: string
  items?: OrderItem[]
}) {
  return (
    <main className="px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <OrderCard orderPlaced={orderPlaced} total={total} shipTo={shipTo} orderNumber={orderNumber} items={items} />
      </div>
    </main>
  )
}

function OrderCard({
  orderPlaced,
  total,
  shipTo,
  orderNumber,
  items,
}: {
  orderPlaced: string
  total: string
  shipTo: string
  orderNumber: string
  items: OrderItem[]
}) {
  return (
    <Card className="overflow-hidden border rounded-xl">
      {/* Header */}
      <CardHeader className="bg-muted/50 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Left: order meta */}
          <dl className="grid w-full grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex flex-col">
              <dt className="text-muted-foreground font-medium tracking-wide">ORDER PLACED</dt>
              <dd className="font-semibold">{orderPlaced}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground font-medium tracking-wide">TOTAL</dt>
              <dd className="font-semibold">{total}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground font-medium tracking-wide">SHIP TO</dt>
              <dd className="flex items-center gap-1 font-semibold">
                <span className="truncate">{shipTo}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </dd>
            </div>
          </dl>

          {/* Right: order links */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right text-sm md:block">
              <div className="text-muted-foreground">ORDER {orderNumber}</div>
              <div className="mt-1 flex items-center gap-3">
                <a href="#" className="text-sky-700 hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  <span>View order details</span>
                </a>
                <span className="text-muted-foreground">|</span>
                <a href="#" className="text-sky-700 hover:underline inline-flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Invoice</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-end">
          <Badge variant="secondary" className="text-green-700 bg-green-50">
            Delivered
          </Badge>
        </div>

        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id} className="py-4 md:py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                {/* Thumbnail */}
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border bg-white">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.alt}
                      width={96}
                      height={80}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                </div>

                {/* Info and actions */}
                <div className="grid flex-1 gap-2">
                  <a href="#" className="text-sky-700 hover:underline font-medium leading-6">
                    {item.title}
                  </a>
                  <p className="text-xs text-muted-foreground">Return window closed on {item.returnClosedOn}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" className="gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Buy it again
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Eye className="h-4 w-4" />
                      Write a review
                    </Button>
                    {item.quantity && item.quantity > 1 && (
                      <span className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export { OrderCard }