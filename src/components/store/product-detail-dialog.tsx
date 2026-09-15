"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Heart, Minus, Package, Plus, RefreshCw, ShoppingBag, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProductImage } from "@/components/store/product-image"
import { useAppStore } from "@/store/app-store"
import { useAddToCart, useProducts, useToggleWishlist, useWishlist } from "@/hooks/use-store"
import { formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/** Deterministic pastel from a color name for swatches without a known hex. */
function nameToHex(name: string): string {
  const known: Record<string, string> = {
    black: "#1c1917", white: "#fafaf9", sage: "#a3b39b", forest: "#3f6142",
    slate: "#64748b", oatmeal: "#d6cfc4", moss: "#6b7d5a", tan: "#b08d63",
    navy: "#33415c", rust: "#b4532a", cream: "#f5efe0", charcoal: "#37332f",
    olive: "#6b6a3f", sand: "#e2d3b3", gray: "#9ca3af", ivory: "#f7f3e8",
    clay: "#c07a5a", steel: "#b6bfc7", speckled: "#e7e0d4",
  }
  const hit = known[name.toLowerCase()]
  if (hit) return hit
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash} 35% 65%)`
}

export function ProductDetailDialog() {
  const productId = useAppStore((s) => s.detailProductId)
  const openProduct = useAppStore((s) => s.openProduct)
  const currency = useAppStore((s) => s.currency)
  const { data: products, isLoading } = useProducts()
  const addToCart = useAddToCart()
  const toggleWishlist = useToggleWishlist()
  const wishlist = useWishlist()

  const product = useMemo(
    () => products?.find((p) => p.id === productId) ?? null,
    [products, productId]
  )

  const colors = useMemo(
    () => [...new Set(product?.variants.map((v) => v.color) ?? [])].filter(Boolean),
    [product]
  )
  const [color, setColor] = useState<string>("")
  const [size, setSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const sizes = useMemo(
    () =>
      [...new Set((product?.variants ?? []).filter((v) => v.color === color).map((v) => v.size))]
        .filter(Boolean),
    [product, color]
  )

  useEffect(() => {
    if (!product) return
    const firstColor = colors[0] ?? ""
    setColor((prev) => (colors.includes(prev) ? prev : firstColor))
    setQuantity(1)
    setAdded(false)
  }, [product, colors])

  useEffect(() => {
    const firstSize = sizes[0] ?? ""
    setSize((prev) => (sizes.includes(prev) ? prev : firstSize))
  }, [sizes])

  if (!product) return null

  const selectedVariant =
    product.variants.find((v) => v.color === color && v.size === size) ??
    product.variants.find((v) => v.color === color) ??
    null
  const priceCents = product.priceCents + (selectedVariant?.priceDelta ?? 0)
  const stock = selectedVariant?.stock ?? 0
  const wishlisted = (wishlist.data ?? []).some((w) => w.product.id === product.id)
  const open = productId !== null

  const handleAdd = () => {
    if (selectedVariant && stock < quantity) {
      toast.error("Not enough stock for this variant")
      return
    }
    addToCart.mutate(
      { productId: product.id, variantId: selectedVariant?.id ?? null, quantity },
      {
        onSuccess: () => {
          toast.success(`Added ${quantity} × ${product.name} to cart`, {
            description: [color, size].filter(Boolean).join(" / ") || undefined,
          })
          setAdded(true)
          setTimeout(() => setAdded(false), 1600)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && openProduct(null)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto scrollbar-thin sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl border">
            <ProductImage
              src={product.image}
              alt={product.name}
              category={product.category}
              className="h-full w-full"
            />
            {product.badge && <Badge className="absolute left-2 top-2 shadow-sm">{product.badge}</Badge>}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
              <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < Math.round(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      )}
                      aria-hidden
                    />
                  ))}
                  <span className="ml-1 text-muted-foreground">{product.rating.toFixed(1)}</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              {product.subscription && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  Subscription available — save & never run out
                </Badge>
              )}
            </div>

            <p className="text-2xl font-bold tabular-nums">{formatMoney(priceCents, currency)}</p>

            {colors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Color: <span className="font-normal text-muted-foreground">{color || "—"}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                  {colors.map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={c === color}
                      aria-label={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "flex h-11 min-w-11 items-center gap-1.5 rounded-full border-2 p-1 pr-3 text-xs transition-colors",
                        c === color ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <span
                        className="h-7 w-7 rounded-full border shadow-inner"
                        style={{ backgroundColor: nameToHex(c) }}
                        aria-hidden
                      />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Size: <span className="font-normal text-muted-foreground">{size || "—"}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                  {sizes.map((sz) => (
                    <Button
                      key={sz}
                      variant={sz === size ? "default" : "outline"}
                      size="sm"
                      className="min-h-11 min-w-11"
                      onClick={() => setSize(sz)}
                    >
                      {sz}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant && (
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  stock === 0 ? "text-destructive" : stock <= 5 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                <Package className="h-4 w-4" aria-hidden />
                {stock === 0
                  ? "Out of stock"
                  : stock <= 5
                    ? `Only ${stock} left in stock`
                    : `${stock} in stock`}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center rounded-lg border" aria-label="Quantity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <Button
                className="min-h-11 flex-1 gap-2"
                onClick={handleAdd}
                disabled={addToCart.isPending || (selectedVariant ? stock === 0 : false)}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Added
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden /> Add to cart
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={cn("h-11 w-11 shrink-0", wishlisted && "border-primary text-primary")}
                onClick={() => toggleWishlist.mutate(product.id)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
              >
                <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
