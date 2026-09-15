"use client"

import { useMemo, useState } from "react"
import { PackageSearch, Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/store/product-card"
import { useProducts } from "@/hooks/use-store"
import { cn } from "@/lib/utils"

type SortKey = "featured" | "price-asc" | "price-desc" | "rating"

export function ShopView() {
  const { data: products, isLoading } = useProducts()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [sort, setSort] = useState<SortKey>("featured")

  const categories = useMemo(
    () => ["All", ...new Set((products ?? []).map((p) => p.category))],
    [products]
  )

  const visible = useMemo(() => {
    let list = products ?? []
    if (category !== "All") list = list.filter((p) => p.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.priceCents - b.priceCents)
      case "price-desc":
        return [...list].sort((a, b) => b.priceCents - a.priceCents)
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating)
      default:
        return list
    }
  }, [products, category, query, sort])

  return (
    <section aria-label="Shop" className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop</h1>
        <p className="text-sm text-muted-foreground">
          Considered goods for daily life — small-batch apparel, home, and pantry.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="min-h-11 pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="min-h-11 w-[150px]" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
        {categories.map((c) => (
          <Button
            key={c}
            role="tab"
            aria-selected={category === c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            className="min-h-9 rounded-full"
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
