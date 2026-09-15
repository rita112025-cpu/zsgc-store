"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductImage } from "@/components/store/product-image"
import { ShareWishlistButton } from "@/components/store/share-wishlist-button"
import { useAppStore } from "@/store/app-store"
import { useToggleWishlist, useWishlist } from "@/hooks/use-store"
import { formatMoney } from "@/lib/currency"

export function WishlistView() {
  const wishlist = useWishlist()
  const toggleWishlist = useToggleWishlist()
  const currency = useAppStore((s) => s.currency)
  const setView = useAppStore((s) => s.setView)
  const openProduct = useAppStore((s) => s.openProduct)

  const items = wishlist.data ?? []

  return (
    <section aria-label="Wishlist" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wishlist</h1>
          <p className="text-sm text-muted-foreground">
            Saved for later{items.length > 0 ? ` · ${items.length} item${items.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <ShareWishlistButton items={items} />
      </div>

      {wishlist.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
          <Button onClick={() => setView("shop")}>Browse the shop</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((w) => (
            <Card key={w.id} className="group overflow-hidden pt-0 transition-shadow hover:shadow-md">
              <button
                onClick={() => openProduct(w.product.id)}
                className="block w-full text-left focus-visible:outline-2"
                aria-label={`View ${w.product.name}`}
              >
                <div className="aspect-square overflow-hidden">
                  <ProductImage
                    src={w.product.image}
                    alt={w.product.name}
                    category={w.product.category}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </button>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{w.product.category}</p>
                <button
                  onClick={() => openProduct(w.product.id)}
                  className="line-clamp-1 w-full text-left text-sm font-semibold hover:underline"
                >
                  {w.product.name}
                </button>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm font-bold tabular-nums">{formatMoney(w.product.priceCents, currency)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => toggleWishlist.mutate(w.product.id)}
                    aria-label={`Remove ${w.product.name} from wishlist`}
                  >
                    <Heart className="h-4 w-4 fill-current" aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
