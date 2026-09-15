"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Layers, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProductImage } from "@/components/store/product-image"
import { ProductEditorDialog } from "@/components/store/product-editor-dialog"
import { VariantEditor } from "@/components/store/variant-editor"
import { adminListProducts, deleteProduct, setProductActive } from "@/lib/demo-db"
import type { ProductDTO } from "@/lib/types"
import { formatMoney } from "@/lib/currency"
import { useAppStore } from "@/store/app-store"

function useAdminProducts() {
  return useQuery({ queryKey: ["admin", "products"], queryFn: adminListProducts })
}

export function AdminProductsTab() {
  const { data: products, isLoading } = useAdminProducts()
  const qc = useQueryClient()
  const currency = useAppStore((s) => s.currency)

  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [variantTarget, setVariantTarget] = useState<ProductDTO | null>(null)
  const [deleting, setDeleting] = useState<ProductDTO | null>(null)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] })
    void qc.invalidateQueries({ queryKey: ["products"] })
  }

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted")
      setDeleting(null)
      invalidate()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setProductActive(id, active),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  })

  const visible = (products ?? []).filter((p) =>
    query.trim()
      ? p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.category.toLowerCase().includes(query.trim().toLowerCase())
      : true
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="min-h-10 pl-9"
            aria-label="Search admin products"
          />
        </div>
        <Button
          className="ml-auto gap-1.5"
          onClick={() => {
            setEditing(null)
            setEditorOpen(true)
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> New product
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">Base price</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Variants</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Stock</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8" aria-hidden />
                  No products match.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0)
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-11 w-11 overflow-hidden rounded-md border">
                        <ProductImage src={p.image} alt={p.name} category={p.category} className="h-full w-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{p.name}</span>
                        {p.badge && <Badge variant="secondary" className="hidden px-1.5 py-0 text-[10px] lg:inline-flex">{p.badge}</Badge>}
                        {p.subscription && (
                          <Badge variant="outline" className="hidden gap-0.5 px-1.5 py-0 text-[10px] lg:inline-flex">
                            <RefreshCw className="h-2.5 w-2.5" aria-hidden /> Sub
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{p.category}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(p.priceCents, currency)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{p.variants.length}</TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      <span className={`tabular-nums ${stock === 0 ? "font-semibold text-destructive" : stock <= 15 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.active}
                        onCheckedChange={(active) => toggleActive.mutate({ id: p.id, active })}
                        aria-label={`Toggle ${p.name} visibility`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={200}>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                  setVariantTarget(p)
                                }}
                                aria-label={`Manage variants for ${p.name}`}
                              >
                                <Layers className="h-4 w-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Variants</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                  setEditing(p)
                                  setEditorOpen(true)
                                }}
                                aria-label={`Edit ${p.name}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleting(p)}
                                aria-label={`Delete ${p.name}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductEditorDialog
        product={editing}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={invalidate}
      />

      {variantTarget && (
        <VariantEditor
          product={variantTarget}
          open={variantTarget !== null}
          onOpenChange={(o) => !o && setVariantTarget(null)}
          onSaved={invalidate}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product, its variants, and related cart/wishlist entries. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
