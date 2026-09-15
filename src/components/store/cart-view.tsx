"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BadgeCheck,
  CreditCard,
  Gift,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/store/app-store"
import { useCart, useInvalidateStoreData, useLoyalty } from "@/hooks/use-store"
import { ProductImage } from "@/components/store/product-image"
import { formatMoney } from "@/lib/currency"
import { getSessionId } from "@/lib/session"
import type { CheckoutResult } from "@/lib/types"

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

export function CartView() {
  const currency = useAppStore((s) => s.currency)
  const setView = useAppStore((s) => s.setView)
  const cart = useCart()
  const loyalty = useLoyalty()
  const invalidateAll = useInvalidateStoreData()
  const qc = useQueryClient()

  const [email, setEmail] = useState("")
  const [giftCode, setGiftCode] = useState("")
  const [giftBalance, setGiftBalance] = useState<{ cents: number; status: string } | null>(null)
  const [redeemLoyalty, setRedeemLoyalty] = useState(false)
  const [placed, setPlaced] = useState<CheckoutResult | null>(null)

  const items = cart.data ?? []
  const points = loyalty.data ?? 0

  const subtotalCents = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.product.priceCents + (it.variant?.priceDelta ?? 0)) * it.quantity,
        0
      ),
    [items]
  )
  const loyaltyCents = redeemLoyalty ? Math.min(points * 5, subtotalCents) : 0
  const giftCents = giftBalance && giftBalance.cents > 0
    ? Math.min(giftBalance.cents, Math.max(0, subtotalCents - loyaltyCents))
    : 0
  const grandCents = Math.max(0, subtotalCents - loyaltyCents - giftCents)
  const subscriptionItems = items.filter((it) => it.product.subscription)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const checkout = useMutation({
    mutationFn: () =>
      jsonFetch<{ checkout: CheckoutResult }>("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          email,
          currency,
          giftCardCode: giftCents > 0 ? giftCode.trim().toUpperCase() : undefined,
          useLoyalty: redeemLoyalty && points > 0,
        }),
      }),
    onSuccess: (d) => {
      setPlaced(d.checkout)
      setGiftCode("")
      setGiftBalance(null)
      setRedeemLoyalty(false)
      invalidateAll()
      toast.success("Order placed! Confirmation email sent.", {
        description: `You earned ${d.checkout.loyalty.earned} loyalty points.`,
      })
    },
    onError: (e) => toast.error(e.message),
  })

  const updateQty = useMutation({
    mutationFn: (input: { id: string; quantity: number }) =>
      jsonFetch("/api/cart", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast.error(e.message),
  })

  const removeItem = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/cart?id=${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e) => toast.error(e.message),
  })

  const checkGiftCard = useMutation({
    mutationFn: (code: string) =>
      jsonFetch<{ balanceCents: number; status: string }>(`/api/giftcard?code=${encodeURIComponent(code)}`),
    onSuccess: (d) => {
      setGiftBalance({ cents: d.balanceCents, status: d.status })
      if (d.balanceCents > 0) toast.success(`Gift card applies ${formatMoney(d.balanceCents, currency)}`)
      else toast.info("Gift card found but has no remaining balance")
    },
    onError: (e) => {
      setGiftBalance(null)
      toast.error(e.message)
    },
  })

  if (placed) {
    return (
      <section aria-label="Order confirmation" className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <BadgeCheck className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold">Thank you — order confirmed!</h1>
        <p className="text-sm text-muted-foreground">
          A confirmation email is on its way to <strong>{placed.order.email}</strong>.
        </p>
        <Card className="text-left">
          <CardContent className="space-y-2 p-5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono text-xs">{placed.order.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(placed.totals.subtotalCents, currency)}</span></div>
            {placed.totals.loyaltyCents > 0 && (
              <div className="flex justify-between text-primary"><span>Loyalty redeemed ({placed.loyalty.used} pts)</span><span className="tabular-nums">−{formatMoney(placed.totals.loyaltyCents, currency)}</span></div>
            )}
            {placed.totals.giftCardCents > 0 && (
              <div className="flex justify-between text-primary"><span>Gift card {placed.order.giftCardCode}</span><span className="tabular-nums">−{formatMoney(placed.totals.giftCardCents, currency)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between font-bold"><span>Total paid</span><span className="tabular-nums">{formatMoney(placed.totals.grandTotalCents, currency)}</span></div>
            <p className="text-xs text-muted-foreground">
              Charged in {placed.order.currency}: {placed.order.totalMajor.toLocaleString()} · Points earned: +{placed.loyalty.earned} (balance {placed.loyalty.balance})
            </p>
            {placed.order.hasSubscription && (
              <p className="flex items-center gap-1.5 rounded-md bg-muted p-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5 text-primary" aria-hidden />
                Your subscription is active — first renewal in 30 days.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setView("orders")}>View orders</Button>
          <Button onClick={() => setPlaced(null)}>Keep shopping</Button>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Cart and checkout" className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
        <p className="text-sm text-muted-foreground">Prices update automatically to your selected currency.</p>
      </div>

      {cart.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Add something lovely from the shop.</p>
          <Button onClick={() => setView("shop")}>Browse the shop</Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => {
              const unit = it.product.priceCents + (it.variant?.priceDelta ?? 0)
              return (
                <Card key={it.id} className="py-0">
                  <CardContent className="flex gap-3 p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                      <ProductImage
                        src={it.product.image}
                        alt={it.product.name}
                        category={it.product.category}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{it.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[it.variant?.color, it.variant?.size].filter(Boolean).join(" / ") || it.product.category}
                          </p>
                          {it.product.subscription && (
                            <Badge variant="secondary" className="mt-1 gap-1">
                              <RefreshCw className="h-3 w-3" aria-hidden /> Subscription
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold tabular-nums">{formatMoney(unit * it.quantity, currency)}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border" aria-label={`Quantity for ${it.product.name}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Decrease quantity"
                            onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity - 1 })}>
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums">{it.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Increase quantity"
                            onClick={() => updateQty.mutate({ id: it.id, quantity: it.quantity + 1 })}>
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${it.product.name} from cart`}
                          onClick={() => removeItem.mutate(it.id)}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Checkout */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order summary</CardTitle>
                <CardDescription>
                  {items.reduce((s, it) => s + it.quantity, 0)} item(s) · charged in {currency}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatMoney(subtotalCents, currency)}</span></div>
                {loyaltyCents > 0 && (
                  <div className="flex justify-between text-primary"><span>Loyalty ({points} pts)</span><span className="tabular-nums">−{formatMoney(loyaltyCents, currency)}</span></div>
                )}
                {giftCents > 0 && (
                  <div className="flex justify-between text-primary"><span>Gift card</span><span className="tabular-nums">−{formatMoney(giftCents, currency)}</span></div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums">{formatMoney(grandCents, currency)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Discounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gift" className="flex items-center gap-1.5 text-sm">
                    <Gift className="h-4 w-4" aria-hidden /> Gift card
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="gift"
                      value={giftCode}
                      onChange={(e) => setGiftCode(e.target.value)}
                      placeholder="ZSGC-…"
                      className="min-h-11 font-mono uppercase"
                    />
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={!giftCode.trim() || checkGiftCard.isPending}
                      onClick={() => checkGiftCard.mutate(giftCode.trim().toUpperCase())}
                    >
                      {checkGiftCard.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Check"}
                    </Button>
                  </div>
                  {giftBalance && (
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Balance: {formatMoney(giftBalance.cents, currency)} · status {giftBalance.status}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Try ZSGC-WELCOME-25, ZSGC-HOLIDAY-50 or ZSGC-VIP-100.</p>
                </div>

                {points > 0 && subtotalCents > 0 && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="loyalty" className="text-sm">Redeem loyalty points</Label>
                      <p className="text-xs text-muted-foreground">
                        {points} pts available · saves {formatMoney(Math.min(points * 5, subtotalCents), currency)}
                      </p>
                    </div>
                    <Switch
                      id="loyalty"
                      checked={redeemLoyalty}
                      onCheckedChange={setRedeemLoyalty}
                      aria-label="Redeem loyalty points"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <CreditCard className="h-4 w-4" aria-hidden /> Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email for receipt</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="min-h-11"
                    aria-invalid={email.length > 0 && !emailValid}
                  />
                </div>
                {subscriptionItems.length > 0 && (
                  <p className="flex items-start gap-1.5 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                    <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
                    Includes {subscriptionItems.length} subscription item(s) — renews monthly, cancel anytime.
                  </p>
                )}
                <Button
                  className="min-h-11 w-full"
                  disabled={!emailValid || checkout.isPending || items.length === 0}
                  onClick={() => checkout.mutate()}
                >
                  {checkout.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Placing order…</>
                  ) : (
                    <>Place order · {formatMoney(grandCents, currency)}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  )
}

