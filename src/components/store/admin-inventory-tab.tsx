"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Package } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminFetch } from "@/lib/session"
import type { ProductDTO } from "@/lib/types"

function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/products")
      if (!res.ok) throw new Error("Failed to load products")
      return (await res.json()) as { products: ProductDTO[] }
    },
    select: (d) => d.products,
  })
}

export function AdminInventoryTab() {
  const { data: products, isLoading } = useAdminProducts()

  const exportCsv = async () => {
    try {
      const res = await adminFetch("/api/admin/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "inventory.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("inventory.csv downloaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed")
    }
  }

  const rows = (products ?? []).flatMap((p) =>
    p.variants.length === 0
      ? [{ product: p, color: "", size: "", stock: null as number | null }]
      : p.variants.map((v) => ({ product: p, color: v.color, size: v.size, stock: v.stock }))
  )

  const totalUnits = rows.reduce((s, r) => s + (r.stock ?? 0), 0)
  const lowStock = rows.filter((r) => (r.stock ?? 0) <= 5).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold">{rows.length} variant rows</p>
          <p className="text-xs text-muted-foreground">
            {totalUnits.toLocaleString()} units on hand · {lowStock} at or below 5
          </p>
        </div>
        <Button onClick={exportCsv} className="gap-1.5">
          <Download className="h-4 w-4" aria-hidden /> Export CSV
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card shadow-sm">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Base price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  rows.map((r) => (
                    <TableRow key={`${r.product.id}-${r.color}-${r.size}`}>
                      <TableCell className="max-w-48 truncate font-medium">{r.product.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{r.product.category}</TableCell>
                      <TableCell>{r.color || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.size || <span className="text-muted-foreground">One size</span>}</TableCell>
                      <TableCell className="text-right">
                        {r.stock === null ? (
                          <Badge variant="outline">n/a</Badge>
                        ) : r.stock === 0 ? (
                          <Badge variant="destructive">0</Badge>
                        ) : r.stock <= 5 ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500">{r.stock}</Badge>
                        ) : (
                          <span className="tabular-nums">{r.stock}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                        ${(r.product.priceCents / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 && !isLoading && (
        <div className="py-10 text-center text-muted-foreground">
          <Package className="mx-auto mb-2 h-8 w-8" aria-hidden />
          No inventory yet — add products first.
        </div>
      )}
    </div>
  )
}
