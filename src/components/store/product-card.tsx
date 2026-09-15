"use client"

import { Heart, RefreshCw, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductImage } from "@/components/store/product-image"
import { useAppStore } from "@/store/app-store"
import { useToggleWishlist, useWishlist } from "@/hooks/use-store"
import { formatMoney } from "@/lib/currency"
import type { ProductDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ProductCard({ product }: { product: ProductDTO }) {
  const currency = useAppStore((s) => s.currency)
  const openProduct = useAppStore((s) => s.openProduct)
  const wishlist = useWishlist()
  const toggleWishlist = useToggleWishlist()

  const wishlisted = (wishlist.data ?? []).some((w) => w.product.id === product.id)
  const minPrice = product.variants.length
    ? product.priceCents + Math.min(...product.variants.map((v) => v.priceDelta))
    : product.priceCents
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)

  return (
    <Card className="group relative overflow-hidden pt-0 transition-shadow hover:shadow-lg">
      <button
        onClick={() => openProduct(product.id)}
        className="block w-full text-left focus-visible:outline-2"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.badge && <Badge className="shadow-sm">{product.badge}</Badge>}
            {product.subscription && (
              <Badge variant="secondary" className="gap-1 bg-background/90 shadow-sm">
                <RefreshCw className="h-3 w-3" aria-hidden />
                Subscription
              </Badge>
            )}
          </div>
          {totalStock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary" className="bg-background text-foreground shadow-sm">
                Sold out
              </Badge>
            </div>
          )}
        </div>
      </button>

      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "absolute right-2 top-2 h-9 w-9 rounded-full shadow-sm transition-colors",
          wishlisted && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={() => toggleWishlist.mutate(product.id)}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wishlisted}
      >
        <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} aria-hidden />
      </Button>

      <CardContent className="space-y-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            {product.rating.toFixed(1)}
          </p>
        </div>
        <button
          onClick={() => openProduct(product.id)}
          className="line-clamp-1 w-full text-left text-sm font-semibold hover:underline focus-visible:outline-2"
        >
          {product.name}
        </button>
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-bold tabular-nums">{formatMoney(minPrice, currency)}</p>
          <Button size="sm" className="h-8 min-h-8" onClick={() => openProduct(product.id)}>
            Quick add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
