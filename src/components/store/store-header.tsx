"use client"

import { useTheme } from "next-themes"
import { Moon, ShoppingBag, Heart, Package, ShieldCheck, Store, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore, type View } from "@/store/app-store"
import { useCart, useWishlist } from "@/hooks/use-store"
import { CurrencySelect } from "@/components/store/currency-select"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { view: View; label: string; icon: typeof Store }[] = [
  { view: "shop", label: "Shop", icon: Store },
  { view: "cart", label: "Cart", icon: ShoppingBag },
  { view: "wishlist", label: "Wishlist", icon: Heart },
  { view: "orders", label: "Orders", icon: Package },
  { view: "admin", label: "Admin", icon: ShieldCheck },
]

export function StoreHeader() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const { resolvedTheme, setTheme } = useTheme()
  const cart = useCart()
  const wishlist = useWishlist()

  const cartCount = (cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlist.data?.length ?? 0

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <button
          onClick={() => setView("shop")}
          className="mr-2 flex min-h-11 items-center gap-2 rounded-md px-1 text-lg font-bold tracking-tight focus-visible:outline-2"
          aria-label="ZSGC Store home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-mono text-sm text-primary-foreground">
            Z
          </span>
          <span>
            ZSGC<span className="text-primary"> Store</span>
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ view: v, label, icon: Icon }) => {
            const badge =
              v === "cart" ? cartCount : v === "wishlist" ? wishlistCount : 0
            return (
              <Button
                key={v}
                variant={view === v ? "secondary" : "ghost"}
                size="sm"
                className="relative min-h-11 px-2 sm:px-3"
                onClick={() => setView(v)}
                aria-current={view === v ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className={cn("hidden md:inline", view === v && "font-semibold")}>{label}</span>
                {badge > 0 && (
                  <Badge
                    className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 tabular-nums"
                    variant="default"
                  >
                    {badge}
                  </Badge>
                )}
                <span className="sr-only">{label}</span>
              </Button>
            )
          })}

          <div className="ml-1 hidden sm:block">
            <CurrencySelect />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-11 w-11"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            <Sun className="h-4 w-4 dark:hidden" aria-hidden />
            <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
          </Button>
        </nav>
      </div>
      <div className="border-t px-4 py-2 sm:hidden">
        <CurrencySelect />
      </div>
    </header>
  )
}
