"use client"

import { Heart, Leaf, Package, ShieldCheck, ShoppingBag, Store } from "lucide-react"
import { useAppStore } from "@/store/app-store"

const LINKS = [
  { view: "shop" as const, label: "Shop", icon: Store },
  { view: "cart" as const, label: "Cart", icon: ShoppingBag },
  { view: "wishlist" as const, label: "Wishlist", icon: Heart },
  { view: "orders" as const, label: "Orders", icon: Package },
  { view: "admin" as const, label: "Admin", icon: ShieldCheck },
]

export function StoreFooter() {
  const setView = useAppStore((s) => s.setView)

  return (
    <footer className="mt-auto border-t bg-stone-50 dark:bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-safe">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-xs text-primary-foreground">
                Z
              </span>
              ZSGC Store
            </p>
            <p className="text-sm text-muted-foreground">
              Considered goods for daily life — apparel, home, and pantry essentials made to last.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden />
              1% of every order funds reforestation.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LINKS.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">We accept</p>
            <div className="flex flex-wrap gap-1.5" aria-label="Accepted payment methods">
              {["Visa", "Mastercard", "Amex", "Apple Pay"].map((p) => (
                <span
                  key={p}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZSGC Store. Demo storefront — gift cards, loyalty points, and
          order emails are simulated.
        </div>
      </div>
    </footer>
  )
}
