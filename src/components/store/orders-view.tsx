"use client"

import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, CreditCard, Gift, Mail, Package, RefreshCw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/app-store"
import { useOrders } from "@/hooks/use-store"
import { formatMoney, type CurrencyCode } from "@/lib/currency"
import { getCustomerEmails } from "@/lib/demo-db"

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  shipped: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  delivered: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
}

function useCustomerEmails() {
  return useQuery({ queryKey: ["emails"], queryFn: () => getCustomerEmails(10) })
}

export function OrdersView() {
  const orders = useOrders()
  const emails = useCustomerEmails()
  const setView = useAppStore((s) => s.setView)

  return (
    <section aria-label="Order history" className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
        <p className="text-sm text-muted-foreground">Your purchase history and notifications.</p>
      </div>

      {(emails.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" aria-hidden /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emails.data!.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium">{e.subject}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    To {e.to} · {new Date(e.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {orders.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : (orders.data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground">When you place an order it will show up here.</p>
          <Button onClick={() => setView("shop")}>Start shopping</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.data!.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">
                    Order <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(-8)}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.hasSubscription && (
                    <Badge variant="secondary" className="gap-1">
                      <RefreshCw className="h-3 w-3" aria-hidden /> Subscription
                    </Badge>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? ""}`}
                  >
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        {it.quantity} × {it.name}
                        {it.variantLabel && (
                          <span className="text-muted-foreground"> · {it.variantLabel}</span>
                        )}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(it.unitPriceCents * it.quantity, order.currency as CurrencyCode)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" aria-hidden /> Subtotal
                    </span>
                    <span className="tabular-nums">{formatMoney(order.subtotalCents, order.currency as CurrencyCode)}</span>
                  </div>
                  {order.loyaltyCents > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Loyalty ({order.loyaltyPointsUsed} pts)
                      </span>
                      <span className="tabular-nums">−{formatMoney(order.loyaltyCents, order.currency as CurrencyCode)}</span>
                    </div>
                  )}
                  {order.giftCardCents > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5" aria-hidden /> Gift card
                      </span>
                      <span className="tabular-nums">−{formatMoney(order.giftCardCents, order.currency as CurrencyCode)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total ({order.currency})</span>
                    <span className="tabular-nums">{order.totalMajor.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
